// @ts-nocheck
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
  }

  return (
    <div className="rounded-lg overflow-hidden border border-peep-border shadow-sm relative group transition-all duration-150">
      <img src={visual} alt="Pool 3D Visual" className="w-full h-auto object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-150 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Button onClick={generateVisual} disabled={loading} variant="secondary" className="transition-all duration-150">
          {loading ? 'Régénération...' : 'Régénérer'}
        </Button>
      </div>
    </div>
  );
};

