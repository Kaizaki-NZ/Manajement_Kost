/* ============================================
   KOST FINANCE — Core Application Logic
   CRUD, localStorage, formatting, categories
   ============================================ */

const KostFinance = (() => {
  'use strict';

  // ---- Categories Cache ----
  // Karena kategori disimpan di DB, kita cache di memori klien agar fungsi sinkron (seperti getCategoryIcon) tetap berjalan cepat.
  let cachedCategories = [];

  async function fetchCategories() {
    try {
      const data = await KostAPI.kategori.getAll();
      cachedCategories = data;
      return cachedCategories;
    } catch (error) {
      console.error('Gagal mengambil kategori:', error);
      return [];
    }
  }

  // ---- CRUD via API ----
  async function addTransaction({ type, amount, date, categoryId, note }) {
    const newTx = await KostAPI.transaksi.create({
      tipe: type,
      jumlah: amount,
      tanggal: date,
      idKategori: categoryId,
      catatan: note
    });
    // Map API fields (Bahasa) to Frontend fields (English)
    return {
      id: newTx.id,
      type: newTx.tipe,
      amount: newTx.jumlah,
      date: newTx.tanggal,
      categoryId: newTx.id_kategori,
      note: newTx.catatan,
      createdAt: newTx.dibuat_pada
    };
  }

  async function getTransactions(opts = {}) {
    // API backend menggunakan: tipe, idKategori, cari, urut, dll
    const apiOpts = {};
    if (opts.type) apiOpts.tipe = opts.type;
    if (opts.categoryId) apiOpts.idKategori = opts.categoryId; // Added categoryId filter
    if (opts.search) apiOpts.cari = opts.search;
    if (opts.sortDesc === false) apiOpts.urut = 'naik';
    else apiOpts.urut = 'turun';

    const data = await KostAPI.transaksi.getAll(apiOpts);
    // Map API fields (Bahasa) to Frontend fields (English)
    return data.map(tx => ({
      id: tx.id,
      type: tx.tipe,
      amount: tx.jumlah,
      date: tx.tanggal,
      categoryId: tx.id_kategori,
      note: tx.catatan,
      createdAt: tx.dibuat_pada
    }));
  }

  async function getTransactionById(id) {
    const tx = await KostAPI.transaksi.getById(id);
    if (!tx) return null;
    return {
      id: tx.id,
      type: tx.tipe,
      amount: tx.jumlah,
      date: tx.tanggal,
      categoryId: tx.id_kategori,
      note: tx.catatan,
      createdAt: tx.dibuat_pada
    };
  }

  async function updateTransaction(id, { type, amount, date, categoryId, note }) {
    const updatedTx = await KostAPI.transaksi.update(id, {
      tipe: type,
      jumlah: amount,
      tanggal: date,
      idKategori: categoryId,
      catatan: note
    });
    if (!updatedTx) return null;
    return {
      id: updatedTx.id,
      type: updatedTx.tipe,
      amount: updatedTx.jumlah,
      date: updatedTx.tanggal,
      categoryId: updatedTx.id_kategori,
      note: updatedTx.catatan,
      createdAt: updatedTx.dibuat_pada,
      updatedAt: updatedTx.diperbarui_pada
    };
  }

  async function deleteTransaction(id) {
    return KostAPI.transaksi.delete(id);
  }

  // ---- Aggregation via API ----
  async function getSummary() {
    const data = await KostAPI.dasbor.getSummary();
    return {
      totalIncome: data.totalPemasukan,
      totalExpense: data.totalPengeluaran,
      balance: data.saldo
    };
  }

  async function getChartData(days = 7) {
    const data = await KostAPI.dasbor.getChart(days);
    return data.map(d => ({
      label: d.label,
      dateStr: d.tanggal,
      income: d.pemasukan,
      expense: d.pengeluaran
    }));
  }

  // ---- Category Helpers ----
  function getCategories(type) {
    if (!type) return cachedCategories;
    return cachedCategories.filter(c => c.tipe === type);
  }

  function getCategoryById(categoryId) {
    return cachedCategories.find(c => c.id === categoryId) || null;
  }

  function getCategoryLabel(categoryId) {
    const cat = getCategoryById(categoryId);
    return cat ? cat.label : 'Tidak Diketahui';
  }

  function getCategoryIcon(categoryId) {
    const cat = getCategoryById(categoryId);
    return cat ? cat.ikon : '❓';
  }

  // ---- Formatting ----
  function formatRupiah(amount) {
    const abs = Math.abs(amount);
    return 'Rp ' + abs.toLocaleString('id-ID');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getGreetingDate() {
    const d = new Date();
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // ---- Toast Notification ----
  function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ---- Confirm Modal ----
  function showConfirm(title, text) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `
        <div class="modal">
          <h3 class="modal__title">${title}</h3>
          <p class="modal__text">${text}</p>
          <div class="modal__actions">
            <button class="btn btn--ghost" id="modal-cancel">Batal</button>
            <button class="btn btn--danger" id="modal-confirm">Hapus</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#modal-confirm').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
        resolve(true);
      });

      overlay.querySelector('#modal-cancel').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
        resolve(false);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          setTimeout(() => overlay.remove(), 200);
          resolve(false);
        }
      });
    });
  }

  // ---- Parse Rupiah Input ----
  function parseRupiahInput(value) {
    return Number(value.replace(/[^\d]/g, '')) || 0;
  }

  function formatRupiahInput(value) {
    const num = parseRupiahInput(value);
    if (num === 0) return '';
    return num.toLocaleString('id-ID');
  }

  // ---- Public API ----
  return {
    fetchCategories,
    addTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getSummary,
    getChartData,
    getCategories,
    getCategoryById,
    getCategoryLabel,
    getCategoryIcon,
    formatRupiah,
    formatDate,
    formatDateShort,
    getTodayString,
    getGreetingDate,
    showToast,
    showConfirm,
    parseRupiahInput,
    formatRupiahInput,
    exportToCSV
  };
})();
