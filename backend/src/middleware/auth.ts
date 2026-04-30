import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string };
}

// 🔒 Fix #2 : warn at startup if JWT_SECRET is not set in environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[SECURITY] JWT_SECRET is not set. Using insecure default. Set JWT_SECRET in production!');
}
const EFFECTIVE_SECRET = JWT_SECRET || 'supersecretjwtkey';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, EFFECTIVE_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    // 🐛 Fix #1 : 401 (Unauthorized) et non 400 (Bad Request) pour un token invalide/expiré
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé. Rôle ADMIN requis.' });
  }
  next();
};
