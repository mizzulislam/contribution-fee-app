import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import ErrorBoundary from '@/components/common/ErrorBoundary'

import AuthLayout from '@/components/layout/AuthLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import Login from '@/features/auth/pages/LoginPage'
import Dashboard from '@/features/dashboard/pages/DashboardPage'

// Existing Pages
import FinanceDashboard from '@/features/accounting/pages/AccountingDashboardPage'
import DutySchedules from '@/features/residents/pages/DutySchedulesPage'

// Sprint 1 & Consolidated Pages
import BillingDashboard from '@/features/billing/pages/BillingDashboardPage'
import GallonsDashboard from '@/features/gallon-tracker/pages/GallonsDashboardPage'

// Sprint 2 Pages (User Portal Consolidated)
import UserBillingDashboard from '@/features/billing/pages/ResidentBillingPage'
import UserInformationDashboard from '@/features/notifications/pages/UserInformationDashboardPage'
import CashReports from '@/features/reports/pages/CashReportsPage'
import GallonsInfo from '@/features/gallon-tracker/pages/GallonsInfoPage'
import MyDuties from '@/features/residents/pages/MyDutiesPage'

// Sprint 3 Pages (Super Admin & Profil)
import ManajemenWarga from '@/features/residents/pages/ResidentsPage'
import ProfileSettings from '@/features/settings/pages/ProfileSettingsPage'
import AuditLogs from '@/features/settings/pages/AuditLogsPage'
import RolesPermissions from '@/features/settings/pages/RolesPermissionsPage'

// Sprint 4 Pages (Super Admin)
import MasterData from '@/features/settings/pages/MasterDataPage'
import NotificationSettings from '@/features/settings/pages/NotificationSettingsPage'
import BackupRestore from '@/features/settings/pages/BackupRestorePage'
import SystemSettings from '@/features/settings/pages/SystemSettingsPage'

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
