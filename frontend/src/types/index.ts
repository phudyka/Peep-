export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'COMMERCIAL';
}

// ─── Formes de piscine ────────────────────────────────────────────────────────

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

// ─── Entrée moteur hydraulique ────────────────────────────────────────────────

export interface PoolInput {
  // Champs de forme (nouveaux)
  shape: PoolShape;
  shapeParams: ShapeParams;

  // Profondeurs — présentes pour toutes les formes
  depthShallow: number;
  depthDeep: number;

  // Rétro-compatibilité : conservés pour RECTANGULAR (utilisés aussi comme fallback)
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

// ─── Résultat du moteur ────────────────────────────────────────────────────────

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

// ─── Devis ─────────────────────────────────────────────────────────────────────

export interface QuoteLine {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  visible: boolean;
  isManuallyAdded: boolean;
  isManuallyEdited: boolean;
  notes?: string;
}

export interface Product {
  id: string;
  sageRef: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellPrice: number;
}

export interface Quote {
  id: string;
  reference: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  shape: PoolShape;
  shapeParams: ShapeParams | null;
  poolData: PoolInput;
  calcParams: Record<string, number>;
  calculationResult: InstallationResult;
  internalNotes: string | null;
  clientName: string;
  clientEmail: string | null;
  lines: QuoteLine[];
  createdAt?: string;
}
