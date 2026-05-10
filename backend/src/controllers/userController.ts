import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../index';
import { Role } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

/**
 * Vérifie que l'utilisateur peut modifier le compte ciblé :
 * - Un admin peut tout modifier.
 * - Un utilisateur standard ne peut modifier que son propre compte.
 */
function canModifyUser(req: AuthRequest, targetId: string): boolean {
  if (req.user?.role === 'ADMIN') return true;
  return req.user?.id === targetId;
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('[userController.getUsers]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? Role.ADMIN : Role.COMMERCIAL;

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: userRole
      },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('[userController.createUser]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!canModifyUser(req, id)) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez modifier que votre propre compte.' });
    }

    const { email, role } = req.body;

    // 🔒 Fix #2 : un utilisateur non-admin ne peut pas élever son propre rôle
    if (role && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé. Seul un admin peut modifier les rôles.' });
    }

    const data: any = {};
    if (email) data.email = email.toLowerCase().trim();
    if (role && (role === 'ADMIN' || role === 'COMMERCIAL')) data.role = role;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }
    console.error('[userController.updateUser]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!canModifyUser(req, id)) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez supprimer que votre propre compte.' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }
    console.error('[userController.deleteUser]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!canModifyUser(req, id)) {
      return res.status(403).json({ error: 'Accès refusé. Vous ne pouvez modifier que votre propre mot de passe.' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis.' });
    }

    // 🔒 Fix #2 : un admin n'a pas besoin de l'ancien mot de passe pour réinitialiser celui d'un utilisateur
    if (req.user?.role === 'ADMIN') {
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      return res.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[userController.changePassword]', error);
    res.status(500).json({ error: 'Erreur serveur interne.' });
  }
};
