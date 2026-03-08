const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {getSettings,updateInstitute,uploadLogo,updateFees,updatePermissions,updateNotifications,updateSecurity,updateAppearance,updateAccount,changePassword,getCoupons,createCoupon,toggleCoupon,deleteCoupon,clearArchivedData,} = require('../controllers/adminSettingController');

// All routes require auth + admin role
router.use(protect, authorize('admin'));
router.get('/', getSettings);
router.put('/institute',        updateInstitute);
router.post('/institute/logo',  ...uploadLogo);   // multer array middleware
router.put('/fees', updateFees);
router.put('/permissions', updatePermissions);
router.put('/notifications', updateNotifications);
router.put('/security',         updateSecurity);
router.put('/change-password',  changePassword);
router.put('/appearance', updateAppearance); // appreance
router.put('/account', updateAccount); //Account (admin profile)
router.get('/coupons',              getCoupons);
router.post('/coupons',             createCoupon);
router.patch('/coupons/:id/toggle', toggleCoupon);
router.delete('/coupons/:id',       deleteCoupon);
router.delete('/data/archived', clearArchivedData); //Data Management

module.exports = router;
