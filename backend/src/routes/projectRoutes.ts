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

// GET /projects/:id
// Get a specific project with tasks summary
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Calculate task statistics
    const taskStats = {
      total: project._count.tasks,
      todo: project.tasks.filter(t => t.status === 'todo').length,
      in_progress: project.tasks.filter(t => t.status === 'in_progress').length,
      done: project.tasks.filter(t => t.status === 'done').length,
      high_priority: project.tasks.filter(t => t.priority === 'high').length,
    };

    const { tasks, _count, ...projectData } = project;
    
    return res.json({ 
      project: {
        ...projectData,
        stats: taskStats,
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ message: 'Failed to fetch project' });
  }
});

// PUT /projects/:id
// Update a project
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if user has access to this project
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    });

    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name || existingProject.name,
        description: description ?? existingProject.description,
      },
    });

    return res.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ message: 'Failed to update project' });
  }
});

// DELETE /projects/:id
// Delete a project (and all its tasks)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // Check if user has access to this project
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks first, then the project
    await prisma.task.deleteMany({
      where: { projectId: id },
    });

    await prisma.project.delete({
      where: { id },
    });

    return res.json({ 
      message: 'Project deleted successfully',
      deletedTasks: existingProject._count.tasks,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ message: 'Failed to delete project' });
  }
});

export default router;
