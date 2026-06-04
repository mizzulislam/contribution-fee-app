import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  allowedRoles: Role[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { profile } = useAuth()

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(profile.role)) {
    // Redirect to dashboard if they don't have permission for this specific route
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
