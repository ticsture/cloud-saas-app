// src/routes/workspaceRoutes.ts

import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /workspaces/my
// Return all workspaces where the current user is a member
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return res.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
});

export default router;
