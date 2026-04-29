import { Router } from 'express';
import { getQuotes, getQuoteById, createQuote, updateQuote } from '../controllers/quoteController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getQuotes);
router.get('/:id', getQuoteById);
router.post('/', createQuote);
router.put('/:id', updateQuote);

export default router;
