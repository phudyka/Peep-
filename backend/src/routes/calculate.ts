import { Router } from 'express';
import { calculateHydraulics } from '../controllers/calculateController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, calculateHydraulics);

export default router;
