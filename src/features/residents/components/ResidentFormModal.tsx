import { X, Save } from 'lucide-react'
import { createPortal } from 'react-dom'
import Select from '@/components/ui/Select'

export interface WargaFormData {
  full_name: string
  nickname: string
  email: string
  room_number: string
  phone_number: string
  role: string
  status: string
}

export interface WargaFormModalProps {
  isOpen: boolean
  onClose: () => void
  formData: WargaFormData
  setFormData: (data: WargaFormData) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  editingId: number | string | null
  setIsEmailEdited: (edited: boolean) => void
}

export function WargaFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  editingId,
  setIsEmailEdited
}: WargaFormModalProps) {
  if (!isOpen) return null

  const toggleRole = (r: string) => {
    const currentRoles = formData.role ? formData.role.split(',').map(r => r.trim()) : []
    let newRoles
    if (currentRoles.includes(r)) {
      newRoles = currentRoles.filter(role => role !== r)
      if (newRoles.length === 0) newRoles = ['user'] // Minimal punya 1 role
    } else {
      newRoles = [...currentRoles, r]
    }
    setFormData({...formData, role: newRoles.join(',')})
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
              <input 
                type="text" 
                required
                className="form-input" 
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="Contoh: Budi Santoso"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Panggilan</label>
              <input 
                type="text" 
                required
                className="form-input" 
                value={formData.nickname}
                onChange={e => setFormData({...formData, nickname: e.target.value})}
                placeholder="Contoh: Budi"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Akses</label>
            <input 
              type="email" 
              required
              className="form-input" 
              value={formData.email}
              onChange={e => {
                setFormData({...formData, email: e.target.value})
                setIsEmailEdited(true)
              }}
              placeholder="otomatis@soematra.com"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Kamar</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.room_number}
                onChange={e => setFormData({...formData, room_number: e.target.value})}
                placeholder="Kosongkan jika admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Akun</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    formData.role.includes('user')
                      ? 'bg-white shadow text-primary border border-primary/10' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => toggleRole('user')}
                >
                  Warga
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    formData.role.includes('admin')
                      ? 'bg-white shadow text-primary border border-primary/10' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => toggleRole('admin')}
                >
                  Bendahara
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Anda bisa memilih keduanya.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor WhatsApp</label>
              <input 
                type="tel" 
                required
                className="form-input" 
                value={formData.phone_number}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({...formData, phone_number: val});
                }}
                placeholder="081234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Pengguna</label>
              <Select
                className="w-full"
                value={formData.status}
                onChange={(val) => setFormData({...formData, status: val})}
                options={[
                  { label: 'Aktif', value: 'Aktif' },
                  { label: 'Pending', value: 'Pending' },
                  { label: 'Nonaktif', value: 'Nonaktif' }
                ]}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 font-medium"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary flex-1 flex justify-center items-center py-2.5 font-medium shadow-md shadow-primary/20"
            >
              {isSubmitting ? 'Menyimpan...' : (
                <><Save className="w-5 h-5 mr-2" /> Simpan</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
