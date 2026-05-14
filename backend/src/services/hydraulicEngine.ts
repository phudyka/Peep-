// ─── Types de forme ────────────────────────────────────────────────────────────

export type PoolShape = 'RECTANGULAR' | 'ROUND' | 'OVAL' | 'L_SHAPE' | 'FREEFORM';

export interface ShapeParamsRectangular {
  shape: 'RECTANGULAR';
  length: number;
  width: number;
}

export interface ShapeParamsRound {
  shape: 'ROUND';
  diameter: number;
}

export interface ShapeParamsOval {
  shape: 'OVAL';
  majorAxis: number;
  minorAxis: number;
}

export interface ShapeParamsLShape {
  shape: 'L_SHAPE';
  length1: number;
  width1: number;
  length2: number;
  width2: number;
}

export interface ShapeParamsFreeform {
  shape: 'FREEFORM';
  surfaceArea: number;
}

export type ShapeParams =
  | ShapeParamsRectangular
  | ShapeParamsRound
  | ShapeParamsOval
  | ShapeParamsLShape
  | ShapeParamsFreeform;

// ─── Entrée moteur ─────────────────────────────────────────────────────────────

export interface PoolInput {
  shape: PoolShape;
  shapeParams: ShapeParams;
  depthShallow: number;
  depthDeep: number;
  /** Conservé pour rétro-compatibilité RECTANGULAR et fallback planGenerator */
  length: number;
  width: number;
  type: 'SKIMMER' | 'OVERFLOW' | 'ROMAN';
  usage: 'RESIDENTIAL' | 'PUBLIC';
  options: {
    heating: boolean;
    spa: boolean;
    counterCurrent: boolean;
    lighting: boolean;
  };
}

// ─── Paramètres de calcul ──────────────────────────────────────────────────────

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

// ─── Résultat ──────────────────────────────────────────────────────────────────

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
  // ─ Étape 11 (Phase 5) : pertes de charge & HMT réelle ────────────────────────
  /** Pertes de charge linéaires sur le circuit (m de colonne d'eau). */
  linearPressureLoss?: number;
  /** Pertes de charge totales = linéaires + singulières (≈ 20% du linéaire). */
  totalPressureLoss?: number;
  /** HMT réelle = HMT de base + pertes de charge totales (m). */
  hmtReal?: number;
  /** Longueur de circuit estimée utilisée pour le calcul (m). */
  estimatedCircuitLength?: number;
  /** Warnings post-calcul (sous-dimensionnement, vérifications recommandées…). */
  warnings?: string[];
}

// ─── Calcul de surface selon la forme ─────────────────────────────────────────

/**
 * Retourne la surface au sol (m²) en fonction de la forme et de ses paramètres.
 * Utilisé exclusivement pour le calcul du volume — les profondeurs sont appliquées
 * ensuite dans le moteur principal.
 */
export function computeSurface(params: ShapeParams): number {
  switch (params.shape) {
    case 'RECTANGULAR':
      return params.length * params.width;

    case 'ROUND':
      return Math.PI * Math.pow(params.diameter / 2, 2);

    case 'OVAL':
      return Math.PI * (params.majorAxis / 2) * (params.minorAxis / 2);

    case 'L_SHAPE':
      return params.length1 * params.width1 + params.length2 * params.width2;

    case 'FREEFORM':
      return params.surfaceArea;
  }
}

// ─── Moteur principal ──────────────────────────────────────────────────────────

/**
 * Exécute la chaîne de 10 calculs séquentiels pour le chiffrage piscine.
 * @param input  Dimensions et options saisies par l'utilisateur.
 * @param params Paramètres de calcul (DB ou surcharges opérateur).
 * @param existingOverrides  Éditions manuelles à préserver.
 * @returns InstallationResult complet avec map de tracking des surcharges.
 */
export function runHydraulicEngine(
  input: PoolInput,
  params: CalcParams,
  existingOverrides: Record<string, number> = {}
): InstallationResult {
  const overridesMap: Record<string, boolean> = {};

  // Helper to apply override if exists
  const applyOverride = (key: string, calculatedValue: number): number => {
    if (existingOverrides[key] !== undefined) {
      overridesMap[key] = true;
      return existingOverrides[key];
    }
    return calculatedValue;
  };

  // Step 1 — Volume
  const depthAvgCalc = (input.depthShallow + input.depthDeep) / 2;
  const depthAvg = applyOverride('depthAvg', depthAvgCalc);

  const surface = computeSurface(input.shapeParams);
  const volumeCalc = surface * depthAvg;
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
  const pumpPowerCalc = standardPowers.find(p => p >= pumpPowerRaw) ?? standardPowers[standardPowers.length - 1];
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

  // ─── Step 11 — Pertes de charge & HMT réelle (Phase 5) ──────────────────────
  //
  // Formule Hazen-Williams (équivalente à un "Darcy-Weisbach simplifié" pour PVC) :
  //   J [m/m] = (10.67 / C^1.852) × Q^1.852 / D^4.87
  // avec Q en m³/s, D en m, C = 150 (coefficient PVC pression).
  //
  // Longueur de circuit estimée : sqrt(surface) × 4 (périmètre approximatif
  // local technique → bassin, conforme à la pratique métier).
  // Pertes singulières : majoration forfaitaire +20% du linéaire (coudes, vannes).
  // Diamètre de référence : on prend l'aspiration (côté basse pression, le plus
  // sensible à la cavitation et au sous-dimensionnement).
  const pvcCoefficient = 150;
  const surfaceM2 = computeSurface(input.shapeParams);
  const circuitLengthCalc = Math.sqrt(Math.max(1, surfaceM2)) * 4;
  const circuitLength = applyOverride('estimatedCircuitLength', circuitLengthCalc);

  const Q_si = adjustedFlowRate / 3600;          // m³/s
  const D_si = suctionDiameter / 1000;           // m
  const J = D_si > 0
    ? (10.67 / Math.pow(pvcCoefficient, 1.852)) * Math.pow(Q_si, 1.852) / Math.pow(D_si, 4.87)
    : 0;
  const linearPressureLossCalc   = J * circuitLength;
  const totalPressureLossCalc    = linearPressureLossCalc * 1.2;
  const linearPressureLoss = applyOverride('linearPressureLoss', linearPressureLossCalc);
  const totalPressureLoss  = applyOverride('totalPressureLoss',  totalPressureLossCalc);
  const hmtRealCalc = params.hmt + totalPressureLoss;
  const hmtReal     = applyOverride('hmtReal', hmtRealCalc);

  // ─── Validations post-calcul → warnings ─────────────────────────────────────
  const warnings: string[] = [];

  // HMT réelle nettement supérieure à la HMT de référence → pompe sous-évaluée
  if (hmtReal > params.hmt * 1.15) {
    warnings.push(
      `HMT réelle (${hmtReal.toFixed(1)} m) > 115% de la HMT de référence — réviser la puissance de pompe à la hausse`
    );
  }

  // Débit < 50% du débit théorique idéal (volume / 6h) → pompe sous-dimensionnée
  const idealFlowRate = volume / 6;
  if (adjustedFlowRate < 0.5 * idealFlowRate) {
    warnings.push(
      `Débit (${adjustedFlowRate.toFixed(1)} m³/h) très inférieur à l'idéal (${idealFlowRate.toFixed(1)} m³/h) — pompe potentiellement sous-dimensionnée`
    );
  }

  // Filtre haute capacité requis
  if (filterArea > 0.8) {
    warnings.push(
      `Surface filtre > 0,8 m² — filtre haute capacité requis, vérifier la disponibilité fournisseur`
    );
  }

  // Puissance importante en usage résidentiel
  if (input.usage === 'RESIDENTIAL' && pumpPower > 1.5) {
    warnings.push(
      `Puissance de pompe ${pumpPower} kW élevée pour un usage résidentiel — confirmer avec le client (raccordement électrique, bruit)`
    );
  }

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
    linearPressureLoss,
    totalPressureLoss,
    hmtReal,
    estimatedCircuitLength: circuitLength,
    warnings,
  };
}
