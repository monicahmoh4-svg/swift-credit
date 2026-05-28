// server/models/index.js
// PostgreSQL query helpers — replaces Mongoose models
const pool = require('../db/pool');

// ─── Reference number generator ───────────────────────────────────
async function generateRefNumber() {
  const result = await pool.query('SELECT COUNT(*) AS cnt FROM loan_applications');
  const count  = parseInt(result.rows[0].cnt) + 1;
  const pad    = String(count).padStart(6, '0');
  return `SC-${new Date().getFullYear()}-${pad}`;
}

// ══════════════════════════════════════════════════════════════════
// LoanApplication helpers
// ══════════════════════════════════════════════════════════════════
const LoanApplication = {

  // Create a new application row
  async create(data) {
    const refNumber = await generateRefNumber();
    const sql = `
      INSERT INTO loan_applications
        (ref_number, first_name, last_name, id_number, kra_pin, phone,
         dob, gender, employment, income, email, loan_purpose)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`;
    const vals = [
      refNumber, data.firstName, data.lastName, data.idNumber,
      data.kraPin || '', data.phone, data.dob, data.gender,
      data.employment, data.income, data.email || '', data.loanPurpose
    ];
    const { rows } = await pool.query(sql, vals);
    return dbRowToApp(rows[0]);
  },

  // Find by numeric id (PK)
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM loan_applications WHERE id = $1', [id]
    );
    return rows[0] ? dbRowToApp(rows[0]) : null;
  },

  // Find by ref_number
  async findOne(filter) {
    if (filter.refNumber) {
      const { rows } = await pool.query(
        'SELECT * FROM loan_applications WHERE ref_number = $1', [filter.refNumber]
      );
      return rows[0] ? dbRowToApp(rows[0]) : null;
    }
    if (filter.lipanaTransId) {
      const { rows } = await pool.query(
        'SELECT * FROM loan_applications WHERE lipana_trans_id = $1', [filter.lipanaTransId]
      );
      return rows[0] ? dbRowToApp(rows[0]) : null;
    }
    return null;
  },

  // Update by id — accepts camelCase field map
  async findByIdAndUpdate(id, updates) {
    const colMap = {
      creditScore:    'credit_score',
      maxLoan:        'max_loan',
      eligible:       'eligible',
      loanAmount:     'loan_amount',
      tenor:          'tenor',
      monthlyPayment: 'monthly_payment',
      totalRepayment: 'total_repayment',
      processingFee:  'processing_fee',
      feePaid:        'fee_paid',
      mpesaCode:      'mpesa_code',
      lipanaTransId:  'lipana_trans_id',
      status:         'status',
      adminNote:      'admin_note',
      reviewedBy:     'reviewed_by',
      reviewedAt:     'reviewed_at',
    };
    const setClauses = [];
    const vals       = [];
    let   idx        = 1;
    for (const [key, val] of Object.entries(updates)) {
      const col = colMap[key];
      if (col) { setClauses.push(`${col} = $${idx++}`); vals.push(val); }
    }
    if (!setClauses.length) return null;
    vals.push(id);
    const sql = `UPDATE loan_applications SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(sql, vals);
    return rows[0] ? dbRowToApp(rows[0]) : null;
  },

  // Count with optional status filter
  async countDocuments(filter = {}) {
    let sql  = 'SELECT COUNT(*) AS cnt FROM loan_applications';
    const vals = [];
    if (filter.status) { sql += ' WHERE status = $1'; vals.push(filter.status); }
    const { rows } = await pool.query(sql, vals);
    return parseInt(rows[0].cnt);
  },

  // List with filters, search, pagination
  async find({ status, search, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const vals       = [];
    let   idx        = 1;

    if (status && status !== 'all') {
      conditions.push(`status = $${idx++}`);
      vals.push(status);
    }
    if (search) {
      conditions.push(`(
        first_name  ILIKE $${idx}   OR
        last_name   ILIKE $${idx}   OR
        id_number   ILIKE $${idx}   OR
        ref_number  ILIKE $${idx}   OR
        phone       ILIKE $${idx}
      )`);
      vals.push(`%${search}%`);
      idx++;
    }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM loan_applications ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...vals, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) AS cnt FROM loan_applications ${where}`, vals)
    ]);

    return {
      apps:  dataRes.rows.map(dbRowToApp),
      total: parseInt(countRes.rows[0].cnt)
    };
  },

  // Dashboard KPI aggregates
  async dashboardStats() {
    const [counts, fees, disbursedAmt, trend] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                          AS total,
          COUNT(*) FILTER (WHERE status = 'pending')       AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')      AS approved,
          COUNT(*) FILTER (WHERE status = 'rejected')      AS rejected,
          COUNT(*) FILTER (WHERE status = 'disbursed')     AS disbursed,
          COUNT(*) FILTER (WHERE status = 'review')        AS review
        FROM loan_applications
      `),
      pool.query(`
        SELECT COALESCE(SUM(amount),0) AS total
        FROM transactions WHERE status = 'success'
      `),
      pool.query(`
        SELECT COALESCE(SUM(loan_amount),0) AS total
        FROM loan_applications
        WHERE status IN ('approved','disbursed')
      `),
      pool.query(`
        SELECT
          TO_CHAR(created_at AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD') AS date,
          COUNT(*) AS count
        FROM loan_applications
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY date
        ORDER BY date ASC
      `)
    ]);

    const c = counts.rows[0];
    const total    = parseInt(c.total);
    const approved = parseInt(c.approved);
    const disbursed= parseInt(c.disbursed);

    return {
      total,
      pending:        parseInt(c.pending),
      approved,
      rejected:       parseInt(c.rejected),
      disbursed,
      review:         parseInt(c.review),
      feesCollected:  parseFloat(fees.rows[0].total),
      disbursedAmount:parseFloat(disbursedAmt.rows[0].total),
      approvalRate:   total > 0 ? Math.round(((approved + disbursed) / total) * 100) : 0,
      trend: trend.rows.map(r => ({ _id: r.date, count: parseInt(r.count) }))
    };
  }
};

// ══════════════════════════════════════════════════════════════════
// Transaction helpers
// ══════════════════════════════════════════════════════════════════
const Transaction = {

  async create(data) {
    const sql = `
      INSERT INTO transactions
        (application_id, ref_number, lipana_trans_id, phone, amount, status)
      VALUES ($1,$2,$3,$4,$5,'pending')
      RETURNING *`;
    const { rows } = await pool.query(sql, [
      data.applicationId, data.refNumber, data.lipanaTransId,
      data.phone, data.amount
    ]);
    return dbRowToTxn(rows[0]);
  },

  async findOne(filter) {
    if (filter.lipanaTransId) {
      const { rows } = await pool.query(
        'SELECT * FROM transactions WHERE lipana_trans_id = $1', [filter.lipanaTransId]
      );
      return rows[0] ? dbRowToTxn(rows[0]) : null;
    }
    if (filter.applicationId) {
      const { rows } = await pool.query(
        'SELECT * FROM transactions WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1',
        [filter.applicationId]
      );
      return rows[0] ? dbRowToTxn(rows[0]) : null;
    }
    return null;
  },

  // Update a transaction row (used in webhook)
  async updateById(id, updates) {
    const colMap = {
      status:     'status',
      mpesaCode:  'mpesa_code',
      rawPayload: 'raw_payload'
    };
    const setClauses = [];
    const vals       = [];
    let   idx        = 1;
    for (const [key, val] of Object.entries(updates)) {
      const col = colMap[key];
      if (col) {
        setClauses.push(`${col} = $${idx++}`);
        vals.push(col === 'raw_payload' ? JSON.stringify(val) : val);
      }
    }
    if (!setClauses.length) return null;
    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals
    );
    return rows[0] ? dbRowToTxn(rows[0]) : null;
  },

  async findAll(limit = 50) {
    const { rows } = await pool.query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1', [limit]
    );
    return rows.map(dbRowToTxn);
  }
};

// ─── Row mappers: snake_case DB → camelCase JS ────────────────────
function dbRowToApp(r) {
  if (!r) return null;
  return {
    _id:            r.id,           // expose as _id for route compatibility
    id:             r.id,
    refNumber:      r.ref_number,
    firstName:      r.first_name,
    lastName:       r.last_name,
    idNumber:       r.id_number,
    kraPin:         r.kra_pin,
    phone:          r.phone,
    dob:            r.dob,
    gender:         r.gender,
    employment:     r.employment,
    income:         parseFloat(r.income),
    email:          r.email,
    loanPurpose:    r.loan_purpose,
    creditScore:    r.credit_score,
    maxLoan:        parseFloat(r.max_loan),
    eligible:       r.eligible,
    loanAmount:     parseFloat(r.loan_amount),
    tenor:          r.tenor,
    monthlyPayment: parseFloat(r.monthly_payment),
    totalRepayment: parseFloat(r.total_repayment),
    processingFee:  parseFloat(r.processing_fee),
    feePaid:        r.fee_paid,
    mpesaCode:      r.mpesa_code,
    lipanaTransId:  r.lipana_trans_id,
    status:         r.status,
    adminNote:      r.admin_note,
    reviewedBy:     r.reviewed_by,
    reviewedAt:     r.reviewed_at,
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
  };
}

function dbRowToTxn(r) {
  if (!r) return null;
  return {
    _id:           r.id,
    id:            r.id,
    applicationId: r.application_id,
    refNumber:     r.ref_number,
    lipanaTransId: r.lipana_trans_id,
    phone:         r.phone,
    amount:        parseFloat(r.amount),
    status:        r.status,
    mpesaCode:     r.mpesa_code,
    rawPayload:    r.raw_payload,
    createdAt:     r.created_at,
    updatedAt:     r.updated_at,
  };
}

module.exports = { LoanApplication, Transaction };
