import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import CaptchaField from '../components/CaptchaField'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://127.0.0.1:8000'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captcha, setCaptcha] = useState({ question: '', isValid: false, value: '' })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    if (!captcha.isValid) {
      setError('Please solve the captcha correctly to continue.')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      const { token, user } = response.data

      // Update AuthContext state (also persists to localStorage + sets axios header)
      login(user, token)

      console.log(`✅ Logged in as ${user.name} (${user.role})`)

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials and try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1014',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(244,196,48,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(244,196,48,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        position: 'fixed',
        left: mousePos.x - 250, top: mousePos.y - 250,
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,196,48,0.08), transparent 70%)',
        pointerEvents: 'none', zIndex: 1, filter: 'blur(20px)',
      }} />

      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{
          position: 'absolute',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(244,196,48,0.2), transparent 60%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={{
          background: 'linear-gradient(135deg, rgba(28,29,34,0.95), rgba(20,21,26,0.95))',
          border: '1px solid rgba(244,196,48,0.2)',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 2,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #f4c430, #ff6b35, transparent)',
        }} />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
            clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
            boxShadow: '0 0 20px rgba(244,196,48,0.5)',
          }} />
          <span style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '22px',
            fontWeight: 700,
            color: '#ece9e2',
            letterSpacing: '0.05em',
          }}>
            PotholeAI
          </span>
        </motion.div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '11px',
            color: '#f4c430',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '10px',
            fontWeight: 600,
          }}>
            ◉ Secure Access
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: '#ece9e2',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Welcome <span style={{
              background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>back</span>
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#9b9a93',
            fontSize: '14px',
            marginTop: '8px',
          }}>
            Sign in to your citizen or admin account
          </p>
        </div>

        {/* Role Info Badges */}
        <div style={{
          display: 'flex', gap: '8px', marginBottom: '24px',
          padding: '12px', background: 'rgba(15,16,20,0.5)',
          border: '1px solid rgba(244,196,48,0.1)',
        }}>
          <div style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(95,184,122,0.1)',
            border: '1px solid rgba(95,184,122,0.3)',
            padding: '8px',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>🏙️</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '10px', color: '#5fb87a', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Citizen</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#6b6a64', marginTop: '2px' }}>Report & Track</div>
          </div>
          <div style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(255,107,53,0.1)',
            border: '1px solid rgba(255,107,53,0.3)',
            padding: '8px',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>🛠️</div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '10px', color: '#ff6b35', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#6b6a64', marginTop: '2px' }}>Manage & Export</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '11px',
              color: '#9b9a93',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontWeight: 600,
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px', top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                opacity: 0.5,
              }}>✉️</span>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  background: 'rgba(15,16,20,0.8)',
                  border: '1px solid rgba(244,196,48,0.2)',
                  padding: '14px 16px 14px 44px',
                  color: '#ece9e2',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '11px',
              color: '#9b9a93',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontWeight: 600,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px', top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                opacity: 0.5,
              }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  background: 'rgba(15,16,20,0.8)',
                  border: '1px solid rgba(244,196,48,0.2)',
                  padding: '14px 50px 14px 44px',
                  color: '#ece9e2',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <CaptchaField onChange={setCaptcha} />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(232,69,60,0.1)',
                  border: '1px solid #e8453c',
                  color: '#e8453c',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            id="login-submit-btn"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? 'linear-gradient(135deg, #2c2c31, #1f1f24)'
                : 'linear-gradient(135deg, #f4c430, #ffd966)',
              color: loading ? '#9b9a93' : '#1a1a1f',
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '16px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
              boxShadow: loading ? 'none' : '0 10px 30px rgba(244,196,48,0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </motion.button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: '#9b9a93',
        }}>
          New to PotholeAI?{' '}
          <Link to="/signup" style={{
            color: '#f4c430',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Create an account →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default Login