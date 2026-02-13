const FeesPayment = require('../models/FeesPayment');
const Coupon = require('../models/Coupon');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { jsPDF } = require('jspdf');
const mongoose = require('mongoose');

// Generate receipt number from timestamp + random
const generateReceiptNo = async () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FVFEES${timestamp}${random}`;
};

// Get pending fees for student
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

    const courseFee = student.courseId?.fee || 0;
    const pendingAmount = Math.max(0, courseFee - (totalPaid[0]?.total || 0));

    // Simulate due date (30 days from admission)
    const dueDate = new Date(student.admissionDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const result = {
      totalFee: courseFee,
      pendingAmount,
      dueDate: pendingAmount > 0 ? dueDate : null,
      feeHead: 'Course Fee',
      courseId: student.courseId?._id
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get pending fees error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await FeesPayment.find({ studentId })
      .populate('courseId', 'courseCategory')
      .sort({ paidDate: -1, createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Validate coupon
exports.validateCoupon = async (req, res) => {
  try {
    console.log('Validate coupon request body:', req.body); // Debug log
    
    // Check if body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing'
      });
    }

    const { code, studentId, courseId } = req.body;

    // Validate required fields
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired or reached maximum usage'
      });
    }

    // Check course applicability
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

// Record payment
exports.collectPayment = async (req, res) => {
  try {
    const { studentId, courseId, amount, baseAmount, couponCode, paymentMode, feeHead } = req.body;

    // Validate student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Validate coupon if applied
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
        // Increment usage
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

// Generate receipt PDF
exports.generateReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await FeesPayment.findById(paymentId)
      .populate('studentId', 'fullName mobile admissionNumber email')
      .populate('courseId', 'courseCategory');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('FINVISION ACADEMY', 105, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Institute of Financial Excellence', 105, 27, { align: 'center' });
    doc.text('Mumbai, Maharashtra', 105, 33, { align: 'center' });
    
    // Receipt header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT RECEIPT', 105, 45, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Receipt No: ${payment.receiptNo}`, 20, 55);
    doc.text(`Date: ${new Date(payment.paidDate).toLocaleDateString('en-IN')}`, 150, 55);
    
    // Line
    doc.line(20, 60, 190, 60);
    
    // Student details
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Student Details:', 20, 70);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${payment.studentId.fullName}`, 20, 77);
    doc.text(`Admission No: ${payment.studentId.admissionNumber}`, 20, 84);
    doc.text(`Mobile: ${payment.studentId.mobile}`, 20, 91);
    if (payment.studentId.email) {
      doc.text(`Email: ${payment.studentId.email}`, 20, 98);
    }
    
    // Payment details
    doc.line(20, 105, 190, 105);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Details:', 20, 115);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Fee Head: ${payment.feeHead}`, 20, 122);
    doc.text(`Course: ${payment.courseId?.courseCategory || 'N/A'}`, 20, 129);
    
    if (payment.couponCode) {
      doc.text(`Base Amount: ₹${payment.baseAmount.toLocaleString('en-IN')}`, 20, 136);
      doc.text(`Coupon Applied: ${payment.couponCode}`, 20, 143);
      doc.text(`Discount: ₹${payment.couponDiscount.toLocaleString('en-IN')}`, 20, 150);
      doc.setFont(undefined, 'bold');
      doc.text(`Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}`, 20, 157);
      doc.setFont(undefined, 'normal');
    } else {
      doc.setFont(undefined, 'bold');
      doc.text(`Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}`, 20, 136);
      doc.setFont(undefined, 'normal');
    }
    
    const lastY = payment.couponCode ? 164 : 143;
    doc.text(`Payment Mode: ${payment.paymentMode}`, 20, lastY);
    doc.text(`Status: ${payment.status}`, 20, lastY + 7);
    
    // Footer
    doc.line(20, lastY + 20, 190, lastY + 20);
    
    doc.setFontSize(9);
    doc.text('Thank you for your payment!', 105, lastY + 30, { align: 'center' });
    doc.text('For any queries, contact: support@finvisionacademy.com | +91 98765 43210', 105, lastY + 37, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text('This is a computer-generated receipt and does not require a signature.', 105, lastY + 50, { align: 'center' });

    // Send PDF
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.receiptNo}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Receipt generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
};

// Admin statistics (revenue & conversion reports)
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

    // Conversion ratio (payments / students)
    const totalStudents = await Student.countDocuments({ status: 'ACTIVE' });
    const totalPayments = await FeesPayment.countDocuments({ status: 'SUCCESS' });
    const conversionRatio = totalStudents > 0 ? (totalPayments / totalStudents) * 100 : 0;

    // Total revenue
    const totalRevenueResult = await FeesPayment.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Payment mode breakdown
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

    // Pending fees calculation
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
      const pending = Math.max(0, courseFee - (paid[0]?.total || 0));
      totalPending += pending;
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

// Get all payments (admin)
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
