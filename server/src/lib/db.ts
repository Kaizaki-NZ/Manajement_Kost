// ============================================
// Koneksi Database — Drizzle + MySQL
// ============================================

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../db/schema.js';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/kost_finance',
  waitForConnections: true,
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: 'default' });
export { pool };
