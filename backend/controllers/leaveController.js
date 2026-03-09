const mongoose         = require('mongoose')
const LeaveApplication = require('../models/LeaveApplication')
const User             = require('../models/User')   // your existing User model

// ─── Helpers ───────────────────────────────────────────────────────────────────
const ok  = (res, data, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true,  message: msg,  data })

const fail = (res, msg = 'Server error', code = 500) =>
  res.status(code).json({ success: false, message: msg })


// ══════════════════════════════════════════════════════════════════════════════
//  STAFF — Apply
// ══════════════════════════════════════════════════════════════════════════════
exports.applyLeave = async (req, res) => {
  try {
    const {
      leaveType, fromDate, toDate,
      reason, isHalfDay, halfDaySlot, contactNo,
    } = req.body

    // ── Validation ─────────────────────────────────────────────────────────
    if (!leaveType || !fromDate || !toDate || !reason)
      return fail(res, 'leaveType, fromDate, toDate and reason are required', 400)

    if (new Date(toDate) < new Date(fromDate))
      return fail(res, 'toDate must be on or after fromDate', 400)

    if (reason.trim().length < 10)
      return fail(res, 'Reason must be at least 10 characters', 400)

    const validTypes = ['casual', 'sick', 'earned', 'halfday', 'emergency', 'unpaid']
    if (!validTypes.includes(leaveType))
      return fail(res, `Invalid leave type. Must be one of: ${validTypes.join(', ')}`, 400)

    // ── Check overlapping pending leave ────────────────────────────────────
    const overlap = await LeaveApplication.findOne({
      staff:  req.user.id,
      status: 'pending',
      $or: [{
        fromDate: { $lte: new Date(toDate)   },
        toDate:   { $gte: new Date(fromDate) },
      }],
    })
    if (overlap)
      return fail(res, 'You already have a pending leave for overlapping dates', 409)

    // ── Create ─────────────────────────────────────────────────────────────
    const application = await LeaveApplication.create({
      staff:       req.user.id,
      staffName:   req.user.name,           // from authMiddleware
      staffEmail:  req.user.email,          // from authMiddleware
      staffRole:   req.user.staffRole,      // from authMiddleware
      leaveType,
      fromDate:    new Date(fromDate),
      toDate:      new Date(toDate),
      reason:      reason.trim(),
      isHalfDay:   !!isHalfDay,
      halfDaySlot: isHalfDay ? (halfDaySlot || 'morning') : null,
      contactNo:   contactNo?.trim() || null,
      status:      'pending',
    })

    return ok(res, application, 'Leave application submitted successfully', 201)
  } catch (e) {
    console.error('[applyLeave]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  STAFF — My History
// ══════════════════════════════════════════════════════════════════════════════
exports.getMyHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const filter = { staff: req.user.id }
    if (status && status !== 'all') filter.status = status

    const [records, total] = await Promise.all([
      LeaveApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .populate('reviewedBy', 'firstName lastName email'),
      LeaveApplication.countDocuments(filter),
    ])

    return ok(res, { records, total, page: +page, limit: +limit })
  } catch (e) {
    console.error('[getMyHistory]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  STAFF — Balance
// ══════════════════════════════════════════════════════════════════════════════
exports.getMyBalance = async (req, res) => {
  try {
    const yearStart = new Date(new Date().getFullYear(), 0, 1)

    const used = await LeaveApplication.aggregate([
      {
        $match: {
          staff:    new mongoose.Types.ObjectId(req.user.id),
          status:   'approved',
          fromDate: { $gte: yearStart },
        },
      },
      {
        $group: {
          _id:      '$leaveType',
          daysUsed: { $sum: '$totalDays' },
        },
      },
    ])

    const MAX     = { casual: 12, sick: 12, earned: 15, halfday: 24, emergency: 5, unpaid: 999 }
    const balance = {}
    Object.keys(MAX).forEach(t => { balance[t] = 0 })
    used.forEach(u => { if (u._id) balance[u._id] = u.daysUsed })

    return ok(res, { balance, max: MAX })
  } catch (e) {
    console.error('[getMyBalance]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  STAFF — Cancel
// ══════════════════════════════════════════════════════════════════════════════
exports.cancelLeave = async (req, res) => {
  try {
    const application = await LeaveApplication.findOne({
      _id:   req.params.id,
      staff: req.user.id,       // ensures staff can only cancel own leave
    })

    if (!application)
      return fail(res, 'Leave application not found', 404)

    if (application.status !== 'pending')
      return fail(res, `Cannot cancel a leave that is already ${application.status}`, 400)

    application.status = 'cancelled'
    await application.save()

    return ok(res, application, 'Leave application cancelled')
  } catch (e) {
    console.error('[cancelLeave]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Get All Leaves
// ══════════════════════════════════════════════════════════════════════════════
exports.getAllLeaves = async (req, res) => {
  try {
    const {
      status, staffId, leaveType,
      fromDate, toDate,
      page = 1, limit = 20,
    } = req.query

    const filter = {}
    if (status    && status    !== 'all') filter.status    = status
    if (leaveType && leaveType !== 'all') filter.leaveType = leaveType
    if (staffId)                          filter.staff     = staffId
    if (fromDate || toDate) {
      filter.fromDate = {}
      if (fromDate) filter.fromDate.$gte = new Date(fromDate)
      if (toDate)   filter.fromDate.$lte = new Date(toDate)
    }

    const [records, total] = await Promise.all([
      LeaveApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .populate('staff',      'firstName lastName email staffRole')
        .populate('reviewedBy', 'firstName lastName email'),
      LeaveApplication.countDocuments(filter),
    ])

    return ok(res, { records, total, page: +page, limit: +limit })
  } catch (e) {
    console.error('[getAllLeaves]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Pending Only (for dashboard notification badge)
// ══════════════════════════════════════════════════════════════════════════════
exports.getPendingLeaves = async (req, res) => {
  try {
    const records = await LeaveApplication.find({ status: 'pending' })
      .sort({ createdAt: 1 })    // oldest first so nothing stales
      .populate('staff', 'firstName lastName email staffRole')

    return ok(res, { records, total: records.length })
  } catch (e) {
    console.error('[getPendingLeaves]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Stats
// ══════════════════════════════════════════════════════════════════════════════
exports.getLeaveStats = async (req, res) => {
  try {
    const yearStart = new Date(new Date().getFullYear(), 0, 1)

    const [byStatus, byType, monthly] = await Promise.all([
      // Count by status (this year)
      LeaveApplication.aggregate([
        { $match: { createdAt: { $gte: yearStart } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Days used by leave type (approved only)
      LeaveApplication.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: yearStart } } },
        { $group: { _id: '$leaveType', totalDays: { $sum: '$totalDays' }, count: { $sum: 1 } } },
      ]),
      // Monthly application trend
      LeaveApplication.aggregate([
        { $match: { createdAt: { $gte: yearStart } } },
        {
          $group: {
            _id:   { month: { $month: '$createdAt' }, status: '$status' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
    ])

    return ok(res, { byStatus, byType, monthly })
  } catch (e) {
    console.error('[getLeaveStats]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Review (Approve / Reject)
// ══════════════════════════════════════════════════════════════════════════════
exports.reviewLeave = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body

    if (!['approved', 'rejected'].includes(status))
      return fail(res, 'status must be "approved" or "rejected"', 400)

    const application = await LeaveApplication.findById(req.params.id)
      .populate('staff', 'firstName lastName email')

    if (!application)
      return fail(res, 'Leave application not found', 404)

    if (application.status !== 'pending')
      return fail(res, `This application is already ${application.status}`, 400)

    // ── Update fields ──────────────────────────────────────────────────────
    application.status       = status
    application.reviewedBy   = req.user.id     // admin's User _id
    application.reviewedAt   = new Date()
    application.adminRemarks = adminRemarks?.trim() || null
    await application.save()

    return ok(res, application, `Leave ${status} successfully`)
  } catch (e) {
    console.error('[reviewLeave]', e)
    return fail(res, e.message)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Delete
// ══════════════════════════════════════════════════════════════════════════════
exports.deleteLeave = async (req, res) => {
  try {
    const application = await LeaveApplication.findByIdAndDelete(req.params.id)
    if (!application) return fail(res, 'Leave application not found', 404)
    return ok(res, null, 'Leave application deleted')
  } catch (e) {
    console.error('[deleteLeave]', e)
    return fail(res, e.message)
  }
}
