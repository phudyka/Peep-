import { Request, Response } from 'express';
import { prisma } from '../index';
import { importCatalogFromCsv } from '../utils/catalogSync';
import path from 'path';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const importCsv = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const filePath = req.file.path;
    const stats = await importCatalogFromCsv(filePath);
    res.json({ message: 'Catalog import complete', stats });
  } catch (error) {
    res.status(500).json({ error: 'Import failed' });
  }
};
