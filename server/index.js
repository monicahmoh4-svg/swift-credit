require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const path         = require('path');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const pool         = require('./db/pool');

const app = express();

// ─── Security & Middleware ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
      fontSrc:    ["'self'", "fonts.gstatic.com", "fonts.googleapis.com"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  }
}));
app.use(cors({ origin: process.env.APP_URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate Limiting ─────────────────────────────────────────────────
const limiter    = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const payLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 5,
  message: { error: 'Too many payment attempts. Please wait 10 minutes.' }
});
app.use('/api/', limiter);
app.use('/api/mpesa/pay', payLimiter);

// ─── Static Files ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/application', require('./routes/application'));
app.use('/api/mpesa',       require('./routes/mpesa'));
app.use('/api/admin',       require('./routes/admin'));

// ─── Frontend Routes ──────────────────────────────────────────────
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../public/index.html'))
);
app.get('/admin', (req, res) =>
  res.sendFile(path.join(__dirname, '../public/admin/index.html'))
);
app.get('/admin/*', (req, res) =>
  res.sendFile(path.join(__dirname, '../public/admin/index.html'))
);
app.use((req, res) =>
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'))
);

// ─── Start: test DB then listen ───────────────────────────────────
const PORT = process.env.PORT || 3000;

pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Neon Postgres connected');
    app.listen(PORT, () =>
      console.log(`🚀 SwiftCredit running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
