// ============================================
// Layanan Transaksi — CRUD + Filter
// ============================================

import { eq, and, desc, asc, like, sql, between, or } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { transaksi, kategori } from '../db/schema.js';

interface FilterTransaksi {
  tipe?: string;
  idKategori?: string;
  cari?: string;
  urut?: string;
  batas?: number;
  tanggalMulai?: string;
  tanggalAkhir?: string;
}

export const layananTransaksi = {
  async daftar(idPengguna: string, filter: FilterTransaksi = {}) {
    const kondisi = [eq(transaksi.idPengguna, idPengguna)];

    if (filter.tipe) {
      kondisi.push(eq(transaksi.tipe, filter.tipe));
    }
    if (filter.idKategori) {
      kondisi.push(eq(transaksi.idKategori, filter.idKategori));
    }
    if (filter.tanggalMulai && filter.tanggalAkhir) {
      kondisi.push(between(transaksi.tanggal, filter.tanggalMulai, filter.tanggalAkhir));
    } else if (filter.tanggalMulai) {
      kondisi.push(sql`${transaksi.tanggal} >= ${filter.tanggalMulai}`);
    } else if (filter.tanggalAkhir) {
      kondisi.push(sql`${transaksi.tanggal} <= ${filter.tanggalAkhir}`);
    }
    if (filter.cari) {
      kondisi.push(like(transaksi.catatan, `%${filter.cari}%`));
    }

    const urutanHasil = filter.urut === 'naik'
      ? [asc(transaksi.tanggal), asc(transaksi.dibuatPada)]
      : [desc(transaksi.tanggal), desc(transaksi.dibuatPada)];

    const batasHasil = filter.batas || 50;

    return db.select().from(transaksi)
      .where(and(...kondisi))
      .orderBy(...urutanHasil)
      .limit(batasHasil);
  },

  async ambilBerdasarkanId(idPengguna: string, id: string) {
    const hasil = await db.select().from(transaksi)
      .where(and(eq(transaksi.id, id), eq(transaksi.idPengguna, idPengguna)))
      .limit(1);
    return hasil[0] || null;
  },

  async buat(idPengguna: string, data: {
    idKategori: string;
    tipe: string;
    jumlah: number;
    tanggal: string;
    catatan?: string;
  }) {
    const id = crypto.randomUUID();
    await db.insert(transaksi).values({
      id,
      idPengguna,
      idKategori: data.idKategori,
      tipe: data.tipe,
      jumlah: data.jumlah,
      tanggal: data.tanggal,
      catatan: data.catatan || '',
    });
    return this.ambilBerdasarkanId(idPengguna, id);
  },

  async perbarui(idPengguna: string, id: string, data: {
    idKategori?: string;
    tipe?: string;
    jumlah?: number;
    tanggal?: string;
    catatan?: string;
  }) {
    const ada = await this.ambilBerdasarkanId(idPengguna, id);
    if (!ada) return null;

    const updateData: Record<string, unknown> = {};
    if (data.idKategori !== undefined) updateData.idKategori = data.idKategori;
    if (data.tipe !== undefined) updateData.tipe = data.tipe;
    if (data.jumlah !== undefined) updateData.jumlah = data.jumlah;
    if (data.tanggal !== undefined) updateData.tanggal = data.tanggal;
    if (data.catatan !== undefined) updateData.catatan = data.catatan;

    await db.update(transaksi)
      .set(updateData)
      .where(and(eq(transaksi.id, id), eq(transaksi.idPengguna, idPengguna)));

    return this.ambilBerdasarkanId(idPengguna, id);
  },

  async hapus(idPengguna: string, id: string) {
    const ada = await this.ambilBerdasarkanId(idPengguna, id);
    if (!ada) return false;

    await db.delete(transaksi)
      .where(and(eq(transaksi.id, id), eq(transaksi.idPengguna, idPengguna)));
    return true;
  },
};
