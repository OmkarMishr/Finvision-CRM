const crypto = require('crypto');
const { createLeadFromSource } = require('../../services/leadService');

const GOOGLE_WEBHOOK_KEY = process.env.GOOGLE_WEBHOOK_KEY; // set in .env

// Verify Google's HMAC signature
const verifyGoogleSignature = (req) => {
  const signature = req.headers['google-lead-signature'] || '';
  const hmac = crypto
    .createHmac('sha256', GOOGLE_WEBHOOK_KEY)
    .update(JSON.stringify(req.body))
    .digest('base64');
  return signature === hmac;
};

// GET - Google Ads sends a test ping
const googleVerify = (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Google webhook active' });
};

// POST - Receives lead from Google Ads lead form
const googleLeadHandler = async (req, res) => {
  try {
    console.log('Google Ads payload:', JSON.stringify(req.body, null, 2));

    // Optional: verify signature for security
    // if (!verifyGoogleSignature(req)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const data = req.body;

    // Google Ads sends user_column_data array
    const fields = data.user_column_data || data.lead_data || [];
    const getValue = (col) =>
      fields.find(f => f.column_name === col || f.column_id === col)?.string_value || '';

    const result = await createLeadFromSource({
      fullName:   getValue('FULL_NAME') || `${getValue('FIRST_NAME')} ${getValue('LAST_NAME')}`.trim(),
      mobile:     getValue('PHONE_NUMBER'),
      email:      getValue('EMAIL'),
      city:       getValue('CITY'),
      occupation: getValue('JOB_TITLE'),
      source:     'Google',
      message:    `Campaign: ${data.campaign_id || ''} | Form: ${data.google_key || ''}`,
    });

    return res.status(200).json({ success: true, leadId: result.leadId });
  } catch (err) {
    console.error('Google webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { googleVerify, googleLeadHandler };
