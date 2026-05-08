// @ts-nocheck
import React from 'react';
import { PoolShape } from '../../types';

export interface ShapeMeta {
  label: string;
  icon: React.ReactNode;
}

export const SHAPE_META: Record<PoolShape, ShapeMeta> = {
  RECTANGULAR: {
    label: 'Rectangulaire',
    icon: <svg viewBox="0 0 40 24" width="40" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="36" height="20" rx="1" /></svg>,
  },
  ROUND: {
    label: 'Ronde',
    icon: <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="16" cy="16" r="13" /></svg>,
  },
  OVAL: {
    label: 'Ovale',
    icon: <svg viewBox="0 0 44 28" width="44" height="28" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="22" cy="14" rx="20" ry="11" /></svg>,
  },
  L_SHAPE: {
    label: 'En L',
    icon: <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="2,2 18,2 18,14 30,14 30,30 2,30" /></svg>,
  },
  FREEFORM: {
    label: 'Forme libre',
    icon: <svg viewBox="0 0 36 32" width="36" height="32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18,2 C28,4 34,10 32,18 C30,26 22,30 14,28 C6,26 2,18 4,10 C6,4 10,1 18,2Z" /></svg>,
  },
};

interface Props {
  currentShape: PoolShape;
  onChange: (shape: PoolShape) => void;
}

export const PoolShapeSelector: React.FC<Props> = ({ currentShape, onChange }) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {(Object.keys(SHAPE_META) as PoolShape[]).map(shape => {
        const meta = SHAPE_META[shape];
        const active = currentShape === shape;
        return (
          <button
            key={shape}
            type="button"
            onClick={() => onChange(shape)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 py-3 px-1 text-center transition-all
              ${active
                ? 'border-primary bg-primary-50/10 text-primary shadow-sm'
                : 'border-default-200 text-default-500 hover:border-default-400 hover:bg-default-100'
              }`}
          >
            <span className="text-current">{meta.icon}</span>
            <span className="text-[11px] font-medium leading-tight">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
};

