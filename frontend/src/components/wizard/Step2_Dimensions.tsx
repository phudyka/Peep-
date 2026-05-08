// @ts-nocheck
import React from 'react';
import { PoolInput, PoolShape, ShapeParams } from '../../types';
import { Input } from '../ui/Input';
import { Select, SelectItem } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PoolShapeSelector } from '../shared/PoolShapeSelector';

export function getDefaultShapeParams(shape: PoolShape): ShapeParams {
  switch (shape) {
    case 'RECTANGULAR': return { shape: 'RECTANGULAR', length: 8, width: 4 };
    case 'ROUND':       return { shape: 'ROUND',       diameter: 6 };
    case 'OVAL':        return { shape: 'OVAL',         majorAxis: 8, minorAxis: 4 };
    case 'L_SHAPE':     return { shape: 'L_SHAPE',      length1: 8, width1: 4, length2: 4, width2: 3 };
    case 'FREEFORM':    return { shape: 'FREEFORM',     surfaceArea: 30 };
  }
}

interface Props {
  input: PoolInput;
  updateInput: (key: keyof PoolInput, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2_Dimensions: React.FC<Props> = ({ input, updateInput, onNext, onBack }) => {
  const currentShape = input.shape ?? 'RECTANGULAR';

  const handleShapeChange = (shape: PoolShape) => {
    const newParams = getDefaultShapeParams(shape);
    updateInput('shape', shape);
    updateInput('shapeParams', newParams);
    if (shape === 'RECTANGULAR') {
      updateInput('length', (newParams as any).length);
      updateInput('width',  (newParams as any).width);
    }
  };

  const updateShapeParam = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const updated = { ...input.shapeParams, [key]: numValue } as ShapeParams;
    updateInput('shapeParams', updated);
    if (currentShape === 'RECTANGULAR') {
      if (key === 'length') updateInput('length', numValue);
      if (key === 'width')  updateInput('width',  numValue);
    }
  };

  const numInput = (label: string, paramKey: string, value: number) => (
    <Input
      label={label}
      type="number"
      min={0}
      step={0.1}
      value={value.toString()}
      onChange={(e) => updateShapeParam(paramKey, e.target.value)}
    />
  );

  return (
    <Card className="max-w-2xl mx-auto w-full" header={
      <>
        <h2 className="text-lg font-bold text-slate-100">La piscine</h2>
        <p className="text-sm text-slate-500 mt-1">Définissez la forme et le type du bassin.</p>
      </>
    }>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Forme du bassin</label>
          <PoolShapeSelector currentShape={currentShape} onChange={handleShapeChange} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {currentShape === 'RECTANGULAR' && (() => {
            const p = input.shapeParams as { length: number; width: number };
            return <>{numInput('Longueur (m)', 'length', p.length)}{numInput('Largeur (m)', 'width', p.width)}</>;
          })()}
          {currentShape === 'ROUND' && (() => {
            const p = input.shapeParams as { diameter: number };
            return numInput('Diamètre (m)', 'diameter', p.diameter);
          })()}
          {currentShape === 'OVAL' && (() => {
            const p = input.shapeParams as { majorAxis: number; minorAxis: number };
            return <>{numInput('Grand axe (m)', 'majorAxis', p.majorAxis)}{numInput('Petit axe (m)', 'minorAxis', p.minorAxis)}</>;
          })()}
          {currentShape === 'L_SHAPE' && (() => {
            const p = input.shapeParams as any;
            return <>{numInput('Longueur 1 (m)', 'length1', p.length1)}{numInput('Largeur 1 (m)', 'width1', p.width1)}
                     {numInput('Longueur 2 (m)', 'length2', p.length2)}{numInput('Largeur 2 (m)', 'width2', p.width2)}</>;
          })()}
          {currentShape === 'FREEFORM' && (() => {
            const p = input.shapeParams as { surfaceArea: number };
            return numInput('Surface au sol (m²)', 'surfaceArea', p.surfaceArea);
          })()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Petit bain (m)"
            type="number"
            value={input.depthShallow.toString()}
            onChange={e => updateInput('depthShallow', e.target.value === '' ? 0 : parseFloat(e.target.value))}
          />
          <Input
            label="Grand bain (m)"
            type="number"
            value={input.depthDeep.toString()}
            onChange={e => updateInput('depthDeep', e.target.value === '' ? 0 : parseFloat(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Select 
            label="Type de piscine" 
            selectedKeys={[input.type]}
            onSelectionChange={(keys) => updateInput('type', Array.from(keys)[0])}
          >
            <SelectItem key="SKIMMER" value="SKIMMER">Skimmer</SelectItem>
            <SelectItem key="OVERFLOW" value="OVERFLOW">Débordement</SelectItem>
            <SelectItem key="ROMAN" value="ROMAN">Romaine</SelectItem>
          </Select>
          <Select 
            label="Usage" 
            selectedKeys={[input.usage]}
            onSelectionChange={(keys) => updateInput('usage', Array.from(keys)[0])}
          >
            <SelectItem key="RESIDENTIAL" value="RESIDENTIAL">Résidentiel</SelectItem>
            <SelectItem key="PUBLIC" value="PUBLIC">Public</SelectItem>
          </Select>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="secondary" onClick={onBack}>← Retour</Button>
          <Button variant="primary" onClick={onNext}>Suivant →</Button>
        </div>
      </div>
    </Card>
  );
};

