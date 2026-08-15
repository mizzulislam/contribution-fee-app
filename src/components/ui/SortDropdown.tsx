import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { cn } from '@/utils/styles'

export interface SortOption {
  label: string
  value: string
}

export interface SortDropdownProps {
  options: SortOption[]
  sortBy: string
  onSortByChange: (value: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
  className?: string
}

export function SortDropdown({
  options,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  className
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeOption = options.find(opt => opt.value === sortBy)
  const activeLabel = activeOption ? activeOption.label : 'Default'

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200 transition-colors flex items-center gap-2 shadow-sm h-[42px] whitespace-nowrap"
      >
        <ArrowUpDown className="w-4 h-4 text-gray-500 shrink-0" />
        <span>Urutkan: {activeLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 min-w-[190px] w-full rounded-xl border border-gray-150 bg-white p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200 space-y-1">
          {/* Options Group */}
          <div className="space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortByChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-50 flex items-center justify-between",
                  sortBy === option.value ? "text-emerald-700 bg-emerald-50/40 font-semibold" : "text-gray-600"
                )}
              >
                <span>{option.label}</span>
                {sortBy === option.value && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
              </button>
            ))}
          </div>

          <hr className="border-gray-150 my-1 mx-1" />

          {/* Direction Group */}
          <div className="space-y-0.5">
            {[
              { label: 'Ascending', value: 'asc' },
              { label: 'Descending', value: 'desc' }
            ].map((dir) => (
              <button
                key={dir.value}
                type="button"
                onClick={() => {
                  onSortOrderChange(dir.value as 'asc' | 'desc')
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-gray-50 flex items-center justify-between",
                  sortOrder === dir.value ? "text-emerald-700 bg-emerald-50/40 font-semibold" : "text-gray-600"
                )}
              >
                <span>{dir.label}</span>
                {sortOrder === dir.value && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
