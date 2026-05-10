import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import quotesRoutes from './routes/quotes';
import catalogRoutes from './routes/catalog';
import settingsRoutes from './routes/settings';
import calculateRoutes from './routes/calculate';
import path from 'path';
import fs from 'fs';

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ─── Dossier uploads ─────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Middlewares ──────────────────────────────────────────────────────────────
// 🔒 Fix #6 : CORS restrictif — en interne uniquement localhost/réseau local
//    Pour un déploiement sur réseau local, l'origin peut être une IP fixe ou wildcard
//    selon l'environnement. Ajustez CORS_ORIGIN dans .env si nécessaire.
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost';
app.use(cors({
  origin: (origin, callback) => {
    // Accepte les requêtes sans origin (curl, Postman, même domaine)
    // et les origins autorisées
    if (!origin || origin === CORS_ORIGIN || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origine non autorisée: ${origin}`));
    }
  },
  credentials: true,
}));

// 🔒 Fix #7 : limite la taille du body JSON à 1 Mo (prévention DoS)
app.use(express.json({ limit: '1mb' }));

// https://express-rate-limit.mintlify.app/referred/securing-with-proxies
app.set('trust proxy', 1);

// 🔒 Fix #11 : rate limiting sur les routes sensibles
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

const calculateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes de calcul. Réessayez dans une minute.' },
});

const importLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop d\'imports. Réessayez dans une minute.' },
});

// ─── Fichiers statiques ───────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/catalog', importLimiter, catalogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calculate', authenticate, calculateLimiter, calculateRoutes);

app.use(errorHandler);

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// 🏗️ Fix #8 : graceful shutdown — déconnecte Prisma proprement
const shutdown = async (signal: string) => {
  console.log(`[${signal}] Graceful shutdown...`);
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
