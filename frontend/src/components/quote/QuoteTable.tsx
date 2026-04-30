import React from 'react';
import { QuoteLine } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface Props {
  lines: QuoteLine[];
  updateLine: (index: number, line: QuoteLine) => void;
  removeLine: (index: number) => void;
}

export const QuoteTable: React.FC<Props> = ({ lines, updateLine, removeLine }) => {
  const calculateTotal = (line: QuoteLine) => {
    return line.quantity * line.unitPrice * (1 - line.discount / 100);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qté</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remise %</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Visible</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {lines.map((line, idx) => (
            <tr key={line.id || `line-${idx}`} className={!line.visible ? 'bg-gray-50 opacity-75' : ''}>
              <td className="px-4 py-2 text-sm text-gray-900">{line.product?.name || 'Inconnu'}</td>
              <td className="px-4 py-2 w-24">
                <Input 
                  type="number" 
                  value={line.quantity === 0 ? '' : line.quantity} 
                  onChange={e => updateLine(idx, { ...line, quantity: e.target.value === '' ? 0 : parseFloat(e.target.value), isManuallyEdited: true })}
                  className="h-8 text-sm"
                />
              </td>
              <td className="px-4 py-2 w-32">
                <Input 
                  type="number" 
                  value={line.unitPrice === 0 ? '' : line.unitPrice} 
                  onChange={e => updateLine(idx, { ...line, unitPrice: e.target.value === '' ? 0 : parseFloat(e.target.value), isManuallyEdited: true })}
                  className="h-8 text-sm"
                />
              </td>
              <td className="px-4 py-2 w-24">
                <Input 
                  type="number" 
                  value={line.discount === 0 ? '' : line.discount} 
                  onChange={e => updateLine(idx, { ...line, discount: e.target.value === '' ? 0 : parseFloat(e.target.value), isManuallyEdited: true })}
                  className="h-8 text-sm"
                />
              </td>
              <td className="px-4 py-2 text-sm font-medium">{calculateTotal(line).toFixed(2)} €</td>
              <td className="px-4 py-2 text-center">
                <button 
                  onClick={() => updateLine(idx, { ...line, visible: !line.visible })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {line.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </td>
              <td className="px-4 py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => removeLine(idx)} className="text-red-500">
                  <Trash2 size={18} />
                </Button>
              </td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                Aucun article dans le devis. Calculez l'hydraulique pour générer l'équipement de base.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
