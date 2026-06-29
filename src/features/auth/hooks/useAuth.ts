import { create } from 'zustand'

// Role harus persis sama dengan yang ada di Google Sheets (kolom 'role')
export type Role = 'super admin' | 'admin' | 'user'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: Role
  nickname?: string
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

const SESSION_KEY = 'soematra_session'
const ACTIVE_ROLE_KEY = 'soematra_active_role'

/**
 * Mendapatkan kunci tanda tangan sesi.
 * Prioritas:
 * 1. Env variable VITE_SESSION_SIGNATURE_SECRET (jika dikonfigurasi).
 * 2. Dynamic key per browser tab session (disimpan di sessionStorage) jika env kosong.
 */
function getSessionSecret(): string {
  const envSecret = import.meta.env.VITE_SESSION_SIGNATURE_SECRET
  if (envSecret && envSecret !== 'isi-string-random-untuk-signature-session-lokal') {
    return envSecret
  }

  // Gunakan dynamic key acak yang disimpan di sessionStorage (unik per tab dan bertahan saat refresh)
  let sessionSecret = sessionStorage.getItem('soematra_session_secret')
  if (!sessionSecret) {
    sessionSecret = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36)
    sessionStorage.setItem('soematra_session_secret', sessionSecret)
  }
  return sessionSecret
}

function createSessionSignature(profile: UserProfile) {
  const payload = JSON.stringify({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    nickname: profile.nickname || '',
    room_number: profile.room_number || '',
  })

  let hash = 2166136261
  const secret = getSessionSecret()
  const input = `${payload}.${secret}`
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return (hash >>> 0).toString(16)
}

function encodeSession(profile: UserProfile) {
  return JSON.stringify({
    profile,
    signature: createSessionSignature(profile),
  })
}

function decodeSession(session: string): UserProfile | null {
  try {
    const parsed = JSON.parse(session)
    if (!parsed?.profile || typeof parsed.signature !== 'string') return null

    const expected = createSessionSignature(parsed.profile)
    return parsed.signature === expected ? parsed.profile : null
  } catch {
    return null
  }
}

function getAvailableRoles(profile: UserProfile) {
  return String(profile.role).split(',').map(r => r.trim().toLowerCase())
}

export const useAuth = create<AuthState>((set, get) => ({
  profile: null,
  activeRole: null,
  isLoading: true,
  setProfile: (profile) => {
    if (profile) {
      sessionStorage.setItem(SESSION_KEY, encodeSession(profile))
      
      const savedActiveRole = sessionStorage.getItem(ACTIVE_ROLE_KEY) as Role | null
      const availableRoles = getAvailableRoles(profile)
      
      if (savedActiveRole && availableRoles.includes(savedActiveRole)) {
        set({ profile, activeRole: savedActiveRole })
      } else {
        let defaultRole: Role = 'user'
        if (availableRoles.includes('super admin')) defaultRole = 'super admin'
        else if (availableRoles.includes('admin')) defaultRole = 'admin'
        else if (availableRoles.length > 0) defaultRole = availableRoles[0] as Role
        
        sessionStorage.setItem(ACTIVE_ROLE_KEY, defaultRole)
        set({ profile, activeRole: defaultRole })
      }
    } else {
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(ACTIVE_ROLE_KEY)
      set({ profile: null, activeRole: null })
    }
  },
  setActiveRole: (role) => {
    const profile = get().profile
    if (!profile || !getAvailableRoles(profile).includes(role)) return

    sessionStorage.setItem(ACTIVE_ROLE_KEY, role)
    set({ activeRole: role })
  },
  signOut: async () => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(ACTIVE_ROLE_KEY)
    set({ profile: null, activeRole: null })
    window.location.href = '/login'
  },
  loadUser: async () => {
    set({ isLoading: true })
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session) {
      try {
        const profile = decodeSession(session)
        if (profile) {
          get().setProfile(profile)
        } else {
          sessionStorage.removeItem(SESSION_KEY)
          sessionStorage.removeItem(ACTIVE_ROLE_KEY)
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
        sessionStorage.removeItem(ACTIVE_ROLE_KEY)
      }
    }
    set({ isLoading: false })
  }
}))
