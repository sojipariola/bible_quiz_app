import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import client from '../api/client'

const DIFFICULTIES = ['', 'basic', 'intermediate', 'advanced']

export default function BibleQuanes() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ difficulty: '', book: '', chapter: '' })
  const [books, setBooks] = useState([])
  const [chapters, setChapters] = useState({})
  const [form, setForm] = useState({
    book: '', chapter: '', question: '', answer: '', explanation: '', reference: '', difficulty: 'basic'
  })
  const [editRow, setEditRow] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const canCreate = ['admin', 'manager'].includes(user?.role)
  const canUpdate = ['admin', 'manager', 'editor'].includes(user?.role)
  const canDelete = ['admin', 'manager'].includes(user?.role)

  // Load facets once
  useEffect(() => {
    client.get('/quiz/facets')
      .then(res => {
        setBooks(res.data.books || [])
        setChapters(res.data.chapters || {})
      })
      .catch(() => {})
  }, [])

  const fetchAll = useCallback(async (page = 1, pageSize = pagination.pageSize, f = filters) => {
    try {
      const params = { page, pageSize }
      if (f.difficulty) params.difficulty = f.difficulty
      if (f.book) params.book = f.book
      if (f.chapter) params.chapter = f.chapter

      const res = await client.get('/bible_quanes/paginated', { params })
      setRows(res.data.data)
      setPagination(res.data.pagination)
    } catch {
      setError('Failed to load data')
    }
  }, [pagination.pageSize])

  useEffect(() => { fetchAll(1, pagination.pageSize) // eslint-disable-next-line
  }, [])

  const handlePageChange = (page) => fetchAll(page, pagination.pageSize, filters)
  const handlePageSizeChange = (pageSize) => fetchAll(1, pageSize, filters)

  const applyFilters = (next) => {
    setFilters(next)
    fetchAll(1, pagination.pageSize, next)
  }

  const clearFilters = () => {
    const cleared = { difficulty: '', book: '', chapter: '' }
    setFilters(cleared)
    fetchAll(1, pagination.pageSize, cleared)
  }

  const openAdd = () => {
    setEditRow(null)
    setForm({ book: '', chapter: '', question: '', answer: '', explanation: '', reference: '', difficulty: 'basic' })
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditRow(row)
    setForm({
      book: row.book,
      chapter: row.chapter ?? '',
      question: row.question,
      answer: row.answer,
      explanation: row.explanation ?? '',
      reference: row.reference ?? '',
      difficulty: row.difficulty ?? 'basic'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (editRow) {
        await client.put(`/bible_quanes/${editRow.id}`, form)
      } else {
        await client.post('/bible_quanes', form)
      }
      setShowModal(false)
      fetchAll(pagination.page, pagination.pageSize, filters)
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await client.delete(`/bible_quanes/${id}`)
      const newTotal = pagination.total - 1
      const maxPage = Math.max(1, Math.ceil(newTotal / pagination.pageSize))
      fetchAll(Math.min(pagination.page, maxPage), pagination.pageSize, filters)
    } catch {
      setError('Delete failed')
    }
  }

  const availableChapters = filters.book ? (chapters[filters.book] || []) : []
  const hasFilters = filters.difficulty || filters.book || filters.chapter

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bible quanes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination.total} record{pagination.total !== 1 ? 's' : ''}
              {hasFilters && ' (filtered)'}
            </p>
          </div>
          {canCreate && (
            <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              + Add Bible quanes
            </button>
          )}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={filters.difficulty}
              onChange={e => applyFilters({ ...filters, difficulty: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All difficulties</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              value={filters.book}
              onChange={e => applyFilters({ ...filters, book: e.target.value, chapter: '' })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All books</option>
              {books.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={filters.chapter}
              onChange={e => applyFilters({ ...filters, chapter: e.target.value })}
              disabled={!filters.book}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">All chapters</option>
              {availableChapters.map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ch.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">{row.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.book}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.chapter}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate" title={row.question}>{row.question}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        row.difficulty === 'advanced' ? 'bg-red-50 text-red-700'
                        : row.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-700'
                        : 'bg-green-50 text-green-700'
                      }`}>
                        {row.difficulty || 'basic'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.reference}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <button onClick={() => openEdit(row)} className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 px-2 py-1 rounded transition-colors">Edit</button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(row.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    {hasFilters ? 'No questions match these filters' : 'No records yet'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>

        {showModal && (
          <Modal title={editRow ? 'Edit Bible quanes' : 'Add Bible quanes'} onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book *</label>
                  <input name="book" type="text" required
                    value={form.book} onChange={e => setForm({ ...form, book: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
                  <input name="chapter" type="number"
                    value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input name="question" type="text" required
                  value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <input name="answer" type="text" required
                  value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <input name="explanation" type="text"
                  value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input name="reference" type="text"
                    value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select name="difficulty" value={form.difficulty}
                    onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {loading ? 'Saving…' : editRow ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  )
}