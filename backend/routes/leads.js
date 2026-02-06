const express = require('express')
const router = express.Router()
const Lead = require('../models/Lead')
const { protect } = require('../middleware/auth')

// @desc    Get all leads (with filters)
// @route   GET /api/leads
// @access  Private (Staff/Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { stage, batchType, leadSource, search } = req.query
    
    let query = {}

    // Role-based filtering
    if (req.user.role === 'staff') {
      if (req.user.staffRole === 'telecaller') {
        query.assignedTelecaller = req.user.userId || req.user.id
      } else if (req.user.staffRole === 'counselor') {
        query.assignedCounselor = req.user.userId || req.user.id
      }
    }

    // Filters
    if (stage) query.stage = stage
    if (batchType) query.batchType = batchType
    if (leadSource) query.leadSource = leadSource
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const leads = await Lead.find(query)
      .populate('assignedTelecaller', 'firstName lastName email')
      .populate('assignedCounselor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({ 
      success: true,
      leads, 
      count: leads.length 
    })
  } catch (error) {
    console.error('Get leads error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (Staff/Admin)
router.post('/', protect, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      createdBy: req.user.userId || req.user.id
    }
    // Remove remarks if it's empty or invalid
    if (!leadData.remarks || leadData.remarks === '' || typeof leadData.remarks === 'string') {
        delete leadData.remarks
      }

    // Auto-assign to telecaller if role is telecaller
    if (req.user.role === 'staff' && req.user.staffRole === 'telecaller') {
      leadData.assignedTelecaller = req.user.userId || req.user.id
    }

    // Check for duplicate mobile number
    const existingLead = await Lead.findOne({ mobile: req.body.mobile })
    if (existingLead) {
      return res.status(400).json({ 
        success: false,
        message: 'Lead with this mobile number already exists',
        existingLead 
      })
    }

    const lead = await Lead.create(leadData)
    
    res.status(201).json({ 
      success: true,
      message: 'Lead created successfully', 
      lead 
    })
  } catch (error) {
    console.error('Create lead error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    })
  }
})

// @desc    Update lead stage
// @route   PUT /api/leads/:id/stage
// @access  Private (Staff/Admin)
router.put('/:id/stage', protect, async (req, res) => {
  try {
    const { stage } = req.body
    
    const lead = await Lead.findById(req.params.id)
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      })
    }

    lead.stage = stage
    
    // Track conversions
    if (stage === 'Paid Batch' && !lead.convertedToPaid) {
      lead.convertedToPaid = true
      lead.conversionDate = new Date()
      lead.batchType = 'Paid'
    }
    
    if (stage === 'Admission') {
      lead.admissionDate = new Date()
      lead.status = 'Converted'
    }

    await lead.save()
    
    res.json({ 
      success: true,
      message: 'Lead stage updated', 
      lead 
    })
  } catch (error) {
    console.error('Update lead stage error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// @desc    Add remark to lead
// @route   POST /api/leads/:id/remarks
// @access  Private (Staff/Admin)
router.post('/:id/remarks', protect, async (req, res) => {
  try {
    const { note } = req.body
    
    const lead = await Lead.findById(req.params.id)
    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      })
    }

    lead.remarks.push({
      note,
      addedBy: req.user.userId || req.user.id,
      addedAt: new Date()
    })

    await lead.save()
    
    const populatedLead = await Lead.findById(lead._id)
      .populate('remarks.addedBy', 'firstName lastName')

    res.json({ 
      success: true,
      message: 'Remark added', 
      lead: populatedLead 
    })
  } catch (error) {
    console.error('Add remark error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// @desc    Assign lead to counselor
// @route   PUT /api/leads/:id/assign-counselor
// @access  Private (Telecaller/Admin)
router.put('/:id/assign-counselor', protect, async (req, res) => {
  try {
    const { counselorId } = req.body
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { 
        assignedCounselor: counselorId,
        stage: 'Counselling'
      },
      { new: true }
    )

    if (!lead) {
      return res.status(404).json({ 
        success: false,
        message: 'Lead not found' 
      })
    }

    res.json({ 
      success: true,
      message: 'Lead assigned to counselor', 
      lead 
    })
  } catch (error) {
    console.error('Assign counselor error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// @desc    Get lead stats
// @route   GET /api/leads/stats/overview
// @access  Private (Staff/Admin)
router.get('/stats/overview', protect, async (req, res) => {
  try {
    let matchQuery = {}
    
    // Role-based filtering
    if (req.user.role === 'staff') {
      const userId = req.user.userId || req.user.id
      if (req.user.staffRole === 'telecaller') {
        matchQuery.assignedTelecaller = userId
      } else if (req.user.staffRole === 'counselor') {
        matchQuery.assignedCounselor = userId
      }
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
          totalConverted: [
            { $match: { convertedToPaid: true } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$actualRevenue' } } }
          ]
        }
      }
    ])

    res.json({ 
      success: true,
      stats: stats[0] 
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

module.exports = router
