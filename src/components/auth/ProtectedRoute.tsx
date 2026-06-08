import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  allowedRoles: Role[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile, activeRole } = useAuth()

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // Use activeRole instead of profile.role to support users with multiple roles switching modes
  if (!activeRole || !allowedRoles.includes(activeRole as Role)) {
    // Redirect to dashboard if they don't have permission for this specific route
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
