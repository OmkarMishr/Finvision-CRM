const mapSheetRowsToLeads = (rows) => {
  if (!rows || rows.length < 2) return [];

  const [headers, ...dataRows] = rows;

  // Status mapping: Meta values → your schema enum values
  const statusMap = {
    'CREATED':  'Active',
    'intake':   'Pending',
    'default':  'Active',
  };

  return dataRows.map((row, index) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = row[i] || '';
    });

    // Clean phone: Meta prefixes with "p:" → strip it
    const rawPhone = obj['PHONE'] || '';
    const cleanPhone = rawPhone.startsWith('p:') ? rawPhone.slice(2) : rawPhone;

    // Map Meta lead_status to your status enum
    const metaStatus = (obj['lead_status'] || '').toUpperCase();
    const status = statusMap[obj['lead_status']] || statusMap['default'];

    return {
      fullName:    obj['FULL_NAME']    || '',
      email:       obj['EMAIL']        || '',
      mobile:      cleanPhone,
      createdAt:   obj['created_time'] || new Date().toISOString(),
      leadSource:  'Facebook',          // all Meta leads default to Facebook
      stage:       'Enquiry',           // all new Meta leads start at Enquiry
      status,
      batchType:   'Free',
      source:      'google_sheet',      // flag to identify sheet-imported leads

      // Store Meta-specific fields as extras (optional, for reference)
      metaLeadId:    obj['id']            || '',
      campaignName:  obj['campaign_name'] || '',
      adName:        obj['ad_name']       || '',
      formName:      obj['form_name']     || '',
    };
  });
};

module.exports = { mapSheetRowsToLeads };