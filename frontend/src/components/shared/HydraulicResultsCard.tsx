import React from 'react';
import { InstallationResult } from '../../types';
import { Card } from '../ui/Card';
import { formatNumber } from '../../utils/format';

interface Props {
  result: InstallationResult;
}

const Field = ({ label, value, unit = '' }: { label: string; value: number; unit?: string }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
    <p className="font-mono text-sm text-slate-200">{formatNumber(value)}{unit && <span className="text-slate-500 ml-1">{unit}</span>}</p>
  </div>
);

export const HydraulicResultsCard: React.FC<Props> = ({ result }) => {
  return (
    <Card className="w-full">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-100">Résultats hydrauliques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Field label="Volume" value={result.volume} unit="m³" />
            <Field label="Débit de base" value={result.baseFlowRate} unit="m³/h" />
            <Field label="Débit ajusté" value={result.adjustedFlowRate} unit="m³/h" />
          </div>
          <div className="space-y-4">
            <Field label="Skimmers" value={result.skimmers} />
            <Field label="Buses de refoulement" value={result.returns} />
            <Field label="Vannes" value={result.valves} />
          </div>
          <div className="space-y-4">
            <Field label="Tuyau aspiration" value={result.suctionDiameter} unit="Ø mm" />
            <Field label="Tuyau refoulement" value={result.pressureDiameter} unit="Ø mm" />
            <Field label="Puissance pompe" value={result.pumpPower} unit="kW" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1e2a3a]">
          <Field label="Surface de filtration" value={result.filterArea} unit="m²" />
          <Field label="Diamètre filtre" value={result.filterDiameter} unit="mm" />
          <Field label="Sable requis" value={result.sand} unit="kg" />
        </div>
      </div>
    </Card>
  );
};


