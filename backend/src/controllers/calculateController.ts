import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { runHydraulicEngine, PoolInput, CalcParams, ShapeParams } from '../services/hydraulicEngine';
import { suggestProductsForResult } from '../services/intelligence';

export const calculateHydraulics = async (req: AuthRequest, res: Response) => {
  try {
    const { poolData, userOverrides, includeProducts } = req.body as {
      poolData: Partial<PoolInput> & Record<string, unknown>;
      userOverrides?: Record<string, number>;
      includeProducts?: boolean;
    };

    // ── Rétro-compatibilité : les anciens devis n'ont pas shape/shapeParams ──
    // On reconstruit un PoolInput valide à partir des champs plats si nécessaire.
    const shape = (poolData.shape as PoolInput['shape']) ?? 'RECTANGULAR';

    let shapeParams: ShapeParams;
    if (poolData.shapeParams) {
      shapeParams = poolData.shapeParams as ShapeParams;
    } else {
      // Fallback RECTANGULAR depuis les anciens champs length/width
      shapeParams = {
        shape: 'RECTANGULAR',
        length: (poolData.length as number) ?? 0,
        width:  (poolData.width  as number) ?? 0,
      };
    }

    const normalizedInput: PoolInput = {
      shape,
      shapeParams,
      depthShallow: (poolData.depthShallow as number) ?? 0,
      depthDeep:    (poolData.depthDeep    as number) ?? 0,
      length:       (poolData.length       as number) ?? 0,
      width:        (poolData.width        as number) ?? 0,
      type:    (poolData.type    as PoolInput['type'])    ?? 'SKIMMER',
      usage:   (poolData.usage   as PoolInput['usage'])   ?? 'RESIDENTIAL',
      options: (poolData.options as PoolInput['options']) ?? {
        heating: false, spa: false, counterCurrent: false, lighting: false,
      },
    };

    // ── Récupération des paramètres de calcul depuis la DB ──────────────────
    const settings = await prisma.calcSettings.findFirst();
    if (!settings) {
      return res.status(500).json({ error: 'CalcSettings not found' });
    }

    const isPublic = normalizedInput.usage === 'PUBLIC';
    const params: CalcParams = {
      filteringTime:          userOverrides?.filteringTime ?? (isPublic ? settings.publicFilteringTime : settings.residentialFilteringTime),
      hmt:                    userOverrides?.hmt           ?? (isPublic ? settings.publicHMT           : settings.residentialHMT),
      pumpEfficiency:         userOverrides?.pumpEfficiency ?? settings.pumpEfficiency,
      m3PerSkimmer:           userOverrides?.m3PerSkimmer   ?? settings.m3PerSkimmer,
      filteringSpeed:         userOverrides?.filteringSpeed  ?? settings.filteringSpeed,
      sandPerM2:              userOverrides?.sandPerM2       ?? settings.sandPerM2,
      flowMultiplier:         userOverrides?.flowMultiplier  ??
        (normalizedInput.type === 'OVERFLOW' ? settings.overflowFlowMultiplier : 1),
      // Fix #17 : transmis depuis la DB, plus hardcodés dans le moteur
      spaFlowAddition:        settings.spaFlowAddition,
      counterCurrentAddition: settings.counterCurrentAddition,
    };

    const result = runHydraulicEngine(normalizedInput, params, userOverrides ?? {});

    // Opt-in : si le client demande explicitement l'enrichissement produit,
    // on lance l'orchestrateur d'intelligence. Sinon on conserve la réponse
    // legacy (zéro régression sur l'auto-save debounce du front actuel).
    if (includeProducts) {
      try {
        const suggestion = await suggestProductsForResult(result, {
          usage:    normalizedInput.usage,
          poolType: normalizedInput.type,
        });
        return res.json({ ...result, suggestion });
      } catch (err) {
        console.warn('[calculateController] suggestion produit indisponible :', err);
        // Fallback gracieux : on rend quand même les résultats hydrauliques.
        return res.json(result);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('[calculateController]', error);
    res.status(500).json({ error: 'Calculation failed' });
  }
};
