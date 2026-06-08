import { create } from 'zustand'

// Role harus persis sama dengan yang ada di Google Sheets (kolom 'role')
export type Role = 'super admin' | 'admin' | 'user'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: Role
  room_number?: string
}

interface AuthState {
  profile: UserProfile | null
  activeRole: Role | null
  isLoading: boolean
  setProfile: (profile: UserProfile | null) => void
  setActiveRole: (role: Role) => void
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  profile: null,
  activeRole: null,
  isLoading: true,
  setProfile: (profile) => {
    if (profile) {
      localStorage.setItem('soematra_session', JSON.stringify(profile))
      
      const savedActiveRole = localStorage.getItem('soematra_active_role') as Role | null
      const availableRoles = String(profile.role).split(',').map(r => r.trim().toLowerCase())
      
      if (savedActiveRole && availableRoles.includes(savedActiveRole)) {
        set({ profile, activeRole: savedActiveRole })
      } else {
        let defaultRole: Role = 'user'
        if (availableRoles.includes('super admin')) defaultRole = 'super admin'
        else if (availableRoles.includes('admin')) defaultRole = 'admin'
        else if (availableRoles.length > 0) defaultRole = availableRoles[0] as Role
        
        localStorage.setItem('soematra_active_role', defaultRole)
        set({ profile, activeRole: defaultRole })
      }
    } else {
      localStorage.removeItem('soematra_session')
      localStorage.removeItem('soematra_active_role')
      set({ profile: null, activeRole: null })
    }
  },
  setActiveRole: (role) => {
    localStorage.setItem('soematra_active_role', role)
    set({ activeRole: role })
  },
  signOut: async () => {
    localStorage.removeItem('soematra_session')
    set({ profile: null })
    window.location.href = '/login'
  },
  loadUser: async () => {
    set({ isLoading: true })
    const session = localStorage.getItem('soematra_session')
    if (session) {
      try {
        const parsed = JSON.parse(session)
        get().setProfile(parsed)
      } catch (e) {
        localStorage.removeItem('soematra_session')
      }
    }
    set({ isLoading: false })
  }
}))
