/**
 * confidenceScorer.ts
 *
 * Calcule un indice de confiance global pour un devis en fonction de la qualité
 * et de la fraîcheur des données ayant servi à le produire. L'idée est de
 * permettre au commercial de savoir d'un coup d'œil s'il peut signer en l'état
 * ou s'il doit revérifier certaines lignes manuellement.
 *
 * Plages :
 *   - high   : ≥ 80  (catalogue Sage frais + correspondances précises)
 *   - medium : 50-79 (sources partielles ou correspondances moyennes)
 *   - low    : < 50  (estimation, vérification recommandée)
 */
import type { MatchResult } from './productMatcher';
import type { ProductSource } from '../../models/productRepository';

export interface QuoteConfidence {
  score: number;                  // 0–100
  level: 'low' | 'medium' | 'high';
  factors: {
    catalogueSage: boolean;
    donneesMarche: boolean;       // scraping (placeholder : false en Phase 1)
    expertiseMetier: boolean;     // base de connaissance (placeholder : false)
    correspondancePrecise: boolean;
  };
  warnings: string[];
}

export interface ConfidenceInputs {
  matches: MatchResult[];
  sourcesUsed: Set<ProductSource>;
  /** Liste des warnings issus du moteur hydraulique (étape 11, validations). */
  engineWarnings?: string[];
  /** Âge des données Sage (en heures) — sert à dévaluer si trop ancien. */
  sageDataAgeHours?: number;
  /** Âge des données scrapées (placeholder Phase 2). */
  scrapingAgeHours?: number;
}

const PRECISE_MATCH_THRESHOLD = 70; // score min pour considérer une match "précise"
const SAGE_FRESH_THRESHOLD_H  = 24;
const SCRAPING_FRESH_THRESHOLD_H = 48;

export function scoreConfidence(input: ConfidenceInputs): QuoteConfidence {
  const warnings: string[] = [];
  let score = 0;

  // ─ Facteur 1 : catalogue Sage disponible (40 pts max) ─
  const hasSage = input.sourcesUsed.has('sage');
  if (hasSage) {
    if ((input.sageDataAgeHours ?? 0) <= SAGE_FRESH_THRESHOLD_H) {
      score += 40;
    } else {
      score += 25;
      warnings.push(`Catalogue Sage > ${SAGE_FRESH_THRESHOLD_H}h — pensez à rafraîchir`);
    }
  } else {
    warnings.push('Aucune donnée Sage disponible — prix issus d\'une estimation');
  }

  // ─ Facteur 2 : données marché (scraping) — 15 pts (Phase 2) ─
  const hasMarket = input.sourcesUsed.has('scraped');
  if (hasMarket) {
    if ((input.scrapingAgeHours ?? 0) <= SCRAPING_FRESH_THRESHOLD_H) {
      score += 15;
    } else {
      score += 8;
      warnings.push(`Prix marché basés sur scraping > ${SCRAPING_FRESH_THRESHOLD_H}h`);
    }
  }

  // ─ Facteur 3 : expertise métier (10 pts — Phase 3) ─
  const hasExpertise = input.sourcesUsed.has('manual');
  if (hasExpertise) score += 10;

  // ─ Facteur 4 : qualité des correspondances (35 pts max) ─
  const totalMatches = input.matches.length;
  const preciseMatches = input.matches.filter(
    m => m.candidates.length > 0 && m.candidates[0].score >= PRECISE_MATCH_THRESHOLD
  ).length;

  const correspondancePrecise = totalMatches > 0 && preciseMatches / totalMatches >= 0.7;
  if (totalMatches > 0) {
    score += Math.round(35 * (preciseMatches / totalMatches));
    if (!correspondancePrecise) {
      warnings.push(`${totalMatches - preciseMatches}/${totalMatches} ligne(s) avec correspondance approximative`);
    }
  }

  // ─ Warnings du moteur hydraulique (n'impactent pas le score, mais s'affichent) ─
  if (input.engineWarnings && input.engineWarnings.length > 0) {
    warnings.push(...input.engineWarnings);
  }

  // ─ Bornage et niveau ─
  score = Math.max(0, Math.min(100, score));
  const level: QuoteConfidence['level'] = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

  return {
    score,
    level,
    factors: {
      catalogueSage: hasSage,
      donneesMarche: hasMarket,
      expertiseMetier: hasExpertise,
      correspondancePrecise,
    },
    warnings,
  };
}
