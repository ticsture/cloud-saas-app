// src/index.ts
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import projectRoutes from './routes/projectRoutes';


import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/prisma';

// 1. Load environment variables from .env file (in development)
dotenv.config();

// 2. Create an Express application instance
const app: Application = express();

// 3. Read port from environment, fallback to 4000 (backend separate from frontend)
const PORT = process.env.PORT || 4000;

// 4. Global middlewares

// Parse incoming JSON bodies -> so we can use req.body
app.use(express.json());

// Enable CORS so frontend (different origin) can call this API
app.use(cors());
// Auth-related routes will be prefixed with /auth
app.use('/auth', authRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/projects', projectRoutes);



// 5. Health check route - useful for monitoring, load balancers, debugging
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'task-manager-backend',
    timestamp: new Date().toISOString(),
  });
});
// DB test route - just to verify Prisma + Postgres work
app.get('/db-test', async (req: Request, res: Response) => {
    try {
      // Simple query: count users
      const userCount = await prisma.user.count();

      res.status(200).json({
        status: 'ok',
        userCount,
      });
    } catch (err) {
      console.error('DB test failed:', err);
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
      });
    }
  });
// 6. Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
