/**
 * intelligenceController.ts
 *
 * Endpoints exposant le moteur d'intelligence :
 *   - POST /api/intelligence/match     → outil de test matching (top 3 par rôle)
 *   - POST /api/admin/knowledge/import → import en masse (CSV parsé ou JSON)
 *   - GET  /api/admin/knowledge        → liste des cas
 *   - POST /api/admin/knowledge        → création manuelle d'un cas
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { sageRepository } from '../services/intelligence/sageConnector';
import {
  matchPump, matchFilter, matchSkimmer, matchValve, matchPipe, matchNozzle, matchSand,
} from '../services/scoring/productMatcher';
import {
  importCases, type ExpertiseCaseInput,
} from '../services/intelligence/knowledgeBase';

// ─── POST /api/intelligence/match ─────────────────────────────────────────────

export const testMatching = async (req: AuthRequest, res: Response) => {
  const {
    pumpPower, flowRate, hmt = 10,
    filterDiameter,
    skimmersCount = 2,
    poolType = 'SKIMMER',
    suctionDiameter = 75,
    pressureDiameter = 63,
  } = req.body as Record<string, number | string>;

  try {
    const products = await sageRepository.getAll();

    const matches = [
      typeof pumpPower === 'number' && typeof flowRate === 'number'
        ? matchPump(products, { pumpPower, flowRate, hmt: Number(hmt) })
        : null,
      typeof filterDiameter === 'number' && typeof flowRate === 'number'
        ? matchFilter(products, { diameter: filterDiameter, flowRate })
        : null,
      matchSkimmer(products, { count: Number(skimmersCount), poolType: poolType as 'SKIMMER' | 'OVERFLOW' | 'ROMAN' }),
      matchValve(products, Number(suctionDiameter)),
      matchPipe(products, { diameter: Number(suctionDiameter), rolesNeeded: 1 }),
      matchNozzle(products, Number(pressureDiameter)),
      matchSand(products),
    ].filter((m): m is NonNullable<typeof m> => m !== null);

    res.json({ matches });
  } catch (err) {
    console.error('[testMatching]', err);
    res.status(500).json({ error: 'Matching failed' });
  }
};

// ─── POST /api/admin/knowledge/import ─────────────────────────────────────────

export const importKnowledge = async (req: AuthRequest, res: Response) => {
  // Accepte deux formats : tableau JSON direct, ou { cases: [...] }
  const payload = Array.isArray(req.body) ? req.body : req.body?.cases;
  if (!Array.isArray(payload)) {
    return res.status(400).json({ error: 'Body must be an array of cases or { cases: [...] }' });
  }

  // Validation minimale
  for (const c of payload) {
    if (!c.titre || !c.probleme || !c.solution) {
      return res.status(400).json({ error: 'Each case requires titre/probleme/solution' });
    }
    if (!Array.isArray(c.tagsTechniques)) {
      return res.status(400).json({ error: `Case "${c.titre}" : tagsTechniques must be an array` });
    }
  }

  try {
    const count = await importCases(payload as ExpertiseCaseInput[]);
    res.json({ imported: count });
  } catch (err) {
    console.error('[importKnowledge]', err);
    res.status(500).json({ error: 'Import failed' });
  }
};

// ─── GET /api/admin/knowledge ────────────────────────────────────────────────

export const listKnowledge = async (req: AuthRequest, res: Response) => {
  const tag = req.query.tag as string | undefined;
  const where = tag ? { tagsTechniques: { has: tag } } : {};
  const cases = await prisma.expertiseCase.findMany({
    where,
    orderBy: [{ gravite: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
  res.json(cases);
};

// ─── POST /api/admin/knowledge ───────────────────────────────────────────────

export const createKnowledgeCase = async (req: AuthRequest, res: Response) => {
  const c = req.body as ExpertiseCaseInput;
  if (!c?.titre || !c?.probleme || !c?.solution || !Array.isArray(c?.tagsTechniques)) {
    return res.status(400).json({ error: 'titre/probleme/solution/tagsTechniques requis' });
  }
  try {
    const count = await importCases([c]);
    res.json({ created: count });
  } catch (err) {
    console.error('[createKnowledgeCase]', err);
    res.status(500).json({ error: 'Création échouée' });
  }
};
