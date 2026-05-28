const mongoose = require('mongoose');

// ─── Loan Application ───────────────────────────────────────────
const loanApplicationSchema = new mongoose.Schema({
  refNumber: { type: String, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  idNumber:  { type: String, required: true },
  kraPin:    { type: String, default: '' },
  phone:     { type: String, required: true },
  dob:       { type: String, required: true },
  gender:    { type: String, required: true },
  employment:{ type: String, required: true },
  income:    { type: Number, required: true },
  email:     { type: String, default: '' },
  loanPurpose: { type: String, required: true },

  // Eligibility
  creditScore: { type: Number, default: 0 },
  maxLoan:     { type: Number, default: 0 },
  eligible:    { type: Boolean, default: false },

  // Loan selection
  loanAmount:    { type: Number, default: 0 },
  tenor:         { type: Number, default: 0 },
  monthlyPayment:{ type: Number, default: 0 },
  totalRepayment:{ type: Number, default: 0 },
  processingFee: { type: Number, default: 500 },

  // Payment
  feePaid:       { type: Boolean, default: false },
  mpesaCode:     { type: String, default: '' },
  lipanaTransId: { type: String, default: '' },

  // Status
  status: {
    type: String,
    enum: ['draft','pending','review','approved','rejected','disbursed'],
    default: 'draft'
  },
  adminNote: { type: String, default: '' },
  reviewedBy: { type: String, default: '' },
  reviewedAt: { type: Date },

}, { timestamps: true });

loanApplicationSchema.pre('save', async function(next) {
  if (!this.refNumber) {
    const count = await mongoose.model('LoanApplication').countDocuments();
    const pad = String(count + 1).padStart(6, '0');
    this.refNumber = `SC-${new Date().getFullYear()}-${pad}`;
  }
  next();
});

// ─── Transaction ───────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication' },
  refNumber:     { type: String },
  lipanaTransId: { type: String, unique: true },
  phone:         { type: String },
  amount:        { type: Number },
  status: {
    type: String,
    enum: ['pending','success','failed'],
    default: 'pending'
  },
  mpesaCode:     { type: String, default: '' },
  rawPayload:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);
const Transaction     = mongoose.model('Transaction', transactionSchema);

module.exports = { LoanApplication, Transaction };
