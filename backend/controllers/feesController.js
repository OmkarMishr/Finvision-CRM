const FeesPayment = require('../models/FeesPayment');
const Coupon = require('../models/Coupon');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Path to your letterhead template
const LETTERHEAD_PATH = path.join(__dirname, '../templates/letterhead-template.pdf');

// Color palette
const COLOR = {
  primary: rgb(200 / 255, 41 / 255, 74 / 255),   // #C8294A  red
  black: rgb(26 / 255, 26 / 255, 26 / 255),
  darkGray: rgb(51 / 255, 51 / 255, 51 / 255),
  midGray: rgb(102 / 255, 102 / 255, 102 / 255),
  lightGray: rgb(180 / 255, 180 / 255, 180 / 255),
  green: rgb(5 / 255, 150 / 255, 105 / 255),
  white: rgb(1, 1, 1),
  highlight: rgb(250 / 255, 236 / 255, 240 / 255),  // Light red background
};

// Generate receipt number from timestamp + random
const generateReceiptNo = async () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FVFEES${timestamp}${random}`;
};

// Format currency
const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;

// Format date
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// ─────────────────────────────────────────────────────────────────────────────
// Helper: draw a horizontal rule
// ─────────────────────────────────────────────────────────────────────────────
const drawLine = (page, x1, y, x2, color = COLOR.lightGray, thickness = 0.8) => {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness,
    color,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: draw a labeled row (left label, right value)
// ─────────────────────────────────────────────────────────────────────────────
const drawRow = (page, fonts, leftX, rightX, y, label, value, opts = {}) => {
  page.drawText(label, {
    x: leftX,
    y,
    size: opts.labelSize || 10,
    font: opts.labelBold ? fonts.bold : fonts.regular,
    color: opts.labelColor || COLOR.midGray,
  });

  page.drawText(value, {
    x: rightX - (opts.valueWidth || 100),
    y,
    size: opts.valueSize || 10,
    font: opts.valueBold ? fonts.bold : fonts.regular,
    color: opts.valueColor || COLOR.darkGray,
    width: opts.valueWidth || 100,
    lineBreakMode: 'none',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Core: fill letterhead template with receipt data
// ─────────────────────────────────────────────────────────────────────────────
const buildReceiptPDF = async (payment) => {
  // Load letterhead
  const templateBytes = await fs.readFile(LETTERHEAD_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Embed fonts
  const fonts = {
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
  };

  // Content boundaries — adjust headerClear/footerClear to match
  // how tall the header and footer are in your letterhead template
  const headerClear = 150;  // px from top to clear letterhead header
  const footerClear = 70;   // px from bottom to clear letterhead footer
  const leftX = 50;
  const rightX = width - 50;
  const contentWidth = rightX - leftX;

  let y = height - headerClear;

  // ── PAYMENT RECEIPT title ─────────────────────────────────────────────────
  const titleText = 'PAYMENT RECEIPT';
  const titleWidth = fonts.bold.widthOfTextAtSize(titleText, 18);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y,
    size: 18,
    font: fonts.bold,
    color: COLOR.primary,
  });

  y -= 8;

  // Thick red underline under title
  page.drawLine({
    start: { x: (width - 140) / 2, y },
    end: { x: (width + 140) / 2, y },
    thickness: 2.5,
    color: COLOR.primary,
  });

  y -= 20;

  // ── Receipt No and Date on same line ──────────────────────────────────────
  page.drawText(`Receipt No: ${payment.receiptNo}`, {
    x: leftX,
    y,
    size: 9,
    font: fonts.bold,
    color: COLOR.darkGray,
  });

  page.drawText(`Date: ${formatDate(payment.paidDate)}`, {
    x: rightX - 120,
    y,
    size: 9,
    font: fonts.regular,
    color: COLOR.darkGray,
  });

  y -= 14;
  drawLine(page, leftX, y, rightX);

  y -= 20;

  // ── STUDENT DETAILS ───────────────────────────────────────────────────────
  page.drawText('Student Details', {
    x: leftX,
    y,
    size: 11,
    font: fonts.bold,
    color: COLOR.black,
  });

  y -= 16;

  const studentRows = [
    { label: 'Name', value: payment.studentId.fullName },
    { label: 'Admission No', value: payment.studentId.admissionNumber },
    { label: 'Mobile', value: String(payment.studentId.mobile) },
  ];
  if (payment.studentId.email) {
    studentRows.push({ label: 'Email', value: payment.studentId.email });
  }

  studentRows.forEach(row => {
    drawRow(page, fonts, leftX, rightX, y, `${row.label}:`, row.value, {
      labelBold: true,
      labelColor: COLOR.midGray,
      valueColor: COLOR.darkGray,
      valueWidth: contentWidth - 90,
    });
    y -= 14;
  });

  y -= 8;
  drawLine(page, leftX, y, rightX);
  y -= 20;

  // ── PAYMENT DETAILS ───────────────────────────────────────────────────────
  page.drawText('Payment Details', {
    x: leftX,
    y,
    size: 11,
    font: fonts.bold,
    color: COLOR.black,
  });

  y -= 16;

  drawRow(page, fonts, leftX, rightX, y, 'Fee Head:', payment.feeHead, {
    labelBold: true,
    labelColor: COLOR.midGray,
    valueColor: COLOR.darkGray,
    valueWidth: contentWidth - 90,
  });
  y -= 14;

  drawRow(page, fonts, leftX, rightX, y, 'Course:', payment.courseId?.courseCategory || 'N/A', {
    labelBold: true,
    labelColor: COLOR.midGray,
    valueColor: COLOR.darkGray,
    valueWidth: contentWidth - 90,
  });
  y -= 20;

  // Coupon breakdown
  if (payment.couponCode) {
    drawRow(page, fonts, leftX, rightX, y, 'Base Amount:', formatCurrency(payment.baseAmount), {
      labelBold: false,
      labelColor: COLOR.midGray,
      valueColor: COLOR.darkGray,
    });
    y -= 14;

    page.drawText(`Coupon Applied: ${payment.couponCode}`, {
      x: leftX,
      y,
      size: 10,
      font: fonts.regular,
      color: COLOR.green,
    });
    y -= 14;

    drawRow(page, fonts, leftX, rightX, y, 'Discount:', `- ${formatCurrency(payment.couponDiscount)}`, {
      labelBold: false,
      labelColor: COLOR.midGray,
      valueColor: COLOR.green,
    });
    y -= 16;

    // Thin separator before total
    drawLine(page, leftX, y, rightX, COLOR.lightGray, 0.5);
    y -= 12;
  }

  // ── AMOUNT PAID highlighted row ───────────────────────────────────────────
  page.drawRectangle({
    x: leftX - 6,
    y: y - 6,
    width: contentWidth + 12,
    height: 24,
    color: COLOR.highlight,
  });

  page.drawText('Amount Paid:', {
    x: leftX,
    y,
    size: 11,
    font: fonts.bold,
    color: COLOR.black,
  });

  const amountText = formatCurrency(payment.amount);
  const amountTextWidth = fonts.bold.widthOfTextAtSize(amountText, 11);
  page.drawText(amountText, {
    x: rightX - amountTextWidth,
    y,
    size: 11,
    font: fonts.bold,
    color: COLOR.primary,
  });

  y -= 28;

  // Payment mode and status
  drawRow(page, fonts, leftX, rightX, y, 'Payment Mode:', payment.paymentMode, {
    labelBold: true,
    labelColor: COLOR.midGray,
    valueColor: COLOR.darkGray,
  });
  y -= 14;

  page.drawText('Status:', {
    x: leftX,
    y,
    size: 10,
    font: fonts.bold,
    color: COLOR.midGray,
  });

  const statusColor =
    payment.status === 'SUCCESS' || payment.status === 'Completed'
      ? COLOR.green
      : COLOR.primary;

  page.drawText(payment.status, {
    x: leftX + 90,
    y,
    size: 10,
    font: fonts.bold,
    color: statusColor,
  });

  y -= 24;
  drawLine(page, leftX, y, rightX);
  y -= 20;

  // ── Thank you message ─────────────────────────────────────────────────────
  const thanksText = 'Thank you for your payment!';
  const thanksWidth = fonts.bold.widthOfTextAtSize(thanksText, 11);
  page.drawText(thanksText, {
    x: (width - thanksWidth) / 2,
    y,
    size: 11,
    font: fonts.bold,
    color: COLOR.primary,
  });

  y -= 16;

  // Disclaimer
  const disclaimer = 'This is a computer-generated receipt and does not require a signature.';
  const disclaimerWidth = fonts.regular.widthOfTextAtSize(disclaimer, 8);
  page.drawText(disclaimer, {
    x: (width - disclaimerWidth) / 2,
    y,
    size: 8,
    font: fonts.regular,
    color: COLOR.lightGray,
  });

  // Note: contact details and footer are already in the letterhead template

  return await pdfDoc.save();
};


// ─────────────────────────────────────────────────────────────────────────────
// Get pending fees for student
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('courseId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const totalPaid = await FeesPayment.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: 'SUCCESS'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const courseFee = student.totalFees || student.courseId?.fee || 0;
    const pendingAmount = Math.max(0, courseFee - (totalPaid[0]?.total || 0));

    const dueDate = new Date(student.admissionDate);
    dueDate.setDate(dueDate.getDate() + 30);

    res.json({
      success: true,
      data: {
        totalFee: courseFee,
        pendingAmount,
        dueDate: pendingAmount > 0 ? dueDate : null,
        feeHead: 'Course Fee',
        courseId: student.courseId?._id
      }
    });
  } catch (error) {
    console.error('Get pending fees error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Get payment history
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await FeesPayment.find({ studentId })
      .populate('courseId', 'courseCategory')
      .sort({ paidDate: -1, createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Validate coupon
// ─────────────────────────────────────────────────────────────────────────────
exports.validateCoupon = async (req, res) => {
  try {
    console.log('Validate coupon request body:', req.body);

    if (!req.body) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const { code, studentId, courseId } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Coupon not found' });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired or reached maximum usage'
      });
    }

    if (courseId && coupon.applicableCourses.length > 0) {
      const courseIds = coupon.applicableCourses.map(id => id.toString());
      if (!courseIds.includes(courseId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not applicable for this course'
        });
      }
    }

    res.json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minAmount: coupon.minAmount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating coupon',
      error: error.message
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Record payment
// ─────────────────────────────────────────────────────────────────────────────
exports.collectPayment = async (req, res) => {
  try {
    const { studentId, courseId, amount, baseAmount, couponCode, paymentMode, feeHead } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid()) {
        if (coupon.discountType === 'PERCENT') {
          couponDiscount = (baseAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          }
        } else {
          couponDiscount = coupon.discountValue;
        }
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const receiptNo = await generateReceiptNo();

    const payment = new FeesPayment({
      studentId,
      courseId: courseId || student.courseId,
      feeHead: feeHead || 'Course Fee',
      baseAmount: baseAmount || amount,
      amount,
      couponCode: couponCode || null,
      couponDiscount,
      paymentMode,
      status: 'SUCCESS',
      receiptNo,
      paidDate: new Date()
    });

    await payment.save();

    // Sync Student document fee fields after every payment
    const totalPaidAgg = await FeesPayment.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: 'SUCCESS'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaidSoFar = totalPaidAgg[0]?.total || 0;

    await Student.findByIdAndUpdate(studentId, {
      paidFees: totalPaidSoFar,
      pendingFees: Math.max(0, (student.totalFees || 0) - totalPaidSoFar),
      lastPaymentDate: new Date()
    });


    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Collect payment error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Generate receipt PDF using letterhead template
// @route GET /api/fees/receipt/:paymentId
// ─────────────────────────────────────────────────────────────────────────────
exports.generateReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await FeesPayment.findById(paymentId)
      .populate('studentId', 'fullName mobile admissionNumber email')
      .populate('courseId', 'courseCategory');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const pdfBytes = await buildReceiptPDF(payment);

    const filename = `Receipt_${payment.receiptNo}_${payment.studentId.admissionNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBytes.length);

    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Receipt generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Admin statistics (revenue and conversion reports)
// ─────────────────────────────────────────────────────────────────────────────
exports.getFeeStatistics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const match = { status: 'SUCCESS' };

    if (dateFrom && dateTo) {
      match.paidDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    const stats = await FeesPayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            month: { $month: '$paidDate' },
            year: { $year: '$paidDate' }
          },
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const totalStudents = await Student.countDocuments({ status: 'ACTIVE' });
    const totalPayments = await FeesPayment.countDocuments({ status: 'SUCCESS' });
    const conversionRatio = totalStudents > 0 ? (totalPayments / totalStudents) * 100 : 0;

    const totalRevenueResult = await FeesPayment.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentModeStats = await FeesPayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const studentsWithPending = await Student.find({ status: 'ACTIVE' })
      .populate('courseId', 'fee')
      .lean();

    let totalPending = 0;
    for (const student of studentsWithPending) {
      const paid = await FeesPayment.aggregate([
        {
          $match: {
            studentId: new mongoose.Types.ObjectId(student._id),
            status: 'SUCCESS'
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const courseFee = student.courseId?.fee || 0;
      totalPending += Math.max(0, courseFee - (paid[0]?.total || 0));
    }

    res.json({
      success: true,
      data: {
        monthlyStats: stats,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        totalPending,
        conversionRatio: Math.round(conversionRatio * 100) / 100,
        totalPayments,
        totalStudents,
        paymentModeBreakdown: paymentModeStats
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Get all payments (Admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentMode, dateFrom, dateTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;
    if (dateFrom && dateTo) {
      query.paidDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    const payments = await FeesPayment.find(query)
      .populate('studentId', 'fullName mobile admissionNumber')
      .populate('courseId', 'courseCategory')
      .sort({ paidDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await FeesPayment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRecords: count
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  getPendingFees: exports.getPendingFees,
  getPaymentHistory: exports.getPaymentHistory,
  validateCoupon: exports.validateCoupon,
  collectPayment: exports.collectPayment,
  generateReceipt: exports.generateReceipt,
  getFeeStatistics: exports.getFeeStatistics,
  getAllPayments: exports.getAllPayments
};
