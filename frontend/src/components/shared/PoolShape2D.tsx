import React from 'react';
import { PoolShape, ShapeParams, ShapeParamsRectangular, ShapeParamsRound, ShapeParamsOval, ShapeParamsLShape } from '../../types';

interface Props {
  shape: PoolShape;
  shapeParams: ShapeParams;
  length?: number;
  width?: number;
  className?: string;
}

const STROKE = '#22c55e';
const FILL = 'transparent';
const STROKE_WIDTH = 2;
const VIEWBOX_SIZE = 200;

const getScale = (maxDim: number) => (maxDim > 0 ? (VIEWBOX_SIZE - 20) / maxDim : 1);

export const PoolShape2D: React.FC<Props> = ({ shape, shapeParams, length, width, className }) => {
  const renderRectangular = () => {
    const p = shapeParams as ShapeParamsRectangular;
    const l = p.length || length || 8;
    const w = p.width || width || 4;
    const scale = getScale(Math.max(l, w));
    const sl = (l * scale) / 2;
    const sw = (w * scale) / 2;
    return (
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className={className} fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH}>
        <rect x={VIEWBOX_SIZE / 2 - sl} y={VIEWBOX_SIZE / 2 - sw} width={sl * 2} height={sw * 2} fill={FILL} rx={2} />
      </svg>
    );
  };

  const renderRound = () => {
    const p = shapeParams as ShapeParamsRound;
    const d = p.diameter || 6;
    const scale = getScale(d);
    const r = (d * scale) / 2;
    return (
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className={className} fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH}>
        <circle cx={VIEWBOX_SIZE / 2} cy={VIEWBOX_SIZE / 2} r={r} fill={FILL} />
      </svg>
    );
  };

  const renderOval = () => {
    const p = shapeParams as ShapeParamsOval;
    const ma = p.majorAxis || 8;
    const mi = p.minorAxis || 4;
    const scale = getScale(Math.max(ma, mi));
    const rx = (ma * scale) / 2;
    const ry = (mi * scale) / 2;
    return (
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className={className} fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH}>
        <ellipse cx={VIEWBOX_SIZE / 2} cy={VIEWBOX_SIZE / 2} rx={rx} ry={ry} fill={FILL} />
      </svg>
    );
  };

  const renderLShape = () => {
    const p = shapeParams as ShapeParamsLShape;
    const l1 = p.length1 || 8, w1 = p.width1 || 4, l2 = p.length2 || 4, w2 = p.width2 || 3;
    const maxDim = Math.max(l1, w1, l2, w2);
    const scale = getScale(maxDim);
    const cx = VIEWBOX_SIZE / 2, cy = VIEWBOX_SIZE / 2;
    const s = (v: number) => v * scale;
    const points = [
      [cx - s(l1) / 2, cy - s(w1) / 2],
      [cx + s(l1) / 2, cy - s(w1) / 2],
      [cx + s(l1) / 2, cy + s(w1) / 2 - s(w2) / 2],
      [cx - s(l1) / 2 + s(l2), cy + s(w1) / 2 - s(w2) / 2],
      [cx - s(l1) / 2 + s(l2), cy + s(w1) / 2],
      [cx - s(l1) / 2, cy + s(w1) / 2],
    ].map(([x, y]) => `${x},${y}`).join(' ');
    return (
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className={className} fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH}>
        <polygon points={points} fill={FILL} />
      </svg>
    );
  };

  const renderFreeform = () => {
    const cx = VIEWBOX_SIZE / 2, cy = VIEWBOX_SIZE / 2, r = VIEWBOX_SIZE / 2 - 10;
    return (
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className={className} fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH}>
        <path d={`M${cx},${cy - r} C${cx + r},${cy - r * 0.8} ${cx + r * 0.8},${cy + r * 0.8} ${cx},${cy + r} C${cx - r * 0.8},${cy + r * 0.8} ${cx - r},${cy - r * 0.8} ${cx},${cy - r}Z`} fill={FILL} />
      </svg>
    );
  };

  switch (shape) {
    case 'RECTANGULAR': return renderRectangular();
    case 'ROUND': return renderRound();
    case 'OVAL': return renderOval();
    case 'L_SHAPE': return renderLShape();
    case 'FREEFORM': return renderFreeform();
    default: return renderRectangular();
  }
};
