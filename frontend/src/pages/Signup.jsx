import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import CaptchaField from '../components/CaptchaField'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://127.0.0.1:8000'

function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: 'Noida',
    role: 'citizen',
    admin_code: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captcha, setCaptcha] = useState({ question: '', isValid: false, value: '' })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const pwd = formData.password
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    setPasswordStrength(strength)
  }, [formData.password])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength < 3) {
      setError('Password too weak. Use uppercase, numbers, and symbols.')
      return
    }

    if (!captcha.isValid) {
      setError('Please solve the captcha correctly to create your account.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        city: formData.city,
        role: formData.role,
        admin_code: formData.role === 'admin' ? formData.admin_code : undefined,
      }

      const response = await axios.post(`${API_URL}/auth/register`, payload)
      const { token, user } = response.data

      // Update AuthContext state (also persists to localStorage + sets axios header)
      login(user, token)

      console.log(`✅ Account created for ${user.name} (${user.role})`)

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['#2c2c31', '#e8453c', '#ff6b35', '#f4c430', '#5fb87a']

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
        background: 'radial-gradient(circle, rgba(255,107,53,0.08), transparent 70%)',
        pointerEvents: 'none', zIndex: 1, filter: 'blur(20px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={{
          background: 'linear-gradient(135deg, rgba(28,29,34,0.95), rgba(20,21,26,0.95))',
          border: '1px solid rgba(244,196,48,0.2)',
          padding: '40px',
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 2,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #ff6b35, #f4c430, transparent)',
        }} />

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '11px',
            color: '#ff6b35',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '10px',
            fontWeight: 600,
          }}>
            ◉ Join the Movement
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '30px',
            fontWeight: 700,
            color: '#ece9e2',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Create your <span style={{
              background: 'linear-gradient(135deg, #ff6b35, #f4c430)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>account</span>
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#9b9a93',
            fontSize: '13px',
            marginTop: '8px',
          }}>
            Help make your city's roads safer
          </p>
        </div>

        {/* Role Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Account Type</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'citizen', label: '🏙️ Citizen', desc: 'Report potholes & earn XP' },
              { value: 'admin', label: '🛠️ Authority', desc: 'Manage & export reports' },
            ].map(opt => (
              <motion.button
                key={opt.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData({ ...formData, role: opt.value })}
                style={{
                  flex: 1,
                  background: formData.role === opt.value
                    ? opt.value === 'admin'
                      ? 'rgba(255,107,53,0.15)'
                      : 'rgba(244,196,48,0.15)'
                    : 'rgba(15,16,20,0.6)',
                  border: `1px solid ${formData.role === opt.value
                    ? opt.value === 'admin' ? '#ff6b35' : '#f4c430'
                    : 'rgba(244,196,48,0.2)'}`,
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.label.split(' ')[0]}</div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '11px', fontWeight: 700,
                  color: formData.role === opt.value
                    ? opt.value === 'admin' ? '#ff6b35' : '#f4c430'
                    : '#9b9a93',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginBottom: '4px',
                }}>
                  {opt.label.split(' ').slice(1).join(' ')}
                </div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px', color: '#6b6a64',
                }}>{opt.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              id="signup-name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              id="signup-email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>City</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={{ ...inputStyle, background: 'rgba(15,16,20,0.8)' }}
              >
                <option>Noida</option>
                <option>Delhi</option>
                <option>Greater Noida</option>
                <option>Ghaziabad</option>
                <option>Gurgaon</option>
              </select>
            </div>
          </div>

          {/* Admin Code field (only visible for admin role) */}
          <AnimatePresence>
            {formData.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: '16px', overflow: 'hidden' }}
              >
                <label style={{ ...labelStyle, color: '#ff6b35' }}>Admin Invite Code *</label>
                <input
                  type="text"
                  name="admin_code"
                  value={formData.admin_code}
                  onChange={handleChange}
                  placeholder="Enter admin invite code"
                  style={{
                    ...inputStyle,
                    border: '1px solid rgba(255,107,53,0.4)',
                  }}
                />
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px', color: '#6b6a64', marginTop: '4px',
                }}>
                  Contact your organization to get the admin invite code
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="signup-password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Min 8 characters"
                style={{ ...inputStyle, paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px', top: '50%',
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

            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1,
                      height: '3px',
                      background: i <= passwordStrength ? strengthColors[passwordStrength] : '#2c2c31',
                      transition: 'all 0.2s',
                    }} />
                  ))}
                </div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '10px',
                  color: strengthColors[passwordStrength],
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  Strength: {strengthLabels[passwordStrength] || 'Too short'}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px', marginTop: '16px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
              style={inputStyle}
            />
          </div>

          <CaptchaField onChange={setCaptcha} />

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '20px',
          }}>
            <input
              type="checkbox"
              required
              style={{ marginTop: '3px', accentColor: '#f4c430' }}
            />
            <label style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: '#9b9a93',
              lineHeight: 1.5,
            }}>
              I agree to PotholeAI's{' '}
              <a href="#" style={{ color: '#f4c430' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" style={{ color: '#f4c430' }}>Privacy Policy</a>
            </label>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(232,69,60,0.1)',
                  border: '1px solid #e8453c',
                  color: '#e8453c',
                  padding: '12px 16px',
                  marginBottom: '16px',
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
            id="signup-submit-btn"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? '#2c2c31'
                : formData.role === 'admin'
                  ? 'linear-gradient(135deg, #ff6b35, #ff8555)'
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
            {loading ? 'Creating account...' : `Create ${formData.role === 'admin' ? 'Admin' : 'Citizen'} Account →`}
          </motion.button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: '#9b9a93',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#f4c430',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Sign in →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: "'Oswald', sans-serif",
  fontSize: '10px',
  color: '#9b9a93',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: '6px',
  fontWeight: 600,
}

const inputStyle = {
  width: '100%',
  background: 'rgba(15,16,20,0.8)',
  border: '1px solid rgba(244,196,48,0.2)',
  padding: '12px 14px',
  color: '#ece9e2',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
}

export default Signup