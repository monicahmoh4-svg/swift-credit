// server/db/migrate.js
// Run once: node server/db/migrate.js
require('dotenv').config();
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔧 Running migrations on Neon Postgres...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS loan_applications (
        id               SERIAL PRIMARY KEY,
        ref_number       VARCHAR(30)  UNIQUE,
        first_name       VARCHAR(100) NOT NULL,
        last_name        VARCHAR(100) NOT NULL,
        id_number        VARCHAR(20)  NOT NULL,
        kra_pin          VARCHAR(20)  DEFAULT '',
        phone            VARCHAR(20)  NOT NULL,
        dob              VARCHAR(20)  NOT NULL,
        gender           VARCHAR(30)  NOT NULL,
        employment       VARCHAR(100) NOT NULL,
        income           NUMERIC      NOT NULL,
        email            VARCHAR(150) DEFAULT '',
        loan_purpose     VARCHAR(100) NOT NULL,

        credit_score     INT          DEFAULT 0,
        max_loan         NUMERIC      DEFAULT 0,
        eligible         BOOLEAN      DEFAULT FALSE,

        loan_amount      NUMERIC      DEFAULT 0,
        tenor            INT          DEFAULT 0,
        monthly_payment  NUMERIC      DEFAULT 0,
        total_repayment  NUMERIC      DEFAULT 0,
        processing_fee   NUMERIC      DEFAULT 0,

        fee_paid         BOOLEAN      DEFAULT FALSE,
        mpesa_code       VARCHAR(30)  DEFAULT '',
        lipana_trans_id  VARCHAR(100) DEFAULT '',

        status           VARCHAR(20)  DEFAULT 'draft'
                         CHECK (status IN ('draft','pending','review','approved','rejected','disbursed')),
        admin_note       TEXT         DEFAULT '',
        reviewed_by      VARCHAR(100) DEFAULT '',
        reviewed_at      TIMESTAMPTZ,

        created_at       TIMESTAMPTZ  DEFAULT NOW(),
        updated_at       TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id               SERIAL PRIMARY KEY,
        application_id   INT          REFERENCES loan_applications(id) ON DELETE SET NULL,
        ref_number       VARCHAR(30),
        lipana_trans_id  VARCHAR(100) UNIQUE,
        phone            VARCHAR(20),
        amount           NUMERIC,
        status           VARCHAR(20)  DEFAULT 'pending'
                         CHECK (status IN ('pending','success','failed')),
        mpesa_code       VARCHAR(30)  DEFAULT '',
        raw_payload      JSONB,
        created_at       TIMESTAMPTZ  DEFAULT NOW(),
        updated_at       TIMESTAMPTZ  DEFAULT NOW()
      );
    `);

    // Auto-update updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_loan_applications_updated_at ON loan_applications;
      CREATE TRIGGER trg_loan_applications_updated_at
        BEFORE UPDATE ON loan_applications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
      CREATE TRIGGER trg_transactions_updated_at
        BEFORE UPDATE ON transactions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    // Indexes for common queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_loan_apps_status     ON loan_applications(status);
      CREATE INDEX IF NOT EXISTS idx_loan_apps_created_at ON loan_applications(created_at);
      CREATE INDEX IF NOT EXISTS idx_loan_apps_ref        ON loan_applications(ref_number);
      CREATE INDEX IF NOT EXISTS idx_loan_apps_id_number  ON loan_applications(id_number);
      CREATE INDEX IF NOT EXISTS idx_txn_lipana_id        ON transactions(lipana_trans_id);
      CREATE INDEX IF NOT EXISTS idx_txn_app_id           ON transactions(application_id);
    `);

    console.log('✅ Migration complete — all tables created.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
