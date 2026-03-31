const Lead     = require('../models/Lead');
const mongoose = require('mongoose');

// Handles both { userId } and { id } and { _id } shapes from JWT middleware
const reqUserId = (req) => req.user?.userId || req.user?._id || req.user?.id;

// ─── Helper: build role-based match query ─────────────────────────────────────
// Each staff role has its own dedicated assignment field in the Lead model.
// This ensures a telecaller never sees a counselor's leads and vice versa.
const roleBasedQuery = (req) => {
  if (req.user.role !== 'staff') return {};   // admin sees all

  const uid = new mongoose.Types.ObjectId(String(reqUserId(req)));

  switch (req.user.staffRole?.toLowerCase()) {
    case 'telecaller':
      return { assignedTelecaller: uid };
    case 'counselor':
      return {
        $or: [
          { assignedCounselor: uid },
          { stage: { $in: ['Counselling', 'Lead Conversion', 'Paid Batch', 'Admission'] } }
        ]
      };
    default:
      // For teacher or unknown roles, return leads created by them
      return { createdBy: uid };
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all leads (with filters)
// @route   GET /api/leads
// @access  Private (Staff/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllLeads = async (req, res) => {
  try {
    const { stage, batchType, leadSource, search, assignedTo } = req.query;

    // Start with role-based scope — staff only see their own leads
    let query = roleBasedQuery(req);

    // Admin can additionally filter by a specific staff member's ID
    // This is used by the admin panel when viewing a specific staff's leads
    if (req.user.role !== 'staff' && assignedTo) {
      const uid = new mongoose.Types.ObjectId(String(assignedTo));
      query = {
        $or: [
          { assignedTelecaller: uid },
          { assignedCounselor:  uid },
          { createdBy:          uid },
        ]
      };
    }

    // Optional filters — applied on top of role scope
    if (stage)      query.stage      = stage;
    if (batchType)  query.batchType  = batchType;
    if (leadSource) query.leadSource = leadSource;
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      // Merge search with existing query using $and to preserve role scope
      query = {
        $and: [
          query,
          {
            $or: [
              { fullName: searchRegex },
              { mobile:   searchRegex },
              { email:    searchRegex },
            ]
          }
        ]
      };
    }

    const leads = await Lead.find(query)
      .populate('assignedTelecaller', 'firstName lastName email staffRole')
      .populate('assignedCounselor',  'firstName lastName email staffRole')
      .populate('createdBy',          'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      count: leads.length,
      data:  leads,
      // Legacy key — keeps older frontend code working
      leads,
    });
  } catch (error) {
    console.error('getAllLeads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (Staff/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const createLead = async (req, res) => {
  try {
    const uid = reqUserId(req);

    const leadData = {
      ...req.body,
      createdBy: uid,
    };

    // Remove remarks if passed as a plain string — remarks must be an array
    // of { note, addedBy, addedAt } objects pushed via the addRemark route
    if (
      !leadData.remarks ||
      typeof leadData.remarks === 'string' ||
      leadData.remarks === ''
    ) {
      delete leadData.remarks;
    }

    // Auto-assign to the telecaller who is creating the lead
    if (
      req.user.role === 'staff' &&
      req.user.staffRole?.toLowerCase() === 'telecaller'
    ) {
      leadData.assignedTelecaller = uid;
    }

    // Prevent duplicate mobile numbers
    const existingLead = await Lead.findOne({ mobile: req.body.mobile });
    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: 'A lead with this mobile number already exists',
        existingLead,
      });
    }

    const lead = await Lead.create(leadData);

    const populated = await Lead.findById(lead._id)
      .populate('assignedTelecaller', 'firstName lastName email')
      .populate('assignedCounselor',  'firstName lastName email')
      .populate('createdBy',          'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead:    populated,
      data:    populated,
    });
  } catch (error) {
    console.error('createLead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update lead stage
// @route   PUT /api/leads/:id/stage
// @access  Private (Staff/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateLeadStage = async (req, res) => {
  try {
    const { stage, note } = req.body;

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required',
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    const previousStage = lead.stage;
    lead.stage = stage;

    // Track paid batch conversion
    if (stage === 'Paid Batch' && !lead.convertedToPaid) {
      lead.convertedToPaid  = true;
      lead.conversionDate   = new Date();
      lead.batchType        = 'Paid';
    }

    // Track admission
    if (stage === 'Admission') {
      lead.admissionDate = new Date();
      lead.status        = 'Converted';
    }

    // Auto-add a stage-change remark for audit trail
    if (note || previousStage !== stage) {
      lead.remarks.push({
        note:    note || `Stage changed from ${previousStage} to ${stage}`,
        addedBy: reqUserId(req),
        addedAt: new Date(),
      });
    }

    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTelecaller', 'firstName lastName')
      .populate('assignedCounselor',  'firstName lastName')
      .populate('remarks.addedBy',    'firstName lastName');

    res.json({
      success: true,
      message: 'Lead stage updated',
      lead:    populated,
      data:    populated,
    });
  } catch (error) {
    console.error('updateLeadStage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add remark to lead
// @route   POST /api/leads/:id/remarks
// @access  Private (Staff/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const addRemark = async (req, res) => {
  try {
    // Accept both { note } and { text } shapes from different frontend callers
    const note = req.body.note || req.body.text || req.body.remark;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Remark note is required',
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    lead.remarks.push({
      note:    note.trim(),
      addedBy: reqUserId(req),
      addedAt: new Date(),
    });

    // Update nextFollowUp if provided
    if (req.body.nextFollowUp) {
      lead.nextFollowUp = new Date(req.body.nextFollowUp);
    }

    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTelecaller', 'firstName lastName')
      .populate('assignedCounselor',  'firstName lastName')
      .populate('remarks.addedBy',    'firstName lastName');

    res.json({
      success: true,
      message: 'Remark added',
      lead:    populated,
      data:    populated,
    });
  } catch (error) {
    console.error('addRemark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Assign lead to counselor
// @route   PUT /api/leads/:id/assign-counselor
// @access  Private (Telecaller/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const assignCounselor = async (req, res) => {
  try {
    // Accept counselorId from body; fallback to assignedTo for flexibility
    const counselorId = req.body.counselorId || req.body.assignedTo;

    if (!counselorId) {
      return res.status(400).json({
        success: false,
        message: 'counselorId is required',
      });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    lead.assignedCounselor = new mongoose.Types.ObjectId(String(counselorId));
    lead.stage             = 'Counselling';

    // Add audit remark
    lead.remarks.push({
      note:    req.body.note || `Lead forwarded to counselor by ${req.user.firstName || 'telecaller'}`,
      addedBy: reqUserId(req),
      addedAt: new Date(),
    });

    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTelecaller', 'firstName lastName email')
      .populate('assignedCounselor',  'firstName lastName email')
      .populate('remarks.addedBy',    'firstName lastName');

    res.json({
      success: true,
      message: 'Lead assigned to counselor',
      lead:    populated,
      data:    populated,
    });
  } catch (error) {
    console.error('assignCounselor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get lead statistics
// @route   GET /api/leads/stats/overview
// @access  Private (Staff/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getLeadStats = async (req, res) => {
  try {
    // Role-based scope — same logic as getAllLeads
    const matchQuery = roleBasedQuery(req);

    const totalLeads = await Lead.countDocuments(matchQuery);

    if (totalLeads === 0) {
      return res.json({
        success: true,
        data: {
          totalLeads:      0,
          byStage:         {},
          byBatchType:     {},
          byLeadSource:    {},
          totalConverted:  0,
          conversionRate:  0,
          totalRevenue:    0,
          formattedRevenue:'₹0',
        },
      });
    }

    const stats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          byStage: [
            { $group: { _id: '$stage', count: { $sum: 1 } } },
            { $sort:  { count: -1 } },
          ],
          byBatchType: [
            { $group: { _id: '$batchType', count: { $sum: 1 } } },
          ],
          byLeadSource: [
            { $group: { _id: '$leadSource', count: { $sum: 1 } } },
            { $sort:  { count: -1 } },
          ],
          totalConverted: [
            { $match: { convertedToPaid: true } },
            { $count: 'count' },
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$actualRevenue' } } },
          ],
          recentLeads: [
            { $sort:  { createdAt: -1 } },
            { $limit: 5 },
            { $project: { fullName: 1, mobile: 1, stage: 1, createdAt: 1 } },
          ],
        },
      },
    ]);

    // Convert arrays to key-value maps
    const byStage = stats[0].byStage.reduce((acc, item) => {
      acc[item._id || 'Unknown'] = item.count;
      return acc;
    }, {});

    const byBatchType = stats[0].byBatchType.reduce((acc, item) => {
      acc[item._id || 'Unknown'] = item.count;
      return acc;
    }, {});

    const byLeadSource = stats[0].byLeadSource.reduce((acc, item) => {
      acc[item._id || 'Unknown'] = item.count;
      return acc;
    }, {});

    const totalConverted = stats[0].totalConverted[0]?.count || 0;
    const totalRevenue   = stats[0].totalRevenue[0]?.total   || 0;
    const conversionRate = ((totalConverted / totalLeads) * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        totalLeads,
        byStage,
        byBatchType,
        byLeadSource,
        totalConverted,
        conversionRate:   parseFloat(conversionRate),
        totalRevenue,
        formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        recentLeads:      stats[0].recentLeads || [],
      },
    });
  } catch (error) {
    console.error('getLeadStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead statistics',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Private (Staff/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTelecaller', 'firstName lastName email staffRole')
      .populate('assignedCounselor',  'firstName lastName email staffRole')
      .populate('createdBy',          'firstName lastName')
      .populate('remarks.addedBy',    'firstName lastName');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Staff can only view leads assigned to them
    if (req.user.role === 'staff') {
      const uid      = String(reqUserId(req));
      const telId    = String(lead.assignedTelecaller?._id || lead.assignedTelecaller || '');
      const counId   = String(lead.assignedCounselor?._id  || lead.assignedCounselor  || '');
      const creatId  = String(lead.createdBy?._id          || lead.createdBy          || '');

      if (uid !== telId && uid !== counId && uid !== creatId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied — this lead is not assigned to you',
        });
      }
    }

    res.json({ success: true, data: lead, lead });
  } catch (error) {
    console.error('getLeadById error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
const deleteLead = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete leads',
      });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    res.json({
      success: true,
      message: `Lead for ${lead.fullName} deleted successfully`,
    });
  } catch (error) {
    console.error('deleteLead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:   error.message,
    });
  }
};


module.exports = {
  getAllLeads,
  createLead,
  updateLeadStage,
  addRemark,
  assignCounselor,
  getLeadStats,
  getLeadById,
  deleteLead,
};
