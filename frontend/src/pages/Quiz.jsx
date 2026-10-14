import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import client from '../api/client'

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function Quiz() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const filters = {
    difficulty: searchParams.get('difficulty') || '',
    book: searchParams.get('book') || '',
    chapter: searchParams.get('chapter') || '',
    limit: parseInt(searchParams.get('limit'), 10) || 10
  }

  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (filters.difficulty) params.set('difficulty', filters.difficulty)
    if (filters.book) params.set('book', filters.book)
    if (filters.chapter) params.set('chapter', filters.chapter)
    params.set('limit', String(filters.limit))
    return `/quiz/questions?${params.toString()}`
  }

  const fetchQuestions = () => {
    setLoading(true)
    setError('')
    client.get(buildUrl())
      .then(res => {
        if (res.data.length === 0) {
          setError('No questions match your filters. Try different selections.')
          setQuestions([])
          return
        }
        setQuestions(res.data)
        setIndex(0)
        setSelected(null)
        setRevealed(false)
        setScore(0)
      })
      .catch(() => setError('Failed to load quiz'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const current = questions[index]
  const done = index >= questions.length

  const handleSelect = (choice) => {
    if (revealed || !current) return
    setSelected(choice)
    setRevealed(true)
    if (choice === current.answer) setScore(s => s + 1)
  }

  const next = () => {
    setSelected(null)
    setRevealed(false)
    setIndex(i => i + 1)
  }

  const restart = () => fetchQuestions()

  const buildChoices = (q) => {
    const pool = questions
      .filter(x => x.id !== q.id)
      .map(x => x.answer)
      .filter(a => a && a !== q.answer)
    const unique = [...new Set(pool)]
    const distractors = shuffle(unique).slice(0, 3)
    return shuffle([q.answer, ...distractors])
  }

  const filterSummary = () => {
    const bits = []
    if (filters.difficulty) bits.push(filters.difficulty)
    if (filters.book) bits.push(filters.book)
    if (filters.chapter) bits.push(`ch. ${filters.chapter}`)
    return bits.join(' · ') || 'All questions'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-gray-400">Loading quiz…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/quiz/setup')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Change Filters
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    const percent = Math.round((score / questions.length) * 100)
    const message =
      percent === 100 ? 'Perfect score! 🎉'
      : percent >= 70 ? 'Great job!'
      : percent >= 50 ? 'Good effort. Keep reading!'
      : 'Keep at it — the Word rewards persistence.'

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-2">
              Quiz Complete
            </p>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{message}</h1>
            <p className="text-5xl font-bold text-blue-600 my-6">
              {score} / {questions.length}
            </p>
            <p className="text-gray-500 mb-2">You answered {percent}% correctly.</p>
            <p className="text-xs text-gray-400 mb-8">Filters: {filterSummary()}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={restart}
                className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Retake Same Filters
              </button>
              <button
                onClick={() => navigate('/quiz/setup')}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Change Filters
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
          <span>{filterSummary()}</span>
          <button
            onClick={() => navigate('/quiz/setup')}
            className="text-blue-600 hover:underline"
          >
            Change filters
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Question {index + 1} of {questions.length}</span>
            <span>Score: {score}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(index / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">
              {current.book}
              {current.chapter ? ` · Chapter ${current.chapter}` : ''}
            </p>
            {current.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                current.difficulty === 'advanced' ? 'bg-red-50 text-red-600'
                : current.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-600'
                : 'bg-green-50 text-green-600'
              }`}>
                {current.difficulty}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{current.question}</h2>

          <div className="space-y-2">
            {buildChoices(current).map((choice, i) => {
              const isCorrect = choice === current.answer
              const isSelected = choice === selected
              let classes = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              if (revealed && isCorrect) classes = 'border-green-500 bg-green-50'
              else if (revealed && isSelected && !isCorrect) classes = 'border-red-500 bg-red-50'
              else if (revealed) classes = 'border-gray-200 opacity-60'

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(choice)}
                  disabled={revealed}
                  className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${classes}`}
                >
                  <span className="text-sm text-gray-800">{choice}</span>
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-1">
                {selected === current.answer ? '✓ Correct!' : '✗ Not quite'}
              </p>
              {current.explanation && (
                <p className="text-sm text-blue-800">{current.explanation}</p>
              )}
              {current.reference && (
                <p className="text-xs text-blue-600 mt-2 font-medium">{current.reference}</p>
              )}
              <button
                onClick={next}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {index + 1 < questions.length ? 'Next Question →' : 'See Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}