import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import client from '../api/client'

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))

  // Refresh role on mount
  useEffect(() => {
    if (!localStorage.getItem('token')) return
    client.get('/user/me')
      .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data))
        setUser(res.data)
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/login')
  }

  const role = user?.role || ''
  const isStaff = ['admin', 'manager', 'editor', 'viewer'].includes(role)
  const canManageUsers = ['admin', 'manager'].includes(role)
  const isAdmin = role === 'admin'
  const homePath = isStaff ? '/admin' : '/dashboard'

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: navigation links */}
          <div className="flex items-center gap-1 flex-wrap">
            <Link to={homePath} className="font-bold text-lg mr-4 hover:text-blue-200">
              {isStaff ? 'Admin' : 'Dashboard'}
            </Link>

            {/* Read — available to all authenticated users */}
            <Link
              to="/reader"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Read
            </Link>

            {/* Quiz — available to all authenticated users */}
            <Link
              to="/quiz/setup"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Quiz
            </Link>

            {canManageUsers && (
              <Link
                to="/users"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Users
              </Link>
            )}

            {isStaff && (
              <Link
                to="/bible_quanes"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Bible quanes
              </Link>
            )}

            {isStaff && (
              <Link
                to="/reports"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Reports
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/review"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Review
              </Link>
            )}
          </div>

          {/* Right: user menu */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors focus:outline-none"
                >
                  <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center font-semibold">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.username}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white text-gray-700 rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        My Dashboard
                      </Link>

                      <Link
                        to="/reader"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        Bible Reader
                      </Link>

                      {isStaff && (
                        <Link
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/review"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          Review Queue
                        </Link>
                      )}

                      <Link
                        to="/change-password"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        Change Password
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}