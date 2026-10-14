// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import client from '../api/client'

export default function UserDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [totalQuestions, setTotalQuestions] = useState(null)
  const [difficultyCounts, setDifficultyCounts] = useState([])
  const [loadingSummary, setLoadingSummary] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      navigate('/login')
      return
    }
    setUser(JSON.parse(stored))

    // Refresh user from /me so role changes take effect
    client.get('/user/me')
      .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data))
        setUser(res.data)
      })
      .catch(() => {})

    // Load quiz facets (books, chapters, difficulty counts)
    client.get('/quiz/facets')
      .then(res => {
        const counts = res.data.counts || []
        const total = counts.reduce((sum, c) => sum + c.count, 0)
        setTotalQuestions(total)
        setDifficultyCounts(counts)
      })
      .catch(() => {
        setTotalQuestions(0)
      })
      .finally(() => setLoadingSummary(false))
  }, [navigate])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.username}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Grow in the Word every day. Read a passage, take a quiz, keep the streak alive.
          </p>
        </div>

        {/* Personal stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Questions available</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {loadingSummary ? '—' : totalQuestions ?? '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">across all books</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Current streak</p>
            <p className="text-3xl font-bold text-orange-500 mt-1">🔥 0</p>
            <p className="text-xs text-gray-400 mt-1">Start reading today</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Last quiz score</p>
            <p className="text-3xl font-bold text-purple-500 mt-1">—</p>
            <p className="text-xs text-gray-400 mt-1">Take a quiz to get started</p>
          </div>
        </div>

        {/* Difficulty breakdown (only if we have data) */}
        {difficultyCounts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">Questions by difficulty</p>
            <div className="flex flex-wrap gap-3">
              {difficultyCounts.map(c => {
                const colors = {
                  basic: 'bg-green-50 text-green-700',
                  intermediate: 'bg-amber-50 text-amber-700',
                  advanced: 'bg-red-50 text-red-700'
                }[c.difficulty] || 'bg-gray-50 text-gray-700'
                return (
                  <span key={c.difficulty} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${colors}`}>
                    {c.difficulty}: {c.count}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Verse of the day */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6 mb-8">
          <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold mb-2">
            Verse of the day
          </p>
          <p className="text-lg italic text-slate-700 mb-2">
            "Your word is a lamp for my feet, a light on my path."
          </p>
          <p className="text-sm font-semibold text-blue-700">— Psalm 119:105</p>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/quiz/setup"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Customise Your Quiz
            </Link>
            <Link
              to="/quiz?limit=10"
              className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Quick 10-Question Quiz
            </Link>
            <Link
              to="/change-password"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}