// ============================================
// Konfigurasi Better Auth
// ============================================

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db.js';
import * as schema from '../db/schema.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'mysql',
    schema: {
      user: schema.pengguna,
      session: schema.sesi,
      account: schema.akun,
      verification: schema.verifikasi,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ['http://localhost', 'http://127.0.0.1'],
});
