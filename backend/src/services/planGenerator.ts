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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanInput {
  quote: { id: string; reference: string; clientName: string; clientEmail?: string|null };
  pool: { length: number; width: number; depthShallow: number; depthDeep: number; type: string };
  hydraulics: {
    volume: number; flowRate: number; pumpPower: number;
    skimmers: number; returns: number;
    pipeDiameterSuction: number; pipeDiameterReturn: number;
    valves: number; filterDiameter: number; sand: number;
  };
}

// ─── Chargement logo (lecture depuis la racine du projet) ─────────────────────

function loadLogo(filename: string): string|undefined {
  // Dans Docker : /app = racine backend. Logo monté à /logos/maria-logo.png
  // En dev local : cherche depuis la racine du projet (3 niveaux au-dessus de dist/services)
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

  // Échelle
  const scale = Math.min(drawW / pool.length, drawH / pool.width) * 0.82;
  const poolSvgW = pool.length * scale;
  const poolSvgH = pool.width * scale;
  const poolX = drawX;
  const poolY = drawY + (drawH - poolSvgH) / 2;

  // Échelle déclarée
  const scaleRef = Math.round(1000 / scale); // 1px ≈ 1mm → 1:scaleRef
  const stdS = [20,25,33,50,75,100,125,150,200];
  const scaleLabel = `1:${stdS.reduce((p,c) => Math.abs(c-scaleRef)<Math.abs(p-scaleRef)?c:p)}`;

  // Local technique
  const techX = MARGIN;
  const techY = poolY;
  const techW = TECH_W - 10;
  const techH = poolSvgH;
  const pumpCX = techX + techW/2, pumpCY = techY + techH*0.25;
  const filtCX  = techX + techW/2, filtCY  = techY + techH*0.58;
  const valvCX  = techX + techW/2, valvCY  = techY + techH*0.88;

  // Skimmers (côté gauche du bassin)
  const skPos = Array.from({length: hydraulics.skimmers}, (_,i) => ({
    x: poolX, y: poolY + ((i+1)/(hydraulics.skimmers+1)) * poolSvgH,
  }));

  // Buses de refoulement (côté droit + côté bas)
  const rRight = Math.floor(hydraulics.returns/2);
  const rBot   = hydraulics.returns - rRight;
  const rfPos = [
    ...Array.from({length:rRight},(_,i) => ({
      x: poolX+poolSvgW, y: poolY+((i+1)/(rRight+1))*poolSvgH, rot:180,
    })),
    ...Array.from({length:rBot},(_,i) => ({
      x: poolX+((i+1)/(rBot+1))*poolSvgW, y: poolY+poolSvgH, rot:270,
    })),
  ];

  // Nœud de jonction (entre local tech et bassin)
  const juncX = techX + techW + 14;

  // Circuit aspiration (bleu)
  const suctionD = skPos.map(sk =>
    `M ${sk.x} ${sk.y} L ${juncX} ${sk.y} L ${juncX} ${pumpCY} L ${pumpCX+15} ${pumpCY}`
  ).join(' ');

  // Circuit refoulement (rouge pointillé)
  const returnD = rfPos.map(rf =>
    `M ${pumpCX} ${pumpCY+15} L ${pumpCX} ${filtCY-26} ` +
    `M ${filtCX} ${filtCY+26} L ${filtCX} ${filtCY+48} L ${juncX+6} ${filtCY+48} L ${juncX+6} ${rf.y} L ${rf.x} ${rf.y}`
  ).join(' ');

  // Logo
  const mariaB64 = loadLogo('maria-logo.png');

  // Date
  const dateStr = new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});

  // Cartouche
  const cartY = VH - MARGIN - CARTOUCHE_H + 4;
  const tbData: TitleBlockData = {
    reference: quote.reference, clientName: quote.clientName,
    clientEmail: quote.clientEmail, date: dateStr,
    scale: scaleLabel, revision: 'A', logoBase64: mariaB64,
  };

  // Légende
  const legX = VW - MARGIN - LEGEND_W + 6, legY = drawY;

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
<rect x="${MARGIN/2}" y="${MARGIN/2}" width="${VW-MARGIN}" height="${VH-MARGIN}" fill="none" stroke="#374151" stroke-width="2"/>

<!-- Titre -->
<text x="${VW/2}" y="${MARGIN/2+20}" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a" letter-spacing="2" font-family="monospace">SCHÉMA HYDRAULIQUE — INSTALLATION PISCINE</text>

<!-- Local technique -->
<rect x="${techX}" y="${techY}" width="${techW}" height="${techH}" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6,3" rx="4"/>
<text x="${techX+techW/2}" y="${techY-9}" text-anchor="middle" font-size="9" font-weight="bold" fill="#475569" font-family="monospace">LOCAL TECHNIQUE</text>
${symbolPump(pumpCX, pumpCY, 28, `${hydraulics.pumpPower} kW`)}
${symbolSandFilter(filtCX, filtCY, 22, `\u00d8${hydraulics.filterDiameter}mm`)}
${symbolValve6Way(valvCX, valvCY, 26)}

<!-- Bassin -->
<rect x="${poolX}" y="${poolY}" width="${poolSvgW}" height="${poolSvgH}" fill="url(#pool-hatch)" rx="3"/>
<rect x="${poolX}" y="${poolY}" width="${poolSvgW}" height="${poolSvgH}" fill="none" stroke="#0369a1" stroke-width="3" rx="3"/>
<text x="${poolX+poolSvgW/2}" y="${poolY+poolSvgH/2-7}" text-anchor="middle" font-size="11" font-weight="bold" fill="#0369a1" opacity="0.55" font-family="monospace">${pool.type}</text>
<text x="${poolX+poolSvgW/2}" y="${poolY+poolSvgH/2+10}" text-anchor="middle" font-size="9" fill="#0369a1" opacity="0.45" font-family="monospace">Vol. ${hydraulics.volume.toFixed(1)} m\u00b3</text>

<!-- Cotation longueur -->
${dimensionLine(poolX, poolY, poolX+poolSvgW, poolY, `${pool.length.toFixed(2)} m`, -30, 'H')}
<!-- Cotation largeur -->
${dimensionLine(poolX+poolSvgW, poolY, poolX+poolSvgW, poolY+poolSvgH, `${pool.width.toFixed(2)} m`, 30, 'V')}

<!-- Profondeurs -->
<text x="${poolX+6}" y="${poolY+poolSvgH-6}" font-size="8" fill="#0369a1" font-family="monospace">prof. min ${pool.depthShallow.toFixed(2)}m</text>
<text x="${poolX+poolSvgW-6}" y="${poolY+poolSvgH-6}" text-anchor="end" font-size="8" fill="#0369a1" font-family="monospace">prof. max ${pool.depthDeep.toFixed(2)}m</text>

<!-- Débit -->
<text x="${poolX+poolSvgW/2}" y="${poolY-46}" text-anchor="middle" font-size="8.5" fill="#374151" font-family="monospace">Débit : ${hydraulics.flowRate.toFixed(2)} m\u00b3/h</text>

<!-- Circuit aspiration -->
<path d="${suctionD}" fill="none" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrow-blue)"/>
<text x="${juncX+3}" y="${pumpCY-5}" font-size="8" fill="#1d4ed8" font-family="monospace">\u00d8${hydraulics.pipeDiameterSuction}</text>

<!-- Circuit refoulement -->
<path d="${returnD}" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="8,4" marker-end="url(#arrow-red)"/>
<text x="${juncX+9}" y="${filtCY+62}" font-size="8" fill="#dc2626" font-family="monospace">\u00d8${hydraulics.pipeDiameterReturn}</text>

<!-- Skimmers -->
${skPos.map((sk,i) => symbolSkimmer(sk.x, sk.y, 14, `SK${i+1}`)).join('\n')}

<!-- Buses -->
${rfPos.map((rf,i) => symbolNozzle(rf.x, rf.y, rf.rot, `RF${i+1}`)).join('\n')}

<!-- Légende -->
${legendBlock(legX, legY)}

<!-- Cartouche -->
${titleBlock(MARGIN/2, cartY, VW-MARGIN, CARTOUCHE_H, tbData)}
</svg>`;
}

/** Mappe un objet Quote Prisma → PlanInput */
export function buildPlanInput(quote: any): PlanInput {
  const p = quote.poolData as any;
  const c = quote.calculationResult as any;
  return {
    quote: { id: quote.id, reference: quote.reference, clientName: quote.clientName, clientEmail: quote.clientEmail },
    pool: { length: p.length, width: p.width, depthShallow: p.depthShallow, depthDeep: p.depthDeep, type: p.type },
    hydraulics: {
      volume: c.volume, flowRate: c.adjustedFlowRate, pumpPower: c.pumpPower,
      skimmers: c.skimmers, returns: c.returns,
      pipeDiameterSuction: c.suctionDiameter, pipeDiameterReturn: c.pressureDiameter,
      valves: c.valves, filterDiameter: c.filterDiameter, sand: c.sand,
    },
  };
}
