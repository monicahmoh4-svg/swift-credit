const express   = require('express');
const axios     = require('axios');
const router    = express.Router();
const { LoanApplication, Transaction } = require('../models');

const LIPANA_BASE   = process.env.LIPANA_BASE_URL || 'https://api.lipana.dev';
const LIPANA_SECRET = process.env.LIPANA_SECRET_KEY;
const APP_URL       = process.env.APP_URL || 'http://localhost:3000';

// ─── Initiate STK Push ────────────────────────────────────────────
router.post('/pay', async (req, res) => {
  const { applicationId, phone } = req.body;

  try {
    const app = await LoanApplication.findById(applicationId);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.feePaid)  return res.status(400).json({ error: 'Fee already paid' });

    // Format phone: ensure 254XXXXXXXXX format
    let formattedPhone = phone.toString().replace(/\s/g, '');
    if (formattedPhone.startsWith('0'))    formattedPhone = '254' + formattedPhone.slice(1);
    if (formattedPhone.startsWith('+'))    formattedPhone = formattedPhone.slice(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    const payload = {
      phone:        formattedPhone,
      amount:       app.processingFee,
      reference:    app.refNumber,
      description:  `SwiftCredit processing fee for loan ${app.refNumber}`,
      callback_url: `${APP_URL}/api/mpesa/webhook`
    };

    const response = await axios.post(`${LIPANA_BASE}/v1/stk-push`, payload, {
      headers: {
        Authorization: `Bearer ${LIPANA_SECRET}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const transactionId = response.data?.transactionId
                       || response.data?.data?.transactionId
                       || response.data?.id;

    if (!transactionId) {
      console.error('Lipana response missing transactionId:', response.data);
      return res.status(500).json({ error: 'STK push failed: no transaction ID returned' });
    }

    // Save pending transaction
    await Transaction.create({
      applicationId: app._id,
      refNumber:     app.refNumber,
      lipanaTransId: transactionId,
      phone:         formattedPhone,
      amount:        app.processingFee,
      status:        'pending'
    });

    res.json({ success: true, transactionId, message: 'STK Push sent. Check your phone.' });

  } catch (err) {
    console.error('STK Push error:', err?.response?.data || err.message);
    res.status(500).json({
      error: 'Could not initiate payment. Please check phone number and try again.',
      details: err?.response?.data || err.message
    });
  }
});

// ─── Webhook: Lipana → Our server ────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const body    = req.body;
    const payload = body.data || body;

    // Handle both camelCase and snake_case
    const txnId  = payload.transactionId || payload.transaction_id || body.transactionId;
    const event  = body.event || body.type || '';
    const mpesaCode = payload.mpesaCode || payload.mpesa_code || payload.MpesaReceiptNumber || '';

    console.log('Lipana webhook received:', JSON.stringify(body, null, 2));

    if (!txnId) {
      console.warn('Webhook received without transactionId');
      return res.status(200).send('OK');
    }

    const txn = await Transaction.findOne({ lipanaTransId: txnId });
    if (!txn) {
      console.warn('No transaction found for ID:', txnId);
      return res.status(200).send('OK');
    }

    if (event.includes('success') || event.includes('complete') || body.ResultCode === 0) {
      txn.status    = 'success';
      txn.mpesaCode = mpesaCode;
      await txn.save();

      // Update application
      await LoanApplication.findByIdAndUpdate(txn.applicationId, {
        feePaid:       true,
        mpesaCode:     mpesaCode,
        lipanaTransId: txnId,
        status:        'pending'
      });

    } else if (event.includes('fail') || event.includes('cancel') || body.ResultCode !== 0) {
      txn.status = 'failed';
      txn.rawPayload = body;
      await txn.save();
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(200).send('OK'); // Always 200 to Lipana
  }
});

// ─── Poll payment status ──────────────────────────────────────────
router.get('/status/:transactionId', async (req, res) => {
  try {
    const txn = await Transaction.findOne({ lipanaTransId: req.params.transactionId });
    if (!txn) return res.json({ status: 'pending', message: 'Transaction not found yet' });

    res.json({
      status:    txn.status,
      mpesaCode: txn.mpesaCode || '',
      amount:    txn.amount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
