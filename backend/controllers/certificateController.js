const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

// Path to your certificate template
const TEMPLATE_PATH = path.join(__dirname, '../templates/certificate-template.pdf');

// Color constants matching your template
const COLOR = {
  red:      [200/255, 41/255, 74/255],    // #C8294A
  black:    [26/255, 26/255, 26/255],     // #1A1A1A
  darkGray: [51/255, 51/255, 51/255],     // #333333
  midGray:  [102/255, 102/255, 102/255],  // #666666
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Fill template with student data
// ─────────────────────────────────────────────────────────────────────────────
const fillCertificateTemplate = async ({ student, certificate, totalClasses, presentClasses, attendancePercentage }) => {
  try {
    // Load template PDF
    const templateBytes = await fs.readFile(TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Embed fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ── Student Name (center-left large text) ────────────────────────────────
    // Coordinates depend on your template layout — adjust these after testing
    firstPage.drawText(student.fullName.toUpperCase(), {
      x: 280,           // Horizontal position (adjust based on your template)
      y: height - 300,  // Vertical position from bottom (adjust based on your template)
      size: 32,
      font: boldFont,
      color: rgb(...COLOR.black),
    });

    // ── Admission Number (small text below name) ──────────────────────────────
    firstPage.drawText(`Admission No: ${student.admissionNumber}`, {
      x: 280,
      y: height - 270,
      size: 9,
      font: regularFont,
      color: rgb(...COLOR.midGray),
    });

    // ── Course Details (in the red strip or body text) ───────────────────────
    const courseStart = new Date(student.admissionDate);
    const courseEnd = new Date(courseStart);
    courseEnd.setMonth(courseEnd.getMonth() + 3);

    firstPage.drawText(`${student.courseCategory}`, {
      x: 280,
      y: height - 310,
      size: 11,
      font: boldFont,
      color: rgb(...COLOR.red),
    });

    firstPage.drawText(`${student.batchType} Batch`, {
      x: 450,
      y: height - 310,
      size: 10,
      font: regularFont,
      color: rgb(...COLOR.midGray),
    });

    // ── Attendance Summary (left sidebar section) ─────────────────────────────
    // These go in the white box on the red sidebar
    const sidebarX = 30;
    const summaryY = height - 350;

    firstPage.drawText(String(totalClasses), {
      x: sidebarX,
      y: summaryY,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1), // White text
    });

    firstPage.drawText(String(presentClasses), {
      x: sidebarX,
      y: summaryY - 30,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    firstPage.drawText(`${attendancePercentage.toFixed(1)}%`, {
      x: sidebarX,
      y: summaryY - 60,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // ── Certificate Number (bottom left sidebar) ──────────────────────────────
    firstPage.drawText(`Cert No: ${certificate.certificateNo}`, {
      x: 30,
      y: 60,
      size: 7.5,
      font: regularFont,
      color: rgb(1, 1, 1),
    });

    firstPage.drawText(`Issued: ${new Date(certificate.issuedDate).toLocaleDateString('en-IN')}`, {
      x: 30,
      y: 48,
      size: 7.5,
      font: regularFont,
      color: rgb(1, 1, 1),
    });

    // ── Course Duration (in red strip) ─────────────────────────────────────────
    firstPage.drawText(
      `${courseStart.toLocaleDateString('en-IN')} - ${courseEnd.toLocaleDateString('en-IN')}`,
      {
        x: 580,
        y: height - 310,
        size: 9,
        font: regularFont,
        color: rgb(...COLOR.midGray),
      }
    );

    return await pdfDoc.save();

  } catch (error) {
    console.error('Template fill error:', error);
    throw new Error('Failed to fill certificate template');
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Check student certificate eligibility
// @route   GET /api/certificates/eligibility
// @access  Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
const checkCertificateEligibility = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const attendance = await StudentAttendance.find({
      studentId: student._id,
      date: { $gte: new Date(student.admissionDate) }
    });

    const totalClasses       = attendance.length;
    const presentClasses     = attendance.filter(a =>
      a.status === 'Present' || a.status === 'Late'
    ).length;
    const attendancePercentage = totalClasses > 0
      ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(2))
      : 0;

    const courseStart    = new Date(student.admissionDate);
    const courseEnd      = new Date(courseStart);
    courseEnd.setMonth(courseEnd.getMonth() + 3);
    const isCourseCompleted = new Date() >= courseEnd;

    const eligible = attendancePercentage >= 75 && isCourseCompleted ;

    const existingCertificate = await Certificate.findOne({ studentId: student._id });

    res.json({
      success: true,
      eligible,
      data: {
        student: {
          fullName:        student.fullName,
          admissionNumber: student.admissionNumber,
          courseCategory:  student.courseCategory,
          batchType:       student.batchType,
          admissionDate:   student.admissionDate,
          totalFees:       student.totalFees,
          paidFees:        student.paidFees,
        },
        attendance: {
          totalClasses,
          presentClasses,
          attendancePercentage,
          requiredPercentage: 75,
        },
        course: {
          startDate:   student.admissionDate,
          endDate:     courseEnd,
          isCompleted: isCourseCompleted,
          duration:    '3 months',
        },
        certificateStatus: existingCertificate ? 'issued' : 'pending',
      },
    });
  } catch (error) {
    console.error('Certificate eligibility error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate and download certificate
// @route   GET /api/certificates/download
// @access  Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
const downloadCertificate = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Set TESTING_MODE = false in production
    const TESTING_MODE = true;

    // Fetch attendance data
    const attendanceRecords = await StudentAttendance.find({
      studentId: student._id,
      date: { $gte: new Date(student.admissionDate) }
    });

    let totalClasses, presentClasses, attendancePercentage;

    if (TESTING_MODE && attendanceRecords.length === 0) {
      totalClasses         = 50;
      presentClasses       = 46;
      attendancePercentage = 92;
    } else {
      totalClasses         = attendanceRecords.length;
      presentClasses       = attendanceRecords.filter(a =>
        a.status === 'Present' || a.status === 'Late'
      ).length;
      attendancePercentage = totalClasses > 0
        ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(2))
        : 90;
    }

    // Eligibility check (skip in TESTING_MODE)
    if (!TESTING_MODE) {
      const courseStart   = new Date(student.admissionDate);
      const courseEnd     = new Date(courseStart);
      courseEnd.setMonth(courseEnd.getMonth() + 3);
      const isCourseCompleted = new Date() >= courseEnd;

      if (attendancePercentage < 75 || !isCourseCompleted) {
        return res.status(403).json({
          success: false,
          message: `Certificate not eligible. Attendance: ${attendancePercentage.toFixed(2)}% (Min 75% required). Course completion: ${isCourseCompleted ? 'Yes' : 'No'}`,
        });
      }
    }

    // Create or reuse certificate record
    let certificate = await Certificate.findOne({ studentId: student._id });
    if (!certificate) {
      certificate = await Certificate.create({
        studentId:            student._id,
        userId:               req.user.id,
        certificateNo:        `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        totalClasses,
        presentClasses,
        attendancePercentage,
        issuedDate:           new Date(),
      });
    }

    // Generate PDF by filling template
    const pdfBytes = await fillCertificateTemplate({
      student,
      certificate,
      totalClasses,
      presentClasses,
      attendancePercentage,
    });

    const filename = `Certificate_${student.admissionNumber}_${student.fullName.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBytes.length);

    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Certificate download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate certificate' });
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all certificates (Admin only)
// @route   GET /api/certificates
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('studentId', 'fullName admissionNumber courseCategory batchType')
      .populate('userId',    'fullName email')
      .sort({ issuedDate: -1 });

    res.json({
      success: true,
      count: certificates.length,
      data: certificates,
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  checkCertificateEligibility,
  downloadCertificate,
  getAllCertificates,
};
