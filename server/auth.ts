import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, UserRecord, UserPreferences } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'nova_default_jwt_secret_dev_2026_key';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  preferences: UserPreferences;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(user: Pick<UserRecord, 'id' | 'username' | 'email'>): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function formatUserProfile(user: UserRecord): AuthenticatedUser & { createdAt: number; updatedAt: number } {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.users.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists.' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      preferences: user.preferences,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = db.users.findById(decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          preferences: user.preferences,
        };
      }
    } catch {
      // Ignore errors for optional authentication
    }
  }

  next();
}
