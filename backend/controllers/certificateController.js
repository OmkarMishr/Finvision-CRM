const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const pdf = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Check student certificate eligibility
// @route   GET /api/certificates/eligibility
// @access  Private (Student)
const checkCertificateEligibility = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const today = new Date();
    const dateOnly = new Date(today.setHours(0, 0, 0, 0));

    // Calculate attendance stats
    const attendance = await StudentAttendance.find({
      studentId: student._id,
      date: { $gte: new Date(student.admissionDate) }
    });

    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => 
      a.status === 'Present' || a.status === 'Late'
    ).length;
    const attendancePercentage = totalClasses > 0 ? 
      ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

    // Course duration check (assuming 3 months = 90 days)
    const courseStart = new Date(student.admissionDate);
    const courseEnd = new Date(courseStart);
    courseEnd.setMonth(courseEnd.getMonth() + 3); // 3 months course
    const isCourseCompleted = today >= courseEnd;

    const eligible = attendancePercentage >= 75 && isCourseCompleted;

    res.json({
      success: true,
      eligible,
      data: {
        student: {
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          courseCategory: student.courseCategory,
          batchType: student.batchType,
          admissionDate: student.admissionDate,
          totalFees: student.totalFees,
          paidFees: student.paidFees
        },
        attendance: {
          totalClasses,
          presentClasses,
          attendancePercentage,
          requiredPercentage: 75
        },
        course: {
          startDate: student.admissionDate,
          endDate: courseEnd,
          isCompleted: isCourseCompleted,
          duration: '3 months'
        },
        certificateStatus: await Certificate.findOne({ studentId: student._id }) ? 'issued' : 'pending'
      }
    });
  } catch (error) {
    console.error('Certificate eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Generate and download certificate
// @route   GET /api/certificates/download
// @access  Private (Student)
const downloadCertificate = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // ✅ TESTING MODE: Set to true to skip eligibility checks
    const TESTING_MODE = true; // Change to false in production

    if (!TESTING_MODE) {
      // Check eligibility (original code)
      const today = new Date();
      const dateOnly = new Date(today.setHours(0, 0, 0, 0));
      const attendance = await StudentAttendance.find({
        studentId: student._id,
        date: { $gte: new Date(student.admissionDate) }
      });

      const totalClasses = attendance.length;
      const presentClasses = attendance.filter(a => 
        a.status === 'Present' || a.status === 'Late'
      ).length;
      const attendancePercentage = totalClasses > 0 ? 
        ((presentClasses / totalClasses) * 100) : 0;

      const courseStart = new Date(student.admissionDate);
      const courseEnd = new Date(courseStart);
      courseEnd.setMonth(courseEnd.getMonth() + 3);
      const isCourseCompleted = today >= courseEnd;

      if (attendancePercentage < 75 || !isCourseCompleted) {
        return res.status(403).json({
          success: false,
          message: `Certificate not eligible. Attendance: ${attendancePercentage.toFixed(2)}% (Min 75% required). Course completion: ${isCourseCompleted ? 'Yes' : 'No'}`
        });
      }
    }

    // ✅ For testing: Use dummy data if no attendance records
    const attendance = await StudentAttendance.find({
      studentId: student._id,
      date: { $gte: new Date(student.admissionDate) }
    });

    const totalClasses = TESTING_MODE && attendance.length === 0 ? 50 : attendance.length;
    const presentClasses = TESTING_MODE && attendance.length === 0 ? 45 : attendance.filter(a => 
      a.status === 'Present' || a.status === 'Late'
    ).length;
    const attendancePercentage = totalClasses > 0 ? 
      ((presentClasses / totalClasses) * 100) : 90; // Default 90% for testing

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ studentId: student._id });
    if (!certificate) {
      certificate = await Certificate.create({
        studentId: student._id,
        userId: req.user.id,
        certificateNo: `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        totalClasses,
        presentClasses,
        attendancePercentage,
        issuedDate: new Date()
      });
    }

    // Generate PDF
    const doc = new pdf();
    const filename = `certificate_${student.admissionNumber}_${student.fullName.replace(/\s+/g, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // ✅ Enhanced PDF Design
    // Background border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

    // Header
    doc
      .fontSize(32)
      .font('Helvetica-Bold')
      .fillColor('#4F46E5')
      .text('CERTIFICATE', 0, 80, { align: 'center' })
      .fontSize(20)
      .fillColor('#6366F1')
      .text('OF COMPLETION', 0, 120, { align: 'center' });

    // Decorative line
    doc
      .moveTo(150, 150)
      .lineTo(doc.page.width - 150, 150)
      .strokeColor('#4F46E5')
      .lineWidth(2)
      .stroke();

    // Institution name
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Finvision Institute', 0, 180, { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Certified Institute for Professional Education', 0, 205, { align: 'center' });

    // This certifies
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#000000')
      .text('This is to certify that', 0, 250, { align: 'center' });

    // Student name (prominent)
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor('#4F46E5')
      .text(student.fullName.toUpperCase(), 0, 280, { align: 'center' });

    // Admission details
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Admission No: ${student.admissionNumber}`, 0, 320, { align: 'center' });

    // Course completion text
    doc
      .fontSize(14)
      .fillColor('#000000')
      .text('has successfully completed the', 0, 360, { align: 'center' })
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#4F46E5')
      .text(`${student.courseCategory} Course`, 0, 385, { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Batch Type: ${student.batchType}`, 0, 415, { align: 'center' });

    // Course duration
    const courseStart = new Date(student.admissionDate);
    const courseEnd = new Date(courseStart);
    courseEnd.setMonth(courseEnd.getMonth() + 3);
    
    doc
      .fontSize(11)
      .fillColor('#666666')
      .text(
        `Duration: ${courseStart.toLocaleDateString('en-IN')} to ${courseEnd.toLocaleDateString('en-IN')} (3 Months)`,
        0,
        440,
        { align: 'center' }
      );

    // Attendance box
    doc
      .rect(150, 480, doc.page.width - 300, 120)
      .fillAndStroke('#F3F4F6', '#D1D5DB');

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('📊 Attendance Summary', 160, 495);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Classes: ${totalClasses}`, 170, 520)
      .text(`Classes Attended: ${presentClasses}`, 170, 540)
      .text(`Attendance Percentage: ${attendancePercentage.toFixed(2)}%`, 170, 560)
      .fontSize(10)
      .fillColor('#059669')
      .text('✓ Minimum Required: 75%', 170, 580);

    // Certificate details
    const issueDate = new Date().toLocaleDateString('en-IN');
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Certificate No: ${certificate.certificateNo}`, 50, 630)
      .text(`Issued on: ${issueDate}`, doc.page.width - 200, 630);

    // Signatures
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Authorized Signature', 100, 690, { width: 150, align: 'center' })
      .text('Principal/Director', doc.page.width - 250, 690, { width: 150, align: 'center' });

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('_____________________', 100, 710, { width: 150, align: 'center' })
      .text('_____________________', doc.page.width - 250, 710, { width: 150, align: 'center' });

    // Footer
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text(
        'This is a computer-generated certificate and does not require a physical signature.',
        0,
        doc.page.height - 60,
        { align: 'center' }
      )
      .text(
        'Finvision Institute | All Rights Reserved | www.finvision.com',
        0,
        doc.page.height - 45,
        { align: 'center' }
      );

    doc.end();
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate'
    });
  }
};


// @desc    Get all certificates (Admin only)
// @route   GET /api/certificates
// @access  Private (Admin)
const getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('studentId', 'fullName admissionNumber courseCategory batchType')
      .populate('userId', 'fullName email')
      .sort({ issuedDate: -1 });

    res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


module.exports = {
  checkCertificateEligibility,
  downloadCertificate,
  getAllCertificates
};
