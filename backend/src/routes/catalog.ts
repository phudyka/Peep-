import { Router } from 'express';
import { getProducts, importCsv } from '../controllers/catalogController';
import { authenticate, requireAdmin } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.get('/', authenticate, getProducts);
router.post('/import', authenticate, requireAdmin, upload.single('file'), importCsv);

export default router;
