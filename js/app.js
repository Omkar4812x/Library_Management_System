// ============================================================
//  LibraX – app.js  (Complete rewrite – MySQL + PHP backend)
//  Features: CRUD, Issue/Return, Fine Payment, Reservation,
//            CSV Export, Notifications, Dark/Light Mode,
//            Member History, Global Search
// ============================================================
"use strict";

// ============================================================
//  THEME
// ============================================================
function initTheme() {
  const saved = localStorage.getItem("librax_theme") || "dark";
  applyTheme(saved);
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("librax_theme", theme);
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ============================================================
//  AUTH
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("loginBtn");
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    const res = await API.auth.login(username, password);
    if (res.success) {
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      initApp();
    } else {
      showToast(res.error || "Login failed", "error");
    }
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML =
      '<span>Sign In</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  }
}

async function handleLogout() {
  stopTopbarClock();
  await API.auth.logout().catch(() => {});
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
}

// ============================================================
//  INIT
// ============================================================
let topbarClockTimer = null;

async function initApp() {
  setTopbarDate();
  startTopbarClock();
  setDefaultDueDate();
  setReturnDate();
  await showPage("dashboard");
}

function setTopbarDate() {
  const el = document.getElementById("topbarDate");
  if (!el) return;

  const now = new Date();
  el.textContent = now.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function startTopbarClock() {
  if (topbarClockTimer) clearInterval(topbarClockTimer);
  setTopbarDate();
  topbarClockTimer = setInterval(() => {
    setTopbarDate();
  }, 1000);
}

function stopTopbarClock() {
  if (topbarClockTimer) {
    clearInterval(topbarClockTimer);
    topbarClockTimer = null;
  }
}

function setDefaultDueDate() {
  const inp = document.getElementById("issueDueDate");
  if (!inp) return;
  const d = new Date();
  d.setDate(d.getDate() + 14);
  inp.value = d.toISOString().split("T")[0];
  inp.min = new Date(Date.now() + 86400000).toISOString().split("T")[0];
}
function setReturnDate() {
  const inp = document.getElementById("returnDate");
  if (inp) inp.value = new Date().toLocaleDateString("en-IN");
}

// ============================================================
//  LOADING OVERLAY
// ============================================================
function setLoading(show) {
  let ov = document.getElementById("loadingOverlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "loadingOverlay";
    ov.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(ov);
  }
  ov.style.display = show ? "flex" : "none";
}

// ============================================================
//  NAVIGATION
// ============================================================
let currentPage = "dashboard";
let currentTransFilter = "all";

async function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.classList.add("hidden");
  });
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  const pageEl = document.getElementById("page-" + page);
  const navEl = document.getElementById("nav-" + page);
  if (pageEl) {
    pageEl.classList.remove("hidden");
    pageEl.classList.add("active");
  }
  if (navEl) navEl.classList.add("active");

  const titles = {
    dashboard: "Dashboard",
    books: "Books",
    members: "Members",
    issue: "Issue / Return",
    reports: "Reports",
    reservations: "Reservations",
  };
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = titles[page] || page;
  currentPage = page;

  // Load page data
  try {
    if (page === "dashboard") await loadDashboard();
    if (page === "books") await loadBooks();
    if (page === "members") await loadMembers();
    if (page === "issue") {
      await loadIssueDropdowns();
      setDefaultDueDate();
      await loadTransactions(currentTransFilter);
    }
    if (page === "reports")
      document.getElementById("reportOutput")?.classList.add("hidden");
    if (page === "reservations") await loadReservations();
  } catch (err) {
    showToast(err.message, "error");
  }
  return false;
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
  document.getElementById("mainContent").classList.toggle("expanded");
}

// ============================================================
//  DASHBOARD
// ============================================================
async function loadDashboard() {
  setLoading(true);
  try {
    const res = await API.dashboard.get();
    if (!res.success) throw new Error(res.error);
    const { stats, categories, recent, overdueList, trend } = res;

    // Stats
    animateCounter("statTotalBooksVal", stats.totalBooks);
    animateCounter("statMembersVal", stats.totalMembers);
    animateCounter("statIssuedVal", stats.totalIssued);
    animateCounter("statAvailableVal", stats.totalAvailable);

    // Overdue badge
    const badge = document.getElementById("overdueBadge");
    if (badge) {
      badge.textContent = stats.totalOverdue;
      badge.style.display = stats.totalOverdue > 0 ? "flex" : "none";
    }
    // Fine stats
    setElText("statFineUnpaid", `₹${stats.totalFineUnpaid.toFixed(2)}`);
    setElText("statFineCollected", `₹${stats.totalFineCollected.toFixed(2)}`);

    // Nav badges
    const booksRes = await API.books.list();
    const membersRes = await API.members.list();
    if (booksRes.success)
      document.getElementById("navBooksCount").textContent = booksRes.total;
    if (membersRes.success)
      document.getElementById("navMembersCount").textContent = membersRes.total;

    // Recent transactions
    renderRecentTransactions(recent);

    // Category chart
    renderCategoryChart(categories);

    // Trend chart
    renderTrendChart(trend);

    // Overdue notifications store
    window._overdueList = overdueList;
    renderNotifications(overdueList);
  } finally {
    setLoading(false);
  }
}

function renderRecentTransactions(recent) {
  const tbody = document.getElementById("recentTransactionsTbody");
  if (!tbody) return;
  tbody.innerHTML =
    recent
      .map(
        (t) => `<tr>
    <td style="font-weight:500;max-width:160px">${t.book_title}</td>
    <td>${t.member_name}</td>
    <td>${getStatusBadge(t.status)}</td>
    <td>${formatDate(t.issue_date)}</td>
  </tr>`,
      )
      .join("") ||
    '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No transactions yet</td></tr>';
}

function renderCategoryChart(categories) {
  const container = document.getElementById("categoryChart");
  if (!container) return;
  const maxTotal = Math.max(...categories.map((c) => parseInt(c.total)), 1);
  const colors = [
    "#6366f1",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
  ];
  container.innerHTML = categories
    .map((c, i) => {
      const pct = Math.round((parseInt(c.total) / maxTotal) * 100);
      return `<div class="chart-bar-item">
      <div class="chart-label"><span>${c.category}</span><span>${c.total} copies</span></div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
      </div>
    </div>`;
    })
    .join("");
}

function renderTrendChart(trend) {
  const container = document.getElementById("trendChart");
  if (!container || !trend.length) return;
  const maxCount = Math.max(...trend.map((t) => parseInt(t.issue_count)), 1);
  container.innerHTML = trend
    .map((t) => {
      const h = Math.max(
        8,
        Math.round((parseInt(t.issue_count) / maxCount) * 80),
      );
      return `<div class="trend-bar-wrap" title="${t.issue_count} issues in ${t.month_label}">
      <div class="trend-bar" style="height:${h}px"></div>
      <span class="trend-label">${t.month_label.split(" ")[0]}</span>
    </div>`;
    })
    .join("");
}

function renderNotifications(overdueList) {
  const panel = document.getElementById("notificationPanel");
  if (!panel) return;
  if (!overdueList.length) {
    panel.innerHTML = '<div class="notif-empty">🎉 No overdue books!</div>';
    return;
  }
  panel.innerHTML = overdueList
    .map(
      (o) => `<div class="notif-item">
    <div class="notif-title">${o.book_title}</div>
    <div class="notif-meta">${o.member_name} • ${o.days_overdue} day(s) overdue • ₹${o.fine_amount}</div>
    <div class="notif-meta" style="color:var(--text-muted)">${o.phone}</div>
  </div>`,
    )
    .join("");
}

// ============================================================
//  BOOKS
// ============================================================
async function loadBooks(params = {}) {
  setLoading(true);
  try {
    const res = await API.books.list(params);
    if (!res.success) throw new Error(res.error);
    renderBooksTable(res.data);
    document.getElementById("navBooksCount").textContent = res.total;
  } finally {
    setLoading(false);
  }
}

function renderBooksTable(books) {
  const tbody = document.getElementById("booksTbody");
  const empty = document.getElementById("booksEmpty");
  if (!tbody) return;
  if (!books.length) {
    tbody.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }
  empty?.classList.add("hidden");
  tbody.innerHTML = books
    .map((b) => {
      const statusBadge =
        b.available > 0
          ? `<span class="badge badge-success">Available (${b.available})</span>`
          : `<span class="badge badge-danger">All Issued</span>`;
      return `<tr>
      <td><code class="code-chip chip-primary">${b.id}</code></td>
      <td style="font-weight:600;max-width:180px" title="${b.title}">${b.title}</td>
      <td>${b.author}</td>
      <td><span class="badge badge-neutral">${b.category}</span></td>
      <td style="color:var(--text-muted);font-size:0.78rem">${b.isbn || "—"}</td>
      <td style="text-align:center">${b.copies}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn" onclick="openEditBookModal('${b.id}')" title="Edit">✏️</button>
          <button class="action-btn del" onclick="confirmDeleteBook('${b.id}','${b.title.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>`;
    })
    .join("");
}

async function filterBooks() {
  const cat = document.getElementById("bookCategoryFilter").value;
  const status = document.getElementById("bookStatusFilter").value;
  await loadBooks({ category: cat, status });
}

function openAddBookModal() {
  document.getElementById("bookModalTitle").textContent = "Add New Book";
  document.getElementById("bookSaveBtn").textContent = "Save Book";
  document.getElementById("bookForm").reset();
  document.getElementById("bookEditId").value = "";
  openModal("bookModal");
}

async function openEditBookModal(id) {
  try {
    const res = await API.books.list({ id });
    if (!res.success || !res.data.length) {
      showToast("Book not found", "error");
      return;
    }
    const b = res.data[0];
    document.getElementById("bookModalTitle").textContent = "Edit Book";
    document.getElementById("bookSaveBtn").textContent = "Update Book";
    document.getElementById("bookEditId").value = b.id;
    document.getElementById("bookTitle").value = b.title;
    document.getElementById("bookAuthor").value = b.author;
    document.getElementById("bookISBN").value = b.isbn;
    document.getElementById("bookCategory").value = b.category;
    document.getElementById("bookPublisher").value = b.publisher;
    document.getElementById("bookYear").value = b.year || "";
    document.getElementById("bookCopies").value = b.copies;
    document.getElementById("bookShelf").value = b.shelf;
    openModal("bookModal");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function saveBook(e) {
  e.preventDefault();
  const editId = document.getElementById("bookEditId").value;
  const payload = {
    title: document.getElementById("bookTitle").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    isbn: document.getElementById("bookISBN").value.trim(),
    category: document.getElementById("bookCategory").value,
    publisher: document.getElementById("bookPublisher").value.trim(),
    year: parseInt(document.getElementById("bookYear").value) || null,
    copies: parseInt(document.getElementById("bookCopies").value),
    shelf: document.getElementById("bookShelf").value.trim(),
  };
  try {
    setLoading(true);
    const res = editId
      ? await API.books.update(editId, payload)
      : await API.books.create(payload);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, "success");
    closeModal("bookModal");
    await loadBooks();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

function confirmDeleteBook(id, title) {
  document.getElementById("confirmMessage").textContent =
    `Delete "${title}"? This action cannot be undone.`;
  document.getElementById("confirmDeleteBtn").onclick = () =>
    deleteBook(id, closeModal.bind(null, "confirmModal"));
  openModal("confirmModal");
}
async function deleteBook(id, cb) {
  try {
    setLoading(true);
    const res = await API.books.delete(id);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, "success");
    cb?.();
    await loadBooks();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

// ============================================================
//  MEMBERS
// ============================================================
async function loadMembers(params = {}) {
  setLoading(true);
  try {
    const res = await API.members.list(params);
    if (!res.success) throw new Error(res.error);
    renderMembersTable(res.data);
    document.getElementById("navMembersCount").textContent = res.total;
  } finally {
    setLoading(false);
  }
}

function renderMembersTable(members) {
  const tbody = document.getElementById("membersTbody");
  const empty = document.getElementById("membersEmpty");
  if (!tbody) return;
  if (!members.length) {
    tbody.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }
  empty?.classList.add("hidden");
  tbody.innerHTML = members
    .map((m) => {
      const typeBadge =
        {
          Student: "badge-info",
          Faculty: "badge-warning",
          Staff: "badge-neutral",
        }[m.type] || "badge-neutral";
      const statusBadge =
        m.status === "Active"
          ? '<span class="badge badge-success">Active</span>'
          : '<span class="badge badge-danger">Inactive</span>';
      return `<tr>
      <td><code class="code-chip chip-secondary">${m.id}</code></td>
      <td style="font-weight:600">${m.name}</td>
      <td><span class="badge ${typeBadge}">${m.type}</span></td>
      <td style="color:var(--text-secondary)">${m.email}</td>
      <td style="color:var(--text-secondary)">${m.phone}</td>
      <td style="text-align:center">${m.booksIssued}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn" onclick="viewMemberHistory('${m.id}','${m.name.replace(/'/g, "\\'")}')">📋</button>
          <button class="action-btn" onclick="openEditMemberModal('${m.id}')">✏️</button>
          <button class="action-btn del" onclick="confirmDeleteMember('${m.id}','${m.name.replace(/'/g, "\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>`;
    })
    .join("");
}

async function filterMembers() {
  const type = document.getElementById("memberTypeFilter").value;
  await loadMembers({ type });
}

function openAddMemberModal() {
  document.getElementById("memberModalTitle").textContent = "Add New Member";
  document.getElementById("memberSaveBtn").textContent = "Save Member";
  document.getElementById("memberForm").reset();
  document.getElementById("memberEditId").value = "";
  openModal("memberModal");
}

async function openEditMemberModal(id) {
  try {
    const res = await API.members.list({ id });
    if (!res.success || !res.data.length) {
      showToast("Member not found", "error");
      return;
    }
    const m = res.data[0];
    document.getElementById("memberModalTitle").textContent = "Edit Member";
    document.getElementById("memberSaveBtn").textContent = "Update Member";
    document.getElementById("memberEditId").value = m.id;
    document.getElementById("memberName").value = m.name;
    document.getElementById("memberType").value = m.type;
    document.getElementById("memberEmail").value = m.email;
    document.getElementById("memberPhone").value = m.phone;
    document.getElementById("memberDept").value = m.dept;
    document.getElementById("memberYear").value = m.year || "";
    openModal("memberModal");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function saveMember(e) {
  e.preventDefault();
  const editId = document.getElementById("memberEditId").value;
  const payload = {
    name: document.getElementById("memberName").value.trim(),
    type: document.getElementById("memberType").value,
    email: document.getElementById("memberEmail").value.trim(),
    phone: document.getElementById("memberPhone").value.trim(),
    dept: document.getElementById("memberDept").value.trim(),
    year: parseInt(document.getElementById("memberYear").value) || null,
  };
  try {
    setLoading(true);
    const res = editId
      ? await API.members.update(editId, payload)
      : await API.members.create(payload);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, "success");
    closeModal("memberModal");
    await loadMembers();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

function confirmDeleteMember(id, name) {
  document.getElementById("confirmMessage").textContent =
    `Remove member "${name}"? This action cannot be undone.`;
  document.getElementById("confirmDeleteBtn").onclick = async () => {
    try {
      setLoading(true);
      const res = await API.members.delete(id);
      if (!res.success) throw new Error(res.error);
      showToast(res.message, "success");
      closeModal("confirmModal");
      await loadMembers();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };
  openModal("confirmModal");
}

async function viewMemberHistory(id, name) {
  try {
    setLoading(true);
    const res = await API.members.history(id);
    if (!res.success) throw new Error(res.error);
    const rows = res.data;
    document.getElementById("historyModalTitle").textContent =
      `📋 History – ${name}`;
    const tbody = document.getElementById("historyTbody");
    tbody.innerHTML =
      rows
        .map(
          (r) => `<tr>
      <td><code class="code-chip chip-muted">${r.trans_code}</code></td>
      <td style="font-weight:500">${r.book_title}</td>
      <td>${formatDate(r.issue_date)}</td>
      <td>${formatDate(r.due_date)}</td>
      <td>${r.return_date ? formatDate(r.return_date) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${r.fine_amount > 0 ? `<span style="color:var(--warning)">₹${r.fine_amount}</span>` : "₹0"}</td>
      <td>${getStatusBadge(r.status)}</td>
    </tr>`,
        )
        .join("") ||
      '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No transactions found</td></tr>';
    openModal("historyModal");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

// ============================================================
//  ISSUE / RETURN
// ============================================================
async function loadIssueDropdowns() {
  try {
    const [booksRes, membersRes, txnsRes] = await Promise.all([
      API.books.list({ status: "Available" }),
      API.members.list(),
      API.transactions.list("active"),
    ]);

    const bookSel = document.getElementById("issueBookId");
    if (bookSel && booksRes.success) {
      bookSel.innerHTML =
        '<option value="">-- Choose a Book --</option>' +
        booksRes.data
          .map(
            (b) =>
              `<option value="${b.id}">${b.title} (${b.id}) – ${b.available} avail.</option>`,
          )
          .join("");
    }

    const memSel = document.getElementById("issueMemberId");
    if (memSel && membersRes.success) {
      memSel.innerHTML =
        '<option value="">-- Choose a Member --</option>' +
        membersRes.data
          .filter((m) => m.status === "Active")
          .map(
            (m) =>
              `<option value="${m.id}">${m.name} (${m.id}) – ${m.type}</option>`,
          )
          .join("");
    }

    // Populate Reserve dropdowns (all books)
    const allBooksRes = await API.books.list();
    const reserveBookSel = document.getElementById("reserveBookId");
    if (reserveBookSel && allBooksRes.success) {
      reserveBookSel.innerHTML =
        '<option value="">-- Choose a Book --</option>' +
        allBooksRes.data
          .filter((b) => b.available === 0)
          .map(
            (b) =>
              `<option value="${b.id}">${b.title} (${b.id}) – All ${b.copies} copies issued</option>`,
          )
          .join("");
    }

    const reserveMemSel = document.getElementById("reserveMemberId");
    if (reserveMemSel && membersRes.success) {
      reserveMemSel.innerHTML =
        '<option value="">-- Choose a Member --</option>' +
        membersRes.data
          .filter((m) => m.status === "Active")
          .map((m) => `<option value="${m.id}">${m.name} (${m.id})</option>`)
          .join("");
    }

    // Populate return dropdown
    const retSel = document.getElementById("returnTransactionId");
    if (retSel && txnsRes.success) {
      retSel.innerHTML =
        '<option value="">-- Choose Active Transaction --</option>' +
        txnsRes.data
          .map(
            (t) =>
              `<option value="${t.id}">${t.id}: ${t.bookTitle} → ${t.memberName}</option>`,
          )
          .join("");
      retSel.onchange = () => showReturnFinePreview(retSel.value, txnsRes.data);
    }
  } catch (err) {
    showToast("Error loading dropdowns: " + err.message, "error");
  }
}

function showReturnFinePreview(txnId, txns) {
  const fineInfo = document.getElementById("fineInfo");
  const fineAmt = document.getElementById("fineAmount");
  if (!txnId) {
    fineInfo?.classList.add("hidden");
    return;
  }
  const txn = txns.find((t) => t.id === txnId);
  if (!txn) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(txn.dueDate);
  const overdueDays = Math.max(0, Math.floor((today - due) / 86400000));
  const fine = overdueDays * 2;
  if (overdueDays > 0) {
    fineInfo?.classList.remove("hidden");
    if (fineAmt)
      fineAmt.textContent = `₹${fine} (${overdueDays} day${overdueDays > 1 ? "s" : ""} overdue)`;
  } else {
    fineInfo?.classList.add("hidden");
  }
}

async function issueBook(e) {
  e.preventDefault();
  const payload = {
    bookId: document.getElementById("issueBookId").value,
    memberId: document.getElementById("issueMemberId").value,
    dueDate: document.getElementById("issueDueDate").value,
  };
  if (!payload.bookId || !payload.memberId || !payload.dueDate) return;
  try {
    setLoading(true);
    const res = await API.transactions.issue(payload);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, "success");
    document.getElementById("issueForm").reset();
    setDefaultDueDate();
    await loadIssueDropdowns();
    await loadTransactions(currentTransFilter);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function returnBook(e) {
  e.preventDefault();
  const txnId = document.getElementById("returnTransactionId").value;
  if (!txnId) return;
  try {
    setLoading(true);
    const res = await API.transactions.return(txnId);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, res.fine > 0 ? "info" : "success");
    document.getElementById("returnForm").reset();
    document.getElementById("fineInfo")?.classList.add("hidden");
    setReturnDate();
    await loadIssueDropdowns();
    await loadTransactions(currentTransFilter);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function reserveBook(e) {
  e.preventDefault();
  const payload = {
    bookId: document.getElementById("reserveBookId").value,
    memberId: document.getElementById("reserveMemberId").value,
  };
  if (!payload.bookId || !payload.memberId) return;
  try {
    setLoading(true);
    const res = await API.transactions.reserve(payload);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, "success");
    document.getElementById("reserveForm").reset();
    await loadIssueDropdowns();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function payFine(txnId) {
  try {
    setLoading(true);
    const res = await API.transactions.payFine(txnId);
    if (!res.success) throw new Error(res.error);
    showToast(res.message, "success");
    await loadTransactions(currentTransFilter);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function loadTransactions(filter = "all") {
  currentTransFilter = filter;
  ["All", "Active", "Returned", "Overdue"].forEach((f) => {
    document
      .getElementById("tab" + f)
      ?.classList.toggle("active", f.toLowerCase() === filter);
  });
  try {
    const res = await API.transactions.list(filter);
    if (!res.success) throw new Error(res.error);
    renderTransactionsTable(res.data);
  } catch (err) {
    showToast(err.message, "error");
  }
}

function filterTransactions(filter) {
  loadTransactions(filter);
}

function renderTransactionsTable(txns) {
  const tbody = document.getElementById("transactionsTbody");
  if (!tbody) return;
  tbody.innerHTML =
    txns
      .map((t) => {
        const fineCell =
          t.fine > 0
            ? t.finePaid
              ? `<span style="color:var(--success)">₹${t.fine} ✅</span>`
              : `<span style="color:var(--warning)">₹${t.fine}</span>
             <button class="action-btn" style="margin-left:4px;font-size:0.7rem" onclick="payFine('${t.id}')">Pay</button>`
            : '<span style="color:var(--text-muted)">₹0</span>';
        return `<tr>
      <td><code class="code-chip chip-muted">${t.id}</code></td>
      <td style="font-weight:500;max-width:140px" title="${t.bookTitle}">${t.bookTitle}</td>
      <td>${t.memberName}</td>
      <td>${formatDate(t.issueDate)}</td>
      <td>${formatDate(t.dueDate)}</td>
      <td>${t.returnDate ? formatDate(t.returnDate) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${fineCell}</td>
      <td>${getStatusBadge(t.status)}</td>
    </tr>`;
      })
      .join("") ||
    `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No transactions found</td></tr>`;
}

// ============================================================
//  RESERVATIONS
// ============================================================
async function loadReservations() {
  setLoading(true);
  try {
    const res = await API.transactions.reservations();
    if (!res.success) throw new Error(res.error);
    const tbody = document.getElementById("reservationsTbody");
    if (!tbody) return;
    tbody.innerHTML =
      res.data
        .map(
          (r) => `<tr>
      <td><code class="code-chip chip-muted">${r.reserve_code}</code></td>
      <td style="font-weight:500">${r.book_title}</td>
      <td>${r.member_name}</td>
      <td>${formatDate(r.reserve_date)}</td>
      <td>${
        r.available_copies > 0
          ? '<span class="badge badge-success">Book Available!</span>'
          : '<span class="badge badge-warning">Waiting</span>'
      }</td>
      <td>${getReserveStatusBadge(r.status)}</td>
    </tr>`,
        )
        .join("") ||
      `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No reservations found</td></tr>`;
  } finally {
    setLoading(false);
  }
}

function getReserveStatusBadge(status) {
  const map = {
    Pending: "badge-warning",
    Fulfilled: "badge-success",
    Cancelled: "badge-danger",
  };
  return `<span class="badge ${map[status] || "badge-neutral"}">${status}</span>`;
}

// ============================================================
//  REPORTS
// ============================================================
async function generateBooksReport() {
  setLoading(true);
  try {
    const res = await API.books.list();
    if (!res.success) throw new Error(res.error);
    const books = res.data;
    const totalCopies = books.reduce((s, b) => s + b.copies, 0);
    const totalAvailable = books.reduce((s, b) => s + b.available, 0);
    const content = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${books.length}</span><span class="stat-label">Total Titles</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${totalCopies}</span><span class="stat-label">Total Copies</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${totalAvailable}</span><span class="stat-label">Available</span></div></div>
      </div>
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline" onclick="exportTableToCSV('reportTable','books_report')">📥 Export CSV</button>
      </div>
      <table class="data-table" id="reportTable">
        <thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Copies</th><th>Available</th><th>Shelf</th></tr></thead>
        <tbody>${books
          .map(
            (b) => `<tr><td>${b.id}</td><td>${b.title}</td><td>${b.author}</td>
          <td>${b.category}</td><td>${b.isbn || "—"}</td><td>${b.copies}</td><td>${b.available}</td><td>${b.shelf || "—"}</td></tr>`,
          )
          .join("")}</tbody>
      </table>`;
    showReport("Books Report", content);
  } finally {
    setLoading(false);
  }
}

async function generateMembersReport() {
  setLoading(true);
  try {
    const res = await API.members.list();
    if (!res.success) throw new Error(res.error);
    const members = res.data;
    const content = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${members.length}</span><span class="stat-label">Total Members</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${members.filter((m) => m.type === "Student").length}</span><span class="stat-label">Students</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${members.filter((m) => m.type === "Faculty").length}</span><span class="stat-label">Faculty</span></div></div>
      </div>
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline" onclick="exportTableToCSV('reportTable','members_report')">📥 Export CSV</button>
      </div>
      <table class="data-table" id="reportTable">
        <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Dept</th><th>Email</th><th>Phone</th><th>Books Issued</th><th>Status</th></tr></thead>
        <tbody>${members
          .map(
            (m) => `<tr><td>${m.id}</td><td>${m.name}</td><td>${m.type}</td>
          <td>${m.dept || "—"}</td><td>${m.email}</td><td>${m.phone}</td><td>${m.booksIssued}</td><td>${m.status}</td></tr>`,
          )
          .join("")}</tbody>
      </table>`;
    showReport("Members Report", content);
  } finally {
    setLoading(false);
  }
}

async function generateOverdueReport() {
  setLoading(true);
  try {
    const res = await API.transactions.list("overdue");
    if (!res.success) throw new Error(res.error);
    const txns = res.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalFine = txns.reduce(
      (s, t) =>
        s +
        Math.max(0, Math.floor((today - new Date(t.dueDate)) / 86400000)) * 2,
      0,
    );
    const content = `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:1rem;margin-bottom:1.5rem;color:var(--danger)">
        ⚠️ <strong>${txns.length}</strong> overdue book(s) — Total estimated fine: <strong>₹${totalFine}</strong>
      </div>
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline" onclick="exportTableToCSV('reportTable','overdue_report')">📥 Export CSV</button>
      </div>
      <table class="data-table" id="reportTable">
        <thead><tr><th>Trans. ID</th><th>Book</th><th>Member</th><th>Due Date</th><th>Days Overdue</th><th>Fine</th><th>Fine Paid</th></tr></thead>
        <tbody>${
          txns.length
            ? txns
                .map((t) => {
                  const overdueDays = Math.max(
                    0,
                    Math.floor((today - new Date(t.dueDate)) / 86400000),
                  );
                  return `<tr><td>${t.id}</td><td>${t.bookTitle}</td><td>${t.memberName}</td>
            <td style="color:var(--danger)">${formatDate(t.dueDate)}</td>
            <td style="color:var(--danger);font-weight:600">${overdueDays} day(s)</td>
            <td style="color:var(--warning)">₹${overdueDays * 2}</td>
            <td>${t.finePaid ? "✅ Paid" : "❌ Unpaid"}</td></tr>`;
                })
                .join("")
            : '<tr><td colspan="7" style="text-align:center;color:var(--success)">🎉 No overdue books!</td></tr>'
        }</tbody>
      </table>`;
    showReport("Overdue Report", content);
  } finally {
    setLoading(false);
  }
}

async function generateTransactionReport() {
  setLoading(true);
  try {
    const res = await API.transactions.list("all");
    if (!res.success) throw new Error(res.error);
    const txns = res.data;
    const totalFine = txns.reduce((s, t) => s + t.fine, 0);
    const fineCollected = txns
      .filter((t) => t.finePaid)
      .reduce((s, t) => s + t.fine, 0);
    const content = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${txns.length}</span><span class="stat-label">Total</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${txns.filter((t) => t.status === "Active").length}</span><span class="stat-label">Active</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">${txns.filter((t) => t.status === "Returned").length}</span><span class="stat-label">Returned</span></div></div>
        <div class="stat-card"><div class="stat-info"><span class="stat-value">₹${fineCollected}</span><span class="stat-label">Fine Collected</span></div></div>
      </div>
      <div style="margin-bottom:1rem">
        <button class="btn btn-sm btn-outline" onclick="exportTableToCSV('reportTable','transaction_report')">📥 Export CSV</button>
      </div>
      <table class="data-table" id="reportTable">
        <thead><tr><th>ID</th><th>Book</th><th>Member</th><th>Issued</th><th>Due</th><th>Returned</th><th>Fine</th><th>Paid</th><th>Status</th></tr></thead>
        <tbody>${txns
          .map(
            (t) => `<tr>
          <td>${t.id}</td><td>${t.bookTitle}</td><td>${t.memberName}</td>
          <td>${formatDate(t.issueDate)}</td><td>${formatDate(t.dueDate)}</td>
          <td>${t.returnDate ? formatDate(t.returnDate) : "—"}</td>
          <td>${t.fine > 0 ? "₹" + t.fine : "₹0"}</td>
          <td>${t.fine > 0 ? (t.finePaid ? "✅" : "❌") : "—"}</td>
          <td>${t.status}</td></tr>`,
          )
          .join("")}</tbody>
      </table>`;
    showReport("Transaction Report", content);
  } finally {
    setLoading(false);
  }
}

function showReport(title, content) {
  document.getElementById("reportTitle").textContent = title;
  document.getElementById("reportContent").innerHTML = content;
  document.getElementById("reportOutput").classList.remove("hidden");
  document
    .getElementById("reportOutput")
    .scrollIntoView({ behavior: "smooth" });
}
function printReport() {
  window.print();
}

// ============================================================
//  CSV EXPORT
// ============================================================
function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) {
    showToast("No table found to export", "error");
    return;
  }
  const rows = [...table.querySelectorAll("tr")];
  const csv = rows
    .map((r) =>
      [...r.querySelectorAll("th,td")]
        .map((c) => `"${c.innerText.replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("CSV exported successfully", "success");
}

// ============================================================
//  GLOBAL SEARCH
// ============================================================
let searchTimeout;
function handleGlobalSearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (!query.trim()) {
      /* refresh current page */ await showPage(currentPage);
      return;
    }
    try {
      if (currentPage === "books") await loadBooks({ search: query });
      else if (currentPage === "members") await loadMembers({ search: query });
      else {
        await showPage("books");
        await loadBooks({ search: query });
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  }, 400);
}

// ============================================================
//  NOTIFICATIONS PANEL
// ============================================================
function toggleNotifications() {
  const panel = document.getElementById("notifDropdown");
  panel?.classList.toggle("hidden");
}

// ============================================================
//  MODALS
// ============================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

// ============================================================
//  TOAST
// ============================================================
function showToast(message, type = "info") {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================================
//  UTILITIES
// ============================================================
function formatDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function getStatusBadge(status) {
  const map = {
    Active: '<span class="badge badge-info">Active</span>',
    Returned: '<span class="badge badge-success">Returned</span>',
    Overdue: '<span class="badge badge-danger">Overdue</span>',
  };
  return map[status] || `<span class="badge badge-neutral">${status}</span>`;
}
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  const steps = 20;
  let step = 0;
  const iv = setInterval(() => {
    el.textContent = Math.round(start + (diff * step) / steps);
    if (++step >= steps) {
      clearInterval(iv);
      el.textContent = target;
    }
  }, 25);
}

// ============================================================
//  BOOT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

  // Modal overlay click-to-close
  document.querySelectorAll(".modal-overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeModal(ov.id);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document
        .querySelectorAll(".modal-overlay:not(.hidden)")
        .forEach((o) => closeModal(o.id));
      document.getElementById("notifDropdown")?.classList.add("hidden");
    }
  });

  // Check existing session
  try {
    const res = await API.auth.check();
    if (res.success) {
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      initApp();
    }
  } catch (e) {
    // Not logged in or server offline – stay on login page
    // Show connection hint if server unreachable
    if (e.message.includes("XAMPP")) {
      showToast(
        "⚠️ XAMPP not running. Open XAMPP and start Apache + MySQL.",
        "warning",
      );
    }
  }
});
