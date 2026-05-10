import React from 'react';
import { PoolInput } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Props {
  clientName: string;
  input: PoolInput;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const Step4_Summary: React.FC<Props> = ({ clientName, input, onBack, onSubmit, isSubmitting }) => {
  const formatDimensions = () => {
    const s = input.shape;
    const p = input.shapeParams as any;
    if (s === 'RECTANGULAR') return `${p.length}m × ${p.width}m`;
    if (s === 'ROUND') return `Ø ${p.diameter}m`;
    if (s === 'OVAL') return `${p.majorAxis}m × ${p.minorAxis}m`;
    if (s === 'L_SHAPE') return `${p.length1}×${p.width1}m / ${p.length2}×${p.width2}m`;
    if (s === 'FREEFORM') return `${p.surfaceArea}m²`;
    return '';
  };

  const activeOptions = Object.entries(input.options)
    .filter(([_, active]) => active)
    .map(([key]) => key);

  const optionLabels: Record<string, string> = {
    heating: 'Chauffage', spa: 'Spa intégré', counterCurrent: 'Nage à contre-courant', lighting: 'Éclairage'
  };

  return (
    <Card className="max-w-lg mx-auto w-full" header={
      <>
        <h2 className="text-lg font-bold text-slate-100">Récapitulatif</h2>
        <p className="text-sm text-slate-500 mt-1">Vérifiez les informations avant de créer le devis.</p>
      </>
    }>
      <div className="space-y-4">
        <div className="flex justify-between border-b border-[#1e2a3a] pb-2">
          <span className="text-sm text-slate-500">Client</span>
          <span className="text-sm font-medium text-slate-200">{clientName}</span>
        </div>
        <div className="flex justify-between border-b border-[#1e2a3a] pb-2">
          <span className="text-sm text-slate-500">Forme</span>
          <span className="text-sm font-medium text-slate-200 capitalize">{input.shape.toLowerCase().replace('_', ' ')} — {formatDimensions()}</span>
        </div>
        <div className="flex justify-between border-b border-[#1e2a3a] pb-2">
          <span className="text-sm text-slate-500">Profondeur</span>
          <span className="text-sm font-medium text-slate-200">{input.depthShallow}m - {input.depthDeep}m</span>
        </div>
        <div className="flex justify-between border-b border-[#1e2a3a] pb-2">
          <span className="text-sm text-slate-500">Type & Usage</span>
          <span className="text-sm font-medium text-slate-200 capitalize">{input.type.toLowerCase()} / {input.usage.toLowerCase()}</span>
        </div>
        <div>
          <span className="text-sm text-slate-500 block mb-2">Options actives</span>
          <div className="flex gap-2 flex-wrap">
            {activeOptions.length > 0 ? (
              activeOptions.map(opt => <Badge key={opt}>{optionLabels[opt]}</Badge>)
            ) : (
              <span className="text-sm text-slate-600">Aucune option sélectionnée</span>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>← Retour</Button>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : '✓ Confirmer et créer'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

