const Lead = require('../models/Lead');
const User = require('../models/User');

// Tracks round-robin index — use Redis in production for persistence across restarts
let telecallerIndex = 0;

// GET - BotSpace URL verification ping
const botspaceVerify = (req, res) => {
  res.status(200).json({ status: 'ok', message: 'BotSpace webhook active' });
};

// POST - Receives lead data from BotSpace and creates lead
const botspaceHandler = async (req, res) => {
  try {
    console.log('BotSpace webhook payload:', JSON.stringify(req.body, null, 2));

    const { contact, message } = req.body;

    // ── 1. Extract fields from BotSpace payload ──────────────────────────
    const fullName  = contact?.name  || contact?.full_name  || 'Unknown';
    const mobile    = contact?.phone || contact?.mobile     || contact?.wa_id || '';
    const email     = contact?.email || '';
    const city      = contact?.city  || '';
    const occupation = contact?.occupation || '';

    // Validate — mobile is required in your Lead model
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number missing in BotSpace payload' });
    }

    // ── 2. Prevent duplicate leads (same mobile) ─────────────────────────
    const existingLead = await Lead.findOne({ mobile });
    if (existingLead) {
      console.log(`Duplicate lead skipped for mobile: ${mobile}`);
      return res.status(200).json({
        success: true,
        message: 'Lead already exists',
        leadId: existingLead._id,
      });
    }

    // ── 3. Round-robin telecaller assignment ─────────────────────────────
    const telecallers = await User.find({ role: 'telecaller', isActive: true }).select('_id name');

    let assignedTelecaller = null;
    if (telecallers.length > 0) {
      assignedTelecaller = telecallers[telecallerIndex % telecallers.length]._id;
      telecallerIndex++;
      console.log(`Lead assigned to telecaller index ${telecallerIndex - 1}:`, assignedTelecaller);
    } else {
      console.warn('No active telecallers found — lead created unassigned');
    }

    // ── 4. Create the lead ────────────────────────────────────────────────
    const lead = await Lead.create({
      fullName,
      mobile,
      email,
      city,
      occupation,
      leadSource:       'Other',       // BotSpace = WhatsApp, map to your enum
      courseCategory:   'Basic',       // Default; can be extracted from bot flow
      stage:            'Enquiry',     // New leads always start at Enquiry
      status:           'Active',
      assignedTelecaller,
      remarks: message?.text
        ? [{
            note: `WhatsApp message: ${message.text}`,
            addedAt: new Date(),
          }]
        : [],
    });

    console.log('New lead created from BotSpace:', lead._id);

    return res.status(200).json({
      success: true,
      message: 'Lead created successfully',
      leadId: lead._id,
      assignedTo: assignedTelecaller,
    });

  } catch (err) {
    console.error('BotSpace webhook error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { botspaceVerify, botspaceHandler };
