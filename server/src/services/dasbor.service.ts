// ============================================
// Layanan Dasbor — Ringkasan & Grafik
// ============================================

import { eq, and, sql, between } from 'drizzle-orm';
import { db } from '../lib/db.js';
import { transaksi } from '../db/schema.js';

export const layananDasbor = {
  async ringkasan(idPengguna: string) {
    const hasil = await db.select({
      tipe: transaksi.tipe,
      total: sql<number>`SUM(${transaksi.jumlah})`.as('total'),
    })
      .from(transaksi)
      .where(eq(transaksi.idPengguna, idPengguna))
      .groupBy(transaksi.tipe);

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    hasil.forEach(r => {
      if (r.tipe === 'pemasukan') totalPemasukan = Number(r.total) || 0;
      else if (r.tipe === 'pengeluaran') totalPengeluaran = Number(r.total) || 0;
    });

    return {
      totalPemasukan,
      totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran,
    };
  },

  async grafik(idPengguna: string, hari: number = 7) {
    const sekarang = new Date();
    const data: { label: string; tanggal: string; pemasukan: number; pengeluaran: number }[] = [];

    // Build date list
    const tanggalDaftar: string[] = [];
    for (let i = hari - 1; i >= 0; i--) {
      const d = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      tanggalDaftar.push(str);
    }

    const awal = tanggalDaftar[0];
    const akhir = tanggalDaftar[tanggalDaftar.length - 1];

    // Fetch aggregated data from DB
    const hasil = await db.select({
      tanggal: transaksi.tanggal,
      tipe: transaksi.tipe,
      total: sql<number>`SUM(${transaksi.jumlah})`.as('total'),
    })
      .from(transaksi)
      .where(and(
        eq(transaksi.idPengguna, idPengguna),
        between(transaksi.tanggal, awal, akhir)
      ))
      .groupBy(transaksi.tanggal, transaksi.tipe);

    // Build lookup map
    const peta = new Map<string, { pemasukan: number; pengeluaran: number }>();
    hasil.forEach(r => {
      const key = String(r.tanggal);
      if (!peta.has(key)) peta.set(key, { pemasukan: 0, pengeluaran: 0 });
      const entry = peta.get(key)!;
      if (r.tipe === 'pemasukan') entry.pemasukan = Number(r.total) || 0;
      else entry.pengeluaran = Number(r.total) || 0;
    });

    // Build response
    tanggalDaftar.forEach(tgl => {
      const d = new Date(tgl + 'T00:00:00');
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const nilaiHari = peta.get(tgl) || { pemasukan: 0, pengeluaran: 0 };
      data.push({
        label,
        tanggal: tgl,
        pemasukan: nilaiHari.pemasukan,
        pengeluaran: nilaiHari.pengeluaran,
      });
    });

    return data;
  },
};
