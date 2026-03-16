// ============================================
// Kost Finance — Express Server Entry Point
// ============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { autentikasiMiddleware } from './middleware/auth.middleware.js';
import kategoriRoutes from './routes/kategori.routes.js';
import transaksiRoutes from './routes/transaksi.routes.js';
import dasborRoutes from './routes/dasbor.routes.js';
import { layananKategori } from './services/kategori.service.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ---- Middleware Global ----
app.use(cors({
  origin: ['http://localhost', 'http://127.0.0.1', 'http://localhost:80'],
  credentials: true,
}));
app.use(express.json());

// ---- Better Auth Routes ----
// Better Auth handles all /api/auth/* routes
app.all('/api/auth/*splat', toNodeHandler(auth));

// ---- Hook: Isi kategori bawaan saat sign-up ----
auth.api.getSession; // type reference
// We'll use a post-signup hook via Better Auth's afterSignUp
// For simplicity, check on first login if categories exist:

// ---- API Routes (Protected) ----
app.use('/api/kategori', autentikasiMiddleware, kategoriRoutes);
app.use('/api/transaksi', autentikasiMiddleware, transaksiRoutes);
app.use('/api/dasbor', autentikasiMiddleware, dasborRoutes);

// ---- Auto-seed endpoint (call after first sign-up) ----
app.post('/api/isi-kategori-bawaan', autentikasiMiddleware, async (req, res) => {
  try {
    const existing = await layananKategori.daftar(req.pengguna!.id);
    if (existing.length > 0) {
      res.json({ pesan: 'Kategori sudah ada', jumlah: existing.length });
      return;
    }
    await layananKategori.isiBawaan(req.pengguna!.id);
    const daftar = await layananKategori.daftar(req.pengguna!.id);
    res.status(201).json({ pesan: 'Kategori bawaan berhasil diisi', daftar });
  } catch (error) {
    console.error('Gagal mengisi kategori bawaan:', error);
    res.status(500).json({ error: 'Gagal mengisi kategori bawaan' });
  }
});

// ---- Health check ----
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'berjalan',
    waktu: new Date().toISOString(),
    versi: '1.0.0',
  });
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`\n🏠 Kost Finance API berjalan di http://localhost:${PORT}`);
  console.log(`📡 Auth:      http://localhost:${PORT}/api/auth/*`);
  console.log(`📋 Kategori:  http://localhost:${PORT}/api/kategori`);
  console.log(`💰 Transaksi: http://localhost:${PORT}/api/transaksi`);
  console.log(`📊 Dasbor:    http://localhost:${PORT}/api/dasbor/ringkasan`);
  console.log(`❤️  Status:    http://localhost:${PORT}/api/status\n`);
});
