import { Request, Response } from 'express';
import { prisma } from '../index';
import { importCatalogFromCsv } from '../utils/catalogSync';
import fs from 'fs';
// 🧹 Fix #9 : suppression de `import path from 'path'` — jamais utilisé

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    console.error('[catalogController.getProducts]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};

export const importCsv = async (req: Request, res: Response) => {
  const filePath = req.file?.path;
  try {
    if (!filePath) {
      return res.status(400).json({ error: 'Aucun fichier CSV uploadé.' });
    }

    const stats = await importCatalogFromCsv(filePath);
    res.json({ message: 'Import du catalogue terminé.', stats });
  } catch (error) {
    console.error('[catalogController.importCsv]', error);
    res.status(500).json({ error: 'Échec de l\'import.' });
  } finally {
    // 🐛 Fix #10 : supprime le fichier temporaire uploadé par multer
    if (filePath) {
      fs.unlink(filePath, (err) => {
        if (err) console.warn('[catalogController] Impossible de supprimer le fichier temporaire:', filePath);
      });
    }
  }
};
