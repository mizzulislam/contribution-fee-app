import { useState } from 'react'
import { User, Mail, Lock, Camera, Save, Loader2, CheckCircle2, X, AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { spreadsheetApi } from '@/services/sheets-client'
import { sha256 } from '@/utils/crypto'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function ProfileSettings() {
  const { profile, setProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'info' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  })
  
  // State Ganti Kata Sandi
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: profile?.full_name || 'Budi Santoso',
    email: profile?.email || 'budi@example.com',
    phone: '081234567890'
  })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal harus 6 karakter.')
      return
    }
    
    setIsChangingPassword(true)
    try {
      const { data, error: apiError } = await spreadsheetApi.get('Users')
      if (apiError || !data || !Array.isArray(data)) {
        throw new Error('Gagal mengakses data pengguna.')
      }
      
      const user = data.find((u: any) => u.id === profile?.id)
      if (!user) {
        throw new Error('Pengguna tidak ditemukan.')
      }
      
      const hashedOldPassword = await sha256(oldPassword)
      const isOldPasswordCorrect = user.password === hashedOldPassword || user.password === oldPassword
      
      if (!isOldPasswordCorrect) {
        throw new Error('Kata sandi lama salah.')
      }
      
      const hashedNewPassword = await sha256(newPassword)
      const updatedUser = {
        ...user,
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      }
      
      const { success } = await spreadsheetApi.put('Users', updatedUser)
      if (!success) {
        throw new Error('Gagal memperbarui kata sandi di spreadsheet.')
      }
      
      setToastMessage('Kata sandi berhasil diperbarui!')
      setTimeout(() => setToastMessage(''), 3000)
      setIsPasswordModalOpen(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      if (profile?.id) {
        const payload = {
          id: profile.id,
          full_name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        }
        const { success, error } = await spreadsheetApi.put('Users', payload)
        
        if (!success) {
          throw new Error(error instanceof Error ? error.message : 'Gagal menyimpan profil')
        }
        
        setProfile({
          ...profile,
          full_name: formData.name
        })
      }

      setToastMessage('Profil berhasil diperbarui!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        title: 'Gagal Menyimpan',
        message: "Error: " + (error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan profil'),
        variant: 'danger'
      })
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    return profile?.id ? localStorage.getItem(`profile_photo_${profile.id}`) : null
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setAlertDialog({
        isOpen: true,
        title: 'Ukuran Berlebihan',
        message: 'Ukuran foto maksimal 2MB',
        variant: 'danger'
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPhotoUrl(base64String)
      if (profile?.id) {
        localStorage.setItem(`profile_photo_${profile.id}`, base64String)
        window.dispatchEvent(new Event('profile_photo_updated'))
      }
      setToastMessage('Foto profil berhasil diperbarui!')
      setTimeout(() => setToastMessage(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="relative">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <User className="mr-3 text-primary w-8 h-8" />
          Profil Saya
        </h1>
        <p className="text-text-secondary mt-1">Kelola data pribadi, informasi kontak, dan pengaturan keamanan akun Anda.</p>
        
        {toastMessage && (
          <div className="absolute top-0 right-0 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 shadow-sm flex items-center animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {toastMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card-container p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-primary-soft/30 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border border-gray-100 text-gray-600 hover:text-primary transition-colors cursor-pointer">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{formData.name}</h2>
            <p className="text-sm text-text-secondary mb-4 capitalize">{profile?.role || 'Penghuni'}</p>
            <span className="badge badge-success inline-block">Akun Aktif</span>
          </div>

          <div className="card-container p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Keamanan</h3>
            </div>
            <div className="p-4 space-y-4">
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center text-sm text-gray-700 hover:text-primary transition-colors p-2 hover:bg-primary-soft/10 rounded-md"
              >
                <Lock className="w-4 h-4 mr-3" /> Ganti Kata Sandi
              </button>
              <button className="w-full flex items-center text-sm text-gray-700 hover:text-primary transition-colors p-2 hover:bg-primary-soft/10 rounded-md">
                <Mail className="w-4 h-4 mr-3" /> Ubah Email
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-container p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="text-xl font-bold text-gray-900">Informasi Pribadi</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-medium text-primary hover:text-primary-dark"
              >
                {isEditing ? 'Batal' : 'Edit Profil'}
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    className="form-input disabled:bg-gray-50 disabled:text-gray-500" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    className="form-input disabled:bg-gray-50 disabled:text-gray-500" 
                    value={formData.email}
                    disabled={true} 
                  />
                  <p className="text-xs text-text-muted mt-1">Email tidak dapat diubah di sini.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor HP / WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    className="form-input disabled:bg-gray-50 disabled:text-gray-500" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Ganti Kata Sandi</h2>
              <button 
                onClick={() => setIsPasswordModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              {passwordError && (
                <div className="bg-[#FEE2E2] text-[#B91C1C] p-4 rounded-xl text-sm flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi Lama</label>
                <input 
                  type="password" 
                  required
                  className="form-input" 
                  placeholder="Masukkan kata sandi saat ini"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi Baru</label>
                <input 
                  type="password" 
                  required
                  className="form-input" 
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                <input 
                  type="password" 
                  required
                  className="form-input" 
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="btn-secondary flex-1 py-2.5 font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="btn-primary flex-1 flex justify-center items-center py-2.5 font-medium shadow-md shadow-primary/20"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        showCancel={false}
        confirmLabel="Mengerti"
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
