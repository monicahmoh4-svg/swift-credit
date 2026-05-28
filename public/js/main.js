/* ═══════════════════════════════════════════════
   SwiftCredit — Frontend Logic
   Connects to Express backend API
═══════════════════════════════════════════════ */

const API = ''; // same origin — relative paths

// ─── State ───────────────────────────────────────────────────────
const state = {
  applicationId: null,
  refNumber: null,
  firstName: '', lastName: '', phone: '',
  creditScore: 0, maxLoan: 0,
  loanAmount: 50000, tenor: 3,
  monthlyPayment: 0, processingFee: 500,
  transactionId: null,
  pollInterval: null,
  countdownInterval: null,
};

// ─── Page Navigation ─────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) { el.classList.add('active'); window.scrollTo(0, 0); }
}

// ─── Progress Sidebar Steps ───────────────────────────────────────
function setProgressStep(active) {
  document.querySelectorAll('.pt-step').forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.remove('active', 'done');
    if (n < active) { s.classList.add('done'); s.querySelector('.pt-circle').textContent = '✓'; }
    else if (n === active) { s.classList.add('active'); s.querySelector('.pt-circle').textContent = n; }
    else { s.querySelector('.pt-circle').textContent = n; }
  });
}

// ─── Show/Hide App Step ───────────────────────────────────────────
function showStep(id) {
  document.querySelectorAll('.app-step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ─── Form Validation Helpers ──────────────────────────────────────
function fieldErr(id, show, msg) {
  const err = document.getElementById('err-' + id);
  const inp = document.getElementById(id);
  if (err) { err.textContent = msg || err.textContent; err.classList.toggle('show', show); }
  if (inp) inp.classList.toggle('has-error', show);
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.has-error').forEach(e => e.classList.remove('has-error'));
}

// ─── Toast ────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  document.getElementById('toast-msg').textContent = msg;
  el.className = `toast show ${type === 'success' ? 't-success' : type === 'error' ? 't-error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}

// ─── STEP 1: Personal Info ────────────────────────────────────────
async function submitPersonalInfo() {
  clearErrors();
  const fName = document.getElementById('firstName').value.trim();
  const lName = document.getElementById('lastName').value.trim();
  const idNum = document.getElementById('idNumber').value.trim();
  const phone = document.getElementById('phoneNumber').value.trim();
  const dob = document.getElementById('dob').value;
  const gender = document.getElementById('gender').value;
  const employment = document.getElementById('employment').value;
  const income = document.getElementById('income').value;
  const loanPurpose = document.getElementById('loanPurpose').value;
  const consent = document.getElementById('consent').checked;

  let valid = true;
  if (!fName) { fieldErr('firstName', true, 'Please enter your first name'); valid = false; }
  if (!lName) { fieldErr('lastName', true, 'Please enter your last name'); valid = false; }
  if (!/^\d{8}$/.test(idNum)) { fieldErr('idNumber', true, 'Enter a valid 8-digit ID number'); valid = false; }

  const phoneClean = phone.replace(/^0/, '').replace(/\s/g, '');
  if (!/^[17]\d{8}$/.test(phoneClean)) { fieldErr('phone', true, 'Enter a valid Safaricom number (07XX or 01XX)'); valid = false; }

  if (!dob) { fieldErr('dob', true, 'Date of birth is required'); valid = false; }
  else {
    const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
    if (age < 18) { fieldErr('dob', true, 'You must be at least 18 years old'); valid = false; }
  }

  if (!income || Number(income) < 1) { fieldErr('income', true, 'Please enter your monthly income'); valid = false; }
  if (!consent) { toast('Please accept the terms and conditions to continue', 'error'); return; }
  if (!valid) { toast('Please fix the errors highlighted above', 'error'); return; }

  // Disable button
  const btn = document.querySelector('#step-personal .btn-primary');
  btn.disabled = true; btn.textContent = 'Please wait...';

  try {
    const res = await fetch(`${API}/api/application/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: fName, lastName: lName, idNumber: idNum,
        kraPin: document.getElementById('kraPin').value.trim(),
        phone: '0' + phoneClean, dob, gender, employment,
        income: Number(income),
        email: document.getElementById('email').value.trim(),
        loanPurpose
      })
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Error saving application', 'error'); btn.disabled = false; btn.textContent = 'Continue to Eligibility Check →'; return; }

    state.applicationId = data.applicationId;
    state.refNumber = data.refNumber;
    state.firstName = fName; state.lastName = lName;
    state.phone = phoneClean;

    // Proceed to eligibility
    showPage('apply');
    showStep('step-eligibility');
    setProgressStep(2);
    runEligibilityCheck();

  } catch (err) {
    toast('Network error. Please check your connection.', 'error');
    btn.disabled = false; btn.textContent = 'Continue to Eligibility Check →';
  }
}

// ─── STEP 2: Eligibility Check ────────────────────────────────────
const checkLabels = [
  'Verifying identity with IPRS...',
  'Running CRB credit bureau check...',
  'Validating Safaricom number...',
  'Analysing M-Pesa history...',
  'Calculating your risk score...'
];

async function runEligibilityCheck() {
  document.getElementById('eligibility-checking').style.display = 'block';
  document.getElementById('eligibility-result').style.display = 'none';

  const items = ['ci-1','ci-2','ci-3','ci-4','ci-5'];
  let i = 0;

  async function tick() {
    if (i > 0) {
      const prev = document.getElementById(items[i - 1]);
      prev.classList.remove('running'); prev.classList.add('done');
    }
    if (i < items.length) {
      document.getElementById(items[i]).classList.add('running');
      document.getElementById('check-status-text').textContent = checkLabels[i];
      i++;
      await new Promise(r => setTimeout(r, 900 + Math.random() * 400));
      tick();
    } else {
      // Call API
      try {
        const res = await fetch(`${API}/api/application/eligibility/${state.applicationId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.eligible) {
          showIneligible(data.creditScore || 0);
        } else {
          state.creditScore = data.creditScore;
          state.maxLoan = data.maxLoan;
          showEligibleResult(data);
        }
      } catch {
        toast('Could not complete eligibility check. Please try again.', 'error');
      }
    }
  }
  tick();
}

function showEligibleResult(data) {
  document.getElementById('eligibility-checking').style.display = 'none';
  document.getElementById('eligibility-result').style.display = 'block';
  document.getElementById('m-maxloan').textContent = `KES ${data.maxLoan.toLocaleString()}`;
  document.getElementById('m-score').textContent = data.creditScore;
  // Update loan slider max
  const slider = document.getElementById('loanSlider');
  if (slider) { slider.max = data.maxLoan; document.getElementById('slider-max-label').textContent = `KES ${data.maxLoan.toLocaleString()}`; }
}

function showIneligible(score) {
  document.getElementById('eligibility-checking').style.display = 'none';
  document.getElementById('eligibility-result').style.display = 'block';
  const card = document.getElementById('elig-card');
  card.querySelector('.result-card-header').style.background = 'linear-gradient(135deg,#FFF5F5,#FED7D7)';
  document.querySelector('.result-icon').textContent = '❌';
  document.getElementById('elig-title').textContent = 'Not Eligible at This Time';
  document.getElementById('elig-title').style.color = '#C53030';
  document.getElementById('elig-sub').textContent = 'Your current profile does not meet our lending criteria. You may re-apply after 90 days.';
  document.getElementById('m-score').textContent = score || '—';
  document.getElementById('m-maxloan').textContent = '—';
  document.querySelector('.result-metrics').style.display = 'none';
  document.querySelector('#eligibility-result .btn-primary').style.display = 'none';
}

function goToLoanSelection() {
  showStep('step-loan');
  setProgressStep(3);
  updateLoanDisplay();
}

// ─── STEP 3: Loan Selection ───────────────────────────────────────
let currentTenor = 3;

function updateLoanDisplay() {
  const slider = document.getElementById('loanSlider');
  state.loanAmount = parseInt(slider.value);
  document.getElementById('loan-display').textContent = state.loanAmount.toLocaleString();
  calcTerms();
  // Sync quick-select highlight
  document.querySelectorAll('.qa-btn').forEach(b => b.classList.remove('selected'));
}

function setLoanAmount(amt) {
  const max = state.maxLoan || 150000;
  const actual = Math.min(amt, max);
  const slider = document.getElementById('loanSlider');
  slider.value = actual;
  state.loanAmount = actual;
  document.getElementById('loan-display').textContent = actual.toLocaleString();
  calcTerms();
  // Highlight correct button
  document.querySelectorAll('.qa-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.textContent.replace(/[^\d]/g, '')) * (b.textContent.includes('K') ? 1000 : 1) === amt);
  });
}

function setTenor(el, months) {
  document.querySelectorAll('.tenor-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  currentTenor = months; state.tenor = months;
  calcTerms();
}

function calcTerms() {
  const amt = state.loanAmount;
  const m = currentTenor;
  const rate = 0.12 / 12;
  const monthly = m === 1 ? amt * (1 + rate) : amt * (rate * Math.pow(1 + rate, m)) / (Math.pow(1 + rate, m) - 1);
  const total = monthly * m;
  const interest = total - amt;
  const fee = Math.max(300, Math.round(amt * 0.01 / 100) * 100);

  state.monthlyPayment = Math.round(monthly);
  state.processingFee = fee;

  document.getElementById('ls-monthly').textContent = `KES ${Math.round(monthly).toLocaleString()}`;
  document.getElementById('ls-interest').textContent = `KES ${Math.round(interest).toLocaleString()}`;
  document.getElementById('ls-total').textContent = `KES ${Math.round(total).toLocaleString()}`;
  document.getElementById('ls-fee').textContent = `KES ${fee.toLocaleString()}`;
}

async function proceedToPayment() {
  const btn = document.querySelector('#step-loan .btn-primary');
  btn.disabled = true; btn.textContent = 'Saving selection...';

  try {
    const res = await fetch(`${API}/api/application/select/${state.applicationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanAmount: state.loanAmount, tenor: currentTenor })
    });
    const data = await res.json();
    if (!res.ok) { toast(data.error || 'Error saving loan selection', 'error'); btn.disabled = false; btn.textContent = 'Proceed to Payment →'; return; }

    state.processingFee = data.processingFee;
    state.monthlyPayment = data.monthlyPayment;

    // Setup payment UI
    document.getElementById('ft-amount').textContent = `KES ${state.loanAmount.toLocaleString()}`;
    document.getElementById('ft-total').textContent = `KES ${state.processingFee.toLocaleString()}`;
    document.getElementById('btn-fee').textContent = state.processingFee.toLocaleString();
    document.getElementById('payPhone').value = state.phone;

    showStep('step-payment');
    setProgressStep(4);
    btn.disabled = false; btn.textContent = 'Proceed to Payment →';
  } catch {
    toast('Network error. Please try again.', 'error');
    btn.disabled = false; btn.textContent = 'Proceed to Payment →';
  }
}

// ─── STEP 4: M-Pesa STK Push ──────────────────────────────────────
async function initiateSTK() {
  const rawPhone = document.getElementById('payPhone').value.trim();
  const phoneClean = rawPhone.replace(/^0/, '');
  if (!/^[17]\d{8}$/.test(phoneClean)) { toast('Enter a valid Safaricom number', 'error'); return; }

  const btn = document.getElementById('stk-btn');
  btn.disabled = true; btn.textContent = 'Sending prompt...';

  try {
    const res = await fetch(`${API}/api/mpesa/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: state.applicationId, phone: '0' + phoneClean })
    });
    const data = await res.json();

    if (!res.ok || !data.transactionId) {
      toast(data.error || 'Could not send STK push. Please try again.', 'error');
      btn.disabled = false; btn.textContent = `📱 Send M-Pesa Prompt — KES ${state.processingFee.toLocaleString()}`;
      return;
    }

    state.transactionId = data.transactionId;
    document.getElementById('waiting-fee').textContent = `KES ${state.processingFee.toLocaleString()}`;

    // Switch to waiting view
    document.getElementById('pay-init').style.display = 'none';
    document.getElementById('pay-waiting').style.display = 'block';

    startCountdown(120);
    startPolling();

  } catch {
    toast('Network error. Please try again.', 'error');
    btn.disabled = false; btn.textContent = `📱 Send M-Pesa Prompt — KES ${state.processingFee.toLocaleString()}`;
  }
}

function startCountdown(secs) {
  clearInterval(state.countdownInterval);
  let s = secs;
  document.getElementById('countdown').textContent = s;
  state.countdownInterval = setInterval(() => {
    s--;
    document.getElementById('countdown').textContent = s;
    if (s <= 0) {
      clearInterval(state.countdownInterval);
      clearInterval(state.pollInterval);
      toast('Payment timed out. Please try again.', 'error');
      document.getElementById('pay-waiting').style.display = 'none';
      document.getElementById('pay-init').style.display = 'block';
      document.getElementById('stk-btn').disabled = false;
      document.getElementById('stk-btn').textContent = `📱 Send M-Pesa Prompt — KES ${state.processingFee.toLocaleString()}`;
    }
  }, 1000);
}

function startPolling() {
  clearInterval(state.pollInterval);
  state.pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/api/mpesa/status/${state.transactionId}`);
      const data = await res.json();
      if (data.status === 'success') {
        clearInterval(state.pollInterval);
        clearInterval(state.countdownInterval);
        onPaymentSuccess(data.mpesaCode);
      } else if (data.status === 'failed') {
        clearInterval(state.pollInterval);
        clearInterval(state.countdownInterval);
        toast('Payment failed or was cancelled. Please try again.', 'error');
        document.getElementById('pay-waiting').style.display = 'none';
        document.getElementById('pay-init').style.display = 'block';
        document.getElementById('stk-btn').disabled = false;
        document.getElementById('stk-btn').textContent = `📱 Send M-Pesa Prompt — KES ${state.processingFee.toLocaleString()}`;
      }
    } catch { /* network blip, keep polling */ }
  }, 2500);
}

async function resendSTK() {
  clearInterval(state.pollInterval);
  clearInterval(state.countdownInterval);
  document.getElementById('pay-waiting').style.display = 'none';
  document.getElementById('pay-init').style.display = 'block';
  document.getElementById('stk-btn').disabled = false;
  document.getElementById('stk-btn').textContent = `📱 Send M-Pesa Prompt — KES ${state.processingFee.toLocaleString()}`;
  toast('You can resend the prompt now.', 'info');
}

async function onPaymentSuccess(mpesaCode) {
  document.getElementById('pay-waiting').style.display = 'none';
  document.getElementById('pay-confirmed').style.display = 'block';
  document.getElementById('mpesa-code-display').textContent = mpesaCode || 'Confirmed';

  // Small delay then submit
  await new Promise(r => setTimeout(r, 2500));

  try {
    const res = await fetch(`${API}/api/application/submit/${state.applicationId}`, { method: 'POST' });
    const data = await res.json();

    if (res.ok) {
      // Populate success page
      document.getElementById('success-ref').textContent = data.refNumber || state.refNumber;
      document.getElementById('s-amount').textContent = `KES ${state.loanAmount.toLocaleString()}`;
      document.getElementById('s-tenor').textContent = `${state.tenor} Month${state.tenor > 1 ? 's' : ''}`;
      document.getElementById('s-monthly').textContent = `KES ${state.monthlyPayment.toLocaleString()}`;
      showPage('success');
    } else {
      toast(data.error || 'Submission error. Please contact support.', 'error');
    }
  } catch {
    toast('Network error during submission. Call +254 700 000 000.', 'error');
  }
}

// ─── Track Application ────────────────────────────────────────────
async function trackApplication() {
  const ref = document.getElementById('track-ref').value.trim();
  if (!ref) { toast('Enter your reference number', 'error'); return; }
  try {
    const res = await fetch(`${API}/api/application/track/${ref}`);
    const data = await res.json();
    const out = document.getElementById('track-result');
    if (!res.ok) { out.innerHTML = `<div class="info-note" style="color:var(--danger)">❌ ${data.error}</div>`; return; }
    const statusColors = { pending:'#D69E2E', approved:'#276749', rejected:'#C53030', disbursed:'#2B6CB0', review:'#6B46C1' };
    out.innerHTML = `
      <div class="result-card" style="text-align:left">
        <div class="result-card-header" style="background:var(--surface)">
          <div class="result-icon">📋</div>
          <div>
            <div class="result-title" style="color:var(--charcoal)">${data.refNumber}</div>
            <div class="result-sub">${data.firstName}'s application</div>
          </div>
        </div>
        <div style="padding:18px 22px">
          <div style="font-size:14px;color:var(--muted);margin-bottom:6px">Loan Amount: <strong>KES ${data.loanAmount?.toLocaleString() || '—'}</strong></div>
          <div style="font-size:14px;color:var(--muted);margin-bottom:6px">Tenor: <strong>${data.tenor || '—'} months</strong></div>
          <div style="font-size:14px">Status: <strong style="color:${statusColors[data.status] || '#333'}">${data.status?.toUpperCase()}</strong></div>
        </div>
      </div>`;
  } catch { toast('Network error', 'error'); }
}

// ─── Init ─────────────────────────────────────────────────────────
calcTerms();
