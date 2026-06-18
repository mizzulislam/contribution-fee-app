import { useState } from 'react'
import { Shield, Key, Lock, CheckSquare, Square, Loader2, CheckCircle2 } from 'lucide-react'

export default function RolesPermissions() {
  const [roles] = useState(['Super Admin', 'Admin (Bendahara)', 'User (Penghuni)'])
  const [activeRole, setActiveRole] = useState('Admin (Bendahara)')
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const [permissions, setPermissions] = useState([
    { id: 1, module: 'Keuangan', desc: 'Melihat laporan keuangan', super: true, admin: true, user: true },
    { id: 2, module: 'Keuangan', desc: 'Verifikasi pembayaran', super: true, admin: true, user: false },
    { id: 3, module: 'Keuangan', desc: 'Mencatat pengeluaran', super: true, admin: true, user: false },
    { id: 4, module: 'Penghuni', desc: 'Melihat daftar penghuni', super: true, admin: true, user: false },
    { id: 5, module: 'Penghuni', desc: 'Mengubah data penghuni', super: true, admin: true, user: false },
    { id: 6, module: 'Sistem', desc: 'Mengelola unit kos', super: true, admin: false, user: false },
    { id: 7, module: 'Sistem', desc: 'Melihat audit log', super: true, admin: false, user: false },
    { id: 8, module: 'Sistem', desc: 'Mengubah pengaturan notifikasi', super: true, admin: false, user: false },
  ])

  const togglePermission = (permId: number) => {
    if (activeRole === 'Super Admin') return // Super admin is immutable

    setPermissions(permissions.map(p => {
      if (p.id === permId) {
        if (activeRole === 'Admin (Bendahara)') {
          return { ...p, admin: !p.admin }
        }
        if (activeRole === 'User (Penghuni)') {
          return { ...p, user: !p.user }
        }
      }
      return p
    }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setToastMessage('Hak akses berhasil diperbarui!')
      setTimeout(() => setToastMessage(''), 3000)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Shield className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Role & Permission
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Atur hak akses terperinci untuk tiap grup pengguna.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      {toastMessage && (
        <div className="fixed top-24 right-8 bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200 shadow-md flex items-center animate-in fade-in slide-in-from-top-2 z-50">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`w-full text-left px-4 py-3 rounded-lg border flex items-center transition-colors ${
                activeRole === role 
                  ? 'bg-primary/10 border-primary text-primary font-bold' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {role === 'Super Admin' ? <Key className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {role}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="card-container overflow-hidden">
            <div className="p-4 bg-gray-50/80 border-b border-border flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Izin Akses: {activeRole}</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {['Keuangan', 'Penghuni', 'Sistem'].map((module) => (
                <div key={module} className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">{module}</h3>
                  <div className="space-y-3">
                    {permissions.filter(p => p.module === module).map((perm, idx) => {
                      let hasAccess = false
                      if (activeRole === 'Super Admin') hasAccess = perm.super
                      if (activeRole === 'Admin (Bendahara)') hasAccess = perm.admin
                      if (activeRole === 'User (Penghuni)') hasAccess = perm.user

                      return (
                        <label key={perm.id} className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${
                          activeRole === 'Super Admin' ? 'opacity-70 bg-gray-50' : 'hover:bg-primary/5 border-gray-100'
                        }`}>
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={hasAccess} 
                            disabled={activeRole === 'Super Admin'} 
                            onChange={() => togglePermission(perm.id)} 
                          />
                          <div className={`mr-3 ${hasAccess ? 'text-primary' : 'text-gray-300'}`}>
                            {hasAccess ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </div>
                          <span className={`${hasAccess ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{perm.desc}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
