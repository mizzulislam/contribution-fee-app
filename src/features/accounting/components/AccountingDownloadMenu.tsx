import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, Printer } from 'lucide-react'

type CellValue = string | number

interface AccountingDownloadMenuProps {
  fileName: string
  title: string
  meta: string
  headers: string[]
  rows: CellValue[][]
  amountColumnIndexes?: number[]
  emptyMessage?: string
}

export default function AccountingDownloadMenu({
  fileName,
  title,
  meta,
  headers,
  rows,
  amountColumnIndexes = [],
  emptyMessage = 'Tidak ada data pada periode ini.',
}: AccountingDownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const printAreaId = `accounting-print-${fileName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const escapeCsvValue = (value: CellValue) => {
    const text = String(value ?? '')
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const handleDownloadCsv = () => {
    const csvContent = [headers, ...rows]
      .map(row => row.map(escapeCsvValue).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${fileName}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const handlePrintPdf = () => {
    setIsOpen(false)
    window.print()
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex min-h-[46px] min-w-[212px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <Download className="h-5 w-5 text-emerald-600" />
        Download
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            CSV
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            PDF
          </button>
        </div>
      )}

      <style>
        {`
          @media screen {
            [data-accounting-print-area="${printAreaId}"] {
              display: none;
            }
          }

          @media print {
            @page {
              size: auto;
              margin: 12mm;
            }

            body * {
              visibility: hidden !important;
            }

            [data-accounting-print-area="${printAreaId}"],
            [data-accounting-print-area="${printAreaId}"] * {
              visibility: visible !important;
            }

            [data-accounting-print-area="${printAreaId}"] {
              display: block !important;
              position: absolute !important;
              inset: 0 auto auto 0 !important;
              width: 100% !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
              font-family: Arial, sans-serif !important;
            }

            [data-accounting-print-area="${printAreaId}"] h1 {
              margin: 0 0 6px !important;
              font-size: 22px !important;
              line-height: 1.2 !important;
            }

            [data-accounting-print-area="${printAreaId}"] .print-meta {
              margin-bottom: 18px !important;
              color: #4b5563 !important;
              font-size: 12px !important;
            }

            [data-accounting-print-area="${printAreaId}"] table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              font-size: 11px !important;
            }

            [data-accounting-print-area="${printAreaId}"] th {
              border: 1px solid #d1d5db !important;
              background: #f3f4f6 !important;
              padding: 8px !important;
              text-align: left !important;
              font-weight: 700 !important;
            }

            [data-accounting-print-area="${printAreaId}"] td {
              border: 1px solid #e5e7eb !important;
              padding: 7px 8px !important;
              vertical-align: top !important;
              word-break: break-word !important;
            }

            [data-accounting-print-area="${printAreaId}"] .print-amount {
              text-align: right !important;
              white-space: nowrap !important;
            }
          }
        `}
      </style>

      <div data-accounting-print-area={printAreaId} aria-hidden="true">
        <h1>{title}</h1>
        <div className="print-meta">{meta}</div>
        <table>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length}>{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      className={amountColumnIndexes.includes(cellIndex) ? 'print-amount' : undefined}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
