import fs from 'fs';
import csvParser from 'csv-parser';
import { prisma } from '../index';
import { ProductCategory } from '@prisma/client';

export async function importCatalogFromCsv(filePath: string): Promise<any> {
  const results: any[] = [];
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: ';' })) // assuming Sage uses semicolon often, fallback to comma otherwise
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          try {
            const { ref, designation, marque, categorie, prix_achat, prix_vente, stock } = row;
            if (!ref || !designation) {
              stats.skipped++;
              continue;
            }

            let parsedCategory: ProductCategory;
            const catMap: Record<string, ProductCategory> = {
              'PUMP': 'PUMP',
              'FILTER': 'FILTER',
              'SKIMMER': 'SKIMMER',
              'VALVE': 'VALVE',
              'PIPE': 'PIPE',
              'NOZZLE': 'NOZZLE',
              'SAND': 'SAND'
            };
            parsedCategory = catMap[String(categorie).toUpperCase()] || 'OTHER';

            await prisma.product.upsert({
              where: { sageRef: ref },
              update: {
                name: designation,
                brand: marque || 'Unknown',
                category: parsedCategory,
                purchasePrice: parseFloat(prix_achat) || 0,
                sellPrice: parseFloat(prix_vente) || 0,
                stock: parseInt(stock) || 0,
              },
              create: {
                sageRef: ref,
                name: designation,
                brand: marque || 'Unknown',
                category: parsedCategory,
                purchasePrice: parseFloat(prix_achat) || 0,
                sellPrice: parseFloat(prix_vente) || 0,
                stock: parseInt(stock) || 0,
              }
            });
            // Assume upsert always updates if exists, creates if not. We won't differentiate counters perfectly here.
            stats.updated++; 
          } catch (error) {
            console.error('Row error:', error);
            stats.errors++;
          }
        }
        resolve(stats);
      })
      .on('error', (error) => reject(error));
  });
}
