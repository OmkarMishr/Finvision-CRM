const { createLeadFromSource } = require('../../services/leadService');

let telecallerIndex = 0;

const botspaceVerify = (req, res) => {
  res.status(200).json({ status: 'ok', message: 'BotSpace webhook active' });
};

const botspaceHandler = async (req, res) => {
  try {
    console.log('BotSpace payload:', JSON.stringify(req.body, null, 2));
    const { contact, message } = req.body;

    const result = await createLeadFromSource({
      fullName:   contact?.name || contact?.profile?.name,
      mobile:     contact?.wa_id || contact?.phone,
      email:      contact?.email,
      city:       contact?.city,
      source:     'WhatsApp',
      message:    message?.text || message?.body,
    });

    if (result.duplicate) {
      return res.status(200).json({ success: true, message: 'Lead already exists', leadId: result.leadId });
    }

    return res.status(200).json({ success: true, leadId: result.leadId });
  } catch (err) {
    console.error('BotSpace webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { botspaceVerify, botspaceHandler };
