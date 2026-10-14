import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Users from './pages/Users.jsx'
import BibleQuanes from './pages/BibleQuanes.jsx'
import Reports from './pages/Reports.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Quiz from './pages/Quiz.jsx'
import QuizSetup from './pages/QuizSetup.jsx'
import BibleReader from './pages/BibleReader.jsx'
import Review from './pages/Review.jsx'

const ALL_AUTHENTICATED = ['admin', 'user', 'manager', 'editor', 'viewer']
const STAFF_ROLES       = ['admin', 'manager', 'editor', 'viewer']
const ADMIN_ROLES       = ['admin', 'manager']

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Any authenticated user */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={ALL_AUTHENTICATED}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute allowedRoles={ALL_AUTHENTICATED}>
            <Quiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/setup"
        element={
          <ProtectedRoute allowedRoles={ALL_AUTHENTICATED}>
            <QuizSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reader"
        element={
          <ProtectedRoute allowedRoles={ALL_AUTHENTICATED}>
            <BibleReader />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowedRoles={ALL_AUTHENTICATED}>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Staff only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={STAFF_ROLES}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bible_quanes"
        element={
          <ProtectedRoute allowedRoles={STAFF_ROLES}>
            <BibleQuanes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={STAFF_ROLES}>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Admin + manager only */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <Users />
          </ProtectedRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/review"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Review />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}

export default App