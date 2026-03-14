const express = require('express');
const router = express.Router();
const { botspaceVerify, botspaceHandler } = require('../controllers/webhookController');

router.get('/botspace', botspaceVerify);
router.post('/botspace', botspaceHandler);

module.exports = router;
