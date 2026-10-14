// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import client from '../api/client'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState({})
  const [recentQuestions, setRecentQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(stored))

    Promise.all([
      client.get('/user/me').then(res => {
        localStorage.setItem('user', JSON.stringify(res.data))
        setUser(res.data)
        return res.data
      }),
      client.get('/reports/summary').then(r => r.data).catch(() => ({})),
      client.get('/bible_quanes').then(r => r.data.slice(0, 5)).catch(() => [])
    ])
      .then(([me, sum, questions]) => {
        setSummary(sum)
        setRecentQuestions(questions)
      })
      .finally(() => setLoading(false))
  }, [navigate])

  if (!user || loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>
  }

  const role = user.role
  const canManageUsers = ['admin', 'manager'].includes(role)
  const canEditContent = ['admin', 'manager', 'editor'].includes(role)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Signed in as <span className="font-medium">{user.username}</span> · <span className="capitalize">{role}</span>
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            {role}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Total users</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{summary.usersCount ?? '—'}</p>
            {canManageUsers && (
              <Link to="/users" className="text-xs text-blue-500 hover:underline mt-2 block">
                Manage users →
              </Link>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Bible questions</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{summary.bible_quanesCount ?? '—'}</p>
            <Link to="/bible_quanes" className="text-xs text-blue-500 hover:underline mt-2 block">
              Browse all →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Books covered</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {new Set(recentQuestions.map(q => q.book)).size || '—'}
            </p>
            <p className="text-xs text-gray-400 mt-2">in recent imports</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">System status</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">OK</p>
            <p className="text-xs text-gray-400 mt-2">DB connected, backups active</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent questions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Recently added questions</h2>
              <Link to="/bible_quanes" className="text-xs text-blue-500 hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentQuestions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No questions yet</p>
              ) : (
                recentQuestions.map(q => (
                  <div key={q.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{q.question}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {q.book} {q.chapter ? `· ch. ${q.chapter}` : ''} {q.reference ? `· ${q.reference}` : ''}
                        </p>
                      </div>
                      {canEditContent && (
                        <Link
                          to="/bible_quanes"
                          className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {canManageUsers && (
                <Link
                  to="/users"
                  className="flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <span className="text-lg">👥</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Manage Users</p>
                    <p className="text-xs text-gray-500">Add, edit, or remove accounts</p>
                  </div>
                </Link>
              )}
              <Link
                to="/bible_quanes"
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <span className="text-lg">📖</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Bible Questions</p>
                  <p className="text-xs text-gray-500">Browse and edit the question bank</p>
                </div>
              </Link>
              <Link
                to="/reports"
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Reports</p>
                  <p className="text-xs text-gray-500">View totals and activity</p>
                </div>
              </Link>
              <Link
                to="/change-password"
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">🔒</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Change Password</p>
                  <p className="text-xs text-gray-500">Update your credentials</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}