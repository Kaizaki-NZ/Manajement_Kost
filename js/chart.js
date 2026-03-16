/* ============================================
   KOST FINANCE — Line Chart Renderer (Canvas)
   Zero-dependency, native Canvas API
   ============================================ */

const KostChart = (() => {
  'use strict';

  const COLORS = {
    income: '#22c55e',
    incomeRgba: 'rgba(34, 197, 94,',
    expense: '#ef4444',
    expenseRgba: 'rgba(239, 68, 68,',
    grid: 'rgba(255, 255, 255, 0.06)',
    label: '#64748b',
    bg: '#0f172a'
  };

  const CONFIG = {
    paddingTop: 24,
    paddingRight: 16,
    paddingBottom: 40,
    paddingLeft: 54,
    dotRadius: 5,
    lineWidth: 2.5,
    dashPattern: [6, 4],
    gridLines: 4
  };

  // Store event handlers for cleanup
  let _moveHandler = null;
  let _leaveHandler = null;

  function render(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Size canvas to container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const padding = parseFloat(getComputedStyle(container).paddingLeft) || 0;
    const width = containerWidth - (padding * 2);
    const height = 200;

    if (width <= 0) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const chartLeft = CONFIG.paddingLeft;
    const chartRight = width - CONFIG.paddingRight;
    const chartTop = CONFIG.paddingTop;
    const chartBottom = height - CONFIG.paddingBottom;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    // Find max value with smart rounding
    let maxVal = 0;
    data.forEach(d => {
      maxVal = Math.max(maxVal, d.income, d.expense);
    });

    if (maxVal === 0) {
      maxVal = 1000000;
    } else if (maxVal < 100000) {
      maxVal = Math.ceil(maxVal / 50000) * 50000;
    } else if (maxVal < 1000000) {
      maxVal = Math.ceil(maxVal / 100000) * 100000;
    } else {
      maxVal = Math.ceil(maxVal / 1000000) * 1000000;
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // ---- Draw Grid ----
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = COLORS.label;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= CONFIG.gridLines; i++) {
      const y = chartTop + (chartHeight / CONFIG.gridLines) * i;
      const val = maxVal - (maxVal / CONFIG.gridLines) * i;

      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();

      const label = val >= 1000000
        ? (val / 1000000).toFixed(1).replace('.0', '') + 'jt'
        : val >= 1000
          ? (val / 1000).toFixed(0) + 'rb'
          : val.toString();
      ctx.fillText(label, chartLeft - 6, y);
    }

    // ---- Build data points ----
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
      x: data.length === 1 ? chartLeft + chartWidth / 2 : chartLeft + stepX * i,
      incomeY: chartTop + chartHeight - (d.income / maxVal) * chartHeight,
      expenseY: chartTop + chartHeight - (d.expense / maxVal) * chartHeight,
      data: d
    }));

    // Draw x labels (skip some if too many)
    const labelSkip = Math.ceil(points.length / 7);
    points.forEach((p, i) => {
      if (i % labelSkip === 0 || i === points.length - 1) {
        ctx.fillStyle = COLORS.label;
        ctx.fillText(p.data.label, p.x, chartBottom + 8);
      }
    });

    if (points.length < 2) {
      if (points.length === 1) {
        _drawDot(ctx, points[0].x, points[0].incomeY, COLORS.income, COLORS.incomeRgba);
        _drawDot(ctx, points[0].x, points[0].expenseY, COLORS.expense, COLORS.expenseRgba);
      }
      return;
    }

    // ---- Draw Area Fills ----
    _drawAreaFill(ctx, points, 'incomeY', COLORS.incomeRgba + ' 0.1)', chartBottom);
    _drawAreaFill(ctx, points, 'expenseY', COLORS.expenseRgba + ' 0.08)', chartBottom);

    // ---- Draw Income Line (solid) ----
    ctx.strokeStyle = COLORS.income;
    ctx.lineWidth = CONFIG.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash([]);
    ctx.beginPath();
    _drawSmoothLine(ctx, points, 'incomeY');
    ctx.stroke();

    // ---- Draw Expense Line (dashed) ----
    ctx.strokeStyle = COLORS.expense;
    ctx.lineWidth = CONFIG.lineWidth;
    ctx.setLineDash(CONFIG.dashPattern);
    ctx.beginPath();
    _drawSmoothLine(ctx, points, 'expenseY');
    ctx.stroke();
    ctx.setLineDash([]);

    // ---- Draw Dots ----
    points.forEach(p => {
      _drawDot(ctx, p.x, p.incomeY, COLORS.income, COLORS.incomeRgba);
      _drawDot(ctx, p.x, p.expenseY, COLORS.expense, COLORS.expenseRgba);
    });

    // ---- Setup Hover tooltip (without cloning canvas!) ----
    _setupTooltip(canvas, points, width);
  }

  function _drawSmoothLine(ctx, points, key) {
    ctx.moveTo(points[0].x, points[0][key]);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev[key], cpx, curr[key], curr.x, curr[key]);
    }
  }

  function _drawAreaFill(ctx, points, key, color, bottom) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, bottom);
    ctx.lineTo(points[0].x, points[0][key]);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev[key], cpx, curr[key], curr.x, curr[key]);
    }
    ctx.lineTo(points[points.length - 1].x, bottom);
    ctx.closePath();
    ctx.fill();
  }

  function _drawDot(ctx, x, y, color, rgbaBase) {
    // Glow
    ctx.beginPath();
    ctx.arc(x, y, CONFIG.dotRadius + 3, 0, Math.PI * 2);
    ctx.fillStyle = rgbaBase + ' 0.2)';
    ctx.fill();

    // Outer
    ctx.beginPath();
    ctx.arc(x, y, CONFIG.dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Inner
    ctx.beginPath();
    ctx.arc(x, y, CONFIG.dotRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
  }

  function _setupTooltip(canvas, points, width) {
    // Remove old event listeners (no cloneNode!)
    if (_moveHandler) canvas.removeEventListener('mousemove', _moveHandler);
    if (_leaveHandler) canvas.removeEventListener('mouseleave', _leaveHandler);

    // Create or reuse tooltip element
    let tooltip = canvas.parentElement.querySelector('.chart-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        color: #f1f5f9;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s;
        z-index: 10;
        white-space: nowrap;
      `;
      canvas.parentElement.style.position = 'relative';
      canvas.parentElement.appendChild(tooltip);
    }

    _moveHandler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;

      let closest = null;
      let closestDist = Infinity;

      points.forEach(p => {
        const dist = Math.abs(mx - p.x);
        if (dist < closestDist) {
          closestDist = dist;
          closest = p;
        }
      });

      if (closest && closestDist < 40) {
        const inc = KostFinance.formatRupiah(closest.data.income);
        const exp = KostFinance.formatRupiah(closest.data.expense);
        tooltip.innerHTML = `
          <div style="font-weight:600; margin-bottom:4px;">${closest.data.label}</div>
          <div style="color:#22c55e;">● Pemasukan: ${inc}</div>
          <div style="color:#ef4444;">○ Pengeluaran: ${exp}</div>
        `;
        tooltip.style.opacity = '1';

        let tx = closest.x - 60;
        if (tx < 0) tx = 0;
        if (tx > width - 160) tx = width - 160;
        tooltip.style.left = tx + 'px';
        tooltip.style.top = (Math.min(closest.incomeY, closest.expenseY) - 70) + 'px';
      } else {
        tooltip.style.opacity = '0';
      }
    };

    _leaveHandler = () => {
      tooltip.style.opacity = '0';
    };

    canvas.addEventListener('mousemove', _moveHandler);
    canvas.addEventListener('mouseleave', _leaveHandler);
  }

  return { render };
})();
