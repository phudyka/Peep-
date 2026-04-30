import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const EFFECTIVE_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Dummy hash used to equalise timing when user is not found
// 🔒 Fix #3 : timing attack — sans ça, un attaquant peut énumérer les emails valides
//    en mesurant le temps de réponse (hash compare = ~100ms vs retour immédiat).
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export const login = async (req: Request, res: Response) => {
  try {
    // 🔒 Fix #4 : validation minimale des entrées
    const { email, password } = req.body;
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Paramètres invalides.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // 🔒 Fix #3 : toujours comparer un hash même si l'utilisateur n'existe pas
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const validPassword = await bcrypt.compare(password, hashToCompare);

    if (!user || !validPassword) {
      // Message identique dans les deux cas (pas d'énumération d'email)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // 🔒 Fix #5 : utilise la même constante que le middleware (EFFECTIVE_SECRET)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      EFFECTIVE_SECRET,
      { expiresIn: '8h' } // réduit de 24h à 8h (journée de travail)
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('[authController.login]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};
