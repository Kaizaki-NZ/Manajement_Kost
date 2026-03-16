/* ============================================
   Tambah / Edit Transaksi Page Logic
   ============================================ */

(function () {
  'use strict';

  let currentType = 'income';
  let editId = null;

  function init() {
    // Check if editing
    const params = new URLSearchParams(window.location.search);
    editId = params.get('edit');

    setupTypeToggle();
    setupAmountInput();
    setupForm();
    setDefaultDate();
    loadCategories();

    if (editId) {
      loadEditData();
    }
  }

  // ---- Type Toggle ----
  function setupTypeToggle() {
    const btnIncome = document.getElementById('btn-income');
    const btnExpense = document.getElementById('btn-expense');

    btnIncome.addEventListener('click', () => switchType('income'));
    btnExpense.addEventListener('click', () => switchType('expense'));
  }

  function switchType(type) {
    currentType = type;
    const btnIncome = document.getElementById('btn-income');
    const btnExpense = document.getElementById('btn-expense');

    btnIncome.className = 'type-toggle__btn' + (type === 'income' ? ' active--income' : '');
    btnExpense.className = 'type-toggle__btn' + (type === 'expense' ? ' active--expense' : '');

    loadCategories();
  }

  // ---- Amount Input (auto-format) ----
  function setupAmountInput() {
    const input = document.getElementById('input-amount');
    input.addEventListener('input', () => {
      const formatted = KostFinance.formatRupiahInput(input.value);
      input.value = formatted;
    });
  }

  // ---- Default Date ----
  function setDefaultDate() {
    const dateInput = document.getElementById('input-date');
    dateInput.value = KostFinance.getTodayString();
  }

  // ---- Load Categories ----
  function loadCategories() {
    const select = document.getElementById('input-category');
    const categories = KostFinance.getCategories(currentType);
    const currentVal = select.value;

    select.innerHTML = '<option value="">Pilih kategori...</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.label}`;
      select.appendChild(option);
    });

    // Restore selection if still valid
    if (currentVal && categories.some(c => c.id === currentVal)) {
      select.value = currentVal;
    }
  }

  // ---- Load Edit Data ----
  function loadEditData() {
    const tx = KostFinance.getTransactionById(editId);
    if (!tx) {
      KostFinance.showToast('Transaksi tidak ditemukan', 'error');
      setTimeout(() => window.location.href = 'riwayat.html', 1000);
      return;
    }

    // Update page title
    document.getElementById('page-title').textContent = 'Edit Transaksi';
    document.getElementById('btn-submit').textContent = '💾 Simpan Perubahan';
    document.title = 'Kost Finance — Edit Transaksi';

    // Switch type
    switchType(tx.type);

    // Fill fields
    document.getElementById('input-amount').value = tx.amount.toLocaleString('id-ID');
    document.getElementById('input-date').value = tx.date;
    document.getElementById('input-note').value = tx.note || '';

    // Load categories first, then set value
    setTimeout(() => {
      document.getElementById('input-category').value = tx.categoryId;
    }, 50);

    // Show delete button
    const deleteBtn = document.getElementById('btn-delete');
    deleteBtn.classList.remove('hidden');
    deleteBtn.addEventListener('click', handleDelete);
  }

  // ---- Form Submit ----
  function setupForm() {
    const form = document.getElementById('transaction-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const amount = KostFinance.parseRupiahInput(document.getElementById('input-amount').value);
      const date = document.getElementById('input-date').value;
      const categoryId = document.getElementById('input-category').value;
      const note = document.getElementById('input-note').value.trim();

      // Validation
      if (amount <= 0) {
        KostFinance.showToast('Masukkan nominal yang valid', 'error');
        return;
      }
      if (!date) {
        KostFinance.showToast('Pilih tanggal', 'error');
        return;
      }
      if (!categoryId) {
        KostFinance.showToast('Pilih kategori', 'error');
        return;
      }

      if (editId) {
        // Update
        KostFinance.updateTransaction(editId, {
          type: currentType,
          amount,
          date,
          categoryId,
          note
        });
        KostFinance.showToast('Transaksi berhasil diperbarui');
      } else {
        // Create
        KostFinance.addTransaction({
          type: currentType,
          amount,
          date,
          categoryId,
          note
        });
        KostFinance.showToast('Transaksi berhasil ditambahkan');
      }

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    });
  }

  // ---- Delete ----
  async function handleDelete() {
    const confirmed = await KostFinance.showConfirm(
      'Hapus Transaksi?',
      'Data yang dihapus tidak bisa dikembalikan.'
    );

    if (confirmed) {
      KostFinance.deleteTransaction(editId);
      KostFinance.showToast('Transaksi berhasil dihapus');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    }
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
