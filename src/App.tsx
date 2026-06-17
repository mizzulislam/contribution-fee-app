import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

import AuthLayout from '@/components/layouts/AuthLayout'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard/Dashboard'

// Existing Pages
import FinanceDashboard from '@/pages/dashboard/finance/FinanceDashboard'
import DutySchedules from '@/pages/dashboard/duties/DutySchedules'

// Sprint 1 & Consolidated Pages
import BillingDashboard from '@/pages/dashboard/finance/BillingDashboard'
import GallonsDashboard from '@/pages/dashboard/gallons/GallonsDashboard'

// Sprint 2 Pages (User Portal Consolidated)
import UserBillingDashboard from '@/pages/dashboard/bills/UserBillingDashboard'
import UserInformationDashboard from '@/pages/dashboard/user/UserInformationDashboard'
import CashReports from '@/pages/dashboard/finance/CashReports'
import GallonsInfo from '@/pages/dashboard/gallons/GallonsInfo'
import MyDuties from '@/pages/dashboard/duties/MyDuties'

// Sprint 3 Pages (Super Admin & Profil)
import ManajemenWarga from '@/pages/dashboard/admin/ManajemenWarga'
import ProfileSettings from '@/pages/dashboard/user/ProfileSettings'
import AuditLogs from '@/pages/dashboard/admin/AuditLogs'
import RolesPermissions from '@/pages/dashboard/admin/RolesPermissions'

// Sprint 4 Pages (Super Admin)
import MasterData from '@/pages/dashboard/admin/MasterData'
import NotificationSettings from '@/pages/dashboard/admin/NotificationSettings'
import BackupRestore from '@/pages/dashboard/admin/BackupRestore'
import SystemSettings from '@/pages/dashboard/admin/SystemSettings'

export default function App() {
  const { loadUser, isLoading } = useAuth()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <span className="text-lg font-medium">Memuat sistem...</span>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            {/* Default Dashboard (Logic per role diatur di dalam komponen Dashboard) */}
            <Route path="/dashboard" element={<Dashboard />} />
  
            {/* SUPER ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['super admin']} />}>
              <Route path="/dashboard/warga" element={<ManajemenWarga />} />
              <Route path="/dashboard/roles" element={<RolesPermissions />} />
              <Route path="/dashboard/master" element={<MasterData />} />
              <Route path="/dashboard/audit" element={<AuditLogs />} />
              <Route path="/dashboard/notifications-settings" element={<NotificationSettings />} />
              <Route path="/dashboard/backup" element={<BackupRestore />} />
              <Route path="/dashboard/settings" element={<SystemSettings />} />
            </Route>
  
            {/* ADMIN / BENDAHARA ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['super admin', 'admin']} />}>
              <Route path="/dashboard/billing" element={<BillingDashboard />} />
              <Route path="/dashboard/finance" element={<FinanceDashboard />} />
              <Route path="/dashboard/gallons-management" element={<GallonsDashboard />} />
              <Route path="/dashboard/duties" element={<DutySchedules />} />
            </Route>
  
            {/* USER / PENGHUNI ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['super admin', 'admin', 'user']} />}>
              <Route path="/dashboard/billing-user" element={<UserBillingDashboard />} />
              <Route path="/dashboard/information" element={<UserInformationDashboard />} />
              <Route path="/dashboard/profile" element={<ProfileSettings />} />
              <Route path="/dashboard/cash-reports" element={<CashReports />} />
              <Route path="/dashboard/gallons-info" element={<GallonsInfo />} />
              <Route path="/dashboard/duties-mine" element={<MyDuties />} />
  
              {/* Legacy Routes Redirect */}
              <Route path="/dashboard/bills" element={<Navigate to="/dashboard/billing-user" replace />} />
              <Route path="/dashboard/payment-confirm" element={<Navigate to="/dashboard/billing-user?tab=confirm" replace />} />
              <Route path="/dashboard/payment-history" element={<Navigate to="/dashboard/billing-user?tab=history" replace />} />
              <Route path="/dashboard/duties-confirm" element={<Navigate to="/dashboard/duties-mine" replace />} />
              <Route path="/dashboard/notifications" element={<Navigate to="/dashboard/information" replace />} />
              <Route path="/dashboard/announcements" element={<Navigate to="/dashboard/information" replace />} />
            </Route>
  
          </Route>
  
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
