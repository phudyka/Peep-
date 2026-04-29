import React from 'react';
import { PoolInput } from '../../types';
import { Input } from '../ui/Input';

interface Props {
  input: PoolInput;
  updateInput: (key: keyof PoolInput, value: any) => void;
}

export const Step1_PoolDimensions: React.FC<Props> = ({ input, updateInput }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">1. Dimensions & Type</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Longueur (m)" 
          type="number" 
          value={input.length} 
          onChange={e => updateInput('length', parseFloat(e.target.value))} 
        />
        <Input 
          label="Largeur (m)" 
          type="number" 
          value={input.width} 
          onChange={e => updateInput('width', parseFloat(e.target.value))} 
        />
        <Input 
          label="Petit bain (m)" 
          type="number" 
          value={input.depthShallow} 
          onChange={e => updateInput('depthShallow', parseFloat(e.target.value))} 
        />
        <Input 
          label="Grand bain (m)" 
          type="number" 
          value={input.depthDeep} 
          onChange={e => updateInput('depthDeep', parseFloat(e.target.value))} 
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Type de piscine</label>
        <select 
          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          value={input.type}
          onChange={e => updateInput('type', e.target.value)}
        >
          <option value="SKIMMER">Skimmer</option>
          <option value="OVERFLOW">Débordement</option>
          <option value="ROMAN">Romaine</option>
        </select>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Usage</label>
        <select 
          className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          value={input.usage}
          onChange={e => updateInput('usage', e.target.value)}
        >
          <option value="RESIDENTIAL">Résidentiel</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>
    </div>
  );
};
