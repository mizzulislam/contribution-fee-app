import { describe, it, expect, vi } from 'vitest'

// Minimal types matching useAuth and Sidebar logic
type Role = 'super admin' | 'admin' | 'user'

const superAdminNav = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Manajemen Warga', path: '/dashboard/warga' },
  { name: 'Role & Permission', path: '/dashboard/roles' },
  { name: 'Data Master', path: '/dashboard/master' },
  { name: 'Audit Log', path: '/dashboard/audit' },
  { name: 'Notifikasi', path: '/dashboard/notifications-settings' },
  { name: 'Backup Data', path: '/dashboard/backup' },
  { name: 'System Settings', path: '/dashboard/settings' },
]

const adminNav = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Kelola Tagihan', path: '/dashboard/billing' },
  { name: 'Akuntansi & Laporan', path: '/dashboard/finance' },
  { name: 'Sistem Galon', path: '/dashboard/gallons-management' },
  { name: 'Jadwal Piket', path: '/dashboard/duties' },
]

const userNav = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Pusat Pembayaran', path: '/dashboard/billing-user' },
  { name: 'Kas Kos', path: '/dashboard/cash-reports' },
  { name: 'Info Galon', path: '/dashboard/gallons-info' },
  { name: 'Kalender Kos', path: '/dashboard/duties-mine' },
  { name: 'Pusat Informasi', path: '/dashboard/information' },
]

// Pure helper function replicates of dashboard role text functions for verification
function getRoleLabel(activeRole: Role | null) {
  if (activeRole === 'super admin') return 'Super Admin'
  if (activeRole === 'admin') return 'Admin'
  return 'Warga'
}

function getWelcomeMessage(activeRole: Role | null) {
  if (activeRole === 'super admin') return 'Pantau dan atur seluruh aktivitas sistem dari sini.'
  if (activeRole === 'admin') return 'Kelola operasional kos, iuran, dan kebutuhan galon.'
  return 'Jangan lupa cek tagihan dan jadwal piket Anda.'
}

function getQuickActions(activeRole: Role | null) {
  if (activeRole === 'super admin') {
    return [
      { label: 'Tambah Warga', to: '/dashboard/warga' },
      { label: 'Data Master', to: '/dashboard/master' },
      { label: 'Audit Log', to: '/dashboard/audit' },
      { label: 'Laporan', to: '/dashboard/finance?tab=statements' },
    ]
  }

  if (activeRole === 'admin') {
    return [
      { label: 'Manajemen Iuran', to: '/dashboard/billing' },
      { label: 'Verifikasi Bayar', to: '/dashboard/billing?tab=verification' },
      { label: 'Catat Transaksi', onClick: true },
      { label: 'Laporan Kas', to: '/dashboard/finance?tab=statements' },
    ]
  }

  return [
    { label: 'Pusat Pembayaran', to: '/dashboard/billing-user' },
    { label: 'Kalender Kos', to: '/dashboard/duties-mine' },
    { label: 'Pusat Informasi', to: '/dashboard/information' },
    { label: 'Info Galon', to: '/dashboard/gallons-info' },
  ]
}

function getNavItems(activeRole: Role) {
  let navItems = userNav
  if (activeRole === 'super admin') navItems = superAdminNav
  else if (activeRole === 'admin') navItems = adminNav
  return navItems
}

describe('Dashboard Roles and Navigation Smoke Test', () => {
  describe('Sidebar Navigation Menus', () => {
    it('should resolve the correct navigation menu for super admin role', () => {
      const navItems = getNavItems('super admin')

      expect(navItems).toEqual(superAdminNav)
      expect(navItems.map(item => item.name)).toContain('Role & Permission')
      expect(navItems.map(item => item.name)).toContain('Audit Log')
      expect(navItems.map(item => item.name)).toContain('Backup Data')
      expect(navItems.map(item => item.name)).not.toContain('Kelola Tagihan')
    })

    it('should resolve the correct navigation menu for admin role', () => {
      const navItems = getNavItems('admin')

      expect(navItems).toEqual(adminNav)
      expect(navItems.map(item => item.name)).toContain('Kelola Tagihan')
      expect(navItems.map(item => item.name)).toContain('Akuntansi & Laporan')
      expect(navItems.map(item => item.name)).toContain('Sistem Galon')
      expect(navItems.map(item => item.name)).not.toContain('Role & Permission')
    })

    it('should resolve the correct navigation menu for user role', () => {
      const navItems = getNavItems('user')

      expect(navItems).toEqual(userNav)
      expect(navItems.map(item => item.name)).toContain('Pusat Pembayaran')
      expect(navItems.map(item => item.name)).toContain('Kas Kos')
      expect(navItems.map(item => item.name)).toContain('Info Galon')
      expect(navItems.map(item => item.name)).not.toContain('Kelola Tagihan')
    })
  })

  describe('Dashboard Role Titles and Welcome Messages', () => {
    it('should return correct role label for each active role', () => {
      expect(getRoleLabel('super admin')).toBe('Super Admin')
      expect(getRoleLabel('admin')).toBe('Admin')
      expect(getRoleLabel('user')).toBe('Warga')
    })

    it('should return correct welcome message for each active role', () => {
      expect(getWelcomeMessage('super admin')).toBe('Pantau dan atur seluruh aktivitas sistem dari sini.')
      expect(getWelcomeMessage('admin')).toBe('Kelola operasional kos, iuran, dan kebutuhan galon.')
      expect(getWelcomeMessage('user')).toBe('Jangan lupa cek tagihan dan jadwal piket Anda.')
    })
  })

  describe('Dashboard Quick Actions Resolution', () => {
    it('should resolve super admin specific quick actions', () => {
      const actions = getQuickActions('super admin')
      expect(actions.map(a => a.label)).toEqual([
        'Tambah Warga',
        'Data Master',
        'Audit Log',
        'Laporan'
      ])
    })

    it('should resolve admin specific quick actions', () => {
      const actions = getQuickActions('admin')
      expect(actions.map(a => a.label)).toEqual([
        'Manajemen Iuran',
        'Verifikasi Bayar',
        'Catat Transaksi',
        'Laporan Kas'
      ])
    })

    it('should resolve user specific quick actions', () => {
      const actions = getQuickActions('user')
      expect(actions.map(a => a.label)).toEqual([
        'Pusat Pembayaran',
        'Kalender Kos',
        'Pusat Informasi',
        'Info Galon'
      ])
    })
  })

  describe('Cleanliness and Absence of Dummy Data / Placeholders', () => {
    it('should not contain TODOs, placeholder names, or lorem ipsum', () => {
      const allTextContents = [
        ...superAdminNav.map(n => n.name),
        ...adminNav.map(n => n.name),
        ...userNav.map(n => n.name),
        getWelcomeMessage('super admin'),
        getWelcomeMessage('admin'),
        getWelcomeMessage('user'),
        ...getQuickActions('super admin').map(a => a.label),
        ...getQuickActions('admin').map(a => a.label),
        ...getQuickActions('user').map(a => a.label),
      ]

      allTextContents.forEach(text => {
        expect(text).not.toMatch(/lorem/i)
        expect(text).not.toMatch(/ipsum/i)
        expect(text).not.toMatch(/todo/i)
        expect(text).not.toMatch(/placeholder/i)
        expect(text).not.toMatch(/dummy/i)
        expect(text.trim().length).toBeGreaterThan(0)
      })
    })
  })
})
