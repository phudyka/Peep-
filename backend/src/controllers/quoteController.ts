import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';

export const getQuotes = async (req: AuthRequest, res: Response) => {
  const quotes = await prisma.quote.findMany({
    include: { createdBy: { select: { email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(quotes);
};

export const getQuoteById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lines: { include: { product: true } } }
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
  const { poolData, calcParams, calculationResult, lines, status, clientName, clientEmail, internalNotes } = req.body;

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
