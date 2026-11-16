/**
 * NabungYuk! — Storage & Data Management Module
 * Mengelola LocalStorage, data demo otomatis, CRUD target celengan, transaksi, dan ekspor CSV.
 */

const NabungYukStorage = (() => {
  const STORAGE_KEYS = {
    GOALS: "nabungyuk_goals_v2",
    TRANSACTIONS: "nabungyuk_transactions_v2",
    THEME: "nabungyuk_theme_v2",
    INITIALIZED: "nabungyuk_initialized_v2"
  };

  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  }

  function createDemoData() {
    const goals = [
      {
        id: "goal-1",
        icon: "🛡️",
        title: "Dana Darurat 6 Bulan",
        targetAmount: 15000000,
        currentAmount: 11250000,
        deadline: getRelativeDate(90),
        note: "Prioritas utama keamanan finansial pribadi",
        createdAt: getRelativeDate(-45)
      },
      {
        id: "goal-2",
        icon: "💻",
        title: "Laptop Produktivitas & Coding",
        targetAmount: 12000000,
        currentAmount: 7800000,
        deadline: getRelativeDate(60),
        note: "Sisihkan bonus proyek & uang saku mingguan",
        createdAt: getRelativeDate(-30)
      },
      {
        id: "goal-3",
        icon: "✈️",
        title: "Liburan Akhir Tahun",
        targetAmount: 5000000,
        currentAmount: 5000000,
        deadline: getRelativeDate(15),
        note: "Tiket, penginapan, dan kuliner lokal",
        createdAt: getRelativeDate(-60)
      }
    ];

    const transactions = [
      {
        id: "tx-101",
        goalId: "goal-1",
        goalTitle: "Dana Darurat 6 Bulan",
        type: "deposit",
        amount: 1500000,
        date: getRelativeDate(-6),
        note: "Setoran rutin awal bulan"
      },
      {
        id: "tx-102",
        goalId: "goal-2",
        goalTitle: "Laptop Produktivitas & Coding",
        type: "deposit",
        amount: 800000,
        date: getRelativeDate(-5),
        note: "Hasil freelance desain UI"
      },
      {
        id: "tx-103",
        goalId: "goal-1",
        goalTitle: "Dana Darurat 6 Bulan",
        type: "withdraw",
        amount: 250000,
        date: getRelativeDate(-4),
        note: "Biaya servis darurat"
      },
      {
        id: "tx-104",
        goalId: "goal-3",
        goalTitle: "Liburan Akhir Tahun",
        type: "deposit",
        amount: 1000000,
        date: getRelativeDate(-3),
        note: "Pelunasan target liburan"
      },
      {
        id: "tx-105",
        goalId: "goal-2",
        goalTitle: "Laptop Produktivitas & Coding",
        type: "deposit",
        amount: 500000,
        date: getRelativeDate(-1),
        note: "Nabung mingguan"
      },
      {
        id: "tx-106",
        goalId: "goal-1",
        goalTitle: "Dana Darurat 6 Bulan",
        type: "deposit",
        amount: 750000,
        date: getRelativeDate(0),
        note: "Setoran konsisten hari ini"
      }
    ];

    saveGoals(goals);
    saveTransactions(transactions);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    return { goals, transactions };
  }

  function init() {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      return createDemoData();
    }
    return {
      goals: getGoals(),
      transactions: getTransactions()
    };
  }

  function getGoals() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.GOALS)) || [];
    } catch {
      return [];
    }
  }

  function saveGoals(goals) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }

  function getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
    } catch {
      return [];
    }
  }

  function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  function addGoal(goalData) {
    const goals = getGoals();
    const newGoal = {
      id: "goal-" + Date.now(),
      icon: goalData.icon || "💰",
      title: goalData.title.trim(),
      targetAmount: Number(goalData.targetAmount),
      currentAmount: Number(goalData.currentAmount) || 0,
      deadline: goalData.deadline,
      note: (goalData.note || "").trim(),
      createdAt: getRelativeDate(0)
    };
    goals.unshift(newGoal);
    saveGoals(goals);

    if (newGoal.currentAmount > 0) {
      recordTransaction(
        {
          goalId: newGoal.id,
          goalTitle: newGoal.title,
          type: "deposit",
          amount: newGoal.currentAmount,
          date: getRelativeDate(0),
          note: "Saldo awal pembukaan target"
        },
        false
      );
    }
    return newGoal;
  }

  function updateGoal(id, updatedFields) {
    const goals = getGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) return null;

    goals[idx] = {
      ...goals[idx],
      icon: updatedFields.icon,
      title: updatedFields.title.trim(),
      targetAmount: Number(updatedFields.targetAmount),
      currentAmount: Number(updatedFields.currentAmount),
      deadline: updatedFields.deadline,
      note: (updatedFields.note || "").trim()
    };
    saveGoals(goals);
    return goals[idx];
  }

  function deleteGoal(id) {
    const goals = getGoals().filter((g) => g.id !== id);
    const transactions = getTransactions().filter((t) => t.goalId !== id);
    saveGoals(goals);
    saveTransactions(transactions);
  }

  function recordTransaction(txData, updateBalance = true) {
    const goals = getGoals();
    const goal = goals.find((g) => g.id === txData.goalId);
    if (!goal) throw new Error("Target celengan tidak ditemukan.");

    const amount = Number(txData.amount);
    if (amount <= 0) throw new Error("Nominal transaksi harus lebih dari Rp 0.");

    const wasCompleted = goal.currentAmount >= goal.targetAmount;

    if (updateBalance) {
      if (txData.type === "withdraw") {
        if (amount > goal.currentAmount) {
          throw new Error("Saldo celengan tidak mencukupi untuk penarikan ini.");
        }
        goal.currentAmount -= amount;
      } else {
        goal.currentAmount += amount;
      }
      saveGoals(goals);
    }

    const transactions = getTransactions();
    const newTx = {
      id: "tx-" + Date.now(),
      goalId: goal.id,
      goalTitle: goal.title,
      type: txData.type,
      amount: amount,
      date: txData.date || getRelativeDate(0),
      note: (txData.note || (txData.type === "deposit" ? "Setor tabungan" : "Penarikan dana")).trim()
    };
    transactions.unshift(newTx);
    saveTransactions(transactions);

    const justCompleted = !wasCompleted && goal.currentAmount >= goal.targetAmount;
    return { transaction: newTx, goal, justCompleted };
  }

  function resetAll() {
    saveGoals([]);
    saveTransactions([]);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
  }

  function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  }

  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  function exportCSV() {
    const transactions = getTransactions();
    if (!transactions.length) return false;

    const headers = ["ID Transaksi", "Tanggal", "Target Celengan", "Jenis", "Nominal (Rp)", "Catatan"];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date,
      '"' + tx.goalTitle.replace(/"/g, '""') + '"',
      tx.type === "deposit" ? "Setor Dana" : "Tarik Dana",
      tx.type === "deposit" ? tx.amount : -tx.amount,
      '"' + (tx.note || "").replace(/"/g, '""') + '"'
    ]);

    const csvLines = [headers.join(",")].concat(rows.map((r) => r.join(",")));
    const csvString = csvLines.join("\r\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Laporan_NabungYuk_" + getRelativeDate(0) + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  return {
    init,
    createDemoData,
    getGoals,
    getTransactions,
    addGoal,
    updateGoal,
    deleteGoal,
    recordTransaction,
    resetAll,
    getTheme,
    setTheme,
    exportCSV,
    getRelativeDate
  };
})();
