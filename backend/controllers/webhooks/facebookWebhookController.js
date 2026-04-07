const axios = require('axios');
const { createLeadFromSource } = require('../../services/leadService');

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN; 
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN; 

// GET - Meta webhook verification handshake
const metaVerify = (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Meta webhook verified');
    return res.status(200).send(challenge); // Must send back challenge string
  }
  return res.status(403).json({ error: 'Forbidden' });
};

// POST - Receives lead notification from Facebook/Instagram
const metaLeadHandler = async (req, res) => {
  try {
    const body = req.body;
    console.log('Meta webhook payload:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            const adName    = change.value.ad_name || '';
            const source    = adName.toLowerCase().includes('instagram') ? 'Instagram' : 'Facebook';

            // Fetch full lead details from Meta Graph API
            const leadRes = await axios.get(
              `https://graph.facebook.com/v19.0/${leadgenId}`,
              { params: { access_token: PAGE_ACCESS_TOKEN } }
            );

            const fieldData = leadRes.data.field_data || [];

            // Map Meta form fields to our lead schema
            const getValue = (name) =>
              fieldData.find(f => f.name === name)?.values?.[0] || '';

            const result = await createLeadFromSource({
              fullName:   getValue('full_name') || `${getValue('first_name')} ${getValue('last_name')}`.trim(),
              mobile:     getValue('phone_number') || getValue('mobile_number'),
              email:      getValue('email'),
              city:       getValue('city'),
              occupation: getValue('job_title'),
              source,
              message:    `Ad: ${adName}`,
            });

            console.log(`${source} lead created:`, result.leadId);
          }
        }
      }
    }

    // Always return 200 to Meta immediately
    return res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('Meta webhook error:', err);
    return res.status(200).send('EVENT_RECEIVED'); // Still return 200 so Meta doesn't retry
  }
};

module.exports = { metaVerify, metaLeadHandler };
