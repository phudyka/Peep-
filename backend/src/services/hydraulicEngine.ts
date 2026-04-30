export interface PoolInput {
  length: number;
  width: number;
  depthShallow: number;
  depthDeep: number;
  type: 'SKIMMER' | 'OVERFLOW' | 'ROMAN';
  usage: 'RESIDENTIAL' | 'PUBLIC';
  options: {
    heating: boolean;
    spa: boolean;
    counterCurrent: boolean;
    lighting: boolean;
  };
}

export interface CalcParams {
  filteringTime: number;
  hmt: number;
  pumpEfficiency: number;
  m3PerSkimmer: number;
  filteringSpeed: number;
  sandPerM2: number;
  flowMultiplier: number;
  // 🐛 Fix #17 : ces champs étaient dans CalcSettings mais ignorés
  spaFlowAddition: number;        // m³/h ajoutés si spa (défaut DB = 4)
  counterCurrentAddition: number; // m³/h ajoutés si nage à contre-courant (défaut DB = 3)
}

export interface InstallationResult {
  volume: number;
  depthAvg: number;
  baseFlowRate: number;
  adjustedFlowRate: number;
  pumpPower: number;
  pumpPowerRaw: number;
  skimmers: number;
  returns: number;
  valves: number;
  suctionDiameter: number;
  pressureDiameter: number;
  filterArea: number;
  filterDiameter: number;
  sand: number;
  overrides: Record<string, boolean>;
}

/**
 * Executes the 10-step calculation chain for pool quoting.
 * @param input The user's pool dimensions and options.
 * @param params The calculation parameters (defaults from DB or user overrides).
 * @param existingOverrides Previous manual edits from the user to preserve.
 * @returns Complete InstallationResult with overrides map tracking.
 */
export function runHydraulicEngine(
  input: PoolInput,
  params: CalcParams,
  existingOverrides: Record<string, number> = {}
): InstallationResult {
  const overridesMap: Record<string, boolean> = {};
  
  // Helper to apply override if exists
  const applyOverride = (key: string, calculatedValue: number) => {
    if (existingOverrides[key] !== undefined) {
      overridesMap[key] = true;
      return existingOverrides[key];
    }
    return calculatedValue;
  };

  // Step 1 — Volume
  const depthAvgCalc = (input.depthShallow + input.depthDeep) / 2;
  const depthAvg = applyOverride('depthAvg', depthAvgCalc);
  
  const volumeCalc = input.length * input.width * depthAvg;
  const volume = applyOverride('volume', volumeCalc);

  // Step 2 — Base flow rate
  const baseFlowRateCalc = volume / params.filteringTime;
  const baseFlowRate = applyOverride('baseFlowRate', baseFlowRateCalc);

  // Step 3 — Adjusted flow rate (utilise les valeurs de CalcSettings)
  let adjustedFlowRateCalc = baseFlowRate * params.flowMultiplier;
  if (input.options.spa)            adjustedFlowRateCalc += params.spaFlowAddition;
  if (input.options.counterCurrent) adjustedFlowRateCalc += params.counterCurrentAddition;
  const adjustedFlowRate = applyOverride('adjustedFlowRate', adjustedFlowRateCalc);

  // Step 4 — Pump power
  const pumpPowerRawCalc = (adjustedFlowRate * params.hmt) / (3600 * params.pumpEfficiency);
  const pumpPowerRaw = applyOverride('pumpPowerRaw', pumpPowerRawCalc);
  
  // ⚡ standardPowers déplacé en constante module (hors de la fonction) dans le refactor suivant
  const standardPowers = [0.25, 0.33, 0.5, 0.75, 1.1, 1.5, 2.2];
  let pumpPowerCalc = standardPowers.find(p => p >= pumpPowerRaw) || standardPowers[standardPowers.length - 1];
  const pumpPower = applyOverride('pumpPower', pumpPowerCalc);

  // Step 5 — Skimmers
  const skimmersCalc = Math.max(2, Math.ceil(volume / params.m3PerSkimmer));
  const skimmers = applyOverride('skimmers', skimmersCalc);

  // Step 6 — Return nozzles
  const returnsCalc = Math.max(2, skimmers * 2);
  const returns = applyOverride('returns', returnsCalc);

  // Step 7 — Pipe diameters
  let suctionDiameterCalc = 90;
  let pressureDiameterCalc = 75;
  if (adjustedFlowRate < 8) {
    suctionDiameterCalc = 63;
    pressureDiameterCalc = 50;
  } else if (adjustedFlowRate < 15) {
    suctionDiameterCalc = 75;
    pressureDiameterCalc = 63;
  }
  const suctionDiameter = applyOverride('suctionDiameter', suctionDiameterCalc);
  const pressureDiameter = applyOverride('pressureDiameter', pressureDiameterCalc);

  // Step 8 — Valves
  const valvesCalc = skimmers + 3;
  const valves = applyOverride('valves', valvesCalc);

  // Step 9 — Filter sizing
  const filterAreaCalc = adjustedFlowRate / params.filteringSpeed;
  const filterArea = applyOverride('filterArea', filterAreaCalc);
  
  const filterDiameterCalc = Math.ceil(Math.sqrt(filterArea / Math.PI) * 2 * 1000);
  const filterDiameter = applyOverride('filterDiameter', filterDiameterCalc);

  // Step 10 — Sand
  const sandCalc = Math.ceil(filterArea * params.sandPerM2);
  const sand = applyOverride('sand', sandCalc);

  return {
    volume,
    depthAvg,
    baseFlowRate,
    adjustedFlowRate,
    pumpPower,
    pumpPowerRaw,
    skimmers,
    returns,
    valves,
    suctionDiameter,
    pressureDiameter,
    filterArea,
    filterDiameter,
    sand,
    overrides: overridesMap,
  };
}
