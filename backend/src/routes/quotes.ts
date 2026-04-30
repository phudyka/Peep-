import { Router } from 'express';
import { getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote } from '../controllers/quoteController';
import { getQuotePlan } from '../controllers/planController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getQuotes);
router.get('/:id', getQuoteById);
router.get('/:id/plan', getQuotePlan);  // ?format=svg (défaut) | dxf
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', deleteQuote);

export default router;
