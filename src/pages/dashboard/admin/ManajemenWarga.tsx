import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { Plus, Users, AlertTriangle, Info } from 'lucide-react'
import { WargaTable } from '@/components/admin/warga/WargaTable'
import { WargaFormModal, type WargaFormData } from '@/components/admin/warga/WargaFormModal'

interface WargaUser extends WargaFormData {
  id: number | string
  name?: string
}

export default function ManajemenWarga() {
  const [users, setUsers] = useState<WargaUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: () => {}
  })
  
  // Form State
  const [formData, setFormData] = useState<WargaFormData>({
    full_name: '',
    nickname: '',
    email: '',
    room_number: '',
    phone_number: '',
    role: 'user',
    status: 'Aktif'
  })
  const [isEmailEdited, setIsEmailEdited] = useState(false)

  // Auto-generate email based on name/nickname
  useEffect(() => {
    if (!isEmailEdited) {
      const baseName = formData.nickname || formData.full_name.split(' ')[0]
      let nextEmail = ''

      if (baseName) {
        nextEmail = `${baseName.toLowerCase().replace(/[^a-z0-9]/g, '')}@soematra.com`
      }

      if (formData.email !== nextEmail) {
        const timer = setTimeout(() => {
          setFormData(prev => ({ ...prev, email: nextEmail }))
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [formData.email, formData.full_name, formData.nickname, isEmailEdited])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Users')
    
    if (data && Array.isArray(data)) {
      setUsers(data)
    } else {
      setUsers([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (editingId) {
      // Mode Edit
      const updatedUser = { id: editingId, ...formData }
      const { success } = await spreadsheetApi.put('Users', updatedUser)

      setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } : u))
      setIsModalOpen(false)
      resetForm()
      
      if (!success) {
        showAlertDialog(
          'Gagal Menyimpan',
          'Gagal memperbarui data pengguna ke sistem.',
          false
        )
      } else {
        showAlertDialog(
          'Pembaruan Berhasil',
          'Data pengguna berhasil diperbarui dan disimpan.',
          false
        )
      }
    } else {
      // Mode Tambah
      const generatedId = globalThis.crypto?.randomUUID?.() || String(Date.now())
      const newUser = { id: generatedId, ...formData }
      const { success } = await spreadsheetApi.post('Users', newUser)
      
      setUsers([...users, newUser])
      setIsModalOpen(false)
      resetForm()

      if (!success) {
        showAlertDialog(
          'Gagal Menyimpan',
          'Gagal menambahkan pengguna baru ke sistem.',
          false
        )
      } else {
        showAlertDialog(
          'Berhasil Ditambahkan',
          'Data pengguna berhasil ditambahkan.',
          false
        )
      }
    }
    setIsSubmitting(false)
  }

  const handleEdit = (user: WargaUser) => {
    setFormData({
      full_name: user.full_name || user.name || '',
      nickname: user.nickname || '',
      email: user.email || '',
      room_number: user.room_number || '',
      phone_number: user.phone_number || '',
      role: user.role || 'user',
      status: user.status || 'Aktif'
    })
    setEditingId(user.id)
    setIsEmailEdited(true)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number | string) => {
    showAlertDialog(
      'Hapus Pengguna',
      'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.',
      true,
      async () => {
        const { success } = await spreadsheetApi.del('Users', id)
        setUsers(users.filter(u => u.id !== id))
        
        if (!success) {
          showAlertDialog(
            'Gagal Menghapus',
            'Gagal menghapus pengguna dari sistem. Terjadi kesalahan koneksi.',
            false
          )
        } else {
          showAlertDialog(
            'Penghapusan Berhasil',
            'Data pengguna telah permanen dihapus dari sistem.',
            false
          )
        }
      }
    )
  }

  const resetForm = () => {
    setFormData({ full_name: '', nickname: '', email: '', room_number: '', phone_number: '', role: 'user', status: 'Aktif' })
    setIsEmailEdited(false)
    setEditingId(null)
  }

  const showAlertDialog = (title: string, message: string, isConfirm: boolean, onConfirm: () => void = () => {}) => {
    setAlertDialog({ isOpen: true, title, message, isConfirm, onConfirm })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Users className="mr-3 text-primary w-8 h-8" />
            Manajemen Warga
          </h1>
          <p className="text-text-secondary mt-1">Daftar pengguna terpusat mencakup Warga, Bendahara, dan Super Admin.</p>
        </div>
        <button 
          className="btn-primary flex items-center"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" /> Tambah Pengguna
        </button>
      </div>

      <WargaTable 
        users={users}
        loading={loading}
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <WargaFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        onSubmit={handleAddUser}
        editingId={editingId}
        setIsEmailEdited={setIsEmailEdited}
      />

      {/* Custom Alert/Confirm Dialog */}
      {alertDialog.isOpen && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onMouseDown={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6 text-center"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full mb-5 ${alertDialog.isConfirm ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
              {alertDialog.isConfirm ? <AlertTriangle className="w-7 h-7" /> : <Info className="w-7 h-7" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{alertDialog.title}</h3>
            <p className="text-sm text-gray-600 mb-8 whitespace-pre-line text-left leading-relaxed">
              {alertDialog.message}
            </p>
            <div className="flex gap-3 justify-center">
              {alertDialog.isConfirm && (
                <button 
                  onClick={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
                  className="btn-secondary flex-1 py-2.5 font-medium"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={() => {
                  if (alertDialog.isConfirm) {
                    alertDialog.onConfirm()
                  } else {
                    setAlertDialog(prev => ({...prev, isOpen: false}))
                  }
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors shadow-md ${
                  alertDialog.isConfirm 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                    : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                }`}
              >
                {alertDialog.isConfirm ? 'Ya, Hapus' : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
