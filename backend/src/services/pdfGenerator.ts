import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { generateSVGPlan, buildPlanInput } from './planGenerator';
import type { PoolShape, ShapeParams } from './hydraulicEngine';

const fonts = {
  Roboto: {
    normal:      'Helvetica',
    bold:        'Helvetica-Bold',
    italics:     'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

// ─── Labels de forme ──────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<PoolShape, string> = {
  RECTANGULAR: 'Rectangulaire',
  ROUND:       'Ronde',
  OVAL:        'Ovale',
  L_SHAPE:     'En L',
  FREEFORM:    'Forme libre',
};

// ─── Bloc dimensions (remplace l'ancien "longueur × largeur") ─────────────────

function dimensionsBlock(shape: PoolShape, params: ShapeParams): Content {
  const rows: [string, string][] = [
    ['Forme', SHAPE_LABELS[shape]],
  ];

  switch (params.shape) {
    case 'RECTANGULAR':
      rows.push(['Longueur', `${params.length.toFixed(2)} m`]);
      rows.push(['Largeur',  `${params.width.toFixed(2)} m`]);
      rows.push(['Surface',  `${(params.length * params.width).toFixed(2)} m²`]);
      break;
    case 'ROUND':
      rows.push(['Diamètre', `${params.diameter.toFixed(2)} m`]);
      rows.push(['Surface',  `${(Math.PI * Math.pow(params.diameter / 2, 2)).toFixed(2)} m²`]);
      break;
    case 'OVAL':
      rows.push(['Grand axe', `${params.majorAxis.toFixed(2)} m`]);
      rows.push(['Petit axe', `${params.minorAxis.toFixed(2)} m`]);
      rows.push(['Surface',   `${(Math.PI * (params.majorAxis / 2) * (params.minorAxis / 2)).toFixed(2)} m²`]);
      break;
    case 'L_SHAPE':
      rows.push(['Longueur 1', `${params.length1.toFixed(2)} m`]);
      rows.push(['Largeur 1',  `${params.width1.toFixed(2)} m`]);
      rows.push(['Longueur 2', `${params.length2.toFixed(2)} m`]);
      rows.push(['Largeur 2',  `${params.width2.toFixed(2)} m`]);
      rows.push(['Surface',    `${(params.length1 * params.width1 + params.length2 * params.width2).toFixed(2)} m²`]);
      break;
    case 'FREEFORM':
      rows.push(['Surface (saisie)', `${params.surfaceArea.toFixed(2)} m²`]);
      break;
  }

  return {
    table: {
      widths: [120, '*'],
      body: rows.map(([label, value]) => [
        { text: label, bold: true, fontSize: 9 },
        { text: value, fontSize: 9 },
      ]),
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 10] as [number, number, number, number],
  };
}

// ─── Extraction shape depuis un quote Prisma (any) ────────────────────────────

function extractShape(quote: any): { shape: PoolShape; params: ShapeParams } {
  const poolData = quote.poolData as any;
  const shape: PoolShape = (quote.shape ?? poolData?.shape ?? 'RECTANGULAR') as PoolShape;
  const params: ShapeParams = quote.shapeParams ?? poolData?.shapeParams ?? {
    shape: 'RECTANGULAR',
    length: poolData?.length ?? 0,
    width:  poolData?.width  ?? 0,
  };
  return { shape, params };
}

// ─── PDF interne ──────────────────────────────────────────────────────────────

export async function generateInternalPDF(quote: any): Promise<Buffer> {
  let planSvg: string | undefined;
  try {
    const planInput = buildPlanInput(quote);
    planSvg = generateSVGPlan(planInput);
  } catch (e) {
    console.warn('[pdfGenerator] Impossible de générer le plan SVG :', e);
  }

  const { shape, params } = extractShape(quote);
  const poolData = quote.poolData as any;

  const docDefinition: TDocumentDefinitions = {
    pageOrientation: 'landscape',
    pageSize: 'A4',
    content: [
      { text: `DEVIS INTERNE — ${quote.reference}`, style: 'header' },
      {
        text: `Client : ${quote.clientName}${quote.clientEmail ? ` (${quote.clientEmail})` : ''}`,
        margin: [0, 6, 0, 10] as [number, number, number, number],
      },

      { text: 'Dimensions du bassin :', style: 'subheader' },
      dimensionsBlock(shape, params),

      {
        columns: [
          { text: `Profondeur petit bain : ${(poolData?.depthShallow ?? 0).toFixed(2)} m`, fontSize: 9 },
          { text: `Profondeur grand bain : ${(poolData?.depthDeep ?? 0).toFixed(2)} m`,    fontSize: 9 },
        ],
        margin: [0, 0, 0, 12] as [number, number, number, number],
      },

      { text: 'Résumé hydraulique :', style: 'subheader' },
      { text: JSON.stringify(quote.calculationResult, null, 2), fontSize: 9, margin: [0, 0, 0, 12] as [number, number, number, number] },

      ...(planSvg ? [
        { text: 'Plan hydraulique 2D :', style: 'subheader' },
        { svg: planSvg, width: 760, margin: [0, 0, 0, 16] as [number, number, number, number] },
      ] : []),

      { text: 'Lignes de devis (toutes, y compris masquées) :', style: 'subheader' },
      tableOfLines(quote.lines, true),
    ],
    styles: {
      header:    { fontSize: 18, bold: true },
      subheader: { fontSize: 13, bold: true, margin: [0, 10, 0, 5] as [number, number, number, number] },
    },
  };

  return bufferFromPdf(docDefinition);
}

// ─── PDF client ───────────────────────────────────────────────────────────────

export async function generateClientPDF(quote: any): Promise<Buffer> {
  const { shape, params } = extractShape(quote);
  const poolData = quote.poolData as any;

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: `DEVIS — ${quote.reference}`, style: 'header' },
      {
        text: `Client : ${quote.clientName}`,
        margin: [0, 10, 0, 10] as [number, number, number, number],
      },

      { text: 'Bassin :', style: 'subheader' },
      dimensionsBlock(shape, params),
      {
        columns: [
          { text: `Profondeur petit bain : ${(poolData?.depthShallow ?? 0).toFixed(2)} m`, fontSize: 9 },
          { text: `Profondeur grand bain : ${(poolData?.depthDeep ?? 0).toFixed(2)} m`,    fontSize: 9 },
        ],
        margin: [0, 0, 0, 12] as [number, number, number, number],
      },

      { text: 'Équipements :', style: 'subheader' },
      tableOfLines(quote.lines.filter((l: any) => l.visible), false),

      {
        text: '\nETS Maria — www.maria-piscines.fr',
        margin: [0, 20, 0, 0] as [number, number, number, number],
        alignment: 'center',
        fontSize: 10,
      },
    ],
    styles: {
      header:    { fontSize: 22, bold: true, alignment: 'center' },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] as [number, number, number, number] },
    },
  };

  return bufferFromPdf(docDefinition);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bufferFromPdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end',  () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

function tableOfLines(lines: any[], internal: boolean): Content {
  const header = ['Produit', 'Qté'];
  if (internal) header.push('Prix achat', 'Marge');
  header.push('Prix unit.', 'Total');

  const body: string[][] = [header];

  for (const l of lines) {
    const total = l.quantity * l.unitPrice * (1 - l.discount / 100);
    const row = [l.product?.name ?? '—', String(l.quantity)];
    if (internal) {
      row.push(
        `${(l.product?.purchasePrice ?? 0).toFixed(2)} €`,
        `${((l.unitPrice - (l.product?.purchasePrice ?? 0)) * l.quantity).toFixed(2)} €`,
      );
    }
    row.push(`${l.unitPrice.toFixed(2)} €`, `${total.toFixed(2)} €`);
    body.push(row);
  }

  return {
    table: {
      headerRows: 1,
      widths: internal ? ['*', 'auto', 'auto', 'auto', 'auto', 'auto'] : ['*', 'auto', 'auto', 'auto'],
      body,
    },
  };
}
