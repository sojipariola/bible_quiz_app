import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Pagination from '../components/Pagination'
import client from '../api/client'

const TAB_CONFIG = {
  summary: { title: 'Summary', paginated: false },
  users: { title: 'Users', paginated: true, endpoint: '/users' },
  bible_quanes: { title: 'Bible quanes', paginated: true, endpoint: '/bible_quanes/paginated' }
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('summary')
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    client.get('/reports/summary').then(r => setSummary(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const cfg = TAB_CONFIG[activeTab]
    if (!cfg.paginated) return

    setLoading(true)
    client.get(cfg.endpoint, { params: { page: 1, pageSize: pagination.pageSize } })
      .then(r => {
        setData(r.data.data)
        setPagination(r.data.pagination)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
    // eslint-disable-next-line
  }, [activeTab])

  const fetchPage = (page, pageSize = pagination.pageSize) => {
    const cfg = TAB_CONFIG[activeTab]
    if (!cfg.paginated) return
    setLoading(true)
    client.get(cfg.endpoint, { params: { page, pageSize } })
      .then(r => {
        setData(r.data.data)
        setPagination(r.data.pagination)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  const tabs = ['summary', 'users', 'bible_quanes']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

        <div className="flex gap-1 bg-white rounded-lg shadow-sm border border-gray-100 p-1 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {TAB_CONFIG[t].title}
            </button>
          ))}
        </div>

        {activeTab === 'summary' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Users</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{summary.usersCount ?? '—'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Bible quanes</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{summary.bible_quanesCount ?? '—'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {data[0] && Object.keys(data[0]).map(k => (
                          <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-gray-700">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                      {data.length === 0 && (
                        <tr><td colSpan={99} className="px-4 py-8 text-center text-gray-400 text-sm">No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => fetchPage(p)}
                  onPageSizeChange={(ps) => fetchPage(1, ps)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}