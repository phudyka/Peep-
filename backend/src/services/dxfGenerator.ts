/**
 * dxfGenerator.ts
 * Génère un DXF R12 ASCII depuis les données du plan hydraulique.
 * Format R12 (1992) — compatible AutoCAD, LibreCAD, QCAD, FreeCAD.
 * Aucune dépendance npm. Unités : MILLIMÈTRES.
 */

import { PlanInput } from './planGenerator';

const g = (code: number, val: string|number) => `  ${code}\n${val}\n`;

const LAYERS = [
  {name:'POOL',      color:4}, // cyan
  {name:'EQUIPMENT', color:3}, // green
  {name:'SUCTION',   color:5}, // blue
  {name:'RETURN',    color:1}, // red
  {name:'DIMENSIONS',color:2}, // yellow
  {name:'TITLE',     color:7}, // white
];

function line(x1:number,y1:number,x2:number,y2:number,layer:string):string {
  return g(0,'LINE')+g(8,layer)+g(10,x1.toFixed(2))+g(20,y1.toFixed(2))+g(30,'0')+g(11,x2.toFixed(2))+g(21,y2.toFixed(2))+g(31,'0');
}
function circle(cx:number,cy:number,r:number,layer:string):string {
  return g(0,'CIRCLE')+g(8,layer)+g(10,cx.toFixed(2))+g(20,cy.toFixed(2))+g(30,'0')+g(40,r.toFixed(2));
}
function text(x:number,y:number,str:string,h:number,layer:string,hjust=0):string {
  return g(0,'TEXT')+g(8,layer)+g(10,x.toFixed(2))+g(20,y.toFixed(2))+g(30,'0')+g(40,h.toFixed(2))+g(1,str)+g(72,hjust)+(hjust?g(11,x.toFixed(2))+g(21,y.toFixed(2))+g(31,'0'):'');
}
function rect(x:number,y:number,w:number,h:number,layer:string):string {
  return line(x,y,x+w,y,layer)+line(x+w,y,x+w,y+h,layer)+line(x+w,y+h,x,y+h,layer)+line(x,y+h,x,y,layer);
}
function dimH(x1:number,y:number,x2:number,off:number,lbl:string):string {
  const dy=y+off,mx=(x1+x2)/2;
  return line(x1,y,x1,dy,'DIMENSIONS')+line(x2,y,x2,dy,'DIMENSIONS')+line(x1,dy,x2,dy,'DIMENSIONS')+text(mx,dy-80,lbl,60,'DIMENSIONS',1);
}
function dimV(x:number,y1:number,y2:number,off:number,lbl:string):string {
  const dx=x+off,my=(y1+y2)/2;
  return line(x,y1,dx,y1,'DIMENSIONS')+line(x,y2,dx,y2,'DIMENSIONS')+line(dx,y1,dx,y2,'DIMENSIONS')+text(dx+30,my,lbl,60,'DIMENSIONS');
}

export function generateDXFPlan(input: PlanInput): string {
  const {quote,pool,hydraulics} = input;
  const S = 1000; // 1m = 1000 unités DXF

  const poolX=38*S, poolY=10*S, poolW=pool.length*S, poolH=pool.width*S;
  const techX=5*S,  techW=28*S, techY=poolY, techH=poolH;
  const pumpX=techX+techW*0.5, pumpY=techY+techH*0.25;
  const filtX=techX+techW*0.5, filtY=techY+techH*0.58;
  const valvX=techX+techW*0.5, valvY=techY+techH*0.88;

  const skPos = Array.from({length:hydraulics.skimmers},(_,i)=>({
    x:poolX, y:poolY+((i+1)/(hydraulics.skimmers+1))*poolH,
  }));
  const rR=Math.floor(hydraulics.returns/2), rB=hydraulics.returns-rR;
  const rfPos = [
    ...Array.from({length:rR},(_,i)=>({x:poolX+poolW, y:poolY+((i+1)/(rR+1))*poolH})),
    ...Array.from({length:rB},(_,i)=>({x:poolX+((i+1)/(rB+1))*poolW, y:poolY+poolH})),
  ];

  const jX = techX+techW+1*S;
  const dateStr = new Date().toLocaleDateString('fr-FR');

  let e = '';

  // Bassin
  e += rect(poolX,poolY,poolW,poolH,'POOL');
  e += text(poolX+poolW/2,poolY+poolH/2,`${pool.type} - Vol.${hydraulics.volume.toFixed(1)}m3`,120,'POOL',1);

  // Local technique
  e += rect(techX,techY,techW,techH,'EQUIPMENT');
  e += text(techX+techW/2,techY+techH+200,'LOCAL TECHNIQUE',80,'EQUIPMENT',1);

  // Pompe (cercle + triangle)
  e += circle(pumpX,pumpY,80,'EQUIPMENT');
  e += line(pumpX-45,pumpY-45,pumpX-45,pumpY+45,'EQUIPMENT');
  e += line(pumpX-45,pumpY-45,pumpX+45,pumpY,'EQUIPMENT');
  e += line(pumpX-45,pumpY+45,pumpX+45,pumpY,'EQUIPMENT');
  e += text(pumpX,pumpY+110,`Pompe ${hydraulics.pumpPower}kW`,50,'EQUIPMENT',1);

  // Filtre (cuve + tête)
  e += rect(filtX-55,filtY-50,110,200,'EQUIPMENT');
  e += circle(filtX,filtY-50,45,'EQUIPMENT');
  e += text(filtX,filtY+180,`Filtre sable Ø${hydraulics.filterDiameter}mm`,50,'EQUIPMENT',1);

  // Vanne 6 voies (hexagone)
  const vR=70;
  for(let i=0;i<6;i++){
    const a1=(Math.PI/3)*i, a2=(Math.PI/3)*(i+1);
    e += line(valvX+vR*Math.cos(a1),valvY+vR*Math.sin(a1),valvX+vR*Math.cos(a2),valvY+vR*Math.sin(a2),'EQUIPMENT');
  }
  e += text(valvX,valvY+vR+80,'VANNE 6 VOIES',50,'EQUIPMENT',1);

  // Skimmers
  skPos.forEach((sk,i)=>{
    const h=150;
    e += rect(sk.x-h,sk.y-h,h*2,h*2,'EQUIPMENT');
    e += line(sk.x-h,sk.y-h,sk.x+h,sk.y+h,'EQUIPMENT');
    e += text(sk.x,sk.y-h-80,`SK${i+1}`,55,'EQUIPMENT',1);
  });

  // Buses
  rfPos.forEach((rf,i)=>{
    e += circle(rf.x,rf.y,40,'EQUIPMENT');
    e += text(rf.x,rf.y+60,`RF${i+1}`,55,'EQUIPMENT',1);
  });

  // Circuit aspiration
  skPos.forEach(sk=>{
    e += line(sk.x,sk.y,jX,sk.y,'SUCTION');
    e += line(jX,sk.y,jX,pumpY,'SUCTION');
    e += line(jX,pumpY,pumpX+80,pumpY,'SUCTION');
  });
  e += text(jX+50,pumpY+150,`Aspiration Ø${hydraulics.pipeDiameterSuction}mm`,60,'SUCTION');

  // Circuit refoulement
  const jX2=techX+techW+2*S;
  rfPos.forEach(rf=>{
    e += line(pumpX,pumpY+80,pumpX,filtY-200,'RETURN');
    e += line(pumpX,filtY-200,filtX,filtY-200,'RETURN');
    e += line(filtX,filtY+200,filtX,filtY+500,'RETURN');
    e += line(filtX,filtY+500,jX2,filtY+500,'RETURN');
    e += line(jX2,filtY+500,jX2,rf.y,'RETURN');
    e += line(jX2,rf.y,rf.x,rf.y,'RETURN');
  });
  e += text(jX2+50,filtY+600,`Refoulement Ø${hydraulics.pipeDiameterReturn}mm`,60,'RETURN');

  // Cotations
  e += dimH(poolX,poolY,poolX+poolW,-3*S,`${pool.length.toFixed(2)} m`);
  e += dimV(poolX+poolW,poolY,poolY+poolH,3*S,`${pool.width.toFixed(2)} m`);
  e += text(poolX+500,poolY+poolH-300,`prof.min ${pool.depthShallow}m`,70,'DIMENSIONS');
  e += text(poolX+poolW-500,poolY+poolH-300,`prof.max ${pool.depthDeep}m`,70,'DIMENSIONS',2);

  // Cartouche
  const cbY=poolY+poolH+8*S, cbW=(pool.length+33)*S;
  e += rect(techX,cbY,cbW,6*S,'TITLE');
  e += line(techX+20*S,cbY,techX+20*S,cbY+6*S,'TITLE');
  e += line(techX+32*S,cbY,techX+32*S,cbY+6*S,'TITLE');
  e += text(techX+500,cbY+4500,`Ref: ${quote.reference}`,100,'TITLE');
  e += text(techX+500,cbY+3000,`Client: ${quote.clientName}`,100,'TITLE');
  e += text(techX+500,cbY+1500,`Date: ${dateStr}`,80,'TITLE');
  e += text(techX+20*S+500,cbY+4500,'ETS MARIA — Depuis 1937',100,'TITLE');
  e += text(techX+32*S+500,cbY+4500,'Revision: A',80,'TITLE');
  e += text(techX+32*S+500,cbY+3000,'Schema hydraulique',80,'TITLE');

  // ── Assemblage DXF R12 ──────────────────────────────────────────────────
  const maxX=((pool.length+50)*S).toFixed(0), maxY=((pool.width+30)*S).toFixed(0);
  const header = g(0,'SECTION')+g(2,'HEADER')+g(9,'$ACADVER')+g(1,'AC1009')+g(9,'$INSUNITS')+g(70,4)+g(9,'$EXTMIN')+g(10,'0')+g(20,'0')+g(30,'0')+g(9,'$EXTMAX')+g(10,maxX)+g(20,maxY)+g(30,'0')+g(0,'ENDSEC');
  const tables = g(0,'SECTION')+g(2,'TABLES')+g(0,'TABLE')+g(2,'LAYER')+LAYERS.map(l=>g(0,'LAYER')+g(2,l.name)+g(70,0)+g(62,l.color)+g(6,'CONTINUOUS')).join('')+g(0,'ENDTAB')+g(0,'ENDSEC');
  const entities = g(0,'SECTION')+g(2,'ENTITIES')+e+g(0,'ENDSEC');

  return header+tables+entities+g(0,'EOF');
}
