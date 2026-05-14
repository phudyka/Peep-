/**
 * knowledgeBase.ts
 *
 * Base de connaissance métier ETS Maria. Permet d'ingérer des cas terrain
 * (CSV, JSON, formulaire admin) et de les retrouver lors du calcul d'un devis
 * pour afficher des "alertes terrain" contextualisées.
 *
 * La recherche se fait :
 *   1. par intersection de `tagsTechniques` (matching exact)
 *   2. par proximité du `contexte.volume` (±25%) en cas d'absence de tags
 *
 * Triée par (gravité décroissante, fréquence décroissante).
 */
import { prisma } from '../../index';
import type { InstallationResult } from '../hydraulicEngine';

// ─── Format public d'un cas ───────────────────────────────────────────────────

export interface ExpertiseCaseInput {
  titre: string;
  probleme: string;
  contexte: Record<string, unknown>;
  solution: string;
  produitsSolution: Array<{ reference: string; quantite: number; role?: string }>;
  tagsTechniques: string[];
  frequence?: number;
  gravite?: number;
  source?: string;
}

export interface ExpertiseAlert {
  id: string;
  titre: string;
  probleme: string;
  solution: string;
  gravite: number;
  tags: string[];
}

// ─── Inférence de tags depuis un résultat de calcul ──────────────────────────
// Permet de retrouver des cas pertinents même quand l'utilisateur n'a pas
// explicitement étiqueté son devis : on déduit du résultat hydraulique.

export function inferTagsFromResult(
  result: InstallationResult,
  context: { usage: 'RESIDENTIAL' | 'PUBLIC'; poolType: 'SKIMMER' | 'OVERFLOW' | 'ROMAN' }
): string[] {
  const tags: string[] = [];

  if (context.poolType === 'OVERFLOW') tags.push('debordement');
  if (context.poolType === 'ROMAN')    tags.push('escalier_romain');
  if (context.usage === 'PUBLIC')      tags.push('usage_public');

  if (result.volume > 80)   tags.push('grand_bassin');
  if (result.volume < 20)   tags.push('mini_bassin');

  if (result.pumpPower >= 1.5) tags.push('puissance_elevee');
  if (result.filterArea > 0.8) tags.push('filtre_haute_capacite');

  // Tags déclenchés par les warnings (qui ont déjà fait le diagnostic)
  for (const w of result.warnings ?? []) {
    if (/sous-dimensionn/i.test(w))     tags.push('pompe_sous_dimensionnee');
    if (/HMT r[ée]elle/i.test(w))        tags.push('hmt_excessive');
    if (/haute capacit[ée]/i.test(w))   tags.push('filtre_haute_capacite');
    if (/[Pp]uissance.*élev/i.test(w))  tags.push('puissance_elevee');
  }

  return Array.from(new Set(tags)); // dédoublonne
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/**
 * Retourne les cas dont les tags chevauchent ceux fournis. Si aucun tag,
 * fallback sur la proximité de volume.
 */
export async function findRelevantCases(
  tags: string[],
  volume?: number,
  limit = 5
): Promise<ExpertiseAlert[]> {
  // Pas de tag → on tente la proximité volume
  if (tags.length === 0 && typeof volume === 'number') {
    const lower = volume * 0.75;
    const upper = volume * 1.25;
    const cases = await prisma.expertiseCase.findMany({
      orderBy: [{ gravite: 'desc' }, { frequence: 'desc' }],
      take: limit * 4, // on filtre ensuite côté JS pour le champ JSON
    });
    return cases
      .filter(c => {
        const v = (c.contexte as Record<string, unknown>)?.volume;
        return typeof v === 'number' && v >= lower && v <= upper;
      })
      .slice(0, limit)
      .map(toAlert);
  }

  if (tags.length === 0) return [];

  const cases = await prisma.expertiseCase.findMany({
    where: { tagsTechniques: { hasSome: tags } },
    orderBy: [{ gravite: 'desc' }, { frequence: 'desc' }],
    take: limit,
  });
  return cases.map(toAlert);
}

function toAlert(c: {
  id: string;
  titre: string;
  probleme: string;
  solution: string;
  gravite: number;
  tagsTechniques: string[];
}): ExpertiseAlert {
  return {
    id:       c.id,
    titre:    c.titre,
    probleme: c.probleme,
    solution: c.solution,
    gravite:  c.gravite,
    tags:     c.tagsTechniques,
  };
}

// ─── Imports ──────────────────────────────────────────────────────────────────

export async function importCases(cases: ExpertiseCaseInput[]): Promise<number> {
  let imported = 0;
  for (const c of cases) {
    await prisma.expertiseCase.create({
      data: {
        titre:            c.titre,
        probleme:         c.probleme,
        contexte:         c.contexte as object,
        solution:         c.solution,
        produitsSolution: c.produitsSolution as object,
        tagsTechniques:   c.tagsTechniques,
        frequence:        c.frequence ?? 1,
        gravite:          c.gravite ?? 1,
        source:           c.source ?? 'manuel_terrain',
      },
    });
    imported++;
  }
  return imported;
}
