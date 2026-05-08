import { Request, Response } from 'express';
import { prisma } from '../index';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {}
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('[settingsController.getSettings]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { companyName, address, siret, currency, lang } = req.body;
    
    let settings = await prisma.settings.findFirst();
    
    const data: any = {};
    if (companyName !== undefined) data.companyName = companyName;
    if (address !== undefined) data.address = address;
    if (siret !== undefined) data.siret = siret;
    if (currency !== undefined) data.currency = currency;
    if (lang !== undefined) data.lang = lang;
    
    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.settings.create({
        data
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('[settingsController.updateSettings]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};
