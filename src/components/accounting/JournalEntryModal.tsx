import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import JournalEntryForm from './JournalEntryForm'

interface JournalEntryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function JournalEntryModal({ isOpen, onClose }: JournalEntryModalProps) {
  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2.5 text-gray-400 hover:text-white bg-gray-100 hover:bg-red-500 rounded-full transition-all duration-200 z-20 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="overflow-y-auto w-full h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#10B981] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#047857]">
          <JournalEntryForm onSuccess={onClose} />
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
