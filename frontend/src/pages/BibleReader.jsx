// frontend/src/pages/BibleReader.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import client from '../api/client'

export default function BibleReader() {
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState('Genesis')
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1)
  const [speechRate, setSpeechRate] = useState(1)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)

  const synthRef = useRef(window.speechSynthesis)
  const utteranceRef = useRef(null)

  // Load books list on mount
  useEffect(() => {
    client.get('/kjv/books')
      .then(res => setBooks(res.data))
      .catch(() => setError('Failed to load books'))
  }, [])

  // Load voices (with voiceschanged handling)
  useEffect(() => {
    const loadVoices = () => {
      const v = synthRef.current.getVoices()
      if (v.length > 0) {
        setVoices(v)
        // Prefer an English voice
        const englishVoice = v.find(voice => voice.lang.startsWith('en'))
        setSelectedVoice(englishVoice || v[0])
      }
    }

    loadVoices()
    synthRef.current.addEventListener('voiceschanged', loadVoices)

    return () => {
      synthRef.current.removeEventListener('voiceschanged', loadVoices)
      synthRef.current.cancel()
    }
  }, [])

  // Load chapter when book/chapter changes
  useEffect(() => {
    setLoading(true)
    setError('')
    client.get(`/kjv/${encodeURIComponent(selectedBook)}/${selectedChapter}`)
      .then(res => {
        setVerses(res.data.verses)
        setCurrentVerseIndex(-1)
      })
      .catch(() => {
        setVerses([])
        setError('Failed to load chapter')
      })
      .finally(() => setLoading(false))
  }, [selectedBook, selectedChapter])

  // Get chapter count for selected book
  const currentBookInfo = books.find(b => b.book === selectedBook)

  // Speak a single verse
  const speakVerse = useCallback((index) => {
    if (index >= verses.length) {
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentVerseIndex(-1)
      return
    }

    const verse = verses[index]
    const utterance = new SpeechSynthesisUtterance(verse.text)

    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = speechRate
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => {
      setCurrentVerseIndex(index)
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      // Auto-advance to next verse
      speakVerse(index + 1)
    }

    utterance.onerror = (event) => {
      // 'interrupted' or 'canceled' are expected when we cancel
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('Speech error:', event.error)
      }
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }, [verses, selectedVoice, speechRate])

  const handlePlay = () => {
    if (isPaused) {
      // Resume: restart from current verse
      synthRef.current.cancel()
      speakVerse(currentVerseIndex >= 0 ? currentVerseIndex : 0)
    } else if (!isSpeaking) {
      // Start from beginning (or from verse 1)
      synthRef.current.cancel()
      speakVerse(0)
    }
  }

  const handlePause = () => {
    synthRef.current.cancel()
    setIsPaused(true)
    setIsSpeaking(false)
  }

  const handleStop = () => {
    synthRef.current.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setCurrentVerseIndex(-1)
  }

  const handleVerseClick = (index) => {
    synthRef.current.cancel()
    speakVerse(index)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current.cancel()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Bible Reader</h1>
          <p className="text-sm text-gray-500 mt-1">
            King James Version · Listen to any chapter
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
              <select
                value={selectedBook}
                onChange={e => {
                  handleStop()
                  setSelectedBook(e.target.value)
                  setSelectedChapter(1)
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {books.map(b => (
                  <option key={b.book} value={b.book}>{b.book}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <select
                value={selectedChapter}
                onChange={e => {
                  handleStop()
                  setSelectedChapter(parseInt(e.target.value, 10))
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentBookInfo && Array.from(
                  { length: currentBookInfo.chapters },
                  (_, i) => i + 1
                ).map(n => (
                  <option key={n} value={n}>Chapter {n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TTS Controls */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Play / Pause / Stop */}
              {!isSpeaking && !isPaused && (
                <button
                  onClick={handlePlay}
                  disabled={verses.length === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Listen
                </button>
              )}

              {isSpeaking && !isPaused && (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                  </svg>
                  Pause
                </button>
              )}

              {isPaused && (
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Resume
                </button>
              )}

              {(isSpeaking || isPaused) && (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.5 4.5A1.5 1.5 0 016 3h8a1.5 1.5 0 011.5 1.5v8A1.5 1.5 0 0114 14H6a1.5 1.5 0 01-1.5-1.5v-8z" clipRule="evenodd" />
                  </svg>
                  Stop
                </button>
              )}

              {/* Speech rate */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs text-gray-500">Speed</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={e => {
                    const rate = parseFloat(e.target.value)
                    setSpeechRate(rate)
                    // Restart current verse with new rate
                    if (isSpeaking && currentVerseIndex >= 0) {
                      synthRef.current.cancel()
                      setTimeout(() => speakVerse(currentVerseIndex), 100)
                    }
                  }}
                  className="w-24"
                />
                <span className="text-xs text-gray-600 w-8">{speechRate}x</span>
              </div>
            </div>

            {/* Voice selector */}
            {voices.length > 1 && (
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Voice</label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={e => {
                    const v = voices.find(voice => voice.name === e.target.value)
                    setSelectedVoice(v)
                    if (isSpeaking && currentVerseIndex >= 0) {
                      synthRef.current.cancel()
                      setTimeout(() => speakVerse(currentVerseIndex), 100)
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
        )}

        {/* Verses */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading chapter…</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {selectedBook} {selectedChapter}
            </h2>
            <div className="space-y-3">
              {verses.map((v, i) => {
                const isActive = i === currentVerseIndex
                return (
                  <div
                    key={v.verse}
                    onClick={() => handleVerseClick(i)}
                    className={`flex gap-3 cursor-pointer rounded-md p-2 -m-2 transition-colors ${
                      isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold flex-shrink-0 pt-1 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {v.verse}
                    </span>
                    <p className={`text-sm leading-relaxed ${
                      isActive ? 'text-blue-900 font-medium' : 'text-gray-700'
                    }`}>
                      {v.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}