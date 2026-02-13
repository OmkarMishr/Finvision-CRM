const mongoose = require('mongoose');

const feesPaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  feeHead: {
    type: String,
    enum: ['Course Fee', 'Exam Fee', 'Certification Fee', 'Other'],
    required: true
  },
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  couponCode: {
    type: String,
    default: null
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  receiptNo: {
    type: String,
    unique: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  paidDate: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  paymentGatewayRef: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for queries
feesPaymentSchema.index({ studentId: 1 });
feesPaymentSchema.index({ courseId: 1 });
feesPaymentSchema.index({ status: 1 });
feesPaymentSchema.index({ paidDate: 1 });

module.exports = mongoose.model('FeesPayment', feesPaymentSchema);
