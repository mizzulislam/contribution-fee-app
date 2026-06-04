import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Select from '@/components/ui/Select'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { Plus, Search, Edit, Trash2, Users, X, Save, Shield, AlertTriangle, Info } from 'lucide-react'

export default function ManajemenWarga() {
  const [users, setUsers] = useState<any[]>([])
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
  const [formData, setFormData] = useState({
    full_name: '',
    nickname: '',
    email: '',
    room_number: '',
    phone_number: '',
    role: 'user'
  })
  const [isEmailEdited, setIsEmailEdited] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Auto-generate email based on name/nickname
  useEffect(() => {
    if (!isEmailEdited) {
      const baseName = formData.nickname || formData.full_name.split(' ')[0]
      if (baseName) {
        const generatedEmail = `${baseName.toLowerCase().replace(/[^a-z0-9]/g, '')}@soematra.com`
        if (formData.email !== generatedEmail) {
          setFormData(prev => ({ ...prev, email: generatedEmail }))
        }
      } else if (formData.email !== '') {
        setFormData(prev => ({ ...prev, email: '' }))
      }
    }
  }, [formData.full_name, formData.nickname, isEmailEdited])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await spreadsheetApi.get('Users')
    
    if (data && Array.isArray(data)) {
      setUsers(data)
    } else {
      // Fallback mock data jika sheet kosong/error
      setUsers([
        { id: 1, full_name: 'Sang Super Admin', email: 'admin@soematra.com', role: 'super admin', phone_number: '08111111111' },
        { id: 2, full_name: 'Bendahara', email: 'bendahara@soematra.com', role: 'admin', phone_number: '08222222222' },
        { id: 3, full_name: 'Budi Santoso', email: 'budi@example.com', room_number: '101', role: 'user', phone_number: '08123456789' },
        { id: 4, full_name: 'Ahmad Dahlan', email: 'ahmad@example.com', room_number: '102', role: 'user', phone_number: '08987654321' }
      ])
    }
    setLoading(false)
  }

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
        setAlertDialog({
          isOpen: true,
          title: 'Mode Mock Aktif',
          message: 'Berhasil diperbarui secara lokal (Mode Mock) karena gagal terhubung ke Google Sheets atau fitur update belum siap di Apps Script Anda.',
          isConfirm: false,
          onConfirm: () => {}
        })
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Pembaruan Berhasil',
          message: 'Data pengguna berhasil diperbarui dan disimpan ke Google Sheets.',
          isConfirm: false,
          onConfirm: () => {}
        })
      }
    } else {
      // Mode Tambah
      const newUser = {
        id: Date.now(),
        ...formData
      }

      const { success } = await spreadsheetApi.post('Users', newUser)
      
      setUsers([...users, newUser])
      setIsModalOpen(false)
      resetForm()

      if (!success) {
        setAlertDialog({
          isOpen: true,
          title: 'Tersimpan (Mode Mock)',
          message: 'Tersimpan di sistem (Mode Mock). Pastikan URL Web App valid.',
          isConfirm: false,
          onConfirm: () => {}
        })
      }
    }
    
    setIsSubmitting(false)
  }

  const handleEdit = (user: any) => {
    setFormData({
      full_name: user.full_name || user.name || '',
      nickname: user.nickname || '',
      email: user.email || '',
      room_number: user.room_number || '',
      phone_number: user.phone_number || '',
      role: user.role || 'user'
    })
    setEditingId(user.id)
    setIsEmailEdited(true)
    setIsModalOpen(true)
  }

  const handleDelete = (id: number | string) => {
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Pengguna',
      message: 'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.',
      isConfirm: true,
      onConfirm: async () => {
        const { success } = await spreadsheetApi.del('Users', id)
        setUsers(users.filter(u => u.id !== id))
        
        if (!success) {
          setAlertDialog({
            isOpen: true,
            title: 'Pengguna Dihapus (Mode Mock)',
            message: 'Berhasil dihapus secara lokal (Mode Mock) karena gagal terhubung ke Google Sheets (ID mungkin tidak cocok atau belum tersinkronisasi).',
            isConfirm: false,
            onConfirm: () => {}
          })
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Penghapusan Berhasil',
            message: 'Data pengguna telah permanen dihapus dari sistem dan Google Sheets.',
            isConfirm: false,
            onConfirm: () => {}
          })
        }
      }
    })
  }

  const resetForm = () => {
    setFormData({ full_name: '', nickname: '', email: '', room_number: '', phone_number: '', role: 'user' })
    setIsEmailEdited(false)
    setEditingId(null)
  }

  const toggleRole = (r: string) => {
    const currentRoles = formData.role ? formData.role.split(',') : []
    let newRoles
    if (currentRoles.includes(r)) {
      newRoles = currentRoles.filter(role => role !== r)
      if (newRoles.length === 0) newRoles = ['user'] // Minimal punya 1 role
    } else {
      newRoles = [...currentRoles, r]
    }
    setFormData({...formData, role: newRoles.join(',')})
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
    
    const matchesRole = roleFilter === '' || u.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (roleStr: string) => {
    if (!roleStr) return <span className="text-gray-400">-</span>
    const roles = roleStr.toLowerCase().split(',')
    return (
      <div className="flex flex-wrap gap-1">
        {roles.includes('super admin') && <span className="badge badge-danger"><Shield className="w-3 h-3 mr-1" /> Super Admin</span>}
        {roles.includes('admin') && <span className="badge badge-info">Bendahara</span>}
        {roles.includes('user') && <span className="badge badge-success">Warga</span>}
      </div>
    )
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

      <div className="card-container p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama, email, atau role..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Select 
              className="w-full sm:w-48 text-sm"
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { label: 'Semua Role', value: '' },
                { label: 'Super Admin', value: 'super admin' },
                { label: 'Bendahara', value: 'admin' },
                { label: 'Warga', value: 'user' }
              ]}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600 uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Nama Pengguna</th>
                <th className="px-6 py-4 whitespace-nowrap">Role</th>
                <th className="px-6 py-4 whitespace-nowrap">Kamar</th>
                <th className="px-6 py-4 whitespace-nowrap">Kontak</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">Memuat data...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted flex flex-col items-center">
                    <Users className="w-8 h-8 text-gray-300 mb-2" />
                    Belum ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((r) => (
                  <tr key={r.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {r.full_name || r.name} {r.nickname && <span className="text-gray-500 font-normal">({r.nickname})</span>}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{r.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(r.role)}
                    </td>
                    <td className="px-6 py-4">
                      {r.room_number || r.rooms?.room_number ? (
                        <span className="font-medium text-gray-700">Kamar {r.room_number || r.rooms?.room_number}</span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{r.phone_number || <span className="text-text-muted">-</span>}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(r)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Penghuni */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-5">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+62</span>
                  <input 
                    type="tel" 
                    required
                    className="form-input pl-12" 
                    value={formData.phone_number}
                    onChange={e => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.startsWith('0')) val = val.substring(1);
                      setFormData({...formData, phone_number: val});
                    }}
                    placeholder="81234567890"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
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
      )}

      {/* Custom Alert/Confirm Dialog */}
      {alertDialog.isOpen && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6 text-center">
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
