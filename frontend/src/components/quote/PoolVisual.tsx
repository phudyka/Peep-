import React, { useState } from 'react';
import { Button } from '../ui/Button';

import api from '../../services/api';

interface Props {
  quoteId?: string;
  existingVisual?: string;
}

export const PoolVisual: React.FC<Props> = ({ quoteId, existingVisual }) => {
  const [visual, setVisual] = useState<string | undefined>(existingVisual);
  const [loading, setLoading] = useState(false);

  const generateVisual = async () => {
    if (!quoteId) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/quotes/${quoteId}/generate-visual`);
      if (data.visualBase64) {
        setVisual(data.visualBase64);
      }
    } catch (error) {
      console.error('Échec de la génération du visuel', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visual) {
    return null;
    /*
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
        <ImageIcon className="h-12 w-12 mb-4 text-gray-400" />
        <p className="mb-4 text-sm">No 3D visual generated yet</p>
        <Button onClick={generateVisual} disabled={loading || !quoteId} variant="secondary">
          {loading ? 'Generating...' : 'Generate with Gemini AI'}
        </Button>
      </div>
    );
    */
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm relative group">
      <img src={visual} alt="Pool 3D Visual" className="w-full h-auto object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Button onClick={generateVisual} disabled={loading} variant="secondary">
          {loading ? 'Régénération...' : 'Régénérer'}
        </Button>
      </div>
    </div>
  );
};
