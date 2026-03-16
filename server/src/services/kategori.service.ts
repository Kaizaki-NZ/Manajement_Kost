// ============================================
// Layanan Kategori — CRUD
// ============================================

import { eq, and } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { kategori } from '../db/schema.js';

export const layananKategori = {
  async daftar(idPengguna: string, tipe?: string) {
    const kondisi = tipe
      ? and(eq(kategori.idPengguna, idPengguna), eq(kategori.tipe, tipe))
      : eq(kategori.idPengguna, idPengguna);

    return db.select().from(kategori).where(kondisi).orderBy(kategori.urutan);
  },

  async ambilBerdasarkanId(idPengguna: string, id: string) {
    const hasil = await db.select().from(kategori)
      .where(and(eq(kategori.id, id), eq(kategori.idPengguna, idPengguna)))
      .limit(1);
    return hasil[0] || null;
  },

  async buat(idPengguna: string, data: {
    label: string;
    ikon: string;
    tipe: string;
    urutan?: number;
  }) {
    const id = crypto.randomUUID();
    await db.insert(kategori).values({
      id,
      idPengguna,
      label: data.label,
      ikon: data.ikon || '📦',
      tipe: data.tipe,
      urutan: data.urutan || 0,
    });
    return this.ambilBerdasarkanId(idPengguna, id);
  },

  async perbarui(idPengguna: string, id: string, data: {
    label?: string;
    ikon?: string;
    urutan?: number;
  }) {
    const ada = await this.ambilBerdasarkanId(idPengguna, id);
    if (!ada) return null;

    await db.update(kategori)
      .set({
        ...(data.label !== undefined && { label: data.label }),
        ...(data.ikon !== undefined && { ikon: data.ikon }),
        ...(data.urutan !== undefined && { urutan: data.urutan }),
      })
      .where(and(eq(kategori.id, id), eq(kategori.idPengguna, idPengguna)));

    return this.ambilBerdasarkanId(idPengguna, id);
  },

  async hapus(idPengguna: string, id: string) {
    const ada = await this.ambilBerdasarkanId(idPengguna, id);
    if (!ada) return false;

    await db.delete(kategori)
      .where(and(eq(kategori.id, id), eq(kategori.idPengguna, idPengguna)));
    return true;
  },

  async isiBawaan(idPengguna: string) {
    const kategoriBawaan = [
      { label: 'Uang Sewa Bulanan', ikon: '🏠', tipe: 'pemasukan', urutan: 1 },
      { label: 'Uang Deposit/DP', ikon: '💰', tipe: 'pemasukan', urutan: 2 },
      { label: 'Pemasukan Lainnya', ikon: '📥', tipe: 'pemasukan', urutan: 3 },
      { label: 'Token Listrik/Air', ikon: '⚡', tipe: 'pengeluaran', urutan: 1 },
      { label: 'Perawatan/Perbaikan', ikon: '🔧', tipe: 'pengeluaran', urutan: 2 },
      { label: 'Operasional Kebersihan', ikon: '🧹', tipe: 'pengeluaran', urutan: 3 },
      { label: 'Pengeluaran Lainnya', ikon: '📤', tipe: 'pengeluaran', urutan: 4 },
    ];

    const values = kategoriBawaan.map(k => ({
      id: crypto.randomUUID(),
      idPengguna,
      label: k.label,
      ikon: k.ikon,
      tipe: k.tipe,
      urutan: k.urutan,
    }));

    await db.insert(kategori).values(values);
  },
};
