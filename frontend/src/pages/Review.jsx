import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import client from '../api/client'

const DIFFICULTIES = ['basic', 'intermediate', 'advanced']

export default function Review() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})

  const fetchQueue = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await client.get('/review/queue', { params: { page, pageSize: pagination.pageSize } })
      setItems(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No review queue. Run `npm run verify-against-kjv` first.')
      } else {
        setError(err.response?.data?.message || 'Failed to load review queue')
      }
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize])

  const fetchStats = useCallback(async () => {
    try {
      const res = await client.get('/review/stats')
      setStats(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    fetchQueue(1)
    // eslint-disable-next-line
  }, [])

  const handleAccept = async (index) => {
    try {
      await client.post('/review/accept', { index })
      fetchStats()
      fetchQueue(pagination.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Accept failed')
    }
  }

  const handleReject = async (index) => {
    if (!window.confirm('Reject this question? It will be archived to rejected.json.')) return
    try {
      await client.post('/review/reject', { index })
      fetchStats()
      fetchQueue(pagination.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Reject failed')
    }
  }

  const handleEditOpen = (item, index) => {
    setEditing(true)
    setDraft({ index, ...item })
  }

  const handleEditSave = async () => {
    const { index, question, answer, explanation, reference, difficulty } = draft
    try {
      await client.post('/review/edit', {
        index,
        updates: { question, answer, explanation, reference, difficulty }
      })
      setEditing(false)
      setDraft({})
      fetchQueue(pagination.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Edit failed')
    }
  }

  const handleRebuild = async () => {
    if (!window.confirm('Rebuild the database from verified.json? This replaces all current questions.')) return
    try {
      const res = await client.post('/review/rebuild-db')
      setError('')
      alert(res.data.message)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Rebuild failed')
    }
  }

  return (
    <>
      <Helmet>
        <title>Review Queue — Bible Quiz App</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Review Queue</h1>
              <p className="text-sm text-gray-500 mt-1">
                Verify paraphrased answers against the KJV text
              </p>
            </div>
            <button
              onClick={handleRebuild}
              className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-md transition-colors"
            >
              Rebuild DB from verified.json
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">In DB</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inDb ?? '—'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified ?? '—'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Needs review</p>
              <p className="text-2xl font-bold text-amber-600">{stats.review ?? '—'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected ?? '—'}</p>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              No items in the review queue. 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item._index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{item.book} {item.chapter}</span>
                      {item.reference && <> · {item.reference}</>}
                      {item.difficulty && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          item.difficulty === 'advanced' ? 'bg-red-50 text-red-700'
                          : item.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-700'
                          : 'bg-green-50 text-green-700'
                        }`}>
                          {item.difficulty}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">#{item._index}</span>
                  </div>

                  <p className="text-sm font-medium text-gray-800 mb-2">{item.question}</p>

                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-3">
                    <p className="text-xs text-blue-600 font-medium mb-1">Answer:</p>
                    <p className="text-sm text-blue-900">{item.answer}</p>
                  </div>

                  {item._verseText && (
                    <div className="bg-slate-50 border border-slate-100 rounded-md p-3 mb-3">
                      <p className="text-xs text-slate-500 font-medium mb-1">KJV verse:</p>
                      <p className="text-sm text-slate-700 italic">{item._verseText}</p>
                    </div>
                  )}

                  {item.explanation && (
                    <p className="text-xs text-gray-500 mb-3">Explanation: {item.explanation}</p>
                  )}

                  {item._reason && (
                    <p className="text-xs text-amber-600 mb-3">
                      Flagged: <span className="font-medium">{item._reason}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleAccept(item._index)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleEditOpen(item, item._index)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleReject(item._index)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-md transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchQueue(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchQueue(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Edit Question</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Question</label>
                <input
                  value={draft.question || ''}
                  onChange={e => setDraft({ ...draft, question: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  rows={3}
                  value={draft.answer || ''}
                  onChange={e => setDraft({ ...draft, answer: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                <input
                  value={draft.reference || ''}
                  onChange={e => setDraft({ ...draft, reference: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={draft.explanation || ''}
                  onChange={e => setDraft({ ...draft, explanation: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={draft.difficulty || 'basic'}
                  onChange={e => setDraft({ ...draft, difficulty: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {draft._verseText && (
                <div className="bg-slate-50 border border-slate-100 rounded-md p-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">KJV verse:</p>
                  <p className="text-xs text-slate-700 italic">{draft._verseText}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={handleEditSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}