// @ts-nocheck
import React from 'react';
import { PoolInput, PoolShape, ShapeParams } from '../../types';
import { Input } from '../ui/Input';

// ─── Métadonnées de forme ──────────────────────────────────────────────────────

interface ShapeMeta {
  label: string;
  icon: React.ReactNode;
}

const SHAPE_META: Record<PoolShape, ShapeMeta> = {
  RECTANGULAR: {
    label: 'Rectangulaire',
    icon: (
      <svg viewBox="0 0 40 24" width="40" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="36" height="20" rx="1" />
      </svg>
    ),
  },
  ROUND: {
    label: 'Ronde',
    icon: (
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="16" cy="16" r="13" />
      </svg>
    ),
  },
  OVAL: {
    label: 'Ovale',
    icon: (
      <svg viewBox="0 0 44 28" width="44" height="28" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="22" cy="14" rx="20" ry="11" />
      </svg>
    ),
  },
  L_SHAPE: {
    label: 'En L',
    icon: (
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="2,2 18,2 18,14 30,14 30,30 2,30" />
      </svg>
    ),
  },
  FREEFORM: {
    label: 'Forme libre',
    icon: (
      <svg viewBox="0 0 36 32" width="36" height="32" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18,2 C28,4 34,10 32,18 C30,26 22,30 14,28 C6,26 2,18 4,10 C6,4 10,1 18,2Z" />
      </svg>
    ),
  },
};

// ─── Valeurs initiales par forme ───────────────────────────────────────────────

export function defaultShapeParams(shape: PoolShape): ShapeParams {
  switch (shape) {
    case 'RECTANGULAR': return { shape: 'RECTANGULAR', length: 8, width: 4 };
    case 'ROUND':       return { shape: 'ROUND',       diameter: 6 };
    case 'OVAL':        return { shape: 'OVAL',         majorAxis: 8, minorAxis: 4 };
    case 'L_SHAPE':     return { shape: 'L_SHAPE',      length1: 8, width1: 4, length2: 4, width2: 3 };
    case 'FREEFORM':    return { shape: 'FREEFORM',     surfaceArea: 30 };
  }
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  input: PoolInput;
  updateInput: (key: keyof PoolInput, value: PoolInput[keyof PoolInput]) => void;
}

// ─── Composant ─────────────────────────────────────────────────────────────────

export const Step1_PoolDimensions: React.FC<Props> = ({ input, updateInput }) => {
  const currentShape = input.shape ?? 'RECTANGULAR';

  const handleShapeChange = (shape: PoolShape) => {
    const newParams = defaultShapeParams(shape);
    // Met à jour la forme ET les params en une fois
    updateInput('shape', shape);
    updateInput('shapeParams', newParams);
    // Sync les champs plats pour rétro-compat RECTANGULAR
    if (shape === 'RECTANGULAR') {
      updateInput('length', (newParams as { length: number }).length);
      updateInput('width',  (newParams as { width: number }).width);
    }
  };

  const updateShapeParam = (key: string, value: number) => {
    const updated = { ...input.shapeParams, [key]: value } as ShapeParams;
    updateInput('shapeParams', updated);
    // Sync champs plats pour RECTANGULAR
    if (currentShape === 'RECTANGULAR') {
      if (key === 'length') updateInput('length', value);
      if (key === 'width')  updateInput('width',  value);
    }
  };

  const numInput = (
    label: string,
    paramKey: string,
    value: number,
    unit = 'm',
  ) => (
    <Input
      label={`${label} (${unit})`}
      type="number"
      min={0}
      step={0.1}
      value={value}
      onChange={e =>
        updateShapeParam(paramKey, e.target.value === '' ? 0 : parseFloat(e.target.value))
      }
    />
  );
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-medium">1. Forme &amp; Dimensions</h3>

      {/* ── Sélecteur de forme ─────────────────────────────────────────────── */}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Forme du bassin</label>
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(SHAPE_META) as PoolShape[]).map(shape => {
            const meta = SHAPE_META[shape];
            const active = currentShape === shape;
            return (
              <button
                key={shape}
                type="button"
                onClick={() => handleShapeChange(shape)}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 px-1 text-center transition-all duration-150
                  ${active
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                    : 'border-peep-border text-default-500 hover:border-peep-hover hover:bg-peep-hover'
                  }`}
              >
                <span className="text-current">{meta.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Champs de dimensions conditionnels ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {currentShape === 'RECTANGULAR' && (() => {
          const p = input.shapeParams as { shape: 'RECTANGULAR'; length: number; width: number };
          return (
            <>
              {numInput('Longueur', 'length', p.length)}
              {numInput('Largeur',  'width',  p.width)}
            </>
          );
        })()}

        {currentShape === 'ROUND' && (() => {
          const p = input.shapeParams as { shape: 'ROUND'; diameter: number };
          return numInput('Diamètre', 'diameter', p.diameter);
        })()}

        {currentShape === 'OVAL' && (() => {
          const p = input.shapeParams as { shape: 'OVAL'; majorAxis: number; minorAxis: number };
          return (
            <>
              {numInput('Grand axe', 'majorAxis', p.majorAxis)}
              {numInput('Petit axe', 'minorAxis', p.minorAxis)}
            </>
          );
        })()}

        {currentShape === 'L_SHAPE' && (() => {
          const p = input.shapeParams as { shape: 'L_SHAPE'; length1: number; width1: number; length2: number; width2: number };
          return (
            <>
              {numInput('Longueur 1', 'length1', p.length1)}
              {numInput('Largeur 1',  'width1',  p.width1)}
              {numInput('Longueur 2', 'length2', p.length2)}
              {numInput('Largeur 2',  'width2',  p.width2)}
            </>
          );
        })()}

        {currentShape === 'FREEFORM' && (() => {
          const p = input.shapeParams as { shape: 'FREEFORM'; surfaceArea: number };
          return numInput('Surface au sol', 'surfaceArea', p.surfaceArea, 'm²');
        })()}
      </div>

      {/* ── Profondeurs — toujours visibles ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Petit bain (m)"
          type="number"
          min={0}
          step={0.1}
          value={input.depthShallow}
          onChange={e =>
            updateInput('depthShallow', e.target.value === '' ? 0 : parseFloat(e.target.value))
          }
        />
        <Input
          label="Grand bain (m)"
          type="number"
          min={0}
          step={0.1}
          value={input.depthDeep}
          onChange={e =>
            updateInput('depthDeep', e.target.value === '' ? 0 : parseFloat(e.target.value))
          }
        />
      </div>

      {/* ── Type de piscine ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Type de piscine</label>
        <select
          className="w-full h-10 rounded-md border border-peep-border bg-peep-surface px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary-500 transition-all duration-150"
          value={input.type}
          onChange={e => updateInput('type', e.target.value as PoolInput['type'])}
        >
          <option value="SKIMMER">Skimmer</option>
          <option value="OVERFLOW">Débordement</option>
          <option value="ROMAN">Romaine</option>
        </select>
      </div>

      {/* ── Usage ─────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Usage</label>
        <select
          className="w-full h-10 rounded-md border border-peep-border bg-peep-surface px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary-500 transition-all duration-150"
          value={input.usage}
          onChange={e => updateInput('usage', e.target.value as PoolInput['usage'])}
        >
          <option value="RESIDENTIAL">Résidentiel</option>
          <option value="PUBLIC">Public</option>
        </select>
      </div>
    </div>
  );
};

