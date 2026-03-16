// ============================================
// Rute Dasbor — /api/dasbor
// ============================================

import { Router } from 'express';
import { layananDasbor } from '../services/dasbor.service.js';

const router = Router();

// GET /api/dasbor/ringkasan
router.get('/ringkasan', async (req, res) => {
  try {
    const ringkasan = await layananDasbor.ringkasan(req.pengguna!.id);
    res.json(ringkasan);
  } catch (error) {
    console.error('Gagal mengambil ringkasan:', error);
    res.status(500).json({ error: 'Gagal mengambil ringkasan' });
  }
});

// GET /api/dasbor/grafik?hari=7
router.get('/grafik', async (req, res) => {
  try {
    const hari = req.query.hari ? Number(req.query.hari) : 7;
    const data = await layananDasbor.grafik(req.pengguna!.id, hari);
    res.json(data);
  } catch (error) {
    console.error('Gagal mengambil data grafik:', error);
    res.status(500).json({ error: 'Gagal mengambil data grafik' });
  }
});

export default router;
