const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['PERCENT', 'FLAT'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  // Renamed from `maxUses` → `maxUsage` to match the frontend admin settings
  // payload. 0 means unlimited.
  maxUsage: {
    type: Number,
    default: 0,
    alias: 'maxUses'
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  // Renamed from `validUntil` → `expiryDate` to match the frontend payload.
  // null = never expires.
  expiryDate: {
    type: Date,
    default: null,
    alias: 'validUntil'
  },
  applicableCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  minAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

couponSchema.methods.isValid = function (currentDate = new Date()) {
  if (!this.isActive) return false;
  if (this.validFrom && currentDate < this.validFrom) return false;
  if (this.expiryDate && currentDate > this.expiryDate) return false;
  if (this.maxUsage > 0 && this.usedCount >= this.maxUsage) return false;
  return true;
};

couponSchema.index({ validFrom: 1, expiryDate: 1 });
couponSchema.index({ isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
