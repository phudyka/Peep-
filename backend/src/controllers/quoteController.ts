import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

/**
 * Vérifie que l'utilisateur courant est propriétaire du devis ou admin.
 * Renvoie 403 si l'accès est refusé, null si le devis n'existe pas.
 */
async function authorizeQuote(req: AuthRequest, res: Response, quoteId: string): Promise<boolean> {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, select: { createdById: true } });
  if (!quote) {
    res.status(404).json({ error: 'Devis introuvable.' });
    return false;
  }
  if (req.user?.role !== 'ADMIN' && quote.createdById !== req.user?.id) {
    res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas propriétaire de ce devis.' });
    return false;
  }
  return true;
}

export const getQuotes = async (req: AuthRequest, res: Response) => {
  // 🔒 Fix #5 : un commercial ne voit que ses propres devis
  const where = req.user?.role !== 'ADMIN' ? { createdById: req.user!.id } : {};

  const quotes = await prisma.quote.findMany({
    where,
    select: {
      id: true, reference: true, status: true, clientName: true,
      createdAt: true,
      createdBy: { select: { email: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(quotes);
};

export const getQuoteById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!(await authorizeQuote(req, res, id))) return;

  // 🔒 Fix #10 : exclure purchasePrice pour les commerciaux
  const isAdmin = req.user?.role === 'ADMIN';
  const productSelect = isAdmin ? true : {
    select: { id: true, sageRef: true, name: true, brand: true, category: true, sellPrice: true, stock: true, active: true, unit: true, photoUrl: true },
  };

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lines: { include: { product: productSelect } } }
  });
  if (!quote) return res.status(404).json({ error: 'Not found' });
  res.json(quote);
};

export const createQuote = async (req: AuthRequest, res: Response) => {
  const { poolData, calcParams, calculationResult, clientName, clientEmail } = req.body;
  const createdById = req.user!.id;

  const quoteCount = await prisma.quote.count();
  const reference = `Q-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;

  const quote = await prisma.quote.create({
    data: {
      reference,
      poolData,
      calcParams,
      calculationResult,
      clientName,
      clientEmail,
      createdById,
    }
  });

  res.json(quote);
};

export const updateQuote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!(await authorizeQuote(req, res, id))) return;

  const { poolData, calcParams, calculationResult, lines, status, clientName, clientEmail, internalNotes } = req.body;

  // 🔒 Fix #5 : un commercial ne peut pas changer le statut d'un devis qui ne lui appartient pas (déjà filtré ci-dessus)
  // Les admins peuvent tout modifier, y compris le statut

  // Transaction for safe updates
  const quote = await prisma.$transaction(async (tx) => {
    const updated = await tx.quote.update({
      where: { id },
      data: {
        poolData,
        calcParams,
        calculationResult,
        status,
        clientName,
        clientEmail,
        internalNotes
      }
    });

    if (lines && Array.isArray(lines)) {
      // Clear old lines
      await tx.quoteLine.deleteMany({ where: { quoteId: id } });
      // Insert new lines
      for (const line of lines) {
        await tx.quoteLine.create({
          data: {
            quoteId: id,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            visible: line.visible,
            isManuallyAdded: line.isManuallyAdded,
            isManuallyEdited: line.isManuallyEdited,
            notes: line.notes
          }
        });
      }
    }

    return await tx.quote.findUnique({
      where: { id },
      include: { lines: { include: { product: true } } }
    });
  });

  res.json(quote);
};

export const deleteQuote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!(await authorizeQuote(req, res, id))) return;

  try {
    await prisma.quoteLine.deleteMany({ where: { quoteId: id } });
    await prisma.quote.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete quote' });
  }
};
