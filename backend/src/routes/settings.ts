import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);

export default router;
