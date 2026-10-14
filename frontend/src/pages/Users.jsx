import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import client from '../api/client'

const ROLES = ['admin', 'user', 'manager', 'editor', 'viewer']

export default function Users() {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' })
  const [editRow, setEditRow] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const canCreate = ['admin', 'manager'].includes(user?.role)
  const canUpdate = ['admin', 'manager', 'editor'].includes(user?.role)
  const canDelete = ['admin', 'manager'].includes(user?.role)

  const fetchAll = useCallback(async (page = pagination.page, pageSize = pagination.pageSize) => {
    try {
      const res = await client.get('/users', { params: { page, pageSize } })
      setRows(res.data.data)
      setPagination(res.data.pagination)
    } catch {
      setError('Failed to load data')
    }
  }, [pagination.page, pagination.pageSize])

  useEffect(() => { fetchAll(1, pagination.pageSize) // eslint-disable-next-line
  }, [])

  const handlePageChange = (page) => {
    fetchAll(page, pagination.pageSize)
  }

  const handlePageSizeChange = (pageSize) => {
    fetchAll(1, pageSize)
  }

  const openAdd = () => {
    setEditRow(null)
    setForm({ username: '', email: '', password: '', role: 'user' })
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditRow(row)
    setForm({ username: row.username, email: row.email || '', password: '', role: row.role })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (editRow) {
        await client.put(`/users/${editRow.id}`, form)
      } else {
        await client.post('/users', form)
      }
      setShowModal(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await client.delete(`/users/${id}`)
      // If we just deleted the last item on the page, step back one page
      const newTotal = pagination.total - 1
      const maxPage = Math.max(1, Math.ceil(newTotal / pagination.pageSize))
      fetchAll(Math.min(pagination.page, maxPage))
    } catch {
      setError('Delete failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination.total} record{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreate && (
            <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              + Add User
            </button>
          )}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">{row.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.role}</td>
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
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No records yet</td></tr>
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
          <Modal title={editRow ? 'Edit User' : 'Add User'} onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input name="username" type="text" required
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editRow ? '(leave blank to keep current)' : '*'}
                </label>
                <input name="password" type="password" required={!editRow}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select name="role" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
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