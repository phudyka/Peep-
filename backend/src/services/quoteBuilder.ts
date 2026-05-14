/**
 * quoteBuilder.ts
 *
 * Construit la liste de lignes de devis à partir d'un résultat hydraulique
 * en s'appuyant sur le moteur d'intelligence (Sage + matching + scoring).
 *
 * Comportement :
 *  1. On demande à l'orchestrateur d'`intelligence/` la meilleure suggestion
 *     pour chaque rôle (pompe, filtre, skimmer, vannes, tuyauterie, buses, sable).
 *  2. Pour chaque ligne, on garantit la présence du produit dans la table
 *     Prisma `Product` (création ou upsert sur `sageRef`) pour respecter la
 *     contrainte FK de `QuoteLine.productId`.
 *  3. On (re)crée les lignes en supprimant les anciennes non-`isManuallyAdded`
 *     pour préserver les ajouts manuels du commercial.
 */
import { prisma } from '../index';
import type { InstallationResult } from './hydraulicEngine';
import {
  suggestProductsForResult,
  type QuoteSuggestion,
  type PrimarySuggestionLine,
} from './intelligence';
import type { UnifiedProduct } from '../models/productRepository';

export interface BuildContext {
  usage: 'RESIDENTIAL' | 'PUBLIC';
  poolType: 'SKIMMER' | 'OVERFLOW' | 'ROMAN';
}

export interface BuildResult {
  /** Lignes ajoutées/mises à jour en DB. */
  linesCreated: number;
  /** Suggestion complète (matches + confiance), pour exposition à l'UI. */
  suggestion: QuoteSuggestion;
}

/**
 * Compute the quote lines for a quote based on the hydraulic result.
 * Préserve les lignes manuellement ajoutées (isManuallyAdded = true).
 */
export async function createOrUpdateQuoteLines(
  quoteId: string,
  result: InstallationResult,
  context: BuildContext
): Promise<BuildResult> {
  const suggestion = await suggestProductsForResult(result, context);

  // 1) Nettoyage des anciennes lignes auto-générées (on préserve les manuelles)
  await prisma.quoteLine.deleteMany({
    where: { quoteId, isManuallyAdded: false, isManuallyEdited: false },
  });

  // 2) Pour chaque ligne primaire, on upsert le produit puis on crée la ligne
  let created = 0;
  for (const line of suggestion.primaryLines) {
    const productId = await upsertProduct(line.product);
    await prisma.quoteLine.create({
      data: {
        quoteId,
        productId,
        quantity:         line.quantity,
        unitPrice:        line.product.sellPrice,
        discount:         0,
        visible:          true,
        isManuallyAdded:  false,
        isManuallyEdited: false,
        notes:            line.reasons[0] ?? null,
      },
    });
    created++;
  }

  return { linesCreated: created, suggestion };
}

/**
 * Garantit qu'un produit issu d'une source externe (Sage, scrap, …) existe
 * dans la table Product et renvoie son id Prisma. Idempotent via `sageRef`.
 */
async function upsertProduct(product: UnifiedProduct): Promise<string> {
  const existing = await prisma.product.findUnique({ where: { sageRef: product.sageRef } });
  if (existing) {
    // Synchronise prix/stock si la source les a fait évoluer
    if (existing.purchasePrice !== product.purchasePrice
     || existing.sellPrice     !== product.sellPrice
     || existing.stock         !== product.stock) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          purchasePrice: product.purchasePrice,
          sellPrice:     product.sellPrice,
          stock:         product.stock,
        },
      });
    }
    return existing.id;
  }
  const created = await prisma.product.create({
    data: {
      sageRef:        product.sageRef,
      name:           product.name,
      brand:          product.brand,
      category:       product.category,
      technicalSpecs: product.technicalSpecs as object,
      purchasePrice:  product.purchasePrice,
      sellPrice:      product.sellPrice,
      unit:           product.unit,
      stock:          product.stock,
      active:         true,
    },
  });
  return created.id;
}

export type { QuoteSuggestion, PrimarySuggestionLine };
