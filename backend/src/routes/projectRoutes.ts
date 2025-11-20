// src/routes/projectRoutes.ts

import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// POST /projects
// Create a new project inside a workspace (user must be a member)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, description, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ message: 'name and workspaceId are required' });
    }

    // Optional: Verify that this user belongs to the workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId,
      },
    });

    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        workspaceId,
      },
    });

    return res.status(201).json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Failed to create project' });
  }
});

// GET /projects
// List projects, optionally filter by workspaceId
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { workspaceId } = req.query;

    // Only show projects from workspaces the user belongs to
    const projects = await prisma.project.findMany({
      where: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
        ...(workspaceId
          ? { workspaceId: String(workspaceId) }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

export default router;
