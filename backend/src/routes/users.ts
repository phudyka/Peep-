import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, changePassword } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getUsers);
router.post('/', authenticate, requireAdmin, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);
router.put('/:id/password', authenticate, changePassword);

export default router;
