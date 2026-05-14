/**
 * productMatcher.ts
 *
 * Matcher cœur du système : à partir d'un besoin hydraulique calculé
 * (puissance pompe, diamètre filtre, etc.) et d'une liste candidate de
 * produits (toutes sources confondues), il classe les meilleurs candidats
 * et retourne les 3 plus pertinents pour chaque rôle.
 *
 * Le scoring est volontairement pur (aucune I/O, aucune dépendance Prisma)
 * pour rester trivialement testable.
 */
import type { UnifiedProduct } from '../../models/productRepository';

// ─── Critères de matching par rôle ────────────────────────────────────────────

export interface PumpRequirement {
  pumpPower: number;        // kW
  flowRate: number;         // m³/h
  hmt: number;              // m
}

export interface FilterRequirement {
  diameter: number;         // mm
  flowRate: number;         // m³/h
}

export interface SkimmerRequirement {
  count: number;
  poolType: 'SKIMMER' | 'OVERFLOW' | 'ROMAN';
}

export interface PipeRequirement {
  diameter: number;         // mm
  rolesNeeded: number;      // approximation rouleaux 25 m
}

// ─── Résultat de matching ─────────────────────────────────────────────────────

export interface MatchedCandidate {
  product: UnifiedProduct;
  score: number;            // 0–100
  reasons: string[];        // ex: "Puissance exacte (1.10 kW)", "Stock OK"
}

export interface MatchResult {
  /** Catégorie matchée (PUMP, FILTER, …) */
  category: string;
  /** Top 3 candidats triés par score décroissant. */
  candidates: MatchedCandidate[];
  /** Vrai si au moins un candidat dépasse le score plancher de 50. */
  hasConfidentMatch: boolean;
}

// ─── Configuration scoring ────────────────────────────────────────────────────

const PREFERRED_BRANDS = new Set(['Hayward', 'Pentair', 'Astral', 'Behringer', 'Desjoyaux', 'Waterline']);
const CONFIDENCE_FLOOR = 50;
const TOP_N = 3;

// ─── Helpers de scoring ───────────────────────────────────────────────────────

/**
 * Score d'adéquation à une valeur cible, normalisé sur [0, maxPoints].
 * Renvoie maxPoints quand value === target, 0 au-delà de ±tolerance.
 */
function proximityScore(value: number, target: number, tolerance: number, maxPoints: number): number {
  if (target === 0) return 0;
  const distance = Math.abs(value - target) / target;
  if (distance >= tolerance) return 0;
  return maxPoints * (1 - distance / tolerance);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function readNumber(specs: Record<string, unknown>, key: string): number | null {
  const v = specs[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// ─── Matcher : Pompe ──────────────────────────────────────────────────────────

export function matchPump(candidates: UnifiedProduct[], need: PumpRequirement): MatchResult {
  const pumps = candidates.filter(c => c.category === 'PUMP');

  // 1) Filtrage : puissance dans [need × 0.9, need × 1.2]
  const inRange = pumps.filter(p => {
    const puissance = readNumber(p.technicalSpecs, 'puissance');
    if (puissance === null) return false;
    return puissance >= need.pumpPower * 0.9 && puissance <= need.pumpPower * 1.2;
  });

  const pool = inRange.length > 0 ? inRange : pumps; // fallback si filtre trop strict
  const prices = pool.map(p => p.sellPrice).filter(x => x > 0);
  const medianPrice = median(prices);

  // 2) Scoring sur 100 points
  const scored: MatchedCandidate[] = pool.map(p => {
    const puissance = readNumber(p.technicalSpecs, 'puissance') ?? need.pumpPower;
    const debit = readNumber(p.technicalSpecs, 'debit') ?? need.flowRate;
    const reasons: string[] = [];

    const powerScore = proximityScore(puissance, need.pumpPower, 0.3, 30);
    if (powerScore >= 25) reasons.push(`Puissance adéquate (${puissance} kW pour ${need.pumpPower} kW requis)`);

    const flowScore = proximityScore(debit, need.flowRate, 0.4, 25);
    if (flowScore >= 20) reasons.push(`Débit cohérent (${debit} m³/h)`);

    const stockScore = p.stock > 0 ? Math.min(20, 10 + p.stock) : 0;
    if (p.stock > 0) reasons.push(`Stock disponible (${p.stock} unités)`);

    const priceScore = (medianPrice > 0 && p.sellPrice <= medianPrice) ? 15 : 7;
    if (priceScore === 15) reasons.push('Prix compétitif (≤ médiane marché)');

    const brandScore = PREFERRED_BRANDS.has(p.brand) ? 10 : 0;
    if (brandScore > 0) reasons.push(`Marque référencée (${p.brand})`);

    const total = Math.round(powerScore + flowScore + stockScore + priceScore + brandScore);
    return { product: p, score: total, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, TOP_N);

  return {
    category: 'PUMP',
    candidates: top,
    hasConfidentMatch: top.length > 0 && top[0].score >= CONFIDENCE_FLOOR,
  };
}

// ─── Matcher : Filtre à sable ─────────────────────────────────────────────────

export function matchFilter(candidates: UnifiedProduct[], need: FilterRequirement): MatchResult {
  const filters = candidates.filter(c => c.category === 'FILTER');

  // Filtre : diamètre dans [target − 100, target + 200] (mm)
  const inRange = filters.filter(f => {
    const d = readNumber(f.technicalSpecs, 'diametre');
    return d !== null && d >= need.diameter - 100 && d <= need.diameter + 200;
  });
  const pool = inRange.length > 0 ? inRange : filters;
  const medianPrice = median(pool.map(p => p.sellPrice).filter(x => x > 0));

  const scored: MatchedCandidate[] = pool.map(f => {
    const diam = readNumber(f.technicalSpecs, 'diametre') ?? need.diameter;
    const debit = readNumber(f.technicalSpecs, 'debit') ?? need.flowRate;
    const reasons: string[] = [];

    const diamScore = proximityScore(diam, need.diameter, 0.25, 35);
    if (diamScore >= 25) reasons.push(`Diamètre adapté (Ø${diam} mm)`);

    const flowScore = proximityScore(debit, need.flowRate, 0.4, 25);
    if (flowScore >= 18) reasons.push(`Débit filtrant cohérent (${debit} m³/h)`);

    const stockScore = f.stock > 0 ? Math.min(20, 10 + f.stock) : 0;
    if (f.stock > 0) reasons.push(`Stock disponible (${f.stock})`);

    const priceScore = (medianPrice > 0 && f.sellPrice <= medianPrice) ? 12 : 5;
    if (priceScore === 12) reasons.push('Prix compétitif');

    const brandScore = PREFERRED_BRANDS.has(f.brand) ? 8 : 0;
    if (brandScore > 0) reasons.push(`Marque référencée (${f.brand})`);

    const total = Math.round(diamScore + flowScore + stockScore + priceScore + brandScore);
    return { product: f, score: total, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, TOP_N);
  return {
    category: 'FILTER',
    candidates: top,
    hasConfidentMatch: top.length > 0 && top[0].score >= CONFIDENCE_FLOOR,
  };
}

// ─── Matcher : Skimmer ────────────────────────────────────────────────────────

export function matchSkimmer(candidates: UnifiedProduct[], need: SkimmerRequirement): MatchResult {
  const skimmers = candidates.filter(c => c.category === 'SKIMMER');
  const medianPrice = median(skimmers.map(p => p.sellPrice).filter(x => x > 0));

  const scored: MatchedCandidate[] = skimmers.map(s => {
    const reasons: string[] = [];
    let score = 0;

    // En débordement, on privilégie les modèles "pro" (avec clapet)
    const type = String(s.technicalSpecs.type ?? '').toLowerCase();
    if (need.poolType === 'OVERFLOW' && type.includes('pro')) {
      score += 25; reasons.push('Modèle pro adapté à un bassin à débordement');
    } else if (need.poolType === 'SKIMMER' && type === 'standard') {
      score += 25; reasons.push('Modèle standard pour bassin à skimmers');
    } else {
      score += 15;
    }

    const stockScore = s.stock >= need.count ? 30 : Math.floor((s.stock / Math.max(1, need.count)) * 30);
    score += stockScore;
    if (s.stock >= need.count) reasons.push(`Stock suffisant pour ${need.count} skimmers`);

    const priceScore = (medianPrice > 0 && s.sellPrice <= medianPrice) ? 25 : 12;
    score += priceScore;
    if (priceScore === 25) reasons.push('Prix compétitif');

    const brandScore = PREFERRED_BRANDS.has(s.brand) ? 20 : 0;
    score += brandScore;
    if (brandScore > 0) reasons.push(`Marque référencée (${s.brand})`);

    return { product: s, score: Math.round(score), reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, TOP_N);
  return {
    category: 'SKIMMER',
    candidates: top,
    hasConfidentMatch: top.length > 0 && top[0].score >= CONFIDENCE_FLOOR,
  };
}

// ─── Matcher : Tuyau PVC ──────────────────────────────────────────────────────

export function matchPipe(candidates: UnifiedProduct[], need: PipeRequirement): MatchResult {
  const pipes = candidates.filter(c => c.category === 'PIPE');
  const exact = pipes.filter(p => readNumber(p.technicalSpecs, 'diametre') === need.diameter);
  const pool = exact.length > 0 ? exact : pipes;

  const scored: MatchedCandidate[] = pool.map(p => {
    const diam = readNumber(p.technicalSpecs, 'diametre') ?? need.diameter;
    const reasons: string[] = [];
    const diamScore = diam === need.diameter ? 60 : proximityScore(diam, need.diameter, 0.3, 60);
    if (diam === need.diameter) reasons.push(`Diamètre exact (Ø${diam})`);

    const stockScore = p.stock >= need.rolesNeeded ? 40 : Math.floor((p.stock / Math.max(1, need.rolesNeeded)) * 40);
    if (p.stock >= need.rolesNeeded) reasons.push('Stock suffisant');

    return { product: p, score: Math.round(diamScore + stockScore), reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    category: 'PIPE',
    candidates: scored.slice(0, TOP_N),
    hasConfidentMatch: scored.length > 0 && scored[0].score >= CONFIDENCE_FLOOR,
  };
}

// ─── Matcher : Sable filtrant ─────────────────────────────────────────────────

export function matchSand(candidates: UnifiedProduct[]): MatchResult {
  const sand = candidates.filter(c => c.category === 'SAND');
  const scored: MatchedCandidate[] = sand.map(s => {
    const reasons: string[] = ['Sable filtrant 0.4/0.8 mm — standard hydraulique'];
    let score = 70 + Math.min(30, s.stock / 4); // beaucoup de stock = score max
    if (PREFERRED_BRANDS.has(s.brand)) reasons.push(`Marque référencée (${s.brand})`);
    return { product: s, score: Math.round(score), reasons };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    category: 'SAND',
    candidates: scored.slice(0, TOP_N),
    hasConfidentMatch: scored.length > 0 && scored[0].score >= CONFIDENCE_FLOOR,
  };
}

// ─── Matcher : Vanne ──────────────────────────────────────────────────────────

export function matchValve(candidates: UnifiedProduct[], suctionDiameter: number): MatchResult {
  const valves = candidates.filter(c => c.category === 'VALVE');
  const sixWay = valves.filter(v => String(v.technicalSpecs.type ?? '').includes('6_voies'));
  const pool = sixWay.length > 0 ? sixWay : valves;

  const scored: MatchedCandidate[] = pool.map(v => {
    const diam = readNumber(v.technicalSpecs, 'diametre') ?? suctionDiameter;
    const reasons: string[] = [];
    const diamScore = proximityScore(diam, suctionDiameter, 0.4, 60);
    if (diamScore > 40) reasons.push(`Diamètre cohérent (Ø${diam})`);
    const stockScore = Math.min(40, v.stock * 2);
    return { product: v, score: Math.round(diamScore + stockScore), reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    category: 'VALVE',
    candidates: scored.slice(0, TOP_N),
    hasConfidentMatch: scored.length > 0 && scored[0].score >= CONFIDENCE_FLOOR,
  };
}

// ─── Matcher : Buse refoulement ───────────────────────────────────────────────

export function matchNozzle(candidates: UnifiedProduct[], pressureDiameter: number): MatchResult {
  const nozzles = candidates.filter(c => c.category === 'NOZZLE');
  const scored: MatchedCandidate[] = nozzles.map(n => {
    const diam = readNumber(n.technicalSpecs, 'diametre') ?? pressureDiameter;
    const reasons: string[] = [];
    const diamScore = proximityScore(diam, pressureDiameter, 0.3, 60);
    if (diamScore > 40) reasons.push(`Diamètre adapté au refoulement (Ø${diam})`);
    const stockScore = Math.min(40, n.stock / 2);
    return { product: n, score: Math.round(diamScore + stockScore), reasons };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    category: 'NOZZLE',
    candidates: scored.slice(0, TOP_N),
    hasConfidentMatch: scored.length > 0 && scored[0].score >= CONFIDENCE_FLOOR,
  };
}
