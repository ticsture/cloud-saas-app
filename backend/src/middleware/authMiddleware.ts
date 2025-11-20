// src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Expected format: "Bearer xyz123"
    const token = authHeader.split(' ')[1];

    const decoded = verifyToken(token);

    // Attach user info to req object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next(); // continue to route handler

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
