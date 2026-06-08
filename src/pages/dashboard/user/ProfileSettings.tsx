import { useState, useEffect } from 'react'
import { User, Mail, Lock, Camera, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { spreadsheetApi } from '@/lib/spreadsheet'

export default function ProfileSettings() {
  const { profile, setProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: profile?.full_name || 'Budi Santoso',
    email: profile?.email || 'budi@example.com',
    phone: '081234567890'
  })

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({...prev, name: profile.full_name, email: profile.email}))
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Asumsikan data profile disimpan di tabel Users
      if (profile?.id) {
        const payload = {
          id: profile.id,
          full_name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        }
        const { success, error } = await spreadsheetApi.put('Users', payload)
        
        if (!success) {
          throw new Error((error as any)?.message || 'Gagal menyimpan profil')
        }
        
        // Update the local authentication state so UI reflects the changes instantly
        setProfile({
          ...profile,
          full_name: formData.name
        })
      }

      setToastMessage('Profil berhasil diperbarui!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.id) {
      const savedPhoto = localStorage.getItem(`profile_photo_${profile.id}`)
      if (savedPhoto) setPhotoUrl(savedPhoto)
    }
  }, [profile?.id])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB')
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

  // ... rest of the render up to the camera button
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
              <button className="w-full flex items-center text-sm text-gray-700 hover:text-primary transition-colors p-2 hover:bg-primary-soft/10 rounded-md">
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
    </div>
  )
}
