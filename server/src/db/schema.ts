// ============================================
// Skema Database — Drizzle + MySQL
// ============================================

import { mysqlTable, varchar, text, int, date, timestamp, boolean, datetime } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';

// ---- Tabel Better Auth (auto-generated) ----

export const pengguna = mysqlTable('user', {
  id: varchar('id', { length: 36 }).primaryKey(),
  nama: varchar('name', { length: 255 }).notNull(),
  surel: varchar('email', { length: 255 }).notNull().unique(),
  surelTerverifikasi: boolean('email_verified').notNull(),
  gambar: varchar('image', { length: 255 }),
  dibuatPada: timestamp('created_at').defaultNow().notNull(),
  diperbaruiPada: timestamp('updated_at').defaultNow().notNull(),
});

export const sesi = mysqlTable('session', {
  id: varchar('id', { length: 36 }).primaryKey(),
  kedaluwarsaPada: datetime('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  dibuatPada: timestamp('created_at').defaultNow().notNull(),
  diperbaruiPada: timestamp('updated_at').defaultNow().notNull(),
  alamatIp: varchar('ip_address', { length: 255 }),
  agenPengguna: varchar('user_agent', { length: 255 }),
  idPengguna: varchar('user_id', { length: 36 }).notNull().references(() => pengguna.id, { onDelete: 'cascade' }),
});

export const akun = mysqlTable('account', {
  id: varchar('id', { length: 36 }).primaryKey(),
  idAkun: varchar('account_id', { length: 255 }).notNull(),
  idPenyedia: varchar('provider_id', { length: 255 }).notNull(),
  idPengguna: varchar('user_id', { length: 36 }).notNull().references(() => pengguna.id, { onDelete: 'cascade' }),
  tokenAkses: varchar('access_token', { length: 255 }),
  tokenSegarkan: varchar('refresh_token', { length: 255 }),
  kedaluwarsaTokenAkses: datetime('access_token_expires_at'),
  kedaluwarsaTokenSegarkan: datetime('refresh_token_expires_at'),
  cakupan: varchar('scope', { length: 255 }),
  idToken: varchar('id_token', { length: 2048 }),
  kataSandi: varchar('password', { length: 255 }),
  dibuatPada: timestamp('created_at').defaultNow().notNull(),
  diperbaruiPada: timestamp('updated_at').defaultNow().notNull(),
});

export const verifikasi = mysqlTable('verification', {
  id: varchar('id', { length: 36 }).primaryKey(),
  pengenal: varchar('identifier', { length: 255 }).notNull(),
  nilai: varchar('value', { length: 255 }).notNull(),
  kedaluwarsaPada: datetime('expires_at').notNull(),
  dibuatPada: timestamp('created_at').defaultNow(),
  diperbaruiPada: timestamp('updated_at').defaultNow(),
});

// ---- Tabel Aplikasi ----

export const kategori = mysqlTable('kategori', {
  id: varchar('id', { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  idPengguna: varchar('id_pengguna', { length: 36 }).notNull().references(() => pengguna.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  ikon: varchar('ikon', { length: 10 }).notNull().default('📦'),
  tipe: varchar('tipe', { length: 15 }).notNull(),   // 'pemasukan' | 'pengeluaran'
  urutan: int('urutan').default(0),
  dibuatPada: timestamp('dibuat_pada').defaultNow().notNull(),
});

export const transaksi = mysqlTable('transaksi', {
  id: varchar('id', { length: 36 }).$defaultFn(() => randomUUID()).primaryKey(),
  idPengguna: varchar('id_pengguna', { length: 36 }).notNull().references(() => pengguna.id, { onDelete: 'cascade' }),
  idKategori: varchar('id_kategori', { length: 36 }).notNull().references(() => kategori.id, { onDelete: 'restrict' }),
  tipe: varchar('tipe', { length: 15 }).notNull(),   // 'pemasukan' | 'pengeluaran'
  jumlah: int('jumlah').notNull(),
  tanggal: date('tanggal').notNull(),
  catatan: text('catatan'),
  dibuatPada: timestamp('dibuat_pada').defaultNow().notNull(),
  diperbaruiPada: timestamp('diperbarui_pada').defaultNow().notNull(),
});
