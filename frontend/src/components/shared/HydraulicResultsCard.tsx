// @ts-nocheck
import React from 'react';
import { InstallationResult } from '../../types';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';
import { cn } from '../ui/Button';

interface Props {
  result: InstallationResult;
  loading: boolean;
  setOverride: (key: string, value: number) => void;
  onRecalculate: () => void;
}

export const HydraulicResultsCard: React.FC<Props> = ({ result, loading, setOverride, onRecalculate }) => {
  const overrides = result.overrides || {};
  
  const numInput = (label: string, key: keyof InstallationResult, value: number) => {
    const isOverridden = overrides[key as string] !== undefined;
    return (
      <div className="relative">
        <Input
          label={label}
          type="number"
          value={value.toString()}
          className={cn("font-mono", isOverridden && "field-overridden")}
          onChange={(e) => setOverride(key as string, e.target.value === '' ? 0 : parseFloat(e.target.value))}
        />
        {isOverridden && (
          <span className="field-overridden-dot" />
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-100">Résultats hydrauliques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {numInput('Volume (m³)', 'volume', result.volume)}
          {numInput('Débit de base (m³/h)', 'baseFlowRate', result.baseFlowRate)}
          {numInput('Débit ajusté (m³/h)', 'adjustedFlowRate', result.adjustedFlowRate)}
          {numInput('Skimmers', 'skimmers', result.skimmers)}
          {numInput('Buses de refoulement', 'returns', result.returns)}
          {numInput('Vannes', 'valves', result.valves)}
          {numInput('Tuyau d\'aspiration (Ø mm)', 'suctionDiameter', result.suctionDiameter)}
          {numInput('Tuyau de refoulement (Ø mm)', 'pressureDiameter', result.pressureDiameter)}
          {numInput('Puissance pompe (kW)', 'pumpPower', result.pumpPower)}
          {numInput('Surface de filtration (m²)', 'filterArea', result.filterArea)}
          {numInput('Diamètre du filtre (mm)', 'filterDiameter', result.filterDiameter)}
          {numInput('Sable requis (kg)', 'sand', result.sand)}
        </div>
        <div className="flex justify-end">
          <Button 
            variant="outline"
            onClick={onRecalculate}
            disabled={loading}
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            Recalculer
          </Button>
        </div>
      </div>
    </Card>
  );
};


