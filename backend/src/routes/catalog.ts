import { Router, Request } from 'express';
import { getProducts, importCsv } from '../controllers/catalogController';
import { authenticate, requireAdmin } from '../middleware/auth';
import multer, { FileFilterCallback } from 'multer';

// 🔒 Fix #11 : limite la taille (5 Mo max) et filtre les types MIME
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers CSV sont acceptés.'));
    }
  },
});

const router = Router();

router.get('/', authenticate, getProducts);
router.post('/import', authenticate, requireAdmin, upload.single('file'), importCsv);

export default router;
