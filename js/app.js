/* ============================================
   KOST FINANCE — Core Application Logic
   CRUD, localStorage, formatting, categories
   ============================================ */

const KostFinance = (() => {
  'use strict';

  const STORAGE_KEY = 'kost_finance_transactions';

  // ---- Categories ----
  const CATEGORIES = {
    income: [
      { id: 'sewa', label: 'Uang Sewa Bulanan', icon: '🏠' },
      { id: 'deposit', label: 'Uang Deposit/DP', icon: '💰' },
      { id: 'income_other', label: 'Pemasukan Lainnya', icon: '📥' }
    ],
    expense: [
      { id: 'listrik_air', label: 'Token Listrik/Air', icon: '⚡' },
      { id: 'perawatan', label: 'Perawatan/Perbaikan', icon: '🔧' },
      { id: 'kebersihan', label: 'Operasional Kebersihan', icon: '🧹' },
      { id: 'expense_other', label: 'Pengeluaran Lainnya', icon: '📤' }
    ]
  };

  // ---- Helper: Generate ID ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // ---- Storage ----
  function _getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return [];
    }
  }

  function _saveAll(transactions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error writing localStorage:', e);
    }
  }

  // ---- CRUD ----
  function addTransaction({ type, amount, date, categoryId, note }) {
    const transactions = _getAll();
    const newTx = {
      id: generateId(),
      type,           // 'income' | 'expense'
      amount: Number(amount),
      date,           // 'YYYY-MM-DD'
      categoryId,
      note: note || '',
      createdAt: new Date().toISOString()
    };
    transactions.push(newTx);
    _saveAll(transactions);
    return newTx;
  }

  function getTransactions({ type, categoryId, search, sortDesc = true } = {}) {
    let transactions = _getAll();

    if (type) {
      transactions = transactions.filter(tx => tx.type === type);
    }
    if (categoryId) {
      transactions = transactions.filter(tx => tx.categoryId === categoryId);
    }
    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(tx =>
        tx.note.toLowerCase().includes(q) ||
        getCategoryLabel(tx.categoryId).toLowerCase().includes(q)
      );
    }

    transactions.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return sortDesc ? -dateCompare : dateCompare;
      return sortDesc
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt);
    });

    return transactions;
  }

  function getTransactionById(id) {
    return _getAll().find(tx => tx.id === id) || null;
  }

  function updateTransaction(id, updates) {
    const transactions = _getAll();
    const index = transactions.findIndex(tx => tx.id === id);
    if (index === -1) return null;

    transactions[index] = {
      ...transactions[index],
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) : transactions[index].amount,
      updatedAt: new Date().toISOString()
    };
    _saveAll(transactions);
    return transactions[index];
  }

  function deleteTransaction(id) {
    const transactions = _getAll();
    const filtered = transactions.filter(tx => tx.id !== id);
    if (filtered.length === transactions.length) return false;
    _saveAll(filtered);
    return true;
  }

  // ---- Aggregation ----
  function getSummary() {
    const transactions = _getAll();
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else totalExpense += tx.amount;
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }

  function getChartData(days = 7) {
    const transactions = _getAll();
    const now = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      let income = 0;
      let expense = 0;

      transactions.forEach(tx => {
        if (tx.date === dateStr) {
          if (tx.type === 'income') income += tx.amount;
          else expense += tx.amount;
        }
      });

      data.push({ label: dayLabel, dateStr, income, expense });
    }

    return data;
  }

  // ---- Category Helpers ----
  function getCategories(type) {
    return CATEGORIES[type] || [];
  }

  function getCategoryById(categoryId) {
    const all = [...CATEGORIES.income, ...CATEGORIES.expense];
    return all.find(c => c.id === categoryId) || null;
  }

  function getCategoryLabel(categoryId) {
    const cat = getCategoryById(categoryId);
    return cat ? cat.label : 'Tidak Diketahui';
  }

  function getCategoryIcon(categoryId) {
    const cat = getCategoryById(categoryId);
    return cat ? cat.icon : '❓';
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

  // ---- Export to CSV ----
  function exportToCSV(opts = {}) {
    const transactions = getTransactions(opts);

    if (transactions.length === 0) {
      showToast('Tidak ada transaksi untuk diekspor', 'error');
      return;
    }

    // CSV Header
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah (Rp)', 'Catatan'];
    const rows = transactions.map(tx => {
      const kategori = getCategoryLabel(tx.categoryId);
      const tipe = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
      const jumlah = tx.type === 'income' ? tx.amount : -tx.amount;
      const catatan = (tx.note || '-').replace(/"/g, '""'); // Escape quotes

      return [
        tx.date,
        tipe,
        `"${kategori}"`,
        jumlah,
        `"${catatan}"`
      ].join(',');
    });

    // Add summary row
    const summary = getSummary();
    rows.push('');
    rows.push(`Ringkasan,,,,`);
    rows.push(`Total Pemasukan,,,${summary.totalIncome},`);
    rows.push(`Total Pengeluaran,,,-${summary.totalExpense},`);
    rows.push(`Saldo,,,${summary.balance},`);

    // Build CSV string with BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csv = bom + headers.join(',') + '\n' + rows.join('\n');

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    link.href = url;
    link.download = `kost-finance-${dateStr}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Berhasil diekspor ke CSV! 📁');
  }

  // ---- Public API ----
  return {
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
