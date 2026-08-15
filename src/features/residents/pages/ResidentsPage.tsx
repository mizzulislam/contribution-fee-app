import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/services/sheets-client'
import { Plus, Users } from 'lucide-react'
import { WargaTable } from '@/features/residents/components/ResidentTable'
import { WargaFormModal, type WargaFormData } from '@/features/residents/components/ResidentFormModal'
import { generateSecureId } from '@/utils/id'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    idToDelete: number | string | null
  }>({
    isOpen: false,
    idToDelete: null
  })
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant?: 'success' | 'danger'
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'success'
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
      setUsers(data as WargaUser[])
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

      if (success) {
        setUsers(users.map(u => u.id === editingId ? { ...u, ...formData } : u))
        setIsModalOpen(false)
        resetForm()
        setSuccessDialog({
          isOpen: true,
          title: 'Pembaruan Berhasil',
          message: 'Data pengguna berhasil diperbarui dan disimpan.',
          variant: 'success'
        })
      } else {
        setSuccessDialog({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: 'Gagal memperbarui data pengguna ke Google Sheets. Silakan coba kembali.',
          variant: 'danger'
        })
      }
    } else {
      // Mode Tambah
      const generatedId = generateSecureId('USR')
      const newUser = { id: generatedId, ...formData }
      const { success, error } = await spreadsheetApi.post('Users', newUser)
      
      if (success) {
        setUsers([...users, newUser])
        setIsModalOpen(false)
        resetForm()
        setSuccessDialog({
          isOpen: true,
          title: 'Berhasil Ditambahkan',
          message: 'Data pengguna berhasil ditambahkan ke database.',
          variant: 'success'
        })
      } else {
        setSuccessDialog({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: error instanceof Error ? error.message : 'Gagal menambahkan pengguna baru ke Google Sheets.',
          variant: 'danger'
        })
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
    setConfirmDialog({
      isOpen: true,
      idToDelete: id
    })
  }

  const handleConfirmDelete = async () => {
    const id = confirmDialog.idToDelete
    if (id === null) return
    
    setIsDeleting(true)
    try {
      const { success } = await spreadsheetApi.del('Users', id)
      if (success) {
        setUsers(users.filter(u => u.id !== id))
        setConfirmDialog({ isOpen: false, idToDelete: null })
        setSuccessDialog({
          isOpen: true,
          title: 'Penghapusan Berhasil',
          message: 'Data pengguna telah permanen dihapus dari sistem.',
          variant: 'success'
        })
      } else {
        setConfirmDialog({ isOpen: false, idToDelete: null })
        setSuccessDialog({
          isOpen: true,
          title: 'Gagal Menghapus',
          message: 'Gagal menghapus pengguna dari sistem. Terjadi kesalahan koneksi.',
          variant: 'danger'
        })
      }
    } catch (e) {
      console.error(e)
      setConfirmDialog({ isOpen: false, idToDelete: null })
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Terjadi kesalahan sistem saat menghapus data.',
        variant: 'danger'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({ full_name: '', nickname: '', email: '', room_number: '', phone_number: '', role: 'user', status: 'Aktif' })
    setIsEmailEdited(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Users className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Manajemen Warga
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Daftar pengguna terpusat mencakup Warga, Bendahara, dan Super Admin.</p>
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeleting}
        onClose={() => !isDeleting && setConfirmDialog({ isOpen: false, idToDelete: null })}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        isOpen={successDialog.isOpen}
        title={successDialog.title}
        message={successDialog.message}
        variant={successDialog.variant || 'success'}
        showCancel={false}
        confirmLabel="Selesai"
        onClose={() => setSuccessDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
