/**
 * planGenerator.ts
 * Génère le plan hydraulique 2D SVG depuis les données d'un devis PEEP.
 * Aucune dépendance externe — SVG est du texte pur.
 *
 * Les logos sont lus depuis la racine du projet (montés via docker-compose volumes).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  symbolSkimmer, symbolNozzle, symbolPump, symbolSandFilter,
  symbolValve6Way, dimensionLine, titleBlock, legendBlock, TitleBlockData,
} from './svgSymbols';
import type { PoolShape, ShapeParams } from './hydraulicEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanInput {
  quote: { id: string; reference: string; clientName: string; clientEmail?: string | null };
  pool: {
    shape: PoolShape;
    shapeParams: ShapeParams;
    /** Conservés pour rétro-compat / cotations RECTANGULAR */
    length: number;
    width: number;
    depthShallow: number;
    depthDeep: number;
    type: string;
  };
  hydraulics: {
    volume: number; flowRate: number; pumpPower: number;
    skimmers: number; returns: number;
    pipeDiameterSuction: number; pipeDiameterReturn: number;
    valves: number; filterDiameter: number; sand: number;
  };
}

// ─── Chargement logo (lecture depuis la racine du projet) ─────────────────────

function loadLogo(filename: string): string | undefined {
  const candidates = [
    path.join('/logos', filename),
    path.join(process.cwd(), '..', filename),
    path.join(__dirname, '..', '..', '..', filename),
    path.join(__dirname, '..', '..', '..', '..', filename),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        return `data:image/png;base64,${buf.toString('base64')}`;
      }
    } catch { /* try next */ }
  }
  return undefined;
}

// ─── Symboles SVG du bassin (contour + hachures) ─────────────────────────────

/**
 * Génère le path de remplissage + le contour du bassin selon sa forme.
 * Toutes les coordonnées sont dans l'espace SVG du plan (drawX, drawY, drawW, drawH).
 */
function poolShapeSVG(
  shape: PoolShape,
  params: ShapeParams,
  poolX: number,
  poolY: number,
  poolSvgW: number,
  poolSvgH: number,
): string {
  switch (shape) {
    case 'RECTANGULAR':
      return `
<rect x="${poolX}" y="${poolY}" width="${poolSvgW}" height="${poolSvgH}"
      fill="url(#pool-hatch)" rx="3"/>
<rect x="${poolX}" y="${poolY}" width="${poolSvgW}" height="${poolSvgH}"
      fill="none" stroke="#0369a1" stroke-width="3" rx="3"/>`;

    case 'ROUND': {
      const cx = poolX + poolSvgW / 2;
      const cy = poolY + poolSvgH / 2;
      const r  = Math.min(poolSvgW, poolSvgH) / 2;
      return `
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#pool-hatch)"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0369a1" stroke-width="3"/>`;
    }

    case 'OVAL': {
      const cx = poolX + poolSvgW / 2;
      const cy = poolY + poolSvgH / 2;
      const rx = poolSvgW / 2;
      const ry = poolSvgH / 2;
      return `
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pool-hatch)"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#0369a1" stroke-width="3"/>`;
    }

    case 'L_SHAPE': {
      const p = params as { shape: 'L_SHAPE'; length1: number; width1: number; length2: number; width2: number };
      const totalL = p.length1;
      const totalW = p.width1;
      // Portion 2 (bras du L) en bas à droite
      const arm2W = (p.length2 / totalL) * poolSvgW;
      const arm2H = (p.width2  / totalW) * poolSvgH;
      const cutX  = poolX + arm2W;
      const cutY  = poolY + (poolSvgH - arm2H);
      // Polygone en L : sens horaire
      const pts = [
        `${poolX},${poolY}`,
        `${poolX + poolSvgW},${poolY}`,
        `${poolX + poolSvgW},${poolY + poolSvgH}`,
        `${cutX},${poolY + poolSvgH}`,
        `${cutX},${cutY}`,
        `${poolX},${cutY}`,
      ].join(' ');
      return `
<polygon points="${pts}" fill="url(#pool-hatch)"/>
<polygon points="${pts}" fill="none" stroke="#0369a1" stroke-width="3"/>`;
    }

    case 'FREEFORM': {
      // Forme libre → ellipse légèrement asymétrique pour indiquer le caractère irrégulier
      const cx = poolX + poolSvgW / 2;
      const cy = poolY + poolSvgH / 2;
      const rx = poolSvgW * 0.48;
      const ry = poolSvgH * 0.44;
      // Courbe de Bézier avec un léger déport pour simuler une forme organique
      const d = `M ${cx - rx},${cy}
        C ${cx - rx},${cy - ry * 1.1}  ${cx},${cy - ry * 1.25}  ${cx + rx * 0.6},${cy - ry}
        C ${cx + rx * 1.15},${cy - ry * 0.7}  ${cx + rx * 1.1},${cy + ry * 0.4}  ${cx + rx * 0.5},${cy + ry}
        C ${cx},${cy + ry * 1.15}  ${cx - rx * 0.9},${cy + ry * 0.8}  ${cx - rx},${cy} Z`;
      return `
<path d="${d}" fill="url(#pool-hatch)"/>
<path d="${d}" fill="none" stroke="#0369a1" stroke-width="3"/>`;
    }
  }
}

/**
 * Génère les cotations SVG selon la forme.
 * Pour les formes non-rectangulaires, on affiche les dimensions clés.
 */
function poolDimensionsSVG(
  shape: PoolShape,
  params: ShapeParams,
  poolX: number,
  poolY: number,
  poolSvgW: number,
  poolSvgH: number,
): string {
  switch (shape) {
    case 'RECTANGULAR': {
      const p = params as { shape: 'RECTANGULAR'; length: number; width: number };
      return `
${dimensionLine(poolX, poolY, poolX + poolSvgW, poolY, `${p.length.toFixed(2)} m`, -30, 'H')}
${dimensionLine(poolX + poolSvgW, poolY, poolX + poolSvgW, poolY + poolSvgH, `${p.width.toFixed(2)} m`, 30, 'V')}`;
    }
    case 'ROUND': {
      const p = params as { shape: 'ROUND'; diameter: number };
      const cx = poolX + poolSvgW / 2;
      const cy = poolY + poolSvgH / 2;
      const r  = Math.min(poolSvgW, poolSvgH) / 2;
      return `
${dimensionLine(cx - r, cy, cx + r, cy, `Ø ${p.diameter.toFixed(2)} m`, -22, 'H')}`;
    }
    case 'OVAL': {
      const p = params as { shape: 'OVAL'; majorAxis: number; minorAxis: number };
      return `
${dimensionLine(poolX, poolY + poolSvgH / 2, poolX + poolSvgW, poolY + poolSvgH / 2, `${p.majorAxis.toFixed(2)} m`, -22, 'H')}
${dimensionLine(poolX + poolSvgW, poolY, poolX + poolSvgW, poolY + poolSvgH, `${p.minorAxis.toFixed(2)} m`, 30, 'V')}`;
    }
    case 'L_SHAPE': {
      const p = params as { shape: 'L_SHAPE'; length1: number; width1: number; length2: number; width2: number };
      return `
${dimensionLine(poolX, poolY, poolX + poolSvgW, poolY, `${p.length1.toFixed(2)} m`, -30, 'H')}
${dimensionLine(poolX + poolSvgW, poolY, poolX + poolSvgW, poolY + poolSvgH, `${p.width1.toFixed(2)} m`, 30, 'V')}`;
    }
    case 'FREEFORM': {
      const p = params as { shape: 'FREEFORM'; surfaceArea: number };
      return `
<text x="${poolX + poolSvgW / 2}" y="${poolY - 14}"
      text-anchor="middle" font-size="9" fill="#374151" font-family="monospace">
  Surface : ${p.surfaceArea.toFixed(1)} m²
</text>`;
    }
  }
}

// ─── Labels de forme ──────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<PoolShape, string> = {
  RECTANGULAR: 'RECTANGULAIRE',
  ROUND:       'RONDE',
  OVAL:        'OVALE',
  L_SHAPE:     'EN L',
  FREEFORM:    'FORME LIBRE',
};

// ─── Générateur principal ─────────────────────────────────────────────────────

export function generateSVGPlan(input: PlanInput): string {
  const { quote, pool, hydraulics } = input;

  // Canvas
  const VW = 1100, VH = 780;
  const MARGIN = 50;
  const CARTOUCHE_H = 72;
  const LEGEND_W = 180;
  const TECH_W = 175;

  // Zone bassin
  const drawX = MARGIN + TECH_W + 22;
  const drawY = MARGIN + 35;
  const drawW = VW - drawX - MARGIN - LEGEND_W - 12;
  const drawH = VH - drawY - MARGIN - CARTOUCHE_H - 18;

  // Échelle : on dérive une bounding box "representative" selon la forme
  let bboxW = pool.length;
  let bboxH = pool.width;
  switch (pool.shape) {
    case 'ROUND':   bboxW = bboxH = (pool.shapeParams as { diameter: number }).diameter;    break;
    case 'OVAL': {
      const op = pool.shapeParams as { majorAxis: number; minorAxis: number };
      bboxW = op.majorAxis; bboxH = op.minorAxis;
      break;
    }
    case 'L_SHAPE': {
      const lp = pool.shapeParams as { length1: number; width1: number };
      bboxW = lp.length1; bboxH = lp.width1;
      break;
    }
    case 'FREEFORM': {
      // Approximation carrée pour le rendu
      const side = Math.sqrt((pool.shapeParams as { surfaceArea: number }).surfaceArea);
      bboxW = side * 1.3; bboxH = side * 0.8;
      break;
    }
  }

  const scale    = Math.min(drawW / bboxW, drawH / bboxH) * 0.82;
  const poolSvgW = bboxW * scale;
  const poolSvgH = bboxH * scale;
  const poolX    = drawX;
  const poolY    = drawY + (drawH - poolSvgH) / 2;

  // Échelle déclarée
  const scaleRef   = Math.round(1000 / scale);
  const stdS       = [20, 25, 33, 50, 75, 100, 125, 150, 200];
  const scaleLabel = `1:${stdS.reduce((p, c) => Math.abs(c - scaleRef) < Math.abs(p - scaleRef) ? c : p)}`;

  // Local technique
  const techX  = MARGIN;
  const techY  = poolY;
  const techW  = TECH_W - 10;
  const techH  = poolSvgH;
  const pumpCX = techX + techW / 2, pumpCY = techY + techH * 0.25;
  const filtCX = techX + techW / 2, filtCY = techY + techH * 0.58;
  const valvCX = techX + techW / 2, valvCY = techY + techH * 0.88;

  // Skimmers (côté gauche du bassin)
  const skPos = Array.from({ length: hydraulics.skimmers }, (_, i) => ({
    x: poolX, y: poolY + ((i + 1) / (hydraulics.skimmers + 1)) * poolSvgH,
  }));

  // Buses de refoulement (côté droit + côté bas)
  const rRight = Math.floor(hydraulics.returns / 2);
  const rBot   = hydraulics.returns - rRight;
  const rfPos  = [
    ...Array.from({ length: rRight }, (_, i) => ({
      x: poolX + poolSvgW, y: poolY + ((i + 1) / (rRight + 1)) * poolSvgH, rot: 180,
    })),
    ...Array.from({ length: rBot }, (_, i) => ({
      x: poolX + ((i + 1) / (rBot + 1)) * poolSvgW, y: poolY + poolSvgH, rot: 270,
    })),
  ];

  // Nœud de jonction
  const juncX = techX + techW + 14;

  // Circuit aspiration (bleu)
  const suctionD = skPos.map(sk =>
    `M ${sk.x} ${sk.y} L ${juncX} ${sk.y} L ${juncX} ${pumpCY} L ${pumpCX + 15} ${pumpCY}`
  ).join(' ');

  // Circuit refoulement (rouge pointillé)
  const returnD = rfPos.map(rf =>
    `M ${pumpCX} ${pumpCY + 15} L ${pumpCX} ${filtCY - 26} ` +
    `M ${filtCX} ${filtCY + 26} L ${filtCX} ${filtCY + 48} L ${juncX + 6} ${filtCY + 48} L ${juncX + 6} ${rf.y} L ${rf.x} ${rf.y}`
  ).join(' ');

  // Logo
  const mariaB64 = loadLogo('maria-logo.png');

  // Date
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Cartouche
  const cartY  = VH - MARGIN - CARTOUCHE_H + 4;
  const tbData: TitleBlockData = {
    reference: quote.reference, clientName: quote.clientName,
    clientEmail: quote.clientEmail, date: dateStr,
    scale: scaleLabel, revision: 'A', logoBase64: mariaB64,
  };

  // Légende
  const legX = VW - MARGIN - LEGEND_W + 6, legY = drawY;

  // Symbole bassin shape-aware
  const poolSymbol = poolShapeSVG(pool.shape, pool.shapeParams, poolX, poolY, poolSvgW, poolSvgH);
  const poolDims   = poolDimensionsSVG(pool.shape, pool.shapeParams, poolX, poolY, poolSvgW, poolSvgH);
  const shapeLabel = SHAPE_LABELS[pool.shape];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">
<defs>
  <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M0,0 L10,5 L0,10z" fill="#dc2626"/>
  </marker>
  <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M0,0 L10,5 L0,10z" fill="#1d4ed8"/>
  </marker>
  <marker id="arrow-dim" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10z" fill="#374151"/>
  </marker>
  <pattern id="pool-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="10" stroke="#bfdbfe" stroke-width="0.8"/>
  </pattern>
</defs>

<!-- Fond -->
<rect width="${VW}" height="${VH}" fill="#f8fafc"/>
<rect x="${MARGIN / 2}" y="${MARGIN / 2}" width="${VW - MARGIN}" height="${VH - MARGIN}" fill="none" stroke="#374151" stroke-width="2"/>

<!-- Titre -->
<text x="${VW / 2}" y="${MARGIN / 2 + 20}" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a" letter-spacing="2" font-family="monospace">SCHÉMA HYDRAULIQUE — INSTALLATION PISCINE</text>

<!-- Local technique -->
<rect x="${techX}" y="${techY}" width="${techW}" height="${techH}" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,3" rx="4"/>
<text x="${techX + techW / 2}" y="${techY - 9}" text-anchor="middle" font-size="9" font-weight="bold" fill="#475569" font-family="monospace">LOCAL TECHNIQUE</text>
${symbolPump(pumpCX, pumpCY, 28, `${hydraulics.pumpPower} kW`)}
${symbolSandFilter(filtCX, filtCY, 22, `\u00d8${hydraulics.filterDiameter}mm`)}
${symbolValve6Way(valvCX, valvCY, 26)}

<!-- Bassin (forme : ${shapeLabel}) -->
${poolSymbol}
<text x="${poolX + poolSvgW / 2}" y="${poolY + poolSvgH / 2 - 7}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1" opacity="0.55" font-family="monospace">${pool.type} — ${shapeLabel}</text>
<text x="${poolX + poolSvgW / 2}" y="${poolY + poolSvgH / 2 + 10}" text-anchor="middle" font-size="9" fill="#0369a1" opacity="0.45" font-family="monospace">Vol. ${hydraulics.volume.toFixed(1)} m\u00b3</text>

<!-- Cotations -->
${poolDims}

<!-- Profondeurs -->
<text x="${poolX + 6}" y="${poolY + poolSvgH - 6}" font-size="8" fill="#0369a1" font-family="monospace">prof. min ${pool.depthShallow.toFixed(2)}m</text>
<text x="${poolX + poolSvgW - 6}" y="${poolY + poolSvgH - 6}" text-anchor="end" font-size="8" fill="#0369a1" font-family="monospace">prof. max ${pool.depthDeep.toFixed(2)}m</text>

<!-- Débit -->
<text x="${poolX + poolSvgW / 2}" y="${poolY - 46}" text-anchor="middle" font-size="8.5" fill="#374151" font-family="monospace">Débit : ${hydraulics.flowRate.toFixed(2)} m\u00b3/h</text>

<!-- Circuit aspiration -->
<path d="${suctionD}" fill="none" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrow-blue)"/>
<text x="${juncX + 3}" y="${pumpCY - 5}" font-size="8" fill="#1d4ed8" font-family="monospace">\u00d8${hydraulics.pipeDiameterSuction}</text>

<!-- Circuit refoulement -->
<path d="${returnD}" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="8,4" marker-end="url(#arrow-red)"/>
<text x="${juncX + 9}" y="${filtCY + 62}" font-size="8" fill="#dc2626" font-family="monospace">\u00d8${hydraulics.pipeDiameterReturn}</text>

<!-- Skimmers -->
${skPos.map((sk, i) => symbolSkimmer(sk.x, sk.y, 14, `SK${i + 1}`)).join('\n')}

<!-- Buses -->
${rfPos.map((rf, i) => symbolNozzle(rf.x, rf.y, rf.rot, `RF${i + 1}`)).join('\n')}

<!-- Légende -->
${legendBlock(legX, legY)}

<!-- Cartouche -->
${titleBlock(MARGIN / 2, cartY, VW - MARGIN, CARTOUCHE_H, tbData)}
</svg>`;
}

/** Mappe un objet Quote Prisma → PlanInput */
export function buildPlanInput(quote: any): PlanInput {
  const p = quote.poolData as any;
  const c = quote.calculationResult as any;

  // Rétro-compat : shape peut venir du champ Quote.shape ou de poolData.shape
  const shape: PoolShape  = (quote.shape ?? p?.shape ?? 'RECTANGULAR') as PoolShape;
  const shapeParams: ShapeParams = quote.shapeParams ?? p?.shapeParams ?? {
    shape: 'RECTANGULAR',
    length: p?.length ?? 0,
    width:  p?.width  ?? 0,
  };

  return {
    quote: {
      id: quote.id, reference: quote.reference,
      clientName: quote.clientName, clientEmail: quote.clientEmail,
    },
    pool: {
      shape,
      shapeParams,
      length:       p?.length       ?? 0,
      width:        p?.width        ?? 0,
      depthShallow: p?.depthShallow ?? 0,
      depthDeep:    p?.depthDeep    ?? 0,
      type:         p?.type         ?? 'SKIMMER',
    },
    hydraulics: {
      volume:              c.volume,
      flowRate:            c.adjustedFlowRate,
      pumpPower:           c.pumpPower,
      skimmers:            c.skimmers,
      returns:             c.returns,
      pipeDiameterSuction: c.suctionDiameter,
      pipeDiameterReturn:  c.pressureDiameter,
      valves:              c.valves,
      filterDiameter:      c.filterDiameter,
      sand:                c.sand,
    },
  };
}
