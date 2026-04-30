import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { generateSVGPlan, buildPlanInput } from '../services/planGenerator';
import { generateDXFPlan } from '../services/dxfGenerator';

/**
 * GET /quotes/:id/plan?format=svg|dxf
 */
export const getQuotePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const format = ((req.query.format as string) || 'svg').toLowerCase();

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });

    const calc = quote.calculationResult as any;
    if (!calc?.volume) {
      return res.status(422).json({ error: 'Données hydrauliques manquantes dans ce devis.' });
    }

    const input = buildPlanInput(quote);

    if (format === 'dxf') {
      const dxf = generateDXFPlan(input);
      const safeRef = quote.reference.replace(/[^a-zA-Z0-9\-_]/g, '_');
      res.setHeader('Content-Type', 'application/dxf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeRef}_plan.dxf"`);
      return res.send(dxf);
    }

    const svg = generateSVGPlan(input);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    return res.send(svg);

  } catch (err) {
    console.error('[planController]', err);
    res.status(500).json({ error: 'Erreur lors de la génération du plan.' });
  }
};
