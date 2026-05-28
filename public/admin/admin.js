/* ═══════════════════════════════════════════════
   SwiftCredit Admin — Dashboard Logic
   Connects to Express backend /api/admin/*
═══════════════════════════════════════════════ */

const API = '';
let authToken = null;
let currentFilter = 'all';
let currentPage = 1;
let currentModalId = null;
let allApps = [];

// ─── Toast ────────────────────────────────────────────────────────
let toastT;
function toast(msg, type = 'info') {
  const el = document.getElementById('adm-toast');
  document.getElementById('t-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  document.getElementById('t-msg').textContent = msg;
  el.className = `toast show ${type === 'success' ? 't-s' : type === 'error' ? 't-e' : ''}`;
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 4000);
}

// ─── Auth headers ─────────────────────────────────────────────────
function headers() {
  return { 'Content-Type': 'application/json', 'x-admin-token': authToken || '' };
}

// ─── Login ────────────────────────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('l-user').value.trim();
  const password = document.getElementById('l-pass').value;
  const errEl = document.getElementById('login-err');
  errEl.classList.remove('show');

  if (!username || !password) { errEl.textContent = 'Please enter username and password.'; errEl.classList.add('show'); return; }

  const btn = document.querySelector('.btn-login');
  btn.disabled = true; btn.textContent = 'Signing in...';

  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Invalid credentials.'; errEl.classList.add('show'); btn.disabled = false; btn.textContent = 'Sign In →'; return; }

    authToken = data.token;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').classList.add('visible');
    startClock();
    loadDashboard();
    loadApplications(1);
  } catch {
    errEl.textContent = 'Network error. Please try again.'; errEl.classList.add('show');
    btn.disabled = false; btn.textContent = 'Sign In →';
  }
}

async function doLogout() {
  await fetch(`${API}/api/admin/logout`, { method: 'POST', credentials: 'include' });
  authToken = null;
  document.getElementById('dashboard').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('l-pass').value = '';
  document.querySelector('.btn-login').disabled = false;
  document.querySelector('.btn-login').textContent = 'Sign In →';
}

// ─── Clock ────────────────────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const el = document.getElementById('adm-clock');
    if (el) el.textContent = now.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
  }
  tick(); setInterval(tick, 30000);
}

// ─── Tab Navigation ───────────────────────────────────────────────
const tabTitles = {
  overview: 'Dashboard Overview',
  applications: 'Loan Applications',
  disbursements: 'Disbursements',
  customers: 'Customer Database',
  transactions: 'M-Pesa Transactions',
  risk: 'Risk & Compliance',
  settings: 'System Settings'
};

function switchTab(name, el) {
  document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('tb-title').textContent = tabTitles[name] || name;

  // Lazy load data
  if (name === 'applications') loadApplications(1, true);
  if (name === 'disbursements') loadDisbursements();
  if (name === 'customers') loadCustomers();
  if (name === 'transactions') loadTransactions();
}

// ─── Dashboard KPIs + Chart ───────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/admin/dashboard`, { headers: headers(), credentials: 'include' });
    if (res.status === 401) { doLogout(); return; }
    const d = await res.json();

    document.getElementById('kpi-total').textContent = d.total || 0;
    document.getElementById('kpi-pending').textContent = (d.pending || 0) + (d.review || 0);
    document.getElementById('kpi-disbursed').textContent = d.disbursedAmount ? `KES ${(d.disbursedAmount / 1000000).toFixed(1)}M` : 'KES 0';
    document.getElementById('kpi-rate').textContent = (d.approvalRate || 0) + '%';
    document.getElementById('kpi-chg-rate').textContent = d.approvalRate >= 70 ? '↑ Good' : '↓ Low';
    document.getElementById('kpi-chg-rate').className = 'kpi-chg ' + (d.approvalRate >= 70 ? 'up' : 'dn');
    document.getElementById('kpi-chg-pend').textContent = `+${d.pending || 0} pending`;
    document.getElementById('kpi-chg-total').textContent = `${d.total || 0} total`;

    document.getElementById('qs-fees').textContent = d.feesCollected ? `KES ${d.feesCollected.toLocaleString()}` : 'KES 0';
    document.getElementById('qs-active').textContent = (d.approved || 0) + (d.disbursed || 0);
    document.getElementById('nav-badge').textContent = (d.pending || 0) + (d.review || 0);

    if (d.kpi_flagged !== undefined) document.getElementById('kpi-flagged').textContent = d.kpi_flagged;

    renderChart(d.trend || []);
    loadApplications(1);
    renderActivityFeed(d);
  } catch (err) {
    console.error('Dashboard load error:', err);
    toast('Could not load dashboard data', 'error');
  }
}

// ─── Bar Chart ────────────────────────────────────────────────────
function renderChart(trend) {
  const chart = document.getElementById('adm-chart');
  if (!chart) return;

  // Fill last 7 days if trend data is sparse
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const found = trend.find(t => t._id === key);
    days.push({ label: d.toLocaleDateString('en-KE', { weekday: 'short' }), count: found ? found.count : 0 });
  }

  const max = Math.max(...days.map(d => d.count), 1);
  chart.innerHTML = days.map(d => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px">
      <div class="bar-val">${d.count}</div>
      <div class="bar" style="height:${Math.max(8, (d.count / max) * 120)}px;width:100%">
        <div class="bar-lbl">${d.label}</div>
      </div>
    </div>
  `).join('');
}

// ─── Activity Feed ────────────────────────────────────────────────
function renderActivityFeed(data) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  const items = [];
  if (data.pending > 0) items.push({ c: 'fd-a', t: `${data.pending} application(s) pending review`, time: 'Now' });
  if (data.disbursed > 0) items.push({ c: 'fd-b', t: `${data.disbursed} loan(s) disbursed this period`, time: 'Today' });
  if (data.approved > 0) items.push({ c: 'fd-g', t: `${data.approved} application(s) approved`, time: 'Today' });
  if (data.feesCollected) items.push({ c: 'fd-g', t: `KES ${data.feesCollected.toLocaleString()} in processing fees collected`, time: 'All time' });
  items.push({ c: 'fd-b', t: 'Dashboard loaded successfully', time: new Date().toLocaleTimeString() });

  feed.innerHTML = items.slice(0, 6).map(i => `
    <div class="feed-item">
      <div class="fdot ${i.c}"></div>
      <div><div class="ftext">${i.t}</div><div class="ftime">${i.time}</div></div>
    </div>`).join('');
}

// ─── Applications Table ───────────────────────────────────────────
async function loadApplications(page = 1, isAllTab = false) {
  currentPage = page;
  const searchEl = document.getElementById(isAllTab ? 'all-search' : 'ov-search') || document.getElementById('ov-search') || document.getElementById('all-search');
  const search = searchEl ? searchEl.value.trim() : '';

  const params = new URLSearchParams({ status: currentFilter, page, limit: 15 });
  if (search) params.append('search', search);

  try {
    const res = await fetch(`${API}/api/admin/applications?${params}`, { headers: headers(), credentials: 'include' });
    if (res.status === 401) { doLogout(); return; }
    const data = await res.json();

    allApps = data.apps || [];
    const bodyId = isAllTab ? 'all-tbl-body' : 'tbl-body';
    const pagerId = isAllTab ? 'all-pager' : 'pager';
    renderTable(bodyId, allApps);
    renderPager(pagerId, data.pages, page, isAllTab);

    // Also populate disbursements
    renderDisbursements(allApps.filter(a => a.status === 'approved'));

  } catch (err) {
    console.error('Load applications error:', err);
    toast('Could not load applications', 'error');
  }
}

function renderTable(bodyId, apps) {
  const tbody = document.getElementById(bodyId);
  if (!tbody) return;
  if (!apps.length) { tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--muted)">No applications found</td></tr>`; return; }

  tbody.innerHTML = apps.map(a => {
    const scoreColor = a.creditScore >= 700 ? 'var(--green)' : a.creditScore >= 640 ? 'var(--gold)' : 'var(--danger)';
    const month = calcMonthly(a.loanAmount, a.tenor);
    return `<tr>
      <td><span style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--green)">${a.refNumber || '—'}</span></td>
      <td><strong>${a.firstName} ${a.lastName}</strong></td>
      <td><code style="font-size:12px">${a.idNumber}</code></td>
      <td style="font-weight:600">KES ${(a.loanAmount || 0).toLocaleString()}</td>
      <td>${a.tenor || '—'}mo</td>
      <td><span style="color:${scoreColor};font-weight:700">${a.creditScore || '—'}</span></td>
      <td>${a.feePaid ? '<span style="color:var(--green)">✅ Paid</span>' : '<span style="color:var(--muted)">—</span>'}</td>
      <td><span class="badge b-${a.status || 'draft'}">${cap(a.status || 'draft')}</span></td>
      <td style="color:var(--muted);font-size:12px">${fmtDate(a.createdAt)}</td>
      <td>
        <div class="act-btns">
          ${(a.status === 'pending' || a.status === 'review') ? `
            <button class="act-btn act-approve" onclick="quickStatus('${a._id}','approved')">✓</button>
            <button class="act-btn act-reject" onclick="quickStatus('${a._id}','rejected')">✗</button>
          ` : ''}
          <button class="act-btn act-view" onclick="openModal('${a._id}')">View</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderPager(pagerId, pages, current, isAllTab) {
  const el = document.getElementById(pagerId);
  if (!el || !pages || pages <= 1) { if (el) el.innerHTML = ''; return; }
  let html = `<span>Page ${current} of ${pages}</span> `;
  if (current > 1) html += `<button class="pg-btn" onclick="loadApplications(${current - 1},${isAllTab})">← Prev</button>`;
  for (let i = Math.max(1, current - 2); i <= Math.min(pages, current + 2); i++) {
    html += `<button class="pg-btn ${i === current ? 'active' : ''}" onclick="loadApplications(${i},${isAllTab})">${i}</button>`;
  }
  if (current < pages) html += `<button class="pg-btn" onclick="loadApplications(${current + 1},${isAllTab})">Next →</button>`;
  el.innerHTML = html;
}

// ─── Filter by status ─────────────────────────────────────────────
function filterStatus(status, el) {
  currentFilter = status;
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  loadApplications(1);
}

// ─── Quick Status Change ──────────────────────────────────────────
async function quickStatus(id, status) {
  try {
    const res = await fetch(`${API}/api/admin/applications/${id}/status`, {
      method: 'PATCH', headers: headers(), credentials: 'include',
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Error updating status', 'error'); return; }
    toast(`Application ${status} successfully`, 'success');
    loadApplications(currentPage);
    loadDashboard();
  } catch { toast('Network error', 'error'); }
}

// ─── Modal ────────────────────────────────────────────────────────
async function openModal(id) {
  currentModalId = id;
  document.getElementById('modal').classList.add('open');

  try {
    const res = await fetch(`${API}/api/admin/applications/${id}`, { headers: headers(), credentials: 'include' });
    const { app, transaction } = await res.json();
    if (!app) return;

    document.getElementById('m-ref').textContent = app.refNumber || id;
    document.getElementById('m-name').textContent = `${app.firstName} ${app.lastName}`;
    document.getElementById('m-id').textContent = app.idNumber;
    document.getElementById('m-phone').textContent = app.phone;
    document.getElementById('m-emp').textContent = app.employment || '—';
    document.getElementById('m-income').textContent = app.income ? `KES ${app.income.toLocaleString()}` : '—';
    document.getElementById('m-score').textContent = app.creditScore || '—';
    document.getElementById('m-amount').textContent = app.loanAmount ? `KES ${app.loanAmount.toLocaleString()}` : '—';
    document.getElementById('m-tenor').textContent = app.tenor ? `${app.tenor} months` : '—';
    document.getElementById('m-monthly').textContent = app.monthlyPayment ? `KES ${app.monthlyPayment.toLocaleString()}` : '—';
    document.getElementById('m-fee').textContent = app.feePaid ? `✅ KES ${(app.processingFee || 500).toLocaleString()} Paid` : '⏳ Pending';
    document.getElementById('m-purpose').textContent = app.loanPurpose || '—';
    document.getElementById('m-mpesa').textContent = app.mpesaCode || (transaction?.mpesaCode) || '—';
    document.getElementById('m-note').value = app.adminNote || '';
    document.getElementById('m-status-badge').innerHTML = `<span class="badge b-${app.status}">${cap(app.status)}</span>`;
  } catch { toast('Could not load application details', 'error'); }
}

function closeModal() { document.getElementById('modal').classList.remove('open'); currentModalId = null; }

async function modalAction(status) {
  if (!currentModalId) return;
  const note = document.getElementById('m-note').value.trim();
  await quickStatus(currentModalId, status);
  // Save note if provided
  if (note) {
    await fetch(`${API}/api/admin/applications/${currentModalId}/status`, {
      method: 'PATCH', headers: headers(), credentials: 'include',
      body: JSON.stringify({ status, adminNote: note })
    });
  }
  closeModal();
}

// ─── Disbursements ────────────────────────────────────────────────
async function loadDisbursements() {
  try {
    const res = await fetch(`${API}/api/admin/applications?status=approved&limit=50`, { headers: headers(), credentials: 'include' });
    const data = await res.json();
    renderDisbursements(data.apps || []);
  } catch { toast('Could not load disbursements', 'error'); }
}

function renderDisbursements(apps) {
  const tbody = document.getElementById('dis-body');
  if (!tbody) return;
  if (!apps.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No approved loans awaiting disbursement</td></tr>`; return; }
  tbody.innerHTML = apps.map(a => `
    <tr>
      <td><span style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--green)">${a.refNumber}</span></td>
      <td><strong>${a.firstName} ${a.lastName}</strong></td>
      <td>${a.phone}</td>
      <td style="font-weight:600">KES ${(a.loanAmount || 0).toLocaleString()}</td>
      <td><span class="badge b-${a.status}">${cap(a.status)}</span></td>
      <td><button class="act-btn act-disburse" onclick="quickStatus('${a._id}','disbursed');this.disabled=true;this.textContent='Disbursed ✓'">💸 Disburse</button></td>
    </tr>`).join('');
}

// ─── Customers ────────────────────────────────────────────────────
async function loadCustomers() {
  try {
    const res = await fetch(`${API}/api/admin/applications?limit=100`, { headers: headers(), credentials: 'include' });
    const data = await res.json();
    const apps = data.apps || [];

    // Group by ID number
    const byId = {};
    apps.forEach(a => {
      if (!byId[a.idNumber]) byId[a.idNumber] = { name: `${a.firstName} ${a.lastName}`, id: a.idNumber, phone: a.phone, apps: 0, total: 0, last: a.createdAt };
      byId[a.idNumber].apps++;
      byId[a.idNumber].total += a.loanAmount || 0;
      if (new Date(a.createdAt) > new Date(byId[a.idNumber].last)) byId[a.idNumber].last = a.createdAt;
    });

    const customers = Object.values(byId);
    const tbody = document.getElementById('cust-body');
    if (!tbody) return;
    if (!customers.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No customers yet</td></tr>`; return; }
    tbody.innerHTML = customers.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.id}</code></td>
        <td>${c.phone}</td>
        <td style="text-align:center">${c.apps}</td>
        <td style="font-weight:600">KES ${c.total.toLocaleString()}</td>
        <td style="color:var(--muted);font-size:12px">${fmtDate(c.last)}</td>
      </tr>`).join('');
  } catch { toast('Could not load customers', 'error'); }
}

// ─── Transactions ─────────────────────────────────────────────────
async function loadTransactions() {
  try {
    const res = await fetch(`${API}/api/admin/transactions`, { headers: headers(), credentials: 'include' });
    const txns = await res.json();
    const tbody = document.getElementById('txn-body');
    if (!tbody) return;
    if (!txns.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No transactions yet</td></tr>`; return; }
    tbody.innerHTML = txns.map(t => `
      <tr>
        <td><code style="font-size:11px">${t.lipanaTransId || '—'}</code></td>
        <td><span style="font-weight:600;color:var(--green)">${t.refNumber || '—'}</span></td>
        <td>${t.phone || '—'}</td>
        <td style="font-weight:600">KES ${(t.amount || 0).toLocaleString()}</td>
        <td><code>${t.mpesaCode || '—'}</code></td>
        <td><span class="badge ${t.status === 'success' ? 'b-approved' : t.status === 'failed' ? 'b-rejected' : 'b-pending'}">${cap(t.status)}</span></td>
        <td style="color:var(--muted);font-size:12px">${fmtDate(t.createdAt)}</td>
      </tr>`).join('');
  } catch { toast('Could not load transactions', 'error'); }
}

// ─── Export CSV ───────────────────────────────────────────────────
async function exportCSV() {
  try {
    const res = await fetch(`${API}/api/admin/applications?limit=1000`, { headers: headers(), credentials: 'include' });
    const data = await res.json();
    const apps = data.apps || [];
    const rows = [
      ['Reference','First Name','Last Name','National ID','Phone','Loan Amount','Tenor','Credit Score','Fee Paid','Status','Applied Date'],
      ...apps.map(a => [
        a.refNumber, a.firstName, a.lastName, a.idNumber, a.phone,
        a.loanAmount, a.tenor, a.creditScore, a.feePaid ? 'Yes' : 'No',
        a.status, fmtDate(a.createdAt)
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `swiftcredit_applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast('Export downloaded', 'success');
  } catch { toast('Export failed', 'error'); }
}

// ─── Helpers ──────────────────────────────────────────────────────
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'; }

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calcMonthly(amount, months) {
  if (!amount || !months) return 0;
  const rate = 0.12 / 12;
  const m = months === 1 ? amount * (1 + rate) : amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
  return Math.round(m);
}

// ─── Close modal on overlay click ────────────────────────────────
document.getElementById('modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// ─── Login on Enter ───────────────────────────────────────────────
document.getElementById('l-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
