import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { runHydraulicEngine, PoolInput, CalcParams } from '../services/hydraulicEngine';

export const calculateHydraulics = async (req: AuthRequest, res: Response) => {
  try {
    const { poolData, userOverrides } = req.body;
    
    // Get default params from DB
    const settings = await prisma.calcSettings.findFirst();
    if (!settings) {
      return res.status(500).json({ error: 'CalcSettings not found' });
    }

    // Prepare params (allow userOverrides to override DB settings)
    const isPublic = poolData.usage === 'PUBLIC';
    const params: CalcParams = {
      filteringTime:          userOverrides?.filteringTime ?? (isPublic ? settings.publicFilteringTime : settings.residentialFilteringTime),
      hmt:                    userOverrides?.hmt ?? (isPublic ? settings.publicHMT : settings.residentialHMT),
      pumpEfficiency:         userOverrides?.pumpEfficiency ?? settings.pumpEfficiency,
      m3PerSkimmer:           userOverrides?.m3PerSkimmer ?? settings.m3PerSkimmer,
      filteringSpeed:         userOverrides?.filteringSpeed ?? settings.filteringSpeed,
      sandPerM2:              userOverrides?.sandPerM2 ?? settings.sandPerM2,
      flowMultiplier:         userOverrides?.flowMultiplier ?? (poolData.type === 'OVERFLOW' ? settings.overflowFlowMultiplier : 1),
      // Fix #17 : transmis depuis la DB, plus hardcodés dans le moteur
      spaFlowAddition:        settings.spaFlowAddition,
      counterCurrentAddition: settings.counterCurrentAddition,
    };

    const result = runHydraulicEngine(poolData as PoolInput, params, userOverrides || {});

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Calculation failed' });
  }
};
