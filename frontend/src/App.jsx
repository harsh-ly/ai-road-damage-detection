import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, Suspense, lazy, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// 🚀 Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const Report = lazy(() => import('./pages/Report'))
const Results = lazy(() => import('./pages/Results'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const MyReports = lazy(() => import('./pages/MyReports'))    // 👈 NEW!
const Leaderboard = lazy(() => import('./pages/Leaderboard')) // 🏆 NEW!

const API_URL = 'http://127.0.0.1:8000'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f1014',
      color: '#f4c430',
      fontFamily: "'Oswald', sans-serif",
      letterSpacing: '0.3em',
    }}>
      LOADING...
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

// ============================================
// 🤖 CHATBOT (FIXED - No early returns!)
// ============================================
function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "👋 Hi! I'm PotholeGPT, your AI assistant powered by Gemini.",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([
    '📊 Show me city stats',
    '🔍 Track my report',
    '🆕 File a new complaint',
  ])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // 👇 UPDATED: Hide chatbot on admin, login, signup, my-reports, and leaderboard pages
  if (['/admin', '/login', '/signup', '/my-reports', '/leaderboard'].includes(pathname)) return null

  const sendMessage = async (messageText = null) => {
    const text = messageText || input.trim()
    if (!text || loading) return

    setMessages(prev => [...prev, { sender: 'user', text, timestamp: new Date() }])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/chat/`, {
        message: text,
        conversation_history: messages.slice(-5),
      })

      const { reply, intent, data, suggestions: newSuggestions } = response.data

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: reply,
        timestamp: new Date(),
        intent,
        data,
      }])

      if (newSuggestions?.length > 0) setSuggestions(newSuggestions)

      if (intent === 'file_report' && data?.action === 'redirect_to_report') {
        setTimeout(() => {
          navigate('/report')
          setIsOpen(false)
        }, 1500)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '⚠️ Backend not responding. Make sure it\'s running on http://127.0.0.1:8000',
        timestamp: new Date(),
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
          border: 'none', cursor: 'pointer', fontSize: '28px',
          zIndex: 999,
          boxShadow: '0 10px 30px rgba(244,196,48,0.3)',
          color: '#1a1a1f',
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: '110px', right: '30px',
              width: '380px', maxWidth: 'calc(100vw - 40px)',
              height: '560px',
              background: 'rgba(28,29,34,0.98)',
              border: '1px solid rgba(244,196,48,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              zIndex: 998,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(244,196,48,0.15)',
              background: 'rgba(244,196,48,0.05)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px',
              }}>🤖</div>
              <div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  color: '#ece9e2', fontWeight: 700, fontSize: '15px',
                  textTransform: 'uppercase',
                }}>PotholeGPT</div>
                <div style={{
                  color: '#5fb87a', fontSize: '11px',
                }}>● Online · Powered by Gemini</div>
              </div>
            </div>

            <div style={{
              flex: 1, padding: '16px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, #f4c430, #ffd966)'
                      : msg.isError
                        ? 'rgba(232,69,60,0.1)'
                        : 'rgba(244,196,48,0.08)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(244,196,48,0.2)',
                    color: msg.sender === 'user' ? '#1a1a1f' : '#ece9e2',
                    padding: '12px 16px', maxWidth: '85%',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px', lineHeight: 1.6,
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{
                  background: 'rgba(244,196,48,0.08)',
                  padding: '12px', maxWidth: '60px',
                  color: '#f4c430',
                }}>...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!loading && suggestions.length > 0 && (
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid rgba(244,196,48,0.1)',
                display: 'flex', gap: '6px', flexWrap: 'wrap',
              }}>
                {suggestions.slice(0, 3).map((s, i) => (
                  <button key={i}
                    onClick={() => sendMessage(s.replace(/^[^\w\s]+\s*/, ''))}
                    style={{
                      background: 'rgba(28,29,34,0.6)',
                      border: '1px solid rgba(244,196,48,0.2)',
                      color: '#c8c6bd',
                      padding: '6px 12px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      borderRadius: '14px',
                    }}>{s}</button>
                ))}
              </div>
            )}

            <div style={{
              padding: '16px',
              borderTop: '1px solid rgba(244,196,48,0.15)',
              display: 'flex', gap: '8px',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(28,29,34,0.8)',
                  border: '1px solid rgba(244,196,48,0.2)',
                  padding: '12px 14px',
                  color: '#ece9e2',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                  border: 'none', color: '#1a1a1f',
                  padding: '12px 18px', cursor: 'pointer',
                  fontWeight: 700,
                }}
              >➤</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// 🎬 ROUTES (WITH LOGIN, SIGNUP & MY REPORTS!)
// ============================================
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/report" element={<Report />} />
      <Route path="/results/:tracking_id" element={<Results />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Admin route: requires authentication AND admin role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Admin />
          </ProtectedRoute>
        }
      />
      {/* My Reports: requires authentication */}
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute requireAuth>
            <MyReports />
          </ProtectedRoute>
        }
      />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <ScrollToTop />
        <Suspense fallback={<LoadingScreen />}>
          <AppRoutes />
        </Suspense>
        <ChatBot />
      </Router>
    </AuthProvider>
  )
}

export default App