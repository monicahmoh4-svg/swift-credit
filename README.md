# SwiftCredit — Loan Application Platform

A professional, full-stack loan application platform built for Kenyan borrowers with M-Pesa (Lipana) payment integration, real-time eligibility checking, and a secure admin dashboard.

---

## 🗂️ Project Structure

```
swiftcredit/
├── server/
│   ├── index.js              # Express app entry point
│   ├── models/
│   │   └── index.js          # Mongoose schemas (LoanApplication, Transaction)
│   ├── routes/
│   │   ├── application.js    # /api/application/* — user-facing loan flow
│   │   ├── mpesa.js          # /api/mpesa/* — Lipana STK Push + webhook
│   │   └── admin.js          # /api/admin/* — protected admin CRUD
│   └── middleware/
│       └── auth.js           # JWT admin auth middleware
├── public/
│   ├── index.html            # User-facing SPA (landing + apply flow)
│   ├── 404.html              # 404 page
│   ├── css/
│   │   └── main.css          # User frontend styles
│   ├── js/
│   │   └── main.js           # User frontend logic + API calls
│   └── admin/
│       ├── index.html        # Admin dashboard (only at /admin)
│       └── admin.js          # Admin dashboard logic + API calls
├── .env.example              # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 User Flow

1. **Landing Page** → Click "Apply Now"
2. **Step 1** — Fill personal details (name, National ID, Safaricom number, income, etc.)
3. **Step 2** — Automatic eligibility check (IPRS, CRB, risk score)
4. **Step 3** — Choose loan amount (slider + quick select) and repayment tenor
5. **Step 4** — Pay processing fee via M-Pesa STK Push (Lipana integration)
6. **Success** — Application submitted with reference number

---

## 🔐 Admin Portal

Accessible **only** at `/admin` — no link from the frontend.

**Features:**
- Secure JWT login (credentials in env vars)
- KPI dashboard (total apps, pending, disbursed, approval rate)
- 7-day application trend chart
- Full applications table with search, filter, pagination
- Approve / Reject / Disburse actions per application
- Loan detail modal with admin notes
- Disbursements management tab
- Customer database tab
- M-Pesa transactions tab
- CSV export
- Risk & Compliance tab
- System settings

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```env
# Server
PORT=3000
NODE_ENV=production

# MongoDB Atlas
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/swiftcredit?retryWrites=true&w=majority

# Lipana M-Pesa API  ← Get from https://lipana.dev dashboard
LIPANA_SECRET_KEY=lip_sk_live_YOUR_LIPANA_SECRET_KEY_HERE
LIPANA_BASE_URL=https://api.lipana.dev

# Your deployed app URL (update after Render deployment)
APP_URL=https://your-app-name.onrender.com

# Admin credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SwiftCredit@Admin2024!
ADMIN_JWT_SECRET=replace_with_64_char_random_string_here_use_openssl_rand_hex_32
SESSION_SECRET=another_long_random_string_here

# Processing fee
PROCESSING_FEE=500
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🖥️ Local Development

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/swiftcredit.git
cd swiftcredit
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Run dev server
npm run dev

# Visit:
# User app:  http://localhost:3000
# Admin:     http://localhost:3000/admin
```

---

## ☁️ Deploying to Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — SwiftCredit"
git remote add origin https://github.com/YOUR_USERNAME/swiftcredit.git
git push -u origin main
```

### Step 2 — Create MongoDB Atlas Database (free tier)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free account
2. Create a free M0 cluster
3. Under **Database Access** → Add user with password
4. Under **Network Access** → Allow access from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → Copy the connection string
6. Replace `<password>` in the string with your DB user password

### Step 3 — Deploy on Render

1. Go to [render.com](https://render.com) → Sign up / Login
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `swiftcredit` (or your preferred name)
   - **Region:** Any (choose closest to Kenya)
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or Starter for production)

5. Add **Environment Variables** (from your `.env`):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas URI |
| `LIPANA_SECRET_KEY` | Your Lipana secret key |
| `LIPANA_BASE_URL` | `https://api.lipana.dev` |
| `APP_URL` | `https://your-app.onrender.com` ← update after first deploy |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | Your chosen strong password |
| `ADMIN_JWT_SECRET` | 64-char random string |
| `SESSION_SECRET` | 64-char random string |
| `PROCESSING_FEE` | `500` |

6. Click **Create Web Service** → Wait for deployment (~2-3 mins)
7. Copy the deployed URL → Update `APP_URL` env var in Render settings → Redeploy

### Step 4 — Configure Lipana Webhook

1. Log in to your [Lipana dashboard](https://lipana.dev)
2. Navigate to **Settings** → **Webhooks**
3. Add webhook URL: `https://your-app.onrender.com/api/mpesa/webhook`
4. Save and test

---

## 📋 Add All These Environment Variables to Render

Go to **Render → Your Service → Environment → Add Environment Variable** for each:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://...
LIPANA_SECRET_KEY=lip_sk_live_...
LIPANA_BASE_URL=https://api.lipana.dev
APP_URL=https://your-app-name.onrender.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_JWT_SECRET=<64 char random hex>
SESSION_SECRET=<64 char random hex>
PROCESSING_FEE=500
```

---

## 🔗 Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/application/start` | Create new application |
| POST | `/api/application/eligibility/:id` | Run eligibility check |
| POST | `/api/application/select/:id` | Set loan amount & tenor |
| POST | `/api/application/submit/:id` | Final submission after payment |
| GET | `/api/application/track/:ref` | Track by reference number |
| POST | `/api/mpesa/pay` | Initiate Lipana STK Push |
| GET | `/api/mpesa/status/:txnId` | Poll payment status |
| POST | `/api/mpesa/webhook` | Lipana payment webhook |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/dashboard` | Dashboard KPIs |
| GET | `/api/admin/applications` | List applications |
| PATCH | `/api/admin/applications/:id/status` | Approve/Reject |
| GET | `/api/admin/transactions` | List transactions |

---

## 🛡️ Security Features

- Helmet.js for HTTP security headers
- Rate limiting (100 req/15min general, 5 req/10min for payments)
- JWT-based admin auth (httpOnly cookie + header)
- `noindex, nofollow` meta on admin page
- Input validation on all endpoints
- Environment variables for all secrets
- CORS configured to app URL only

---

## 📞 Support

- **User-facing app:** `https://your-app.onrender.com`
- **Admin portal:** `https://your-app.onrender.com/admin`
- Admin login: use credentials from your env vars

---

*Built with Express.js, MongoDB, Lipana M-Pesa API, and vanilla JS frontend.*
