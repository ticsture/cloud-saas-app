// src/utils/jwt.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d'; // token valid for 7 days

// What we store inside the token
export interface JwtPayload {
  userId: string;
  email: string;
}

// Create a JWT for a user
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify a JWT and get the payload back
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
