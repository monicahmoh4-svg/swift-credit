const express = require('express');
const router  = express.Router();
const { requireAdmin, generateToken } = require('../middleware/auth');
const { LoanApplication, Transaction } = require('../models');

// ─── Login ────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ username, role: 'admin' });
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   8 * 60 * 60 * 1000
    });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Logout ───────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
});

// ─── Dashboard KPIs ───────────────────────────────────────────────
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const stats = await LoanApplication.dashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── List Applications ────────────────────────────────────────────
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const { apps, total } = await LoanApplication.find({
      status, search, page: Number(page), limit: Number(limit)
    });
    res.json({
      apps,
      total,
      pages:   Math.ceil(total / limit),
      current: Number(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get single application ───────────────────────────────────────
router.get('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    const transaction = await Transaction.findOne({ applicationId: app.id });
    res.json({ app, transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update status (approve / reject / disburse) ─────────────────
router.patch('/applications/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved','rejected','review','disbursed'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const app = await LoanApplication.findByIdAndUpdate(req.params.id, {
      status,
      adminNote:  adminNote || '',
      reviewedBy: req.admin.username,
      reviewedAt: new Date()
    });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Transactions ─────────────────────────────────────────────────
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const txns = await Transaction.findAll(50);
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
