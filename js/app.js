/**
 * NabungYuk! — Main UI Controller & Savings Simulator
 * Mengatur render DOM, modal CRUD, transaksi, simulasi kalkulator, konfeti, & Lucide icons.
 */

const NabungYukApp = (() => {
  let state = {
    goals: [],
    transactions: [],
    goalFilter: "all",
    goalSort: "newest",
    goalSearch: "",
    txTypeFilter: "all",
    txSearch: "",
    simMode: "amount",
    lastSimulation: null
  };

  function formatIDR(num) {
    return "Rp " + Math.round(Number(num) || 0).toLocaleString("id-ID");
  }

  function getDaysRemaining(deadlineStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  function refreshIcons() {
    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function showToast(message, isError = false) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className =
      "toast-item flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold " +
      (isError
        ? "bg-rose-600 text-white border-rose-500"
        : "bg-slate-900 dark:bg-emerald-600 text-white border-slate-800 dark:border-emerald-500");
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function triggerCelebration(goalTitle) {
    document.getElementById("celebrationMessage").textContent =
      'Luar biasa! Target "' + goalTitle + '" telah terkumpul 100%. Konsistensi menabungmu membuahkan hasil!';
    openModal("celebrationModal");

    if (typeof confetti === "function") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }

  function openModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
    refreshIcons();
  }

  function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function refreshUI() {
    state.goals = NabungYukStorage.getGoals();
    state.transactions = NabungYukStorage.getTransactions();

    renderKPIs();
    renderGoals();
    renderTransactions();
    NabungYukCharts.refreshAll(state.goals, state.transactions);
    refreshIcons();
  }

  function renderKPIs() {
    const totalSaved = state.goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalTarget = state.goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const remaining = Math.max(0, totalTarget - totalSaved);
    const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    const completedCount = state.goals.filter((g) => g.currentAmount >= g.targetAmount).length;
    const activeGoals = state.goals.filter((g) => g.currentAmount < g.targetAmount);

    let dailySuggestion = 0;
    activeGoals.forEach((g) => {
      const rem = Math.max(0, g.targetAmount - g.currentAmount);
      const days = Math.max(1, getDaysRemaining(g.deadline));
      dailySuggestion += rem / days;
    });

    const dailyRounded = Math.ceil(dailySuggestion);
    const monthlyRounded = dailyRounded * 30;

    document.getElementById("kpiTotalSaved").textContent = formatIDR(totalSaved);
    document.getElementById("kpiOverallPctBadge").textContent = overallPct + "%";
    document.getElementById("kpiOverallProgressBar").style.width = overallPct + "%";

    document.getElementById("kpiTotalTarget").textContent = formatIDR(totalTarget);
    document.getElementById("kpiRemainingText").innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span><span>Sisa ' +
      formatIDR(remaining) +
      " lagi untuk dicapai</span>";

    document.getElementById("kpiCompletedGoals").textContent = completedCount + " / " + state.goals.length;
    document.getElementById("kpiActiveGoalsText").innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>' +
      activeGoals.length +
      " celengan aktif berjalan</span>";

    document.getElementById("kpiDailySuggestion").textContent = formatIDR(dailyRounded);
    document.getElementById("kpiMonthlySuggestionText").innerHTML =
      '<span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span><span>Setara ' +
      formatIDR(monthlyRounded) +
      " / bulan</span>";

    document.getElementById("goalCountBadge").textContent = state.goals.length;
  }

  function renderGoals() {
    const container = document.getElementById("goalsContainer");

    let filtered = state.goals.filter((g) => {
      const isDone = g.currentAmount >= g.targetAmount;
      if (state.goalFilter === "active" && isDone) return false;
      if (state.goalFilter === "completed" && !isDone) return false;
      if (state.goalSearch && !g.title.toLowerCase().includes(state.goalSearch.toLowerCase())) {
        return false;
      }
      return true;
    });

    if (state.goalSort === "progress") {
      filtered.sort((a, b) => b.currentAmount / (b.targetAmount || 1) - a.currentAmount / (a.targetAmount || 1));
    } else if (state.goalSort === "deadline") {
      filtered.sort((a, b) => a.deadline.localeCompare(b.deadline));
    }

    if (!filtered.length) {
      container.innerHTML = `
        <div class="col-span-full rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-3">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <i data-lucide="piggy-bank" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">Belum ada target celengan yang sesuai</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">Buat target impian pertamamu sekarang atau ubah filter pencarian di atas.</p>
          <button type="button" onclick="document.getElementById('btnOpenGoalModal').click()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Target Baru</span>
          </button>
        </div>
      `;
      refreshIcons();
      return;
    }

    container.innerHTML = filtered
      .map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
        const isDone = g.currentAmount >= g.targetAmount;
        const daysLeft = getDaysRemaining(g.deadline);
        const remaining = Math.max(0, g.targetAmount - g.currentAmount);
        const dailyNeeded = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining;

        let deadlineBadge = "";
        if (isDone) {
          deadlineBadge = '<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ Selesai</span>';
        } else if (daysLeft > 7) {
          deadlineBadge = '<span class="text-[11px] text-slate-500 dark:text-slate-400">' + daysLeft + " hari lagi (" + g.deadline + ")</span>";
        } else if (daysLeft >= 0) {
          deadlineBadge = '<span class="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Sisa ' + daysLeft + " hari! (" + g.deadline + ")</span>";
        } else {
          deadlineBadge = '<span class="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Terlewat ' + Math.abs(daysLeft) + " hari</span>";
        }

        return `
          <article class="rounded-2xl bg-white dark:bg-slate-900 border ${isDone ? "border-emerald-400/70 dark:border-emerald-500/40" : "border-slate-200/80 dark:border-slate-800"} p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div class="space-y-4">
              <!-- Top Header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                    ${g.icon}
                  </div>
                  <div>
                    <h3 class="font-bold text-base text-slate-900 dark:text-white leading-snug">${escapeHTML(g.title)}</h3>
                    <div class="mt-0.5 flex items-center gap-1">
                      <i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i>
                      ${deadlineBadge}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button type="button" data-edit-goal="${g.id}" title="Edit Target" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                  </button>
                  <button type="button" data-delete-goal="${g.id}" title="Hapus Target" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <!-- Amounts & Progress Bar -->
              <div>
                <div class="flex items-baseline justify-between mb-1.5">
                  <span class="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">${formatIDR(g.currentAmount)}</span>
                  <span class="text-xs font-semibold text-slate-400">dari ${formatIDR(g.targetAmount)}</span>
                </div>

                <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>

                <div class="flex items-center justify-between text-xs mt-2">
                  <span class="font-bold text-slate-700 dark:text-slate-300">${pct}% terkumpul</span>
                  ${
                    isDone
                      ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">🎉 Tercapai 100%</span>'
                      : '<span class="text-slate-500 dark:text-slate-400">Saran: <strong class="text-slate-800 dark:text-slate-200">' + formatIDR(dailyNeeded) + "/hari</strong></span>"
                  }
                </div>
              </div>

              ${
                g.note
                  ? '<div class="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">💡 ' +
                    escapeHTML(g.note) +
                    "</div>"
                  : ""
              }
            </div>

            <!-- Action Footer -->
            <div class="flex items-center gap-2 pt-1">
              <button type="button" data-tx-goal="${g.id}" data-tx-type="deposit" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-1.5">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>Setor Dana</span>
              </button>
              <button type="button" data-tx-goal="${g.id}" data-tx-type="withdraw" class="py-2.5 px-3.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Tarik
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    refreshIcons();
  }

  function renderTransactions() {
    const tbody = document.getElementById("txTableBody");
    const emptyEl = document.getElementById("txEmptyState");

    const filtered = state.transactions.filter((tx) => {
      if (state.txTypeFilter !== "all" && tx.type !== state.txTypeFilter) return false;
      if (state.txSearch) {
        const q = state.txSearch.toLowerCase();
        const matchGoal = tx.goalTitle.toLowerCase().includes(q);
        const matchNote = (tx.note || "").toLowerCase().includes(q);
        if (!matchGoal && !matchNote) return false;
      }
      return true;
    });

    if (!filtered.length) {
      tbody.innerHTML = "";
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    tbody.innerHTML = filtered
      .map((tx) => {
        const isDeposit = tx.type === "deposit";
        return `
          <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
            <td class="py-3.5 px-5 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">${tx.date}</td>
            <td class="py-3.5 px-5 font-bold text-slate-800 dark:text-slate-100">${escapeHTML(tx.goalTitle)}</td>
            <td class="py-3.5 px-5 whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isDeposit
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
              }">
                ${isDeposit ? "Setor Dana" : "Tarik Dana"}
              </span>
            </td>
            <td class="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-300">${escapeHTML(tx.note || "-")}</td>
            <td class="py-3.5 px-5 text-right font-extrabold whitespace-nowrap ${
              isDeposit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }">
              ${isDeposit ? "+" : "-"} ${formatIDR(tx.amount)}
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function openGoalFormModal(goalToEdit = null, prefill = null) {
    const form = document.getElementById("goalForm");
    form.reset();

    if (goalToEdit) {
      document.getElementById("goalModalTitle").textContent = "Edit Target Celengan";
      document.getElementById("goalId").value = goalToEdit.id;
      document.getElementById("goalIcon").value = goalToEdit.icon;
      document.getElementById("goalTitle").value = goalToEdit.title;
      document.getElementById("goalTargetAmount").value = goalToEdit.targetAmount;
      document.getElementById("goalCurrentAmount").value = goalToEdit.currentAmount;
      document.getElementById("goalDeadline").value = goalToEdit.deadline;
      document.getElementById("goalNote").value = goalToEdit.note || "";
    } else {
      document.getElementById("goalModalTitle").textContent = "Buat Target Celengan Baru";
      document.getElementById("goalId").value = "";
      document.getElementById("goalDeadline").value = NabungYukStorage.getRelativeDate(90);

      if (prefill) {
        document.getElementById("goalTitle").value = prefill.title || "";
        document.getElementById("goalTargetAmount").value = prefill.targetAmount || "";
        document.getElementById("goalCurrentAmount").value = prefill.currentAmount || 0;
        if (prefill.deadline) document.getElementById("goalDeadline").value = prefill.deadline;
        document.getElementById("goalNote").value = prefill.note || "";
      }
    }

    openModal("goalModal");
  }

  function openTransactionModal(preselectedGoalId = null, defaultType = "deposit") {
    if (!state.goals.length) {
      showToast("Buat target celengan terlebih dahulu sebelum mencatat transaksi.", true);
      openGoalFormModal();
      return;
    }

    const select = document.getElementById("txGoalSelect");
    select.innerHTML = state.goals
      .map((g) => '<option value="' + g.id + '">' + g.icon + " " + escapeHTML(g.title) + "</option>")
      .join("");

    if (preselectedGoalId) {
      select.value = preselectedGoalId;
    }

    document.querySelectorAll('input[name="txType"]').forEach((r) => {
      r.checked = r.value === defaultType;
    });

    document.getElementById("txAmount").value = "";
    document.getElementById("txNote").value = "";
    document.getElementById("txDate").value = NabungYukStorage.getRelativeDate(0);

    updateTxBalanceHint();
    openModal("txModal");
  }

  function updateTxBalanceHint() {
    const goalId = document.getElementById("txGoalSelect").value;
    const goal = state.goals.find((g) => g.id === goalId);
    if (goal) {
      const rem = Math.max(0, goal.targetAmount - goal.currentAmount);
      document.getElementById("txGoalBalanceHint").textContent =
        "Saldo terkumpul: " + formatIDR(goal.currentAmount) + " • Sisa target: " + formatIDR(rem);
    }
  }

  function calculateSimulation() {
    const goalName = document.getElementById("simGoalName").value.trim() || "Target Impian";
    const target = Math.max(0, Number(document.getElementById("simTargetAmount").value) || 0);
    const initial = Math.max(0, Number(document.getElementById("simInitialAmount").value) || 0);
    const needed = Math.max(0, target - initial);

    if (state.simMode === "amount") {
      const durationVal = Math.max(1, Number(document.getElementById("simDurationValue").value) || 1);
      const unit = document.getElementById("simDurationUnit").value;

      let totalDays = durationVal;
      let unitLabel = "hari";
      if (unit === "weeks") {
        totalDays = durationVal * 7;
        unitLabel = "minggu";
      } else if (unit === "months") {
        totalDays = durationVal * 30;
        unitLabel = "bulan";
      }

      const perPeriod = Math.ceil(needed / durationVal);
      const daily = Math.ceil(needed / totalDays);
      const weekly = Math.ceil(daily * 7);
      const estDate = NabungYukStorage.getRelativeDate(totalDays);

      document.getElementById("simResultHeadline").textContent = formatIDR(perPeriod) + " / " + unitLabel;
      document.getElementById("simResultSubtext").textContent =
        "Untuk mengumpulkan kekurangan " + formatIDR(needed) + " dalam " + durationVal + " " + unitLabel + ".";
      document.getElementById("simDailyBreakdown").textContent = formatIDR(daily);
      document.getElementById("simWeeklyBreakdown").textContent = formatIDR(weekly);
      document.getElementById("simEstimatedDate").textContent = estDate;

      state.lastSimulation = {
        title: goalName,
        targetAmount: target,
        currentAmount: initial,
        deadline: estDate,
        note: "Rencana simulasi: " + formatIDR(perPeriod) + "/" + unitLabel
      };
    } else {
      const routineAmt = Math.max(1000, Number(document.getElementById("simRoutineAmount").value) || 1000);
      const freq = document.getElementById("simRoutineFreq").value;

      const periodsNeeded = needed > 0 ? Math.ceil(needed / routineAmt) : 0;
      let totalDays = periodsNeeded;
      let freqLabel = "hari";
      let daily = routineAmt;

      if (freq === "weekly") {
        totalDays = periodsNeeded * 7;
        freqLabel = "minggu";
        daily = Math.ceil(routineAmt / 7);
      } else if (freq === "monthly") {
        totalDays = periodsNeeded * 30;
        freqLabel = "bulan";
        daily = Math.ceil(routineAmt / 30);
      }

      const weekly = Math.ceil(daily * 7);
      const estDate = NabungYukStorage.getRelativeDate(Math.max(1, totalDays));

      document.getElementById("simResultHeadline").textContent =
        periodsNeeded === 0 ? "Target Sudah Tercapai!" : periodsNeeded + " " + freqLabel + " (" + totalDays + " hari)";
      document.getElementById("simResultSubtext").textContent =
        "Dengan setoran rutin " + formatIDR(routineAmt) + " per " + freqLabel + " untuk sisa " + formatIDR(needed) + ".";
      document.getElementById("simDailyBreakdown").textContent = formatIDR(daily);
      document.getElementById("simWeeklyBreakdown").textContent = formatIDR(weekly);
      document.getElementById("simEstimatedDate").textContent = estDate;

      state.lastSimulation = {
        title: goalName,
        targetAmount: target,
        currentAmount: initial,
        deadline: estDate,
        note: "Setoran rutin " + formatIDR(routineAmt) + "/" + freqLabel
      };
    }
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    const moonIcon = document.getElementById("themeIconMoon");
    const sunIcon = document.getElementById("themeIconSun");

    if (theme === "dark") {
      html.classList.add("dark");
      moonIcon.classList.add("hidden");
      sunIcon.classList.remove("hidden");
    } else {
      html.classList.remove("dark");
      moonIcon.classList.remove("hidden");
      sunIcon.classList.add("hidden");
    }

    NabungYukStorage.setTheme(theme);
    NabungYukCharts.refreshAll(state.goals, state.transactions);
  }

  function bindEvents() {
    // Theme toggle
    document.getElementById("btnThemeToggle").addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains("dark");
      applyTheme(isDark ? "light" : "dark");
    });

    // Demo Data & Reset
    document.getElementById("btnDemoData").addEventListener("click", () => {
      NabungYukStorage.createDemoData();
      refreshUI();
      showToast("✨ Data demo berhasil dimuat ulang!");
    });

    document.getElementById("btnResetData").addEventListener("click", () => {
      if (confirm("Hapus seluruh target celengan dan riwayat transaksi?")) {
        NabungYukStorage.resetAll();
        refreshUI();
        showToast("🗑️ Seluruh data berhasil dikosongkan.");
      }
    });

    // Modals open/close
    document.getElementById("btnOpenGoalModal").addEventListener("click", () => openGoalFormModal());
    document.getElementById("btnQuickDepositHero").addEventListener("click", () => openTransactionModal(null, "deposit"));
    document.getElementById("btnQuickWithdrawHero").addEventListener("click", () => openTransactionModal(null, "withdraw"));

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close-modal")));
    });

    // Goal Form Submit
    document.getElementById("goalForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("goalId").value;
      const payload = {
        icon: document.getElementById("goalIcon").value,
        title: document.getElementById("goalTitle").value,
        targetAmount: document.getElementById("goalTargetAmount").value,
        currentAmount: document.getElementById("goalCurrentAmount").value,
        deadline: document.getElementById("goalDeadline").value,
        note: document.getElementById("goalNote").value
      };

      if (id) {
        NabungYukStorage.updateGoal(id, payload);
        showToast("✅ Target celengan berhasil diperbarui!");
      } else {
        const created = NabungYukStorage.addGoal(payload);
        showToast("🎯 Target celengan baru berhasil dibuat!");
        if (created.currentAmount >= created.targetAmount) {
          triggerCelebration(created.title);
        }
      }

      closeModal("goalModal");
      refreshUI();
    });

    // Goal Card Delegated Actions
    document.getElementById("goalsContainer").addEventListener("click", (e) => {
      const editBtn = e.target.closest("[data-edit-goal]");
      if (editBtn) {
        const goal = state.goals.find((g) => g.id === editBtn.getAttribute("data-edit-goal"));
        if (goal) openGoalFormModal(goal);
        return;
      }

      const delBtn = e.target.closest("[data-delete-goal]");
      if (delBtn) {
        const id = delBtn.getAttribute("data-delete-goal");
        if (confirm("Hapus target celengan ini beserta riwayat transaksinya?")) {
          NabungYukStorage.deleteGoal(id);
          refreshUI();
          showToast("🗑️ Target celengan dihapus.");
        }
        return;
      }

      const txBtn = e.target.closest("[data-tx-goal]");
      if (txBtn) {
        openTransactionModal(txBtn.getAttribute("data-tx-goal"), txBtn.getAttribute("data-tx-type"));
      }
    });

    // Transaction Modal Events
    document.getElementById("txGoalSelect").addEventListener("change", updateTxBalanceHint);

    document.querySelectorAll("[data-quick-amount]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const input = document.getElementById("txAmount");
        const addVal = Number(chip.getAttribute("data-quick-amount"));
        input.value = (Number(input.value) || 0) + addVal;
      });
    });

    document.getElementById("btnFillRemaining").addEventListener("click", () => {
      const goalId = document.getElementById("txGoalSelect").value;
      const goal = state.goals.find((g) => g.id === goalId);
      if (goal) {
        const rem = Math.max(0, goal.targetAmount - goal.currentAmount);
        document.getElementById("txAmount").value = rem > 0 ? rem : 50000;
      }
    });

    document.getElementById("txForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const goalId = document.getElementById("txGoalSelect").value;
      const type = document.querySelector('input[name="txType"]:checked').value;
      const amount = Number(document.getElementById("txAmount").value);
      const date = document.getElementById("txDate").value;
      const note = document.getElementById("txNote").value;

      try {
        const result = NabungYukStorage.recordTransaction({
          goalId,
          type,
          amount,
          date,
          note
        });
        closeModal("txModal");
        refreshUI();
        showToast(
          type === "deposit"
            ? "💸 Berhasil setor " + formatIDR(amount) + "!"
            : "📤 Penarikan " + formatIDR(amount) + " dicatat."
        );
        if (result.justCompleted) {
          triggerCelebration(result.goal.title);
        }
      } catch (err) {
        showToast(err.message, true);
      }
    });

    // Goal Filters, Sort & Search
    document.querySelectorAll("[data-goal-filter]").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll("[data-goal-filter]").forEach((t) => {
          t.classList.remove("active");
          t.classList.add("text-slate-600", "dark:text-slate-400");
        });
        tab.classList.add("active");
        tab.classList.remove("text-slate-600", "dark:text-slate-400");
        state.goalFilter = tab.getAttribute("data-goal-filter");
        renderGoals();
      });
    });

    document.getElementById("sortGoalSelect").addEventListener("change", (e) => {
      state.goalSort = e.target.value;
      renderGoals();
    });

    document.getElementById("searchGoalInput").addEventListener("input", (e) => {
      state.goalSearch = e.target.value;
      renderGoals();
    });

    // Transaction Filters & Export CSV
    document.getElementById("filterTxType").addEventListener("change", (e) => {
      state.txTypeFilter = e.target.value;
      renderTransactions();
    });

    document.getElementById("searchTxInput").addEventListener("input", (e) => {
      state.txSearch = e.target.value;
      renderTransactions();
    });

    document.getElementById("btnExportCSV").addEventListener("click", () => {
      const ok = NabungYukStorage.exportCSV();
      if (ok) showToast("📥 Laporan CSV berhasil diunduh!");
      else showToast("Belum ada transaksi untuk diekspor.", true);
    });

    // Simulator Mode & Inputs
    document.querySelectorAll("[data-sim-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-sim-mode]").forEach((b) => {
          b.classList.remove("active");
          b.classList.add("text-slate-600", "dark:text-slate-300");
        });
        btn.classList.add("active");
        btn.classList.remove("text-slate-600", "dark:text-slate-300");
        state.simMode = btn.getAttribute("data-sim-mode");

        if (state.simMode === "amount") {
          document.getElementById("simDurationGroup").classList.remove("hidden");
          document.getElementById("simDepositGroup").classList.add("hidden");
        } else {
          document.getElementById("simDurationGroup").classList.add("hidden");
          document.getElementById("simDepositGroup").classList.remove("hidden");
        }
        calculateSimulation();
      });
    });

    document.getElementById("simulatorForm").addEventListener("input", calculateSimulation);

    document.getElementById("btnConvertSimToGoal").addEventListener("click", () => {
      if (!state.lastSimulation) calculateSimulation();
      openGoalFormModal(null, state.lastSimulation);
    });

    // Active nav pill on click
    document.querySelectorAll(".nav-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".nav-pill").forEach((p) => {
          p.classList.remove("active");
          p.classList.add("text-slate-600", "dark:text-slate-300");
        });
        pill.classList.add("active");
        pill.classList.remove("text-slate-600", "dark:text-slate-300");
      });
    });
  }

  function init() {
    NabungYukStorage.init();
    const savedTheme = NabungYukStorage.getTheme();
    applyTheme(savedTheme);

    bindEvents();
    calculateSimulation();
    refreshUI();
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", NabungYukApp.init);
