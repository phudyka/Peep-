/**
 * quoteBuilder.ts
 * 🧹 Fix #16 : Ce module est un placeholder non utilisé.
 * La logique de mapping résultat hydraulique → lignes de catalogue
 * devra être implémentée ici quand le catalogue sera suffisamment peuplé.
 *
 * TODO: implémenter la sélection automatique de produits :
 *  - Chercher une pompe dont la puissance ≥ result.pumpPower
 *  - Chercher un filtre dont le diamètre correspond à result.filterDiameter
 *  - Chercher des skimmers, buses, vannes, sable en quantité
 */
import { prisma } from '../index';
import { InstallationResult } from './hydraulicEngine';

export async function createOrUpdateQuoteLines(
  _quoteId: string,
  _result: InstallationResult,
  _userOverrides: Record<string, boolean>
): Promise<any[]> {
  // Stub — retourne toujours un tableau vide en attendant l'implémentation.
  return [];
}
