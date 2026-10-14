import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import client from '../api/client'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState({})

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    setUser(JSON.parse(stored))
    client.get('/reports/summary').then(r => setSummary(r.data)).catch(() => {})
  }, [navigate])

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Bible Quiz App Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user.username}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Users</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{summary.usersCount ?? '—'}</p>
            <Link to="/users" className="text-xs text-blue-500 hover:underline mt-2 block">View all →</Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Bible quanes</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{summary.bible_quanesCount ?? '—'}</p>
            <Link to="/bible_quanes" className="text-xs text-blue-500 hover:underline mt-2 block">View all →</Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-3">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/users" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors">Users</Link>
            <Link to="/bible_quanes" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors">Bible quanes</Link>
            <Link to="/reports" className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm hover:bg-green-100 transition-colors">Reports</Link>
          </div>
        </div>
      </div>
    </div>
  )
}