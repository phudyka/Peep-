/**
 * svgSymbols.ts — Symboles SVG techniques paramétriques pour le plan hydraulique.
 */

export function symbolSkimmer(cx: number, cy: number, size: number, label = 'SK'): string {
  const h = size / 2;
  return `<g transform="translate(${cx},${cy})">
    <rect x="${-h}" y="${-h}" width="${size}" height="${size}" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.5"/>
    <line x1="${-h}" y1="${-h}" x2="${h}" y2="${h}" stroke="#1d4ed8" stroke-width="1"/>
    ${label ? `<text x="0" y="${h+11}" text-anchor="middle" font-size="9" font-weight="bold" fill="#1d4ed8" font-family="monospace">${label}</text>` : ''}
  </g>`;
}

export function symbolNozzle(cx: number, cy: number, rotation: number, label = ''): string {
  const r = 6;
  return `<g transform="translate(${cx},${cy}) rotate(${rotation})">
    <circle r="${r}" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="${r+8}" y2="0" stroke="#dc2626" stroke-width="2" marker-end="url(#arrow-red)"/>
  </g>
  ${label ? `<text x="${cx}" y="${cy+r+13}" text-anchor="middle" font-size="9" font-weight="bold" fill="#dc2626" font-family="monospace">${label}</text>` : ''}`;
}

export function symbolPump(cx: number, cy: number, size: number, label = ''): string {
  const r = size / 2, t = r * 0.6;
  const pts = `${-t},${t} ${-t},${-t} ${t},0`;
  return `<g transform="translate(${cx},${cy})">
    <circle r="${r}" fill="#fefce8" stroke="#92400e" stroke-width="2"/>
    <polygon points="${pts}" fill="#92400e"/>
    ${label ? `<text x="0" y="${r+13}" text-anchor="middle" font-size="8" font-weight="bold" fill="#92400e" font-family="monospace">${label}</text>` : ''}
  </g>`;
}

export function symbolSandFilter(cx: number, cy: number, radius: number, label = ''): string {
  const tw = radius * 1.4, th = radius * 2.2, hr = radius * 0.45;
  return `<g transform="translate(${cx},${cy})">
    <rect x="${-tw/2}" y="${hr-2}" width="${tw}" height="${th}" rx="6" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
    <circle cx="0" cy="${hr*0.2}" r="${hr}" fill="#dcfce7" stroke="#15803d" stroke-width="2"/>
    <rect x="${-tw/2+3}" y="${hr+th*0.45}" width="${tw-6}" height="${th*0.35}" rx="2" fill="#d4a04a" opacity="0.5"/>
    ${label ? `<text x="0" y="${hr+th+14}" text-anchor="middle" font-size="8" font-weight="bold" fill="#15803d" font-family="monospace">${label}</text>` : ''}
  </g>`;
}

export function symbolValve6Way(cx: number, cy: number, size: number): string {
  const r = size / 2;
  const pts = Array.from({length:6},(_,i)=>{const a=(Math.PI/3)*i-Math.PI/6;return `${(r*Math.cos(a)).toFixed(1)},${(r*Math.sin(a)).toFixed(1)}`;}).join(' ');
  return `<g transform="translate(${cx},${cy})">
    <polygon points="${pts}" fill="#faf5ff" stroke="#7c3aed" stroke-width="2"/>
    <text x="0" y="4" text-anchor="middle" font-size="9" font-weight="bold" fill="#7c3aed" font-family="monospace">6V</text>
    <text x="0" y="${r+13}" text-anchor="middle" font-size="8" fill="#7c3aed" font-family="monospace">V.6 voies</text>
  </g>`;
}

export function dimensionLine(x1:number,y1:number,x2:number,y2:number,text:string,offset:number,axis:'H'|'V'): string {
  if (axis==='H') {
    const oy=y1+offset,mx=(x1+x2)/2;
    return `<g stroke="#374151" stroke-width="0.8" fill="none">
      <line x1="${x1}" y1="${y1}" x2="${x1}" y2="${oy}" stroke-dasharray="3,2"/>
      <line x1="${x2}" y1="${y2}" x2="${x2}" y2="${oy}" stroke-dasharray="3,2"/>
      <line x1="${x1}" y1="${oy}" x2="${x2}" y2="${oy}" marker-start="url(#arrow-dim)" marker-end="url(#arrow-dim)"/>
      <rect x="${mx-26}" y="${oy-10}" width="52" height="13" fill="white"/>
      <text x="${mx}" y="${oy}" dy="1" text-anchor="middle" font-size="9" fill="#374151" font-family="monospace">${text}</text>
    </g>`;
  }
  const ox=x1+offset,my=(y1+y2)/2;
  return `<g stroke="#374151" stroke-width="0.8" fill="none">
    <line x1="${x1}" y1="${y1}" x2="${ox}" y2="${y1}" stroke-dasharray="3,2"/>
    <line x1="${x2}" y1="${y2}" x2="${ox}" y2="${y2}" stroke-dasharray="3,2"/>
    <line x1="${ox}" y1="${y1}" x2="${ox}" y2="${y2}" marker-start="url(#arrow-dim)" marker-end="url(#arrow-dim)"/>
    <rect x="${ox-26}" y="${my-10}" width="52" height="13" fill="white"/>
    <text x="${ox}" y="${my}" dy="1" text-anchor="middle" font-size="9" fill="#374151" font-family="monospace">${text}</text>
  </g>`;
}

export interface TitleBlockData {
  reference: string; clientName: string; clientEmail?: string|null;
  date: string; scale: string; revision: string; logoBase64?: string;
}

export function titleBlock(x:number,y:number,w:number,h:number,data:TitleBlockData): string {
  const logoW=96, sep1=x+logoW+8, colW=(w-logoW-8)/2, sep2=sep1+colW;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" stroke="#374151" stroke-width="1.5"/>
    <line x1="${sep1}" y1="${y}" x2="${sep1}" y2="${y+h}" stroke="#374151" stroke-width="1"/>
    <line x1="${sep2}" y1="${y}" x2="${sep2}" y2="${y+h}" stroke="#374151" stroke-width="0.8"/>
    ${data.logoBase64
      ? `<image href="${data.logoBase64}" x="${x+3}" y="${y+4}" width="${logoW-6}" height="${h-8}" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="${x+logoW/2}" y="${y+h/2+5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8" font-family="sans-serif">ETS MARIA</text>`}
    <text x="${sep1+6}" y="${y+16}" font-size="8.5" font-family="monospace" fill="#0f172a"><tspan font-weight="bold">Réf : </tspan>${data.reference}</text>
    <text x="${sep1+6}" y="${y+30}" font-size="8.5" font-family="monospace" fill="#0f172a"><tspan font-weight="bold">Client : </tspan>${data.clientName}</text>
    ${data.clientEmail?`<text x="${sep1+6}" y="${y+44}" font-size="7.5" font-family="monospace" fill="#6b7280">${data.clientEmail}</text>`:''}
    <text x="${sep1+6}" y="${y+58}" font-size="8.5" font-family="monospace" fill="#0f172a"><tspan font-weight="bold">Date : </tspan>${data.date}</text>
    <text x="${sep2+6}" y="${y+16}" font-size="8.5" font-family="monospace" fill="#0f172a"><tspan font-weight="bold">Échelle : </tspan>${data.scale}</text>
    <text x="${sep2+6}" y="${y+30}" font-size="8.5" font-family="monospace" fill="#0f172a"><tspan font-weight="bold">Rév. : </tspan>${data.revision}</text>
    <text x="${sep2+6}" y="${y+44}" font-size="7.5" font-family="monospace" fill="#6b7280">Schéma hydraulique</text>
    <text x="${sep2+6}" y="${y+58}" font-size="7.5" font-family="monospace" fill="#6b7280">Usage interne — ETS Maria</text>
  </g>`;
}

export function legendBlock(x:number,y:number): string {
  const lh=26;
  return `<g>
    <rect x="${x-4}" y="${y}" width="170" height="${lh*7+12}" fill="white" stroke="#374151" stroke-width="1" rx="3"/>
    <text x="${x+81}" y="${y+13}" text-anchor="middle" font-size="9" font-weight="bold" fill="#374151" font-family="monospace">LÉGENDE</text>
    ${symbolSkimmer(x+11,y+22+lh*0,14,'')}
    <text x="${x+26}" y="${y+26+lh*0}" font-size="9" font-family="monospace" fill="#1d4ed8">Skimmer</text>
    <circle cx="${x+11}" cy="${y+22+lh*1}" r="6" fill="#fecaca" stroke="#dc2626" stroke-width="1.5"/>
    <text x="${x+26}" y="${y+26+lh*1}" font-size="9" font-family="monospace" fill="#dc2626">Buse refoulement</text>
    ${symbolPump(x+11,y+22+lh*2,18,'')}
    <text x="${x+26}" y="${y+26+lh*2}" font-size="9" font-family="monospace" fill="#92400e">Pompe</text>
    ${symbolSandFilter(x+11,y+22+lh*3,10,'')}
    <text x="${x+26}" y="${y+26+lh*3}" font-size="9" font-family="monospace" fill="#15803d">Filtre à sable</text>
    ${symbolValve6Way(x+11,y+22+lh*4,18)}
    <text x="${x+26}" y="${y+26+lh*4}" font-size="9" font-family="monospace" fill="#7c3aed">Vanne 6 voies</text>
    <line x1="${x+2}" y1="${y+22+lh*5}" x2="${x+20}" y2="${y+22+lh*5}" stroke="#1d4ed8" stroke-width="2"/>
    <text x="${x+26}" y="${y+26+lh*5}" font-size="9" font-family="monospace" fill="#1d4ed8">Aspiration</text>
    <line x1="${x+2}" y1="${y+22+lh*6}" x2="${x+20}" y2="${y+22+lh*6}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="${x+26}" y="${y+26+lh*6}" font-size="9" font-family="monospace" fill="#dc2626">Refoulement</text>
  </g>`;
}
