/**
 * intelligence/index.ts
 *
 * Orchestrateur du moteur de devis intelligent. Agrège les sources (Sage,
 * scraping, expertise métier) et expose une API simple au reste du backend :
 *
 *    const suggestion = await suggestProductsForResult(result);
 *
 * Les sources non encore implémentées (Phase 2 scraping, Phase 3 expertise)
 * sont absentes du tableau `repositories` — elles s'y ajouteront sans
 * modification de cette interface.
 */
import type { InstallationResult } from '../hydraulicEngine';
import type { IProductRepository, UnifiedProduct, ProductSource } from '../../models/productRepository';
import { sageRepository } from './sageConnector';
import {
  matchPump, matchFilter, matchSkimmer, matchValve, matchPipe, matchNozzle, matchSand,
  type MatchResult, type MatchedCandidate,
} from '../scoring/productMatcher';
import { scoreConfidence, type QuoteConfidence } from '../scoring/confidenceScorer';
import { findRelevantCases, inferTagsFromResult, type ExpertiseAlert } from './knowledgeBase';

// ─── Sources actives ─────────────────────────────────────────────────────────
// Pour brancher le scraper (Phase 2) ou la base de connaissance (Phase 3),
// il suffit d'ajouter l'instance ici. Le reste du système est agnostique.
const repositories: IProductRepository[] = [
  sageRepository,
];

// ─── Suggestion complète pour un devis ───────────────────────────────────────

export interface QuoteSuggestion {
  matches: MatchResult[];
  confidence: QuoteConfidence;
  sourcesUsed: ProductSource[];
  /** Lignes "prêtes à coller" pour un devis : top 1 de chaque catégorie. */
  primaryLines: PrimarySuggestionLine[];
  /** Alertes terrain issues de la base de connaissance métier ETS Maria. */
  expertiseAlerts: ExpertiseAlert[];
}

export interface PrimarySuggestionLine {
  category: string;
  product: UnifiedProduct;
  quantity: number;
  reasons: string[];
  /** Alternatives (rangs 2 et 3) si l'utilisateur veut changer. */
  alternatives: MatchedCandidate[];
}

/**
 * Agrège tous les produits actifs des sources branchées (Sage, …) en un seul
 * pool consommable par le matcher. Source défaillante → ignorée (graceful).
 */
async function gatherCandidates(): Promise<{ products: UnifiedProduct[]; sources: Set<ProductSource> }> {
  const products: UnifiedProduct[] = [];
  const sources  = new Set<ProductSource>();

  for (const repo of repositories) {
    try {
      if (!(await repo.isAvailable())) continue;
      const rows = await repo.getAll();
      products.push(...rows);
      sources.add(repo.sourceName);
    } catch (err) {
      console.warn(`[intelligence] source ${repo.sourceName} indisponible :`, err);
    }
  }

  return { products, sources };
}

/**
 * Cœur public : à partir d'un résultat de calcul hydraulique, retourne
 * une suggestion complète (matches + confiance + lignes prêtes à intégrer).
 */
export async function suggestProductsForResult(
  result: InstallationResult,
  context: { usage: 'RESIDENTIAL' | 'PUBLIC'; poolType: 'SKIMMER' | 'OVERFLOW' | 'ROMAN' }
): Promise<QuoteSuggestion> {
  const { products, sources } = await gatherCandidates();

  // ─ Matching par rôle ─
  const matches: MatchResult[] = [
    matchPump(products, {
      pumpPower: result.pumpPower,
      flowRate:  result.adjustedFlowRate,
      hmt:       result.hmtReal ?? 8,
    }),
    matchFilter(products, {
      diameter: result.filterDiameter,
      flowRate: result.adjustedFlowRate,
    }),
    matchSkimmer(products, {
      count:    result.skimmers,
      poolType: context.poolType,
    }),
    matchValve(products, result.suctionDiameter),
    matchPipe(products, {
      diameter:     result.suctionDiameter,
      rolesNeeded:  1,
    }),
    matchNozzle(products, result.pressureDiameter),
    matchSand(products),
  ];

  // ─ Alertes terrain (base de connaissance) ─
  let expertiseAlerts: ExpertiseAlert[] = [];
  try {
    const tags = inferTagsFromResult(result, context);
    expertiseAlerts = await findRelevantCases(tags, result.volume, 5);
    if (expertiseAlerts.length > 0) sources.add('manual');
  } catch (err) {
    // Une base vide ou un schéma pas encore migré ne doit pas casser le calcul.
    console.warn('[intelligence] base de connaissance indisponible :', err);
  }

  // ─ Confiance globale ─
  const sageAgeHours = computeSageDataAge(products);
  const confidence = scoreConfidence({
    matches,
    sourcesUsed: sources,
    engineWarnings: result.warnings,
    sageDataAgeHours: sageAgeHours,
  });

  // ─ Lignes primaires (top 1 par rôle) avec quantités calculées ─
  const primaryLines = matches
    .filter(m => m.candidates.length > 0)
    .map(m => buildPrimaryLine(m, result));

  return {
    matches,
    confidence,
    sourcesUsed: Array.from(sources),
    primaryLines,
    expertiseAlerts,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeSageDataAge(products: UnifiedProduct[]): number {
  const sageProds = products.filter(p => p.source === 'sage');
  if (sageProds.length === 0) return Infinity;
  const oldest = Math.min(...sageProds.map(p => p.fetchedAt.getTime()));
  return (Date.now() - oldest) / (1000 * 60 * 60); // heures
}

function buildPrimaryLine(match: MatchResult, result: InstallationResult): PrimarySuggestionLine {
  const top = match.candidates[0];
  const [, ...rest] = match.candidates;

  // Quantité par catégorie : calque le besoin métier
  let quantity = 1;
  switch (match.category) {
    case 'PUMP':    quantity = 1; break;
    case 'FILTER':  quantity = 1; break;
    case 'VALVE':   quantity = result.valves; break;
    case 'SKIMMER': quantity = result.skimmers; break;
    case 'NOZZLE':  quantity = result.returns; break;
    case 'PIPE': {
      // Rouleaux de 25 m → circuit estimé / 25, arrondi au supérieur.
      const len = result.estimatedCircuitLength ?? 25;
      quantity = Math.max(1, Math.ceil(len / 25));
      break;
    }
    case 'SAND': {
      // Sacs de 25 kg.
      quantity = Math.max(1, Math.ceil(result.sand / 25));
      break;
    }
  }

  return {
    category:     match.category,
    product:      top.product,
    quantity,
    reasons:      top.reasons,
    alternatives: rest,
  };
}
