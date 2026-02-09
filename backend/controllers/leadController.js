const Lead = require('../models/Lead');

// @desc    Get all leads (with filters)
// @route   GET /api/leads
// @access  Private (Staff/Admin)
const getAllLeads = async (req, res) => {
  try {
    const { stage, batchType, leadSource, search } = req.query;
    
    let query = {};

    // Role-based filtering
    if (req.user.role === 'staff') {
      if (req.user.staffRole === 'telecaller') {
        query.assignedTelecaller = req.user.userId || req.user.id;
      } else if (req.user.staffRole === 'counselor') {
        query.assignedCounselor = req.user.userId || req.user.id;
      }
    }

    // Filters
    if (stage) query.stage = stage;
    if (batchType) query.batchType = batchType;
    if (leadSource) query.leadSource = leadSource;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTelecaller', 'firstName lastName email')
      .populate('assignedCounselor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ 
      success: true,
      leads, 
      count: leads.length 
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (Staff/Admin)
const createLead = async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user.userId || req.user.id
    };

    // Remove remarks if it's empty or invalid
    if (!leadData.remarks || leadData.remarks === '' || typeof leadData.remarks === 'string') {
      delete leadData.remarks;
    }

    // Auto-assign to telecaller if role is telecaller
    if (req.user.role === 'staff' && req.user.staffRole === 'telecaller') {
      leadData.assignedTelecaller = req.user.userId || req.user.id;
    }

    // Check for duplicate mobile number
    const existingLead = await Lead.findOne({ mobile: req.body.mobile });
    if (existingLead) {
      return res.status(400).json({ 
        success: false,
        message: 'Lead with this mobile number already exists',
        existingLead 
      });
    }

    const lead = await Lead.create(leadData);
    
    res.status(201).json({ 
      success: true,
      message: 'Lead created successfully', 
      lead 
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Update lead stage
// @route   PUT /api/leads/:id/stage
// @access  Private (Staff/Admin)
const updateLeadStage = async (req, res) => {
  try {
    const { stage } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      });
    }

    lead.stage = stage;
    
    // Track conversions
    if (stage === 'Paid Batch' && !lead.convertedToPaid) {
      lead.convertedToPaid = true;
      lead.conversionDate = new Date();
      lead.batchType = 'Paid';
    }
    
    if (stage === 'Admission') {
      lead.admissionDate = new Date();
      lead.status = 'Converted';
    }

    await lead.save();
    
    res.json({ 
      success: true,
      message: 'Lead stage updated', 
      lead 
    });
  } catch (error) {
    console.error('Update lead stage error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Add remark to lead
// @route   POST /api/leads/:id/remarks
// @access  Private (Staff/Admin)
const addRemark = async (req, res) => {
  try {
    const { note } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      });
    }

    lead.remarks.push({
      note,
      addedBy: req.user.userId || req.user.id,
      addedAt: new Date()
    });

    await lead.save();
    
    const populatedLead = await Lead.findById(lead._id)
      .populate('remarks.addedBy', 'firstName lastName');

    res.json({ 
      success: true,
      message: 'Remark added', 
      lead: populatedLead 
    });
  } catch (error) {
    console.error('Add remark error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Assign lead to counselor
// @route   PUT /api/leads/:id/assign-counselor
// @access  Private (Telecaller/Admin)
const assignCounselor = async (req, res) => {
  try {
    const { counselorId } = req.body;
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { 
        assignedCounselor: counselorId,
        stage: 'Counselling'
      },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Lead assigned to counselor', 
      lead 
    });
  } catch (error) {
    console.error('Assign counselor error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Get lead stats
// @route   GET /api/leads/stats/overview
// @access  Private (Staff/Admin)
const getLeadStats = async (req, res) => {
  try {
    let matchQuery = {};
    
    // Role-based filtering
    if (req.user.role === 'staff') {
      const userId = req.user.userId || req.user.id;
      if (req.user.staffRole === 'telecaller') {
        matchQuery.assignedTelecaller = userId;
      } else if (req.user.staffRole === 'counselor') {
        matchQuery.assignedCounselor = userId;
      }
    }

    // Get total count
    const totalLeads = await Lead.countDocuments(matchQuery);

    // If no leads, return empty stats
    if (totalLeads === 0) {
      return res.json({ 
        success: true,
        data: {  
          totalLeads: 0,
          byStage: {},
          byBatchType: {},
          byLeadSource: {},
          totalConverted: 0,
          conversionRate: 0,
          totalRevenue: 0,
          formattedRevenue: '₹0'
        }
      });
    }

    const stats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          byStage: [
            { $group: { _id: '$stage', count: { $sum: 1 } } }
          ],
          byBatchType: [
            { $group: { _id: '$batchType', count: { $sum: 1 } } }
          ],
          byLeadSource: [
            { $group: { _id: '$leadSource', count: { $sum: 1 } } }
          ],
          totalConverted: [
            { $match: { convertedToPaid: true } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$actualRevenue' } } }
          ]
        }
      }
    ]);
    const byStage = {};
    stats[0].byStage.forEach(item => {
      byStage[item._id] = item.count;
    });

    const byBatchType = {};
    stats[0].byBatchType.forEach(item => {
      byBatchType[item._id] = item.count;
    });

    const byLeadSource = {};
    stats[0].byLeadSource.forEach(item => {
      byLeadSource[item._id] = item.count;
    });

    const totalConverted = stats[0].totalConverted[0]?.count || 0;
    const totalRevenue = stats[0].totalRevenue[0]?.total || 0;
    const conversionRate = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(2) : 0;

    const formattedStats = {
      totalLeads,
      byStage,
      byBatchType,
      byLeadSource,
      totalConverted,
      conversionRate: parseFloat(conversionRate),
      totalRevenue,
      formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`
    };

    res.json({ 
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch lead statistics',
      error: error.message
    });
  }
};


module.exports = {
  getAllLeads,
  createLead,
  updateLeadStage,
  addRemark,
  assignCounselor,
  getLeadStats
};
