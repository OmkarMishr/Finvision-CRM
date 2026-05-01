import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import { exportToExcel, exportToPDF } from '../../utils/exportData'

// Reusable export button. Drops down to let the user pick Excel (.xls) or
// PDF. Replaces every per-panel "Export CSV" button so the UX is consistent
// across the app and so we never ship CSV-only output again.
//
// Props:
//   filename  base filename (date is appended automatically)
//   title     printed at the top of the file
//   headers   string[] column labels
//   rows      (string|number|Date|null)[][] — 1 row per record
//   getRows   () => { headers, rows } — alternative to passing rows; called
//             at click-time so the caller can compute fresh data on demand
//   disabled  optional — disables the button
//   className optional — extra classes on the button
//   variant   "primary" (default green) | "subtle" (outline)
const ExportButton = ({
  filename = 'export',
  title    = '',
  headers,
  rows,
  getRows,
  disabled = false,
  className = '',
  variant = 'primary',
  label = 'Export',
}) => {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  const resolveData = () => {
    if (typeof getRows === 'function') {
      const r = getRows() || {}
      return { headers: r.headers || headers || [], rows: r.rows || [] }
    }
    return { headers: headers || [], rows: rows || [] }
  }

  const handle = (format) => {
    setOpen(false)
    const data = resolveData()
    const args = { filename, title, ...data }
    if (format === 'excel') exportToExcel(args)
    else                    exportToPDF(args)
  }

  const baseBtn =
    variant === 'subtle'
      ? 'px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50'
      : 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium'

  return (
    <div ref={wrapRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        className={`${baseBtn} flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}>
        <Download className="w-4 h-4" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
          <button
            onClick={() => handle('excel')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Download as Excel
          </button>
          <button
            onClick={() => handle('pdf')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
            <FileText className="w-4 h-4 text-red-600" />
            Download as PDF
          </button>
        </div>
      )}
    </div>
  )
}

export default ExportButton
