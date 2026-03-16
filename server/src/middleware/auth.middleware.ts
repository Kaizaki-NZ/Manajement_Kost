// ============================================
// Middleware Autentikasi
// ============================================

import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      pengguna?: {
        id: string;
        nama: string;
        surel: string;
      };
    }
  }
}

export async function autentikasiMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      res.status(401).json({ error: 'Tidak terautentikasi' });
      return;
    }

    req.pengguna = {
      id: session.user.id,
      nama: session.user.name,
      surel: session.user.email,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Sesi tidak valid' });
  }
}
