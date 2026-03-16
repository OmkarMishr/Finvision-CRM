const express = require('express');
const router = express.Router();

const { botspaceVerify, botspaceHandler }     = require('../controllers/webhooks/botSpaceWebhookController');
const { metaVerify, metaLeadHandler }         = require('../controllers/webhooks/facebookWebhookController');
const { googleVerify, googleLeadHandler }     = require('../controllers/webhooks/googleWebhookController');

// ── WhatsApp (BotSpace) ───────────────────────────────────────────
router.get('/botspace',  botspaceVerify);
router.post('/botspace', botspaceHandler);

// ── Facebook & Instagram Lead Ads (same Meta system) ─────────────
router.get('/meta',  metaVerify);       // Meta verification handshake
router.post('/meta', metaLeadHandler);  // Facebook leads
// Instagram uses the same endpoint — differentiated inside metaLeadHandler

// ── Google Ads Lead Forms ─────────────────────────────────────────
router.get('/google',  googleVerify);
router.post('/google', googleLeadHandler);

module.exports = router;
