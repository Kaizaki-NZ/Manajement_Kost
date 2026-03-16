/* ============================================
   Riwayat (History) Page Logic
   ============================================ */

(function () {
  'use strict';

  let currentFilter = 'all';
  let searchQuery = '';

  function init() {
    setupFilters();
    setupSearch();
    setupExport();
    renderTransactions();
  }

  // ---- Export CSV ----
  function setupExport() {
    const btn = document.getElementById('btn-export');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const opts = { sortDesc: true };
      if (currentFilter !== 'all') opts.type = currentFilter;
      if (searchQuery) opts.search = searchQuery;
      KostFinance.exportToCSV(opts);
    });
  }

  // ---- Filters ----
  function setupFilters() {
    const filterBar = document.getElementById('filter-bar');
    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      // Update active state
      filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      currentFilter = chip.dataset.filter;
      renderTransactions();
    });
  }

  // ---- Search ----
  function setupSearch() {
    const input = document.getElementById('search-input');
    let debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = input.value.trim();
        renderTransactions();
      }, 250);
    });
  }

  // ---- Render ----
  function renderTransactions() {
    const container = document.getElementById('transaction-list');
    if (!container) return;

    const opts = { sortDesc: true };
    if (currentFilter !== 'all') {
      opts.type = currentFilter;
    }
    if (searchQuery) {
      opts.search = searchQuery;
    }

    const transactions = KostFinance.getTransactions(opts);

    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📭</div>
          <p class="empty-state__text">
            ${searchQuery ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi.'}
          </p>
        </div>
      `;
      return;
    }

    // Group by date
    const groups = {};
    transactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });

    let html = '';
    Object.entries(groups).forEach(([date, txList]) => {
      html += `
        <div class="date-group">
          <div class="date-group__label">${KostFinance.formatDate(date)}</div>
          <div class="transaction-list">
      `;

      txList.forEach(tx => {
        const icon = KostFinance.getCategoryIcon(tx.categoryId);
        const category = KostFinance.getCategoryLabel(tx.categoryId);
        const isIncome = tx.type === 'income';
        const amountClass = isIncome ? 'transaction-item__amount--income' : 'transaction-item__amount--expense';
        const iconClass = isIncome ? 'transaction-item__icon--income' : 'transaction-item__icon--expense';
        const prefix = isIncome ? '+' : '-';

        html += `
          <div class="transaction-item" data-id="${tx.id}" onclick="window.location.href='tambah.html?edit=${tx.id}'">
            <div class="transaction-item__icon ${iconClass}">${icon}</div>
            <div class="transaction-item__info">
              <p class="transaction-item__category">${category}</p>
              <p class="transaction-item__note">${tx.note || '-'}</p>
            </div>
            <div>
              <p class="transaction-item__amount ${amountClass}">${prefix}${KostFinance.formatRupiah(tx.amount)}</p>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
