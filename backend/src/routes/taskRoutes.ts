// src/routes/taskRoutes.ts

import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();


// POST /tasks  → Create new task
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, description, projectId, priority, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'title and projectId are required' });
    }

    // Ensure user is part of the workspace of this project:
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.workspace.members.some(
      (m) => m.userId === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You do not have access to this workspace' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'todo'
      }
    });

    return res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Failed to create task' });
  }
});


// GET /tasks  → List tasks (optional: filter by projectId)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { projectId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        project: {
          workspace: {
            members: {
              some: { userId }
            }
          }
        },
        ...(projectId ? { projectId: String(projectId) } : {}),
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});


// GET /tasks/:id → Get single task
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isMember = task.project.workspace.members.some(
      (m) => m.userId === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    return res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return res.status(500).json({ message: 'Failed to fetch task' });
  }
});


// PUT /tasks/:id → Update task
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Check access
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isMember = task.project.workspace.members.some(
      (m) => m.userId === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId
      }
    });

    return res.json({ task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Failed to update task' });
  }
});


// DELETE /tasks/:id → Delete task
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // Check access
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: { members: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isMember = task.project.workspace.members.some(
      (m) => m.userId === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.task.delete({
      where: { id }
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ message: 'Failed to delete task' });
  }
});

export default router;
