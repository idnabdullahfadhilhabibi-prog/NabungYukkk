/**
 * NabungYuk! — Interactive Charts Module (Chart.js)
 * Menampilkan grafik Tren Setor vs Tarik Dana dan Distribusi Saldo Celengan.
 */

const NabungYukCharts = (() => {
  let cashflowChartInstance = null;
  let distributionChartInstance = null;

  function isDarkMode() {
    return document.documentElement.classList.contains("dark");
  }

  function getThemeColors() {
    const dark = isDarkMode();
    return {
      textColor: dark ? "#cbd5e1" : "#475569",
      gridColor: dark ? "rgba(148, 163, 184, 0.1)" : "rgba(15, 23, 42, 0.06)",
      tooltipBg: dark ? "#1e293b" : "#0f172a",
      borderColor: dark ? "#0f172a" : "#ffffff"
    };
  }

  function formatCompactIDR(value) {
    if (value >= 1000000) return "Rp " + (value / 1000000).toFixed(1) + " jt";
    if (value >= 1000) return "Rp " + Math.round(value / 1000) + " rb";
    return "Rp " + value;
  }

  function renderCashflowChart(transactions) {
    const ctx = document.getElementById("cashflowChart");
    if (!ctx || typeof Chart === "undefined") return;

    const colors = getThemeColors();
    const dateMap = {};
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((tx) => {
      if (!dateMap[tx.date]) {
        dateMap[tx.date] = { deposit: 0, withdraw: 0 };
      }
      if (tx.type === "deposit") dateMap[tx.date].deposit += tx.amount;
      else dateMap[tx.date].withdraw += tx.amount;
    });

    const recentDates = Object.keys(dateMap).slice(-7);
    const labels = recentDates.length
      ? recentDates.map((d) => {
          const p = d.split("-");
          return p[2] + "/" + p[1];
        })
      : ["Belum ada data"];

    const depositData = recentDates.length ? recentDates.map((d) => dateMap[d].deposit) : [0];
    const withdrawData = recentDates.length ? recentDates.map((d) => dateMap[d].withdraw) : [0];

    if (cashflowChartInstance) {
      cashflowChartInstance.destroy();
    }

    cashflowChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Setor Dana",
            data: depositData,
            backgroundColor: "#10b981",
            borderRadius: 8,
            barPercentage: 0.6
          },
          {
            label: "Tarik Dana",
            data: withdrawData,
            backgroundColor: "#f43f5e",
            borderRadius: 8,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: colors.textColor,
              usePointStyle: true,
              boxWidth: 8,
              font: { family: '"Plus Jakarta Sans", sans-serif', weight: "600", size: 11 }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context) =>
                context.dataset.label + ": Rp " + Number(context.raw).toLocaleString("id-ID")
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: colors.textColor,
              font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
              callback: (val) => formatCompactIDR(val)
            }
          }
        }
      }
    });
  }

  function renderDistributionChart(goals) {
    const ctx = document.getElementById("distributionChart");
    if (!ctx || typeof Chart === "undefined") return;

    const colors = getThemeColors();
    const withBalance = goals.filter((g) => g.currentAmount > 0);

    const labels = withBalance.length ? withBalance.map((g) => g.title) : ["Belum ada saldo"];
    const values = withBalance.length ? withBalance.map((g) => g.currentAmount) : [1];
    const palette = withBalance.length
      ? ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"]
      : ["#cbd5e1"];

    if (distributionChartInstance) {
      distributionChartInstance.destroy();
    }

    distributionChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: palette,
            borderWidth: 3,
            borderColor: colors.borderColor,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: colors.textColor,
              usePointStyle: true,
              padding: 14,
              font: { family: '"Plus Jakarta Sans", sans-serif', weight: "600", size: 11 }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            padding: 10,
            cornerRadius: 10,
            callbacks: {
              label: (context) => {
                if (!withBalance.length) return "Saldo masih Rp 0";
                return context.label + ": Rp " + Number(context.raw).toLocaleString("id-ID");
              }
            }
          }
        }
      }
    });
  }

  function refreshAll(goals, transactions) {
    renderCashflowChart(transactions);
    renderDistributionChart(goals);
  }

  return {
    refreshAll
  };
})();
