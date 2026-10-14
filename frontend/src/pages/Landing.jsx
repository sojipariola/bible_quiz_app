import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // A rotating set of verses to display dynamically in the hero
  const verses = [
    { text: "Your word is a lamp for my feet, a light on my path.", ref: "Psalm 119:105" },
    { text: "For the word of God is alive and active. Sharper than any double-edged sword...", ref: "Hebrews 4:12" },
    { text: "Do not merely listen to the word, and so deceive yourselves. Do what it says.", ref: "James 1:22" }
  ]

  // Simple rotation for the verse display (optional visual flair)
  const [currentVerse, setCurrentVerse] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVerse((prev) => (prev + 1) % verses.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [verses.length])

  return (
    <>
      <Helmet>
        <title>Bible Quiz App — Grow Your Faith Through Interactive Scripture Quizzes</title>
        <meta
          name="description"
          content="Deepen your understanding of Scripture with customizable Bible quizzes across all 66 books. Choose your difficulty, book, and chapter. Free to start."
        />
        <meta name="keywords" content="Bible quiz, Scripture study, Bible trivia, Bible reading, Christian app, Old Testament, New Testament" />
        <meta name="author" content="Bible Quiz App" />

        {/* Open Graph (Facebook, LinkedIn, etc.) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Bible Quiz App — Interactive Scripture Study" />
        <meta property="og:description" content="Test your knowledge of the Bible with customizable quizzes across the Old and New Testaments." />
        <meta property="og:url" content="https://yourdomain.com/" />
        <meta property="og:site_name" content="Bible Quiz App" />
        <meta property="og:image" content="https://yourdomain.com/og-image.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bible Quiz App — Interactive Scripture Study" />
        <meta name="twitter:description" content="Customizable Bible quizzes across all 66 books. Choose your difficulty, book, and chapter." />
        <meta name="twitter:image" content="https://yourdomain.com/og-image.png" />

        {/* Canonical */}
        <link rel="canonical" href="https://yourdomain.com/" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Navigation Bar */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="font-bold text-xl text-slate-800 tracking-tight">BibleQuiz</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                Read. Learn. Grow.
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                Make Scripture a <span className="text-blue-600">daily habit</span>, not a to-do list.
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                Stop opening apps that drain you. Start opening the One that fills you.
                Join thousands building a lasting Bible reading habit through interactive quizzes and simple tracking.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  to="/register"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Start Reading Today →
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-sm"
                >
                  I already have an account
                </Link>
              </div>

              {/* Dynamic Verse Display */}
              <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 shadow-sm max-w-lg mx-auto">
                <p className="text-slate-700 italic text-lg mb-2 transition-opacity duration-500">
                  "{verses[currentVerse].text}"
                </p>
                <p className="text-sm font-semibold text-blue-600">
                  — {verses[currentVerse].ref}
                </p>
              </div>
            </div>
          </div>

          {/* Background decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-30 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Why BibleQuiz?</h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                We built the tools that help you overcome the two biggest hurdles: knowing what to read and staying consistent.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Adaptive Reading Plans</h3>
                <p className="text-slate-600 leading-relaxed">
                  Fell behind? No problem. Our system redistributes your reading so you can catch up at a comfortable pace without guilt.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Streaks & Progress</h3>
                <p className="text-slate-600 leading-relaxed">
                  Build momentum with visual streak counters and activity heatmaps. Watch your consistency grow day by day.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Interactive Quizzes</h3>
                <p className="text-slate-600 leading-relaxed">
                  Test your knowledge and reinforce what you've read. Learning Scripture has never been this engaging.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Stats Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-blue-400 mb-2">66</p>
                <p className="text-slate-400">Books Covered</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-400 mb-2">100%</p>
                <p className="text-slate-400">Free to Start</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-400 mb-2">24/7</p>
                <p className="text-slate-400">Access Anywhere</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Ready to make Scripture a priority?
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
              Join a community of readers who are trading mindless scrolling for meaningful reading.
              Start your journey today.
            </p>
            <Link
              to="/register"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-1"
            >
              Create Your Free Account
            </Link>
            <p className="mt-6 text-sm text-slate-500">
              No credit card required. Start reading in under 30 seconds.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="font-semibold text-slate-700">BibleQuiz</span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} BibleQuiz. Built for the community.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}