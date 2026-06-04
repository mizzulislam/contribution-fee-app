import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SidebarState = {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapsed: () => void
  setCollapsed: (value: boolean) => void
  toggleMobile: () => void
  closeMobile: () => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (value) => set({ isCollapsed: value }),
      toggleMobile: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: 'soematra-sidebar-state',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
