const express = require('express');
const router  = express.Router();
const { LoanApplication } = require('../models');

const MIN_LOAN = 1000;
const MAX_LOAN = 115000;
const FEE_RATE = 0.10; // 10% of loan amount

function calcProcessingFee(amount) {
  return Math.round(amount * FEE_RATE);
}

// ─── Create application (Step 1) ─────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const {
      firstName, lastName, idNumber, kraPin, phone,
      dob, gender, employment, income, email, loanPurpose
    } = req.body;

    if (!firstName || !lastName || !idNumber || !phone || !dob || !employment || !income || !loanPurpose)
      return res.status(400).json({ error: 'All required fields must be filled' });

    if (!/^\d{8}$/.test(idNumber))
      return res.status(400).json({ error: 'Invalid ID number (must be 8 digits)' });

    const app = await LoanApplication.create({
      firstName, lastName, idNumber: idNumber.trim(), kraPin: kraPin || '',
      phone: phone.toString().trim(), dob, gender, employment,
      income: Number(income), email: email || '', loanPurpose
    });

    res.json({ success: true, applicationId: app._id, refNumber: app.refNumber });
  } catch (err) {
    console.error('Start application error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── Eligibility check (Step 2) ──────────────────────────────────
router.post('/eligibility/:id', async (req, res) => {
  try {
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    let baseScore = 550;
    if      (app.income >= 100000) baseScore += 160;
    else if (app.income >=  60000) baseScore += 120;
    else if (app.income >=  30000) baseScore +=  80;
    else if (app.income >=  15000) baseScore +=  40;
    else if (app.income >=   5000) baseScore +=  15;

    if (app.employment.includes('Formal'))     baseScore += 80;
    if (app.employment.includes('Business'))   baseScore += 50;
    if (app.employment.includes('Freelancer')) baseScore += 20;
    if (app.kraPin) baseScore += 30;

    const seed = parseInt(app.idNumber.slice(-3)) % 60;
    baseScore += seed;

    const creditScore = Math.min(850, Math.max(520, baseScore));

    // Max loan capped at KES 115,000. Income-linked: up to 3× monthly income,
    // never exceeding MAX_LOAN, never below MIN_LOAN.
    const incomeLinked = Math.round((app.income * 3) / 1000) * 1000;
    const maxLoan = Math.min(MAX_LOAN, Math.max(MIN_LOAN, incomeLinked));
    const eligible = creditScore >= 580 && maxLoan >= MIN_LOAN;

    await LoanApplication.findByIdAndUpdate(req.params.id, { creditScore, maxLoan, eligible });

    res.json({ success: true, eligible, creditScore, maxLoan, interestRate: 12 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Select loan amount & tenor (Step 3) ─────────────────────────
router.post('/select/:id', async (req, res) => {
  try {
    const { loanAmount, tenor } = req.body;
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });

    if (loanAmount < MIN_LOAN)
      return res.status(400).json({ error: `Minimum loan amount is KES ${MIN_LOAN.toLocaleString()}` });
    if (loanAmount > MAX_LOAN)
      return res.status(400).json({ error: `Maximum loan amount is KES ${MAX_LOAN.toLocaleString()}` });
    if (loanAmount > app.maxLoan)
      return res.status(400).json({ error: 'Amount exceeds your approved maximum' });

    const rate    = 0.12 / 12;
    const months  = parseInt(tenor);
    const monthly = months === 1
      ? loanAmount * (1 + rate)
      : loanAmount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalRepayment = monthly * months;
    const processingFee  = calcProcessingFee(loanAmount);

    await LoanApplication.findByIdAndUpdate(req.params.id, {
      loanAmount,
      tenor: months,
      monthlyPayment:  Math.round(monthly),
      totalRepayment:  Math.round(totalRepayment),
      processingFee
    });

    res.json({
      success: true,
      monthlyPayment:  Math.round(monthly),
      totalRepayment:  Math.round(totalRepayment),
      processingFee
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Final submit after fee paid (Step 4) ────────────────────────
router.post('/submit/:id', async (req, res) => {
  try {
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    if (!app.feePaid) return res.status(400).json({ error: 'Processing fee not yet confirmed' });

    res.json({
      success: true,
      refNumber: app.refNumber,
      message: 'Application submitted. You will be contacted within 24–48 hours.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Track by reference number ────────────────────────────────────
router.get('/track/:ref', async (req, res) => {
  try {
    const app = await LoanApplication.findOne({ refNumber: req.params.ref })
      .select('refNumber firstName status loanAmount tenor createdAt');
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
