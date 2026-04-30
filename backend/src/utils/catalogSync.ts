import fs from 'fs';
import csvParser from 'csv-parser';
import { prisma } from '../index';
import { ProductCategory } from '@prisma/client';

const CAT_MAP: Record<string, ProductCategory> = {
  PUMP: 'PUMP', FILTER: 'FILTER', SKIMMER: 'SKIMMER',
  VALVE: 'VALVE', PIPE: 'PIPE', NOZZLE: 'NOZZLE', SAND: 'SAND',
};

export async function importCatalogFromCsv(filePath: string): Promise<{
  created: number; updated: number; skipped: number; errors: number;
}> {
  const rows: any[] = [];
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

  // Parse CSV en mémoire
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: ';' }))
      .on('data', (data) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  // ⚡ Fix #13 : Note — les upserts sont exécutés séquentiellement pour éviter
  //   les conflits sur contrainte unique. Pour de gros catalogues (>500 lignes),
  //   envisager un batch via prisma.$transaction([...upserts]) ou un import natif SQL.
  for (const row of rows) {
    try {
      const { ref, designation, marque, categorie, prix_achat, prix_vente, stock } = row;
      if (!ref || !designation) {
        stats.skipped++;
        continue;
      }

      const category: ProductCategory = CAT_MAP[String(categorie).toUpperCase()] ?? 'OTHER';
      const payload = {
        name:          designation,
        brand:         marque || 'Unknown',
        category,
        purchasePrice: parseFloat(prix_achat) || 0,
        sellPrice:     parseFloat(prix_vente) || 0,
        stock:         parseInt(stock) || 0,
      };

      // 🐛 Fix #12 : distingue create vs update pour avoir des stats précises
      const existing = await prisma.product.findUnique({ where: { sageRef: ref } });
      if (existing) {
        await prisma.product.update({ where: { sageRef: ref }, data: payload });
        stats.updated++;
      } else {
        await prisma.product.create({ data: { sageRef: ref, ...payload } });
        stats.created++;
      }
    } catch (error) {
      console.error('[catalogSync] Erreur ligne:', error);
      stats.errors++;
    }
  }

  return stats;
}
