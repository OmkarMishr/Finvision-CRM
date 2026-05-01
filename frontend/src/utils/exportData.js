// Export helpers — Excel and PDF — used by the shared ExportButton.
//
// These are deliberately dependency-light:
//   * Excel: an HTML <table> saved with .xls extension and the
//     application/vnd.ms-excel MIME type. Excel and Google Sheets both open
//     this natively. Avoids pulling in SheetJS just for tabular dumps.
//   * PDF: jspdf (already a dependency). We render the table by hand instead
//     of depending on jspdf-autotable so this module has zero new deps.

import { jsPDF } from 'jspdf'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const safeFilename = (name = 'export') =>
  String(name)
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'export'

const todayStamp = () => new Date().toISOString().split('T')[0]

// Coerce any cell to a printable string. Dates → ISO date, null/undefined → "".
const cell = (v) => {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'number') return String(v)
  return String(v)
}

// Escape for HTML — needed for the .xls path so values containing < > & don't
// break the table parse.
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Excel (.xls) ─────────────────────────────────────────────────────────────
// `headers` = string[],  `rows` = (string|number|Date|null)[][]
export const exportToExcel = ({ filename = 'export', title = '', headers = [], rows = [] }) => {
  const dateLine = `Generated ${new Date().toLocaleString('en-IN')}`
  const head = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')
  const body = rows
    .map(r => `<tr>${headers.map((_, i) => `<td>${escapeHtml(cell(r[i]))}</td>`).join('')}</tr>`)
    .join('')

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/>
  <style>
    table  { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
    th, td { border: 1px solid #999; padding: 4px 8px; vertical-align: top; }
    th     { background:#1a1a1a; color:#fff; text-align:left; }
    td     { mso-number-format: "@"; }
    h2     { font-family: Calibri, Arial, sans-serif; }
    .meta  { color: #666; font-size: 10pt; margin-bottom: 12px; }
  </style></head>
<body>
${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
<div class="meta">${dateLine}</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`

  // BOM so Excel treats it as UTF-8 reliably.
  const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  downloadBlob(blob, `${safeFilename(filename)}_${todayStamp()}.xls`)
}

// ─── PDF (jspdf, hand-rolled table) ───────────────────────────────────────────
export const exportToPDF = ({ filename = 'export', title = '', headers = [], rows = [] }) => {
  // Landscape gives more room for wide tables. A4 in points: 595 × 842.
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin     = 36

  // Header
  doc.setFont('helvetica', 'bold').setFontSize(14)
  if (title) doc.text(title, margin, margin + 4)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(120)
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, margin, margin + 22)
  doc.setTextColor(0)

  // Column widths — distribute evenly with min/max guards so labels fit.
  const usableWidth = pageWidth - margin * 2
  const colCount    = Math.max(headers.length, 1)
  const colWidth    = usableWidth / colCount

  const rowHeight = 18
  let y = margin + 44

  const drawHeaderRow = () => {
    doc.setFillColor(26, 26, 26)
    doc.rect(margin, y, usableWidth, rowHeight, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(255)
    headers.forEach((h, i) => {
      const text = doc.splitTextToSize(String(h ?? ''), colWidth - 8)
      doc.text(text[0] || '', margin + i * colWidth + 4, y + 12)
    })
    doc.setTextColor(0)
    y += rowHeight
  }

  drawHeaderRow()
  doc.setFont('helvetica', 'normal').setFontSize(9)

  rows.forEach((row, rIdx) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      drawHeaderRow()
      doc.setFont('helvetica', 'normal').setFontSize(9)
    }

    if (rIdx % 2 === 1) {
      doc.setFillColor(245, 246, 248)
      doc.rect(margin, y, usableWidth, rowHeight, 'F')
    }

    headers.forEach((_, i) => {
      const raw   = cell(row[i])
      const lines = doc.splitTextToSize(raw, colWidth - 8)
      doc.text(lines[0] || '', margin + i * colWidth + 4, y + 12)
    })

    // thin row separator
    doc.setDrawColor(220).setLineWidth(0.4)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)
    y += rowHeight
  })

  // Footer page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(140)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 14, { align: 'right' })
  }

  doc.save(`${safeFilename(filename)}_${todayStamp()}.pdf`)
}

// Convenience: accept rows as objects when callers prefer columns config.
//   columns: [{ header, accessor: row => value }]
export const buildRowsFromObjects = (objects = [], columns = []) => ({
  headers: columns.map(c => c.header),
  rows:    objects.map(obj => columns.map(c =>
    typeof c.accessor === 'function' ? c.accessor(obj) : obj?.[c.accessor]
  )),
})
