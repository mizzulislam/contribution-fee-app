import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/hooks/useAuth'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { sha256 } from '@/utils/crypto'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setProfile } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // 1. Fetch data dari sheet Users
      const { data, error: apiError } = await spreadsheetApi.get('Users')
      
      if (apiError || !data || !Array.isArray(data)) {
        throw new Error('Gagal memuat data pengguna. Silakan periksa koneksi internet atau Google Sheets API.')
      }

      // Hitung hash dari input password pengguna
      const inputHash = await sha256(password)
      
      // Cari pengguna berdasarkan email
      const user = data.find((u: any) => String(u.email).toLowerCase() === email.toLowerCase())
      
      if (!user) {
        throw new Error('Email atau password salah.')
      }

      let isAuthenticated = false
      let needsMigration = false

      // Cek apakah password tersimpan cocok (apakah hash SHA-256 atau plaintext untuk migrasi)
      if (user.password === inputHash) {
        isAuthenticated = true
      } else if (user.password === password) {
        // Cocok dengan plaintext, tandai perlu migrasi ke hash
        isAuthenticated = true
        needsMigration = true
      }

      if (isAuthenticated) {
        // Jika perlu migrasi, simpan password versi hash kembali ke spreadsheet
        if (needsMigration) {
          const updatedUser = {
            ...user,
            password: inputHash,
            updated_at: new Date().toISOString()
          }
          await spreadsheetApi.put('Users', updatedUser)
        }

        // Set local profile sesi
        setProfile({
          id: user.id || Math.random().toString(),
          email: user.email,
          full_name: user.full_name || user.email.split('@')[0],
          role: (user.role as Role) || 'user',
          room_number: user.room_number || undefined
        })

        sessionStorage.setItem('soematra_show_welcome_modal', '1')
        navigate('/dashboard')
      } else {
        throw new Error('Email atau password salah.')
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="md:hidden flex justify-center mb-6">
        <div className="w-16 h-16 bg-[#ECFDF5] rounded-2xl flex items-center justify-center border border-[#D1FAE5]">
          <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      </div>
      
      <div className="text-center md:text-left mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Masuk ke Sistem</h2>
        <p className="text-gray-500">Silakan masukkan email dan kata sandi Anda</p>
      </div>

      {error && (
        <div className="bg-[#FEE2E2] text-[#B91C1C] p-4 rounded-[10px] mb-6 text-sm flex items-start">
          <svg className="w-5 h-5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="admin@soematra.com"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Kata Sandi</label>
            <a href="#" className="text-sm font-medium text-[#10B981] hover:text-[#047857]">Lupa Sandi?</a>
          </div>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="admin123"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full mt-4 flex items-center justify-center"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
