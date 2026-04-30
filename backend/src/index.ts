import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import quotesRoutes from './routes/quotes';
import catalogRoutes from './routes/catalog';
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

// ─── Fichiers statiques ───────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/calculate', calculateRoutes);

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
