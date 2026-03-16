// ============================================
// Rute Transaksi — /api/transaksi
// ============================================

import { Router } from 'express';
import { layananTransaksi } from '../services/transaksi.service.js';

const router = Router();

// GET /api/transaksi
router.get('/', async (req, res) => {
  try {
    const filter = {
      tipe: req.query.tipe as string | undefined,
      idKategori: req.query.idKategori as string | undefined,
      cari: req.query.cari as string | undefined,
      urut: req.query.urut as string | undefined,
      batas: req.query.batas ? Number(req.query.batas) : undefined,
      tanggalMulai: req.query.tanggalMulai as string | undefined,
      tanggalAkhir: req.query.tanggalAkhir as string | undefined,
    };
    const daftar = await layananTransaksi.daftar(req.pengguna!.id, filter);
    res.json(daftar);
  } catch (error) {
    console.error('Gagal mengambil transaksi:', error);
    res.status(500).json({ error: 'Gagal mengambil transaksi' });
  }
});

// GET /api/transaksi/:id
router.get('/:id', async (req, res) => {
  try {
    const hasil = await layananTransaksi.ambilBerdasarkanId(req.pengguna!.id, req.params.id);
    if (!hasil) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json(hasil);
  } catch (error) {
    console.error('Gagal mengambil transaksi:', error);
    res.status(500).json({ error: 'Gagal mengambil transaksi' });
  }
});

// POST /api/transaksi
router.post('/', async (req, res) => {
  try {
    const { idKategori, tipe, jumlah, tanggal, catatan } = req.body;
    if (!idKategori || !tipe || !jumlah || !tanggal) {
      res.status(400).json({ error: 'idKategori, tipe, jumlah, dan tanggal wajib diisi' });
      return;
    }
    if (jumlah <= 0) {
      res.status(400).json({ error: 'Jumlah harus lebih dari 0' });
      return;
    }
    const hasil = await layananTransaksi.buat(req.pengguna!.id, {
      idKategori, tipe, jumlah: Number(jumlah), tanggal, catatan,
    });
    res.status(201).json(hasil);
  } catch (error) {
    console.error('Gagal membuat transaksi:', error);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

// PUT /api/transaksi/:id
router.put('/:id', async (req, res) => {
  try {
    const { idKategori, tipe, jumlah, tanggal, catatan } = req.body;
    const hasil = await layananTransaksi.perbarui(req.pengguna!.id, req.params.id, {
      idKategori, tipe,
      jumlah: jumlah !== undefined ? Number(jumlah) : undefined,
      tanggal, catatan,
    });
    if (!hasil) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json(hasil);
  } catch (error) {
    console.error('Gagal memperbarui transaksi:', error);
    res.status(500).json({ error: 'Gagal memperbarui transaksi' });
  }
});

// DELETE /api/transaksi/:id
router.delete('/:id', async (req, res) => {
  try {
    const berhasil = await layananTransaksi.hapus(req.pengguna!.id, req.params.id);
    if (!berhasil) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ pesan: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus transaksi:', error);
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
});

export default router;
