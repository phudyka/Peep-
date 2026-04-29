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
      <h3 className="text-lg font-medium">2. Options & Accessoires</h3>
      <div className="space-y-2">
        {options.map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
              checked={input.options[key]}
              onChange={e => updateOption(key, e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
