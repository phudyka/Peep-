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

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Static file serving for product photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/calculate', calculateRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
