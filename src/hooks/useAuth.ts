import { create } from 'zustand'

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
  isLoading: boolean
  setProfile: (profile: UserProfile | null) => void
  setLoading: (isLoading: boolean) => void
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => {
    if (profile) {
      localStorage.setItem('soematra_session', JSON.stringify(profile))
    } else {
      localStorage.removeItem('soematra_session')
    }
    set({ profile })
  },
  setLoading: (isLoading) => set({ isLoading }),
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
        set({ profile: parsed })
      } catch (e) {
        localStorage.removeItem('soematra_session')
      }
    }
    set({ isLoading: false })
  }
}))
