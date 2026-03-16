/* ============================================
   Dashboard Page Logic
   ============================================ */

(function () {
  'use strict';

  function init() {
    renderGreeting();
    renderSummary();
    renderChart();
    renderRecentTransactions();
  }

  function renderGreeting() {
    const el = document.getElementById('greeting-date');
    if (el) el.textContent = KostFinance.getGreetingDate();
  }

  function renderSummary() {
    const summary = KostFinance.getSummary();

    const saldoEl = document.getElementById('saldo-amount');
    const incomeEl = document.getElementById('income-amount');
    const expenseEl = document.getElementById('expense-amount');

    if (saldoEl) saldoEl.textContent = KostFinance.formatRupiah(summary.balance);
    if (incomeEl) incomeEl.textContent = KostFinance.formatRupiah(summary.totalIncome);
    if (expenseEl) expenseEl.textContent = KostFinance.formatRupiah(summary.totalExpense);
  }

  function renderChart() {
    const data = KostFinance.getChartData(7);
    KostChart.render('cashflow-chart', data);
  }

  function renderRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;

    const transactions = KostFinance.getTransactions({ sortDesc: true });
    const recent = transactions.slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📭</div>
          <p class="empty-state__text">Belum ada transaksi.<br>Tap tombol <strong>+</strong> untuk menambah.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(tx => {
      const icon = KostFinance.getCategoryIcon(tx.categoryId);
      const category = KostFinance.getCategoryLabel(tx.categoryId);
      const isIncome = tx.type === 'income';
      const amountClass = isIncome ? 'transaction-item__amount--income' : 'transaction-item__amount--expense';
      const iconClass = isIncome ? 'transaction-item__icon--income' : 'transaction-item__icon--expense';
      const prefix = isIncome ? '+' : '-';
      const dateStr = KostFinance.formatDateShort(tx.date);

      return `
        <div class="transaction-item" data-id="${tx.id}" onclick="window.location.href='tambah.html?edit=${tx.id}'">
          <div class="transaction-item__icon ${iconClass}">${icon}</div>
          <div class="transaction-item__info">
            <p class="transaction-item__category">${category}</p>
            <p class="transaction-item__note">${tx.note || '-'}</p>
          </div>
          <div>
            <p class="transaction-item__amount ${amountClass}">${prefix}${KostFinance.formatRupiah(tx.amount)}</p>
            <p class="transaction-item__date">${dateStr}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Resize chart on window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderChart, 200);
  });

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
