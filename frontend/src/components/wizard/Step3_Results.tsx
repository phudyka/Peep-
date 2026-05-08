// @ts-nocheck
import React from 'react';
import { InstallationResult } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';

interface Props {
  result: InstallationResult | null;
  loading: boolean;
  setOverride: (key: string, value: number) => void;
  resetOverride: (key: string) => void;
}

export const Step3_Results: React.FC<Props> = ({ result, loading, setOverride, resetOverride }) => {
  if (loading) return <div className="p-4 text-center text-gray-500">Calcul en cours...</div>;
  if (!result) return null;

  const renderField = (key: keyof InstallationResult, label: string, unit: string = '') => {
    // Only process number fields
    if (key === 'overrides') return null;
    
    const isOverridden = result.overrides[key];
    const value = result[key as keyof InstallationResult] as number;

    return (
      <div key={key} className="flex items-end gap-2 mb-2">
        <div className="flex-1">
          <Input
            label={`${label} ${unit ? `(${unit})` : ''}`}
            type="number"
            value={value}
            onChange={e => setOverride(key, parseFloat(e.target.value) || 0)}
            isOverridden={isOverridden}
            className={isOverridden ? 'font-bold' : ''}
          />
        </div>
        {isOverridden && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-1 text-yellow-600 hover:text-yellow-700"
            onClick={() => resetOverride(key)}
            title="Réinitialiser à la valeur calculée"
          >
            <RefreshCw size={16} />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">3. Résultats hydrauliques</h3>
      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <h4 className="font-medium text-gray-600 mb-2 border-b pb-1">Données du bassin</h4>
          {renderField('volume', 'Volume', 'm³')}
          {renderField('baseFlowRate', 'Débit de base', 'm³/h')}
          {renderField('adjustedFlowRate', 'Débit ajusté', 'm³/h')}
        </div>
        <div>
          <h4 className="font-medium text-gray-600 mb-2 border-b pb-1">Dimensionnement équipement</h4>
          {renderField('pumpPower', 'Puissance pompe', 'kW')}
          {renderField('filterArea', 'Surface de filtration', 'm²')}
          {renderField('filterDiameter', 'Diamètre du filtre', 'mm')}
          {renderField('sand', 'Sable requis', 'kg')}
        </div>
        <div className="col-span-2 mt-4">
          <h4 className="font-medium text-gray-600 mb-2 border-b pb-1">Plomberie</h4>
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              {renderField('skimmers', 'Skimmers')}
              {renderField('returns', 'Buses de refoulement')}
              {renderField('valves', 'Vannes')}
            </div>
            <div>
              {renderField('suctionDiameter', 'Tuyau d\'aspiration', 'Ø mm')}
              {renderField('pressureDiameter', 'Tuyau de refoulement', 'Ø mm')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

