const express = require('express');
const router  = express.Router();
const { LoanApplication } = require('../models');

// ─── Create / update application (step by step) ──────────────────
router.post('/start', async (req, res) => {
  try {
    const {
      firstName, lastName, idNumber, kraPin, phone,
      dob, gender, employment, income, email, loanPurpose
    } = req.body;

    // Basic validation
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

// ─── Eligibility check (simulated + scored) ──────────────────────
router.post('/eligibility/:id', async (req, res) => {
  try {
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Score based on income bracket & employment
    let baseScore = 550;
    if (app.income >= 80000) baseScore += 150;
    else if (app.income >= 40000) baseScore += 100;
    else if (app.income >= 20000) baseScore += 50;

    if (app.employment.includes('Formal'))  baseScore += 80;
    if (app.employment.includes('Business')) baseScore += 40;
    if (app.kraPin) baseScore += 30;

    // Add some deterministic variance based on ID
    const seed = parseInt(app.idNumber.slice(-3)) % 100;
    baseScore += seed;

    const creditScore = Math.min(850, Math.max(550, baseScore));
    const maxLoan     = Math.min(500000, Math.round(app.income * 3 / 1000) * 1000);
    const eligible    = creditScore >= 600 && maxLoan >= 5000;

    await LoanApplication.findByIdAndUpdate(req.params.id, {
      creditScore, maxLoan, eligible
    });

    res.json({ success: true, eligible, creditScore, maxLoan, interestRate: 12 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Set loan terms ───────────────────────────────────────────────
router.post('/select/:id', async (req, res) => {
  try {
    const { loanAmount, tenor } = req.body;
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });

    if (loanAmount > app.maxLoan)
      return res.status(400).json({ error: 'Amount exceeds approved maximum' });

    const rate    = 0.12 / 12;
    const months  = parseInt(tenor);
    const monthly = months === 1
      ? loanAmount * (1 + rate)
      : loanAmount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalRepayment = monthly * months;
    const processingFee  = Math.max(300, Math.round(loanAmount * 0.01 / 100) * 100);

    await LoanApplication.findByIdAndUpdate(req.params.id, {
      loanAmount, tenor: months,
      monthlyPayment: Math.round(monthly),
      totalRepayment: Math.round(totalRepayment),
      processingFee
    });

    res.json({
      success: true,
      monthlyPayment: Math.round(monthly),
      totalRepayment: Math.round(totalRepayment),
      processingFee
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Submit final application after payment ────────────────────────
router.post('/submit/:id', async (req, res) => {
  try {
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    if (!app.feePaid) return res.status(400).json({ error: 'Processing fee not paid yet' });

    res.json({
      success: true,
      refNumber: app.refNumber,
      message: 'Application submitted successfully. You will receive an SMS within 24-48 hours.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get application status (for applicant tracking) ─────────────
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
