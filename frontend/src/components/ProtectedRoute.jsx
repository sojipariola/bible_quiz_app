// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const userStr = localStorage.getItem('user')
  const token = localStorage.getItem('token')

  // Not authenticated → redirect to login, remember where they were going
  if (!userStr || !token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  let user
  try {
    user = JSON.parse(userStr)
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return <Navigate to="/login" replace />
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Send plain users to their dashboard, staff to admin
    const fallback = user.role === 'user' ? '/dashboard' : '/admin'
    return <Navigate to={fallback} replace />
  }

  return children
}