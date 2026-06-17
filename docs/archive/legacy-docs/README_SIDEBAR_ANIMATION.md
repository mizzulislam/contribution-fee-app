# README — Implementasi Collapsible Sidebar + Animated Logo untuk Tax Feyments

Panduan ini digunakan untuk membuat sidebar yang bisa buka/tutup dengan animasi halus, efek glassmorphism, dan perubahan logo dari bentuk penuh menjadi icon kecil ketika sidebar di-collapse.

Target stack:

- Next.js App Router
- React Client Component
- TypeScript
- Tailwind CSS
- lucide-react
- Zustand untuk state global

---

## 1. Tujuan Fitur

Fitur yang harus dibuat:

1. Sidebar dapat dibuka dan ditutup dari tombol toggle.
2. Saat sidebar terbuka, lebar sidebar menjadi `280px`.
3. Saat sidebar tertutup, lebar sidebar menjadi `84px`.
4. Logo berubah dari full brand menjadi icon compact.
5. Teks menu menghilang dengan animasi opacity dan translate.
6. Icon menu tetap terlihat saat sidebar tertutup.
7. Konten dashboard ikut menyesuaikan layout tanpa patah.
8. Animasi terasa premium, smooth, dan konsisten dengan desain Tax Feyments.
9. State sidebar tetap tersimpan meskipun halaman berpindah.
10. Sidebar tetap responsive untuk desktop dan mobile.

---

## 2. Struktur File yang Disarankan

Tambahkan atau sesuaikan struktur berikut:

```txt
src/
  components/
    layout/
      app-shell.tsx
      sidebar.tsx
      sidebar-logo.tsx
      sidebar-toggle.tsx
      sidebar-nav-item.tsx
  stores/
    sidebar-store.ts
  lib/
    cn.ts
```

Jika project sudah memiliki komponen layout sendiri, jangan membuat layout baru yang duplikatif. Integrasikan komponen ini ke layout dashboard yang sudah ada.

---

## 3. Utility `cn`

Pastikan project memiliki helper className.

Buat file:

```txt
src/lib/cn.ts
```

Isi:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Jika belum ada dependency:

```bash
npm install clsx tailwind-merge
```

---

## 4. Sidebar Store dengan Zustand

Buat file:

```txt
src/stores/sidebar-store.ts
```

Isi:

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type SidebarState = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
};

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
      name: "tax-feyments-sidebar-state",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
```

---

## 5. Komponen Logo yang Berubah Menjadi Icon

Buat file:

```txt
src/components/layout/sidebar-logo.tsx
```

Isi:

```tsx
"use client";

import { ReceiptText } from "lucide-react";
import { cn } from "@/lib/cn";

type SidebarLogoProps = {
  collapsed: boolean;
};

export function SidebarLogo({ collapsed }: SidebarLogoProps) {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-white/10 px-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        collapsed ? "justify-center" : "justify-start gap-3"
      )}
    >
      <div
        className={cn(
          "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl",
          "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25 shadow-[0_0_30px_rgba(16,185,129,0.24)]",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed && "scale-95 rounded-xl"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-emerald-500/20" />
        <ReceiptText
          className={cn(
            "relative z-10 size-5 transition-transform duration-300",
            collapsed ? "rotate-0 scale-110" : "-rotate-6 scale-100"
          )}
        />
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed
            ? "w-0 translate-x-2 opacity-0"
            : "w-[170px] translate-x-0 opacity-100"
        )}
      >
        <span className="truncate text-base font-semibold tracking-tight text-white">
          Tax Feyments
        </span>
        <span className="truncate text-xs text-emerald-100/60">
          AI Tax Readiness
        </span>
      </div>
    </div>
  );
}
```

Catatan penting:

- `ReceiptText` bisa diganti dengan logo SVG aplikasi jika sudah ada.
- Ketika `collapsed = true`, teks brand hilang, hanya icon yang terlihat.
- Animasi memakai `duration-300` dan cubic-bezier agar tidak terasa kaku.

---

## 6. Komponen Toggle Sidebar

Buat file:

```txt
src/components/layout/sidebar-toggle.tsx
```

Isi:

```tsx
"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";

type SidebarToggleProps = {
  collapsed: boolean;
  onClick: () => void;
  className?: string;
};

export function SidebarToggle({ collapsed, onClick, className }: SidebarToggleProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
      className={cn(
        "group inline-flex size-9 items-center justify-center rounded-xl",
        "border border-white/10 bg-white/[0.06] text-white/75 backdrop-blur-xl",
        "transition-all duration-300 hover:bg-white/[0.1] hover:text-white hover:shadow-[0_0_24px_rgba(16,185,129,0.16)]",
        "focus:outline-none focus:ring-2 focus:ring-emerald-300/50",
        className
      )}
    >
      <Icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
    </button>
  );
}
```

---

## 7. Komponen Nav Item

Buat file:

```txt
src/components/layout/sidebar-nav-item.tsx
```

Isi:

```tsx
"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  collapsed: boolean;
};

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex h-11 items-center rounded-2xl px-3 text-sm font-medium",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        collapsed ? "justify-center" : "justify-start gap-3",
        active
          ? "bg-emerald-400/15 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.16)]"
          : "text-white/62 hover:bg-white/[0.07] hover:text-white"
      )}
    >
      {active && (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-300 transition-all duration-300",
            collapsed && "h-5"
          )}
        />
      )}

      <Icon
        className={cn(
          "size-5 shrink-0 transition-all duration-300",
          active ? "text-emerald-300" : "text-white/55 group-hover:text-emerald-200",
          collapsed ? "scale-105" : "scale-100"
        )}
      />

      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          collapsed
            ? "w-0 translate-x-2 opacity-0"
            : "w-[180px] translate-x-0 opacity-100"
        )}
      >
        {label}
      </span>
    </Link>
  );
}
```

---

## 8. Komponen Sidebar Utama

Buat file:

```txt
src/components/layout/sidebar.tsx
```

Isi:

```tsx
"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Calculator,
  FileText,
  FolderArchive,
  Home,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/stores/sidebar-store";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarToggle } from "./sidebar-toggle";
import { SidebarNavItem } from "./sidebar-nav-item";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/readiness", label: "Readiness Score", icon: ShieldCheck },
  { href: "/dashboard/calculator", label: "Tax Calculator", icon: Calculator },
  { href: "/dashboard/documents", label: "Document Vault", icon: FolderArchive },
  { href: "/dashboard/reports", label: "Tax Reports", icon: FileText },
  { href: "/dashboard/simulation", label: "What-If Simulation", icon: BarChart3 },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: Bot },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } =
    useSidebarStore();

  return (
    <>
      <div
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh border-r border-white/10",
          "bg-[#06140f]/88 text-white shadow-2xl backdrop-blur-2xl",
          "transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "lg:w-[84px]" : "lg:w-[280px]",
          "w-[280px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.14),transparent_34%)]" />

        <SidebarLogo collapsed={isCollapsed} />

        <div
          className={cn(
            "flex items-center px-4 py-4 transition-all duration-300",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-[0.22em] text-emerald-100/40 transition-all duration-300",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            Menu
          </p>

          <SidebarToggle
            collapsed={isCollapsed}
            onClick={toggleCollapsed}
            className="hidden lg:inline-flex"
          />
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={isCollapsed}
              />
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <div
            className={cn(
              "overflow-hidden rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] p-3 transition-all duration-300",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            <div
              className={cn(
                "flex items-center transition-all duration-300",
                isCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-200">
                <Sparkles className="size-4" />
              </div>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  isCollapsed ? "w-0 translate-x-2 opacity-0" : "w-[180px] opacity-100"
                )}
              >
                <p className="truncate text-sm font-semibold text-white">AI Tax Insight</p>
                <p className="truncate text-xs text-emerald-100/55">Ready to assist</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
```

---

## 9. App Shell agar Konten Ikut Bergeser

Buat file:

```txt
src/components/layout/app-shell.tsx
```

Isi:

```tsx
"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSidebarStore } from "@/stores/sidebar-store";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleMobile } = useSidebarStore();

  return (
    <div className="min-h-dvh bg-[#020807] text-white">
      <Sidebar />

      <main
        className={cn(
          "min-h-dvh transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "lg:pl-[84px]" : "lg:pl-[280px]"
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-[#020807]/70 px-4 backdrop-blur-2xl lg:hidden">
          <button
            type="button"
            onClick={toggleMobile}
            aria-label="Open mobile sidebar"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <p className="text-sm font-semibold">Tax Feyments</p>
            <p className="text-xs text-white/50">AI Tax Readiness</p>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

---

## 10. Integrasi ke Layout Dashboard

Cari file layout dashboard, biasanya salah satu dari berikut:

```txt
src/app/dashboard/layout.tsx
src/app/(dashboard)/layout.tsx
src/app/(protected)/dashboard/layout.tsx
```

Gunakan:

```tsx
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
```

Jika layout dashboard sudah memuat autentikasi Supabase, jangan hapus logic auth-nya. Cukup bungkus bagian UI dengan `<AppShell>`.

Contoh:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
```

---

## 11. Dependency yang Dibutuhkan

Pastikan dependency berikut tersedia:

```bash
npm install lucide-react zustand clsx tailwind-merge
```

Jika project sudah menggunakan shadcn/ui, biasanya `cn` sudah tersedia di:

```txt
src/lib/utils.ts
```

Jika sudah ada, gunakan import berikut, bukan membuat `src/lib/cn.ts` baru:

```ts
import { cn } from "@/lib/utils";
```

---

## 12. Detail Animasi yang Wajib Dipertahankan

Gunakan standar berikut agar animasi konsisten:

```txt
duration: 300ms
easing: cubic-bezier(0.4, 0, 0.2, 1)
expanded width: 280px
collapsed width: 84px
logo icon size: 44px
nav item height: 44px
border radius: 16px - 24px
```

Tailwind class utama:

```txt
transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
```

---

## 13. Acceptance Criteria

Fitur dianggap selesai jika:

- Sidebar bisa collapse dan expand di desktop.
- Logo berubah dari full brand menjadi icon compact.
- Teks menu hilang tanpa layout patah.
- Icon menu tetap sejajar saat collapsed.
- Main content bergeser sesuai lebar sidebar.
- Mobile sidebar terbuka sebagai drawer.
- Overlay mobile muncul dan bisa diklik untuk menutup sidebar.
- Active menu terlihat jelas.
- State collapse tersimpan setelah refresh.
- Tidak ada hydration mismatch.
- Tidak ada error TypeScript.
- Tidak ada duplikasi layout dashboard.

---

## 14. Prompt untuk Agent AI / Antigravity IDE

Gunakan prompt berikut:

```txt
Implementasikan fitur collapsible sidebar premium pada aplikasi Tax Feyments.

Konteks project:
- Next.js App Router
- React Client Components
- TypeScript
- Tailwind CSS
- lucide-react
- Zustand
- Desain aplikasi dark mode, glassmorphism, premium, smooth micro-animation.

Tugas utama:
1. Buat sidebar dashboard yang bisa buka/tutup di desktop.
2. Saat expanded, sidebar width 280px.
3. Saat collapsed, sidebar width 84px.
4. Logo harus berubah dari full logo “Tax Feyments + AI Tax Readiness” menjadi icon compact saja.
5. Transisi logo, teks menu, width sidebar, dan padding main content harus smooth menggunakan duration 300ms dan cubic-bezier(0.4,0,0.2,1).
6. Icon menu tetap terlihat saat collapsed, label menu hilang dengan opacity dan translate animation.
7. Buat mobile drawer sidebar dengan overlay backdrop blur.
8. Simpan state collapsed menggunakan Zustand persist agar tetap tersimpan setelah refresh.
9. Jangan merusak logic auth Supabase atau protected route yang sudah ada.
10. Jangan membuat duplikasi layout jika layout dashboard sudah tersedia; cukup integrasikan AppShell.
11. Pastikan tidak ada hydration mismatch, TypeScript error, atau layout shift yang kasar.
12. Gunakan menu dashboard yang relevan: Dashboard, Readiness Score, Tax Calculator, Document Vault, Tax Reports, What-If Simulation, AI Assistant, Settings.
13. Pastikan active route state bekerja berdasarkan pathname.
14. Gunakan aesthetic dark emerald premium sesuai branding Tax Feyments.

File yang perlu dibuat/disesuaikan:
- src/stores/sidebar-store.ts
- src/components/layout/sidebar-logo.tsx
- src/components/layout/sidebar-toggle.tsx
- src/components/layout/sidebar-nav-item.tsx
- src/components/layout/sidebar.tsx
- src/components/layout/app-shell.tsx
- src/app/dashboard/layout.tsx atau layout dashboard yang sudah ada

Acceptance criteria:
- Sidebar expand/collapse berjalan mulus.
- Logo full berubah menjadi icon compact saat collapsed.
- Main content ikut menyesuaikan padding.
- Mobile drawer berjalan baik.
- State collapsed persisted.
- Tidak ada error build/lint/typecheck.
```

---

## 15. Testing Manual

Jalankan:

```bash
npm run dev
```

Buka dashboard, lalu cek:

1. Klik tombol collapse sidebar.
2. Refresh halaman, pastikan status collapsed tetap sama.
3. Klik semua menu, pastikan active state berubah.
4. Resize ke mobile, pastikan sidebar berubah menjadi drawer.
5. Klik overlay mobile, pastikan sidebar tertutup.
6. Jalankan build.

```bash
npm run build
```

Jika build gagal karena path import `@/lib/cn`, ubah import menjadi path `cn` yang memang digunakan project, misalnya:

```ts
import { cn } from "@/lib/utils";
```
