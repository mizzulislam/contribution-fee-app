import { createPortal } from 'react-dom'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'info' | 'success'
  showCancel?: boolean
  onClose: () => void
  onConfirm?: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  showCancel = true,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const getIconContainerClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 text-red-600'
      case 'success':
        return 'bg-green-100 text-green-600'
      case 'info':
      default:
        return 'bg-primary-100 text-primary-600'
    }
  }

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-7 h-7" />
      case 'success':
        return <CheckCircle2 className="w-7 h-7" />
      case 'info':
      default:
        return <Info className="w-7 h-7" />
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full mb-5 ${getIconContainerClass()}`}>
          {renderIcon()}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-8 whitespace-pre-line text-left leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          {showCancel && (
            <button
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 font-medium"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm()
              } else {
                onClose()
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors shadow-md ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : variant === 'success'
                ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                : 'bg-primary hover:bg-primary-dark shadow-primary/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
