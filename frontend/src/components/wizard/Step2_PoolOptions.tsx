// @ts-nocheck
import React from 'react';
import { PoolInput } from '../../types';

interface Props {
  input: PoolInput;
  updateOption: (key: keyof PoolInput['options'], value: boolean) => void;
}

export const Step2_PoolOptions: React.FC<Props> = ({ input, updateOption }) => {
  const options = [
    { key: 'heating', label: 'Chauffage' },
    { key: 'spa', label: 'Spa intégré' },
    { key: 'counterCurrent', label: 'Nage à contre-courant' },
    { key: 'lighting', label: 'Éclairage' },
  ] as const;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">2. Options & Accessoires</h3>
      <div className="space-y-2">
        {options.map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-2 cursor-pointer hover:bg-peep-hover p-2 rounded-lg transition-all duration-150">
            <input 
              type="checkbox" 
              className="rounded border-peep-border text-green-500 focus:ring-green-500/30 h-4 w-4 bg-peep-surface"
              checked={input.options[key]}
              onChange={e => updateOption(key, e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-200">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

