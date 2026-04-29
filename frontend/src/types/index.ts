export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'COMMERCIAL';
}

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
  poolData: PoolInput;
  calcParams: Record<string, number>;
  calculationResult: InstallationResult;
  internalNotes: string | null;
  clientName: string;
  clientEmail: string | null;
  lines: QuoteLine[];
  createdAt?: string;
}
