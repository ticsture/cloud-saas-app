// src/routes/authRoutes.ts

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import { signToken } from '../utils/jwt';

const router = Router();

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Create a default workspace for this user (owner)
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name || 'My'} Workspace`,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });

    // Create JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error during signup' });
  }
});

export default router;
