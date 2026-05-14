import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  testMatching,
  importKnowledge,
  listKnowledge,
  createKnowledgeCase,
} from '../controllers/intelligenceController';

const router = Router();

// 🔒 Toutes les routes intelligence sont authentifiées.
router.use(authenticate);

// ─── Test matching (auth requis, rate-limit 10 req/min) ──────────────────────
const matchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes de matching. Réessayez dans une minute.' },
});
router.post('/match', matchLimiter, testMatching);

// ─── Base de connaissance (admin uniquement) ─────────────────────────────────
router.get('/knowledge',         requireAdmin, listKnowledge);
router.post('/knowledge',        requireAdmin, createKnowledgeCase);
router.post('/knowledge/import', requireAdmin, importKnowledge);

export default router;
