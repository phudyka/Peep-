import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

export async function generateInternalPDF(quote: any): Promise<Buffer> {
  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: `INTERNAL QUOTE - ${quote.reference}`, style: 'header' },
      { text: `Client: ${quote.clientName} (${quote.clientEmail})`, margin: [0, 10, 0, 10] },
      { text: 'Hydraulic Parameters Summary:', style: 'subheader' },
      { text: JSON.stringify(quote.calculationResult, null, 2), fontSize: 10, margin: [0, 0, 0, 10] },
      { text: 'Lines (Including Hidden):', style: 'subheader' },
      tableOfLines(quote.lines, true)
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
    }
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

export async function generateClientPDF(quote: any): Promise<Buffer> {
  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: `QUOTE - ${quote.reference}`, style: 'header' },
      { text: `Client: ${quote.clientName}`, margin: [0, 10, 0, 10] },
      { text: 'Equipment List:', style: 'subheader' },
      tableOfLines(quote.lines.filter((l: any) => l.visible), false),
      { text: '\nCompany Details Footer...', margin: [0, 20, 0, 0], alignment: 'center', fontSize: 10 }
    ],
    styles: {
      header: { fontSize: 22, bold: true, alignment: 'center' },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
    }
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

function tableOfLines(lines: any[], internal: boolean) {
  const body = [];
  const header = ['Product', 'Qty'];
  if (internal) header.push('Purchase Price', 'Margin');
  header.push('Unit Price', 'Total');

  body.push(header);

  lines.forEach(l => {
    const total = l.quantity * l.unitPrice * (1 - l.discount / 100);
    const row = [l.product.name, l.quantity.toString()];
    if (internal) {
      row.push(l.product.purchasePrice.toString());
      const margin = (l.unitPrice - l.product.purchasePrice) * l.quantity;
      row.push(margin.toString());
    }
    row.push(l.unitPrice.toString(), total.toString());
    body.push(row);
  });

  return {
    table: {
      headerRows: 1,
      widths: internal ? ['*', 'auto', 'auto', 'auto', 'auto', 'auto'] : ['*', 'auto', 'auto', 'auto'],
      body
    }
  };
}
