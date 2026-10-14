import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import client from '../api/client'

const DIFFICULTIES = [
  { value: '', label: 'Any difficulty' },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
]

const COUNTS = [10, 20, 30, 40, 50, 100]

export default function QuizSetup() {
  const navigate = useNavigate()
  const [facets, setFacets] = useState({ books: [], chapters: {}, counts: [] })
  const [form, setForm] = useState({
    difficulty: '',
    book: '',
    chapter: '',
    count: 10
  })
  const [available, setAvailable] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load books + chapters
  useEffect(() => {
    client.get('/quiz/facets')
      .then(res => setFacets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // When filter changes, check how many questions match
  useEffect(() => {
    const params = new URLSearchParams()
    if (form.difficulty) params.set('difficulty', form.difficulty)
    if (form.book) params.set('book', form.book)
    if (form.chapter) params.set('chapter', form.chapter)

    client.get(`/quiz/count?${params.toString()}`)
      .then(res => setAvailable(res.data.count))
      .catch(() => setAvailable(null))
  }, [form.difficulty, form.book, form.chapter])

  const availableChapters = form.book ? (facets.chapters[form.book] || []) : []
  const overAsk = available !== null && form.count > available
  const canStart = available !== null && available > 0 && !overAsk

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canStart) return

    const params = new URLSearchParams()
    if (form.difficulty) params.set('difficulty', form.difficulty)
    if (form.book) params.set('book', form.book)
    if (form.chapter) params.set('chapter', form.chapter)
    params.set('limit', String(form.count))

    navigate(`/quiz?${params.toString()}`)
  }

  // Reset chapter when book changes
  const handleBookChange = (e) => {
    setForm({ ...form, book: e.target.value, chapter: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      </div>
    )
  }

  const totalInBank = facets.counts.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Start a Quiz</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose your filters. The quiz picks random questions each time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={form.difficulty}
              onChange={e => setForm({ ...form, difficulty: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <div className="mt-2 flex gap-3 text-xs text-gray-500">
              {facets.counts.map(c => (
                <span key={c.difficulty}>
                  <span className="capitalize font-medium">{c.difficulty}</span>: {c.count}
                </span>
              ))}
            </div>
          </div>

          {/* Book */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Book of the Bible
            </label>
            <select
              value={form.book}
              onChange={handleBookChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All books</option>
              {facets.books.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Chapter (only if a book is chosen) */}
          {form.book && availableChapters.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter
              </label>
              <select
                value={form.chapter}
                onChange={e => setForm({ ...form, chapter: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All chapters</option>
                {availableChapters.map(ch => (
                  <option key={ch} value={ch}>Chapter {ch}</option>
                ))}
              </select>
            </div>
          )}

          {/* Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of questions
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map(n => {
                const disabled = available !== null && n > available
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={disabled}
                    onClick={() => setForm({ ...form, count: n })}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                      form.count === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : disabled
                        ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Availability hint */}
          <div className="text-sm">
            {available === null ? (
              <span className="text-gray-400">Checking availability…</span>
            ) : available === 0 ? (
              <span className="text-red-600">
                No questions match this combination. Try a different filter.
              </span>
            ) : overAsk ? (
              <span className="text-amber-600">
                Only {available} question{available !== 1 ? 's' : ''} available. Pick a smaller count.
              </span>
            ) : (
              <span className="text-gray-500">
                {available} question{available !== 1 ? 's' : ''} match — the quiz will use {Math.min(form.count, available)}.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!canStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Quiz
          </button>

          <p className="text-xs text-gray-400 text-center">
            {totalInBank} questions in the bank
          </p>
        </form>
      </div>
    </div>
  )
}