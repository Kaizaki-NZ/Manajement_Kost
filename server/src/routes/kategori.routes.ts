// ============================================
// Rute Kategori — /api/kategori
// ============================================

import { Router } from 'express';
import { layananKategori } from '../services/kategori.service.js';

const router = Router();

// GET /api/kategori?tipe=pemasukan
router.get('/', async (req, res) => {
  try {
    const tipe = req.query.tipe as string | undefined;
    const daftar = await layananKategori.daftar(req.pengguna!.id, tipe);
    res.json(daftar);
  } catch (error) {
    console.error('Gagal mengambil kategori:', error);
    res.status(500).json({ error: 'Gagal mengambil kategori' });
  }
});

// POST /api/kategori
router.post('/', async (req, res) => {
  try {
    const { label, ikon, tipe, urutan } = req.body;
    if (!label || !tipe) {
      res.status(400).json({ error: 'Label dan tipe wajib diisi' });
      return;
    }
    const hasil = await layananKategori.buat(req.pengguna!.id, { label, ikon, tipe, urutan });
    res.status(201).json(hasil);
  } catch (error) {
    console.error('Gagal membuat kategori:', error);
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
});

// PUT /api/kategori/:id
router.put('/:id', async (req, res) => {
  try {
    const { label, ikon, urutan } = req.body;
    const hasil = await layananKategori.perbarui(req.pengguna!.id, req.params.id, { label, ikon, urutan });
    if (!hasil) {
      res.status(404).json({ error: 'Kategori tidak ditemukan' });
      return;
    }
    res.json(hasil);
  } catch (error) {
    console.error('Gagal memperbarui kategori:', error);
    res.status(500).json({ error: 'Gagal memperbarui kategori' });
  }
});

// DELETE /api/kategori/:id
router.delete('/:id', async (req, res) => {
  try {
    const berhasil = await layananKategori.hapus(req.pengguna!.id, req.params.id);
    if (!berhasil) {
      res.status(404).json({ error: 'Kategori tidak ditemukan' });
      return;
    }
    res.json({ pesan: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus kategori:', error);
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
});

export default router;
