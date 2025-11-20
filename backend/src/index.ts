// src/index.ts

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

// 5. Health check route - useful for monitoring, load balancers, debugging
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'task-manager-backend',
    timestamp: new Date().toISOString(),
  });
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
