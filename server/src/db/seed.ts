// ============================================
// Isian Kategori Bawaan
// ============================================

import 'dotenv/config';
import { db, pool } from '../lib/db.js';
import { layananKategori } from '../services/kategori.service.js';

async function seed() {
  console.log('🌱 Memulai isian data bawaan...');

  // Ambil semua pengguna dari tabel user
  const [rows] = await pool.execute('SELECT id, name FROM user');
  const pengguna = rows as { id: string; name: string }[];

  if (pengguna.length === 0) {
    console.log('⚠️  Tidak ada pengguna. Daftar terlebih dahulu lewat /api/auth/sign-up/email');
    process.exit(0);
  }

  for (const p of pengguna) {
    const existing = await layananKategori.daftar(p.id);
    if (existing.length > 0) {
      console.log(`⏭️  Pengguna "${p.name}" sudah memiliki ${existing.length} kategori, lewati.`);
      continue;
    }
    await layananKategori.isiBawaan(p.id);
    console.log(`✅ Kategori bawaan berhasil diisi untuk pengguna "${p.name}"`);
  }

  console.log('🌱 Isian data selesai!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Isian data gagal:', err);
  process.exit(1);
});
