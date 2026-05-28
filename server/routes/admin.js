const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const { requireAdmin, generateToken } = require('../middleware/auth');
const { LoanApplication, Transaction } = require('../models');

// ─── Admin Login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const validUser = username === process.env.ADMIN_USERNAME;
    const validPass = password === process.env.ADMIN_PASSWORD;

    if (!validUser || !validPass)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ username, role: 'admin' });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Logout ─────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
});

// ─── Dashboard KPIs ───────────────────────────────────────────────
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [total, pending, approved, rejected, disbursed, review] = await Promise.all([
      LoanApplication.countDocuments(),
      LoanApplication.countDocuments({ status: 'pending' }),
      LoanApplication.countDocuments({ status: 'approved' }),
      LoanApplication.countDocuments({ status: 'rejected' }),
      LoanApplication.countDocuments({ status: 'disbursed' }),
      LoanApplication.countDocuments({ status: 'review' }),
    ]);

    const feesAgg = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const feesCollected = feesAgg[0]?.total || 0;

    const disbursedAmtAgg = await LoanApplication.aggregate([
      { $match: { status: { $in: ['approved', 'disbursed'] } } },
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);
    const disbursedAmount = disbursedAmtAgg[0]?.total || 0;

    // 7-day trend
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const trend = await LoanApplication.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const approvalRate = total > 0 ? Math.round(((approved + disbursed) / total) * 100) : 0;

    res.json({
      total, pending, approved, rejected, disbursed, review,
      feesCollected, disbursedAmount, approvalRate, trend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── List Applications ─────────────────────────────────────────────
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { firstName:  new RegExp(search, 'i') },
        { lastName:   new RegExp(search, 'i') },
        { idNumber:   new RegExp(search, 'i') },
        { refNumber:  new RegExp(search, 'i') },
        { phone:      new RegExp(search, 'i') }
      ];
    }

    const [apps, total] = await Promise.all([
      LoanApplication.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      LoanApplication.countDocuments(query)
    ]);

    res.json({ apps, total, pages: Math.ceil(total / limit), current: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get single application ────────────────────────────────────────
router.get('/applications/:id', requireAdmin, async (req, res) => {
  try {
    const app = await LoanApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    const txn = await Transaction.findOne({ applicationId: app._id });
    res.json({ app, transaction: txn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Approve / Reject ─────────────────────────────────────────────
router.patch('/applications/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected', 'review', 'disbursed'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const app = await LoanApplication.findByIdAndUpdate(req.params.id, {
      status, adminNote: adminNote || '',
      reviewedBy: req.admin.username,
      reviewedAt: new Date()
    }, { new: true });

    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Transactions list ─────────────────────────────────────────────
router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const txns = await Transaction.find().sort({ createdAt: -1 }).limit(50);
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
