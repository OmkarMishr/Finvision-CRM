const AdminSetting = require('../models/AdminSetting');
const Coupon = require('../models/Coupon');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Auth middleware exposes req.user.userId / req.user.id (both as strings).
// Controllers must NEVER read req.user._id — it is undefined.
const reqUserId = (req) => req.user?.userId || req.user?.id;

// ── Multer — logo upload ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/logos';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `logo_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime    = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

// ── Helper: get or create singleton settings doc ───────────────────────────────
const getSettings = async () => {
  let settings = await AdminSetting.findOne({ type: 'global' });
  if (!settings) {
    settings = await AdminSetting.create({ type: 'global' });
  }
  return settings;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/admin-settings
// Returns a plain-JS view of the singleton settings doc — Mongoose subdocument
// `_id`s are stripped so they don't round-trip back on save (which would let
// stale ids reach the wire and confuse client-side diffs).
// ─────────────────────────────────────────────────────────────────────────────
const stripSubdocIds = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripSubdocIds);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_id' || k === '__v') continue;
    out[k] = stripSubdocIds(v);
  }
  return out;
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    const data     = stripSubdocIds(settings.toObject({ virtuals: false }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/institute
// ─────────────────────────────────────────────────────────────────────────────
exports.updateInstitute = async (req, res) => {
  try {
    const { name, tagline, email, phone, address, website } = req.body;
    const settings = await getSettings();

    if (name)    settings.institute.name    = name;
    if (tagline) settings.institute.tagline = tagline;
    if (email)   settings.institute.email   = email;
    if (phone)   settings.institute.phone   = phone;
    if (address) settings.institute.address = address;
    if (website) settings.institute.website = website;

    settings.markModified('institute');
    await settings.save();

    res.json({ success: true, message: 'Institute profile updated', data: settings.institute });
  } catch (err) {
    console.error('updateInstitute error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/admin-settings/institute/logo
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadLogo = [
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const settings  = await getSettings();
      const logoUrl   = `/uploads/logos/${req.file.filename}`;

      // Delete old logo file if exists
      if (settings.institute.logoUrl) {
        const oldPath = path.join(__dirname, '..', settings.institute.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      settings.institute.logoUrl = logoUrl;
      settings.markModified('institute');
      await settings.save();

      res.json({ success: true, message: 'Logo uploaded', logoUrl });
    } catch (err) {
      console.error('uploadLogo error:', err);
      if (err.message?.includes('Only JPEG')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/fees
// ─────────────────────────────────────────────────────────────────────────────
exports.updateFees = async (req, res) => {
  try {
    const { feeHeads, gst, receipt } = req.body;
    const settings = await getSettings();

    if (Array.isArray(feeHeads)) {
      // Always keep a "Course Fee" head — collection forms expect it.
      const cleaned = [...new Set(feeHeads.map(h => String(h).trim()).filter(Boolean))];
      if (!cleaned.includes('Course Fee')) cleaned.unshift('Course Fee');
      settings.fees.feeHeads = cleaned;
    }
    if (gst) {
      if (typeof gst.enabled    === 'boolean') settings.fees.gst.enabled    = gst.enabled;
      if (gst.percentage !== undefined)        settings.fees.gst.percentage = Number(gst.percentage);
    }
    if (receipt) {
      if (receipt.footerText !== undefined)             settings.fees.receipt.footerText = receipt.footerText;
      if (typeof receipt.showLogo === 'boolean')        settings.fees.receipt.showLogo   = receipt.showLogo;
    }

    settings.markModified('fees');
    await settings.save();

    res.json({ success: true, message: 'Fees config updated', data: settings.fees });
  } catch (err) {
    console.error('updateFees error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/permissions
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid permissions payload' });
    }

    // Prevent modifying admin permissions
    delete permissions.admin;

    const settings = await getSettings();
    settings.permissions = { ...settings.permissions, ...permissions };
    settings.markModified('permissions');
    await settings.save();

    res.json({ success: true, message: 'Permissions updated', data: settings.permissions });
  } catch (err) {
    console.error('updatePermissions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/notifications
// ─────────────────────────────────────────────────────────────────────────────
exports.updateNotifications = async (req, res) => {
  try {
    const { email, inApp } = req.body;
    const settings = await getSettings();

    if (email) {
      Object.keys(email).forEach(key => {
        if (typeof email[key] === 'boolean' && key in settings.notifications.email) {
          settings.notifications.email[key] = email[key];
        }
      });
    }
    if (inApp) {
      Object.keys(inApp).forEach(key => {
        if (typeof inApp[key] === 'boolean' && key in settings.notifications.inApp) {
          settings.notifications.inApp[key] = inApp[key];
        }
      });
    }

    settings.markModified('notifications');
    await settings.save();

    res.json({ success: true, message: 'Notification preferences updated', data: settings.notifications });
  } catch (err) {
    console.error('updateNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/security
// ─────────────────────────────────────────────────────────────────────────────
exports.updateSecurity = async (req, res) => {
  try {
    const { twoFAEnabled, newDeviceAlerts } = req.body;
    const settings = await getSettings();

    if (typeof twoFAEnabled    === 'boolean') settings.security.twoFAEnabled    = twoFAEnabled;
    if (typeof newDeviceAlerts === 'boolean') settings.security.newDeviceAlerts = newDeviceAlerts;

    settings.markModified('security');
    await settings.save();

    res.json({ success: true, message: 'Security settings updated', data: settings.security });
  } catch (err) {
    console.error('updateSecurity error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/appearance
// ─────────────────────────────────────────────────────────────────────────────
exports.updateAppearance = async (req, res) => {
  try {
    const { theme, dateFormat, sidebarCollapsed } = req.body;
    const settings = await getSettings();

    const validThemes = ['light', 'dark', 'system'];
    const validDates  = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

    if (theme      && validThemes.includes(theme))      settings.appearance.theme           = theme;
    if (dateFormat && validDates.includes(dateFormat))  settings.appearance.dateFormat      = dateFormat;
    if (typeof sidebarCollapsed === 'boolean')          settings.appearance.sidebarCollapsed = sidebarCollapsed;

    settings.markModified('appearance');
    await settings.save();

    res.json({ success: true, message: 'Appearance updated', data: settings.appearance });
  } catch (err) {
    console.error('updateAppearance error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/account  (admin profile)
// ─────────────────────────────────────────────────────────────────────────────
exports.updateAccount = async (req, res) => {
  try {
    const User = require('../models/User');
    const { firstName, lastName, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      reqUserId(req),
      { $set: { firstName, lastName, phone } },
      { new: true, select: '-password' }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Account updated', data: updated });
  } catch (err) {
    console.error('updateAccount error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT  /api/admin-settings/change-password
// ─────────────────────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const User   = require('../models/User');
    const bcrypt = require('bcryptjs');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(reqUserId(req)).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // pre-save hook hashes the password — assigning the plain value is correct.
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// COUPON CRUD
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/admin-settings/coupons
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error('getCoupons error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST  /api/admin-settings/coupons
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxDiscount, minAmount, maxUsage, expiryDate, applicableCourses } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'code, discountType and discountValue are required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code:              code.toUpperCase(),
      discountType,
      discountValue:     Number(discountValue),
      maxDiscount:       maxDiscount       != null && maxDiscount !== '' ? Number(maxDiscount) : null,
      minAmount:         minAmount         != null ? Number(minAmount)   : 0,
      maxUsage:          maxUsage          != null && maxUsage   !== '' ? Number(maxUsage)   : 0,
      expiryDate:        expiryDate        || null,
      applicableCourses: Array.isArray(applicableCourses) ? applicableCourses : [],
      createdBy:         reqUserId(req),
    });

    res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
  } catch (err) {
    console.error('createCoupon error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// PATCH  /api/admin-settings/coupons/:id/toggle
exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, data: coupon });
  } catch (err) {
    console.error('toggleCoupon error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE  /api/admin-settings/coupons/:id
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    console.error('deleteCoupon error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/admin-settings/account  (current admin profile)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAccount = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(reqUserId(req)).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('getAccount error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/admin-settings/account/photo  (admin avatar upload)
// ─────────────────────────────────────────────────────────────────────────────
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/admin-profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `admin_${reqUserId(req) || 'user'}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

exports.uploadAccountPhoto = [
  uploadPhoto.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const User = require('../models/User');
      const user = await User.findById(reqUserId(req));
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Remove previous photo file if it lives under our uploads tree.
      if (user.profilePhoto && user.profilePhoto.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', user.profilePhoto);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (_) { /* ignore */ }
        }
      }

      const photoUrl = `/uploads/admin-profiles/${req.file.filename}`;
      user.profilePhoto = photoUrl;
      await user.save();

      res.json({ success: true, message: 'Photo uploaded', photoUrl, data: { profilePhoto: photoUrl } });
    } catch (err) {
      console.error('uploadAccountPhoto error:', err);
      if (err.message?.includes('Only JPEG')) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/admin-settings/data/overview
// ─────────────────────────────────────────────────────────────────────────────
exports.getDataOverview = async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Lead    = require('../models/Lead');
    const User    = require('../models/User');
    const Batch   = require('../models/Batch');

    const [students, leads, archivedStudents, archivedLeads, users, batches] = await Promise.all([
      Student.countDocuments({ isDeleted: { $ne: true } }),
      Lead.countDocuments({    isDeleted: { $ne: true } }),
      Student.countDocuments({ isDeleted: true }),
      Lead.countDocuments({    isDeleted: true }),
      User.countDocuments(),
      Batch.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        active:   { students, leads, users, batches },
        archived: { students: archivedStudents, leads: archivedLeads },
      },
    });
  } catch (err) {
    console.error('getDataOverview error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/admin-settings/data/backup
// Streams a JSON backup of all CRM collections (excluding password hashes).
// ─────────────────────────────────────────────────────────────────────────────
exports.createBackup = async (req, res) => {
  try {
    const Student           = require('../models/Student');
    const Lead              = require('../models/Lead');
    const User              = require('../models/User');
    const Batch             = require('../models/Batch');
    const StudentAttendance = require('../models/StudentAttendance');
    const FeesPayment       = require('../models/FeesPayment');

    const [students, leads, users, batches, attendance, payments, settings] = await Promise.all([
      Student.find().lean(),
      Lead.find().lean(),
      User.find().select('-password').lean(),
      Batch.find().lean(),
      StudentAttendance.find().lean(),
      FeesPayment.find().lean(),
      AdminSetting.findOne({ type: 'global' }).lean(),
    ]);

    const backup = {
      version:   '1.0.0',
      timestamp: new Date().toISOString(),
      createdBy: reqUserId(req),
      data: { students, leads, users, batches, attendance, payments, settings },
      metadata: {
        totalStudents:   students.length,
        totalLeads:      leads.length,
        totalUsers:      users.length,
        totalBatches:    batches.length,
        totalAttendance: attendance.length,
        totalPayments:   payments.length,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=finvision_backup_${Date.now()}.json`
    );
    res.json(backup);
  } catch (err) {
    console.error('createBackup error:', err);
    res.status(500).json({ success: false, message: 'Failed to create backup', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST  /api/admin-settings/data/restore
// Accepts a backup JSON (multipart upload as `file`, or raw JSON body).
// Replaces students/leads/batches/attendance/payments. Users are NOT touched
// (avoids admin lockout) and AdminSetting is upserted.
// ─────────────────────────────────────────────────────────────────────────────
const backupUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

exports.restoreBackup = [
  backupUpload.single('file'),
  async (req, res) => {
    try {
      let backup = req.body;

      // If multipart upload, parse the file buffer
      if (req.file) {
        try {
          backup = JSON.parse(req.file.buffer.toString('utf8'));
        } catch (parseErr) {
          return res.status(400).json({ success: false, message: 'Invalid backup file: not valid JSON' });
        }
      }

      if (!backup || !backup.data || !backup.version) {
        return res.status(400).json({ success: false, message: 'Invalid backup file format' });
      }
      if (backup.version !== '1.0.0') {
        return res.status(400).json({
          success: false,
          message: `Unsupported backup version: ${backup.version}`,
        });
      }

      const Student           = require('../models/Student');
      const Lead              = require('../models/Lead');
      const Batch             = require('../models/Batch');
      const StudentAttendance = require('../models/StudentAttendance');
      const FeesPayment       = require('../models/FeesPayment');

      const { students = [], leads = [], batches = [], attendance = [], payments = [], settings } = backup.data;

      // Wipe collections we're about to restore (Users intentionally preserved
      // to avoid locking the admin out of the system).
      await Promise.all([
        Student.deleteMany({}),
        Lead.deleteMany({}),
        Batch.deleteMany({}),
        StudentAttendance.deleteMany({}),
        FeesPayment.deleteMany({}),
      ]);

      const results = await Promise.all([
        students.length   ? Student.insertMany(students,     { ordered: false }) : [],
        leads.length      ? Lead.insertMany(leads,           { ordered: false }) : [],
        batches.length    ? Batch.insertMany(batches,        { ordered: false }) : [],
        attendance.length ? StudentAttendance.insertMany(attendance, { ordered: false }) : [],
        payments.length   ? FeesPayment.insertMany(payments, { ordered: false }) : [],
      ]);

      // Restore the singleton settings doc as an upsert (or leave alone if absent).
      if (settings) {
        const { _id, __v, createdAt, updatedAt, ...settingsData } = settings;
        await AdminSetting.findOneAndUpdate(
          { type: 'global' },
          { $set: settingsData },
          { upsert: true, new: true }
        );
      }

      res.json({
        success: true,
        message: 'Database restored successfully',
        restored: {
          students:   results[0].length,
          leads:      results[1].length,
          batches:    results[2].length,
          attendance: results[3].length,
          payments:   results[4].length,
        },
        restoredFrom: backup.timestamp,
      });
    } catch (err) {
      console.error('restoreBackup error:', err);
      res.status(500).json({ success: false, message: 'Failed to restore backup', error: err.message });
    }
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DELETE  /api/admin-settings/data/archived  (danger zone)
// ─────────────────────────────────────────────────────────────────────────────
exports.clearArchivedData = async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Lead    = require('../models/Lead');

    // Only hard-delete records that are already soft-deleted (isDeleted: true)
    const [students, leads] = await Promise.all([
      Student.deleteMany({ isDeleted: true }),
      Lead.deleteMany({    isDeleted: true }),
    ]);

    res.json({
      success: true,
      message: 'Archived data cleared',
      deleted: {
        students: students.deletedCount,
        leads:    leads.deletedCount,
      },
    });
  } catch (err) {
    console.error('clearArchivedData error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
