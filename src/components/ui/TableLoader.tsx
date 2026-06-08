import { Loader2 } from 'lucide-react'

interface TableLoaderProps {
  colSpan: number
  text?: string
}

export function TableLoader({ colSpan, text = 'Memuat data...' }: TableLoaderProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <span className="text-sm font-medium">{text}</span>
        </div>
      </td>
    </tr>
  )
}
