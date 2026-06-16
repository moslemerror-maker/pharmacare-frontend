export const fmt = {
  currency: v => `₹${parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`,
  date:     v => v ? new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—',
  dateTime: v => v ? new Date(v).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—',
  num:      v => parseFloat(v||0).toLocaleString('en-IN'),
}

export const statusBadge = (status) => {
  const map = {
    Active:'badge-blue', Dispensed:'badge-green', Partial:'badge-yellow', Expired:'badge-red',
    Paid:'badge-green', Unpaid:'badge-red', Pending:'badge-yellow', Received:'badge-green',
    OK:'badge-green', LOW:'badge-yellow', CRITICAL:'badge-red', 'OUT OF STOCK':'badge-red',
    Cash:'badge-gray', Card:'badge-blue', UPI:'badge-purple',
  }
  return map[status] || 'badge-gray'
}

// Named aliases so pages can import { fmtDate, fmtDateTime } directly
export const fmtDate     = fmt.date
export const fmtDateTime = fmt.dateTime

export const gstOptions = [0, 5, 12, 18]
export const formOptions = ['Tablet','Capsule','Syrup','Injection','Cream','Drops','Inhaler','Powder','Other']
export const scheduleOptions = ['OTC','H','H1','X','G']
export const frequencyOptions = ['Once daily (OD)','Twice daily (BD)','Thrice daily (TID)','Four times daily (QID)','SOS / As needed','At bedtime (HS)','Before meals (AC)','After meals (PC)']
export const durationOptions = ['1 day','2 days','3 days','5 days','7 days','10 days','14 days','1 month','2 months','3 months','Ongoing']
