const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getSettings,
  updateInstitute,
  uploadLogo,
  updateFees,
  updatePermissions,
  updateNotifications,
  updateSecurity,
  updateAppearance,
  getAccount,
  updateAccount,
  uploadAccountPhoto,
  changePassword,
  getCoupons,
  createCoupon,
  toggleCoupon,
  deleteCoupon,
  getDataOverview,
  createBackup,
  restoreBackup,
  clearArchivedData,
} = require('../controllers/adminSettingController');

// All routes require auth + admin role
router.use(protect, authorize('admin'));

// ── Settings (singleton) ─────────────────────────────────────────────────────
router.get('/',                     getSettings);

// ── Institute ────────────────────────────────────────────────────────────────
router.put('/institute',            updateInstitute);
router.post('/institute/logo',      ...uploadLogo);          // multer + handler

// ── Fees / Permissions / Notifications / Security / Appearance ───────────────
router.put('/fees',                 updateFees);
router.put('/permissions',          updatePermissions);
router.put('/notifications',        updateNotifications);
router.put('/security',             updateSecurity);
router.put('/appearance',           updateAppearance);

// ── Account (admin profile) ──────────────────────────────────────────────────
router.get('/account',              getAccount);
router.put('/account',              updateAccount);
router.post('/account/photo',       ...uploadAccountPhoto);  // multer + handler
router.put('/change-password',      changePassword);

// ── Coupons ──────────────────────────────────────────────────────────────────
router.get('/coupons',              getCoupons);
router.post('/coupons',             createCoupon);
router.patch('/coupons/:id/toggle', toggleCoupon);
router.delete('/coupons/:id',       deleteCoupon);

// ── Data Management (backup / restore / archive) ─────────────────────────────
router.get('/data/overview',        getDataOverview);
router.get('/data/backup',          createBackup);
router.post('/data/restore',        ...restoreBackup);       // multer + handler
router.delete('/data/archived',     clearArchivedData);

module.exports = router;
