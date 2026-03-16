const Lead = require('../models/Lead');
const User = require('../models/User');

let telecallerIndex = 0;

const createLeadFromSource = async ({ fullName, mobile, email, city, occupation, source, message }) => {

  // Validate mobile
  if (!mobile) throw new Error('Mobile number is required');

  // Prevent duplicates
  const existing = await Lead.findOne({ mobile });
  if (existing) {
    return { duplicate: true, leadId: existing._id };
  }

  // Round-robin assignment
  const telecallers = await User.find({ role: 'telecaller', isActive: true }).select('_id');
  let assignedTelecaller = null;
  if (telecallers.length > 0) {
    assignedTelecaller = telecallers[telecallerIndex % telecallers.length]._id;
    telecallerIndex++;
  }

  // Create lead
  const lead = await Lead.create({
    fullName:          fullName || 'Unknown',
    mobile,
    email:             email    || '',
    city:              city     || '',
    occupation:        occupation || '',
    leadSource:        source,
    courseCategory:    'Basic',
    stage:             'Enquiry',
    status:            'Active',
    assignedTelecaller,
    remarks: message
      ? [{ note: `${source}: ${message}`, addedAt: new Date() }]
      : [],
  });

  return { duplicate: false, leadId: lead._id, assignedTelecaller };
};

module.exports = { createLeadFromSource };
