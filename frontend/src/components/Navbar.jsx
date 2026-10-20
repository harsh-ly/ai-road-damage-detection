import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const mobileRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setShowDropdown(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
    navigate('/')
  }

  // Build links based on auth state and role
  const isAdmin = user?.role === 'admin'

  const links = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/report', label: 'Report', icon: '📋' },
    ...(isAuthenticated ? [{ path: '/my-reports', label: 'My Impact', icon: '⭐' }] : []),
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin Panel', icon: '🛠️' }] : []),
  ]

  return (
    <>
      <nav style={{
        background: scrolled
          ? 'rgba(15,16,20,0.85)'
          : 'rgba(26,26,31,0.95)',
        borderBottom: '1px solid rgba(244,196,48,0.15)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}>
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
              clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
              boxShadow: '0 0 15px rgba(244,196,48,0.4)',
            }}
          />
          <span style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: '17px',
            letterSpacing: '0.02em',
            color: '#ece9e2',
            textTransform: 'uppercase',
          }}>
            Pothole<span style={{ color: '#f4c430' }}>AI</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="desktop-nav" style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          {links.map((link) => {
            const active = location.pathname === link.path
            const isMyImpact = link.path === '/my-reports'
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  position: 'relative',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: active ? '#f4c430' : '#9b9a93',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {/* Special glow for My Impact */}
                  {isMyImpact && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ fontSize: '12px' }}
                    >
                      ⭐
                    </motion.span>
                  )}
                  {link.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="activeNav"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    style={{
                      position: 'absolute',
                      bottom: '-21px',
                      left: '16px',
                      right: '16px',
                      height: '2px',
                      background: 'linear-gradient(90deg, #f4c430, #ff6b35)',
                      boxShadow: '0 0 10px rgba(244,196,48,0.6)',
                    }}
                  />
                )}
              </Link>
            )
          })}

          {/* Live Status Badge */}
          <div style={{
            marginLeft: '16px',
            paddingLeft: '16px',
            borderLeft: '1px solid rgba(244,196,48,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#5fb87a',
                boxShadow: '0 0 8px #5fb87a',
              }}
            />
            <span style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '10px',
              color: '#5fb87a',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              Live
            </span>
          </div>

          {/* ============================================ */}
          {/* 🔐 AUTH SECTION (Login/Signup or Profile)   */}
          {/* ============================================ */}
          <div style={{
            marginLeft: '20px',
            paddingLeft: '20px',
            borderLeft: '1px solid rgba(244,196,48,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            {user ? (
              // ===== USER IS LOGGED IN =====
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(244,196,48,0.08)',
                    border: '1px solid rgba(244,196,48,0.3)',
                    padding: '6px 14px 6px 6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Avatar (First letter) */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a1f',
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 700,
                    fontSize: '12px',
                    boxShadow: '0 0 10px rgba(244,196,48,0.3)',
                  }}>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '12px',
                    color: '#ece9e2',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {user.name?.split(' ')[0] || 'User'}
                  </span>
                  <motion.span
                    animate={{ rotate: showDropdown ? 180 : 0 }}
                    style={{ color: '#9b9a93', fontSize: '10px' }}
                  >
                    ▾
                  </motion.span>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: 0,
                        width: '240px',
                        background: 'linear-gradient(135deg, rgba(28,29,34,0.98), rgba(20,21,26,0.98))',
                        border: '1px solid rgba(244,196,48,0.2)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top accent */}
                      <div style={{
                        height: '2px',
                        background: 'linear-gradient(90deg, #f4c430, #ff6b35, transparent)',
                      }} />

                      {/* User Info */}
                      <div style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(244,196,48,0.1)',
                      }}>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '14px',
                          color: '#ece9e2',
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}>
                          {user.name || 'User'}
                        </div>
                        <div style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '11px',
                          color: '#9b9a93',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '8px',
                        }}>
                          {user.email}
                        </div>
                        {/* Role Badge — admin gets gold, citizen gets green */}
                        {isAdmin ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(244,196,48,0.15)',
                            border: '1px solid #f4c430',
                            color: '#f4c430',
                            padding: '2px 8px',
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}>
                            🛠️ Admin
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(95,184,122,0.15)',
                            border: '1px solid #5fb87a',
                            color: '#5fb87a',
                            padding: '2px 8px',
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}>
                            ✓ Verified Citizen
                          </div>
                        )}
                      </div>

                      {/* Admin Panel link — only for admins */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            color: '#f4c430',
                            textDecoration: 'none',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '13px',
                            transition: 'background 0.2s',
                            borderBottom: '1px solid rgba(244,196,48,0.1)',
                            background: 'rgba(244,196,48,0.05)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,196,48,0.12)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244,196,48,0.05)'}
                        >
                          <span style={{ fontSize: '14px' }}>🛠️</span>
                          <span style={{ fontWeight: 700 }}>Admin Panel</span>
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: '9px',
                            color: '#f4c430',
                            background: 'rgba(244,196,48,0.2)',
                            padding: '2px 6px',
                            fontFamily: "'Oswald', sans-serif",
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                          }}>
                            ADMIN
                          </span>
                        </Link>
                      )}

                      {/* My Impact Link */}
                      <Link
                        to="/my-reports"
                        onClick={() => setShowDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          color: '#c8c6bd',
                          textDecoration: 'none',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '13px',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid rgba(244,196,48,0.1)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,196,48,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '14px' }}>⭐</span>
                        <span>My Impact</span>
                      </Link>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          background: 'transparent',
                          border: 'none',
                          color: '#e8453c',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '13px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(232,69,60,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '14px' }}>🚪</span>
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // ===== USER IS NOT LOGGED IN =====
              <>
                <Link to="/login" style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#9b9a93',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  border: '1px solid rgba(244,196,48,0.3)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#f4c430'
                    e.target.style.color = '#f4c430'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(244,196,48,0.3)'
                    e.target.style.color = '#9b9a93'
                  }}
                >
                  Sign in
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#1a1a1f',
                    textDecoration: 'none',
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                    display: 'inline-block',
                    boxShadow: '0 4px 15px rgba(244,196,48,0.3)',
                  }}>
                    Sign up
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'transparent',
            border: '1px solid rgba(244,196,48,0.3)',
            color: '#f4c430',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '18px',
          }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              position: 'fixed',
              top: '64px',
              right: 0,
              bottom: 0,
              width: '280px',
              background: 'linear-gradient(135deg, rgba(28,29,34,0.98), rgba(20,21,26,0.98))',
              borderLeft: '1px solid rgba(244,196,48,0.2)',
              backdropFilter: 'blur(20px)',
              zIndex: 999,
              padding: '24px 20px',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Mobile User Info (if logged in) */}
            {user && (
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(244,196,48,0.15), rgba(255,107,53,0.08))',
                border: '1px solid rgba(244,196,48,0.3)',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a1f',
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 700,
                    boxShadow: '0 0 15px rgba(244,196,48,0.3)',
                  }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '13px',
                      color: '#ece9e2',
                      fontWeight: 600,
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px',
                      color: '#9b9a93',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>
                {/* Role Badge (Mobile) */}
                {isAdmin ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(244,196,48,0.15)',
                    border: '1px solid #f4c430',
                    color: '#f4c430',
                    padding: '3px 10px',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}>
                    🛠️ Admin
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(95,184,122,0.15)',
                    border: '1px solid #5fb87a',
                    color: '#5fb87a',
                    padding: '3px 10px',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}>
                    ✓ Verified Citizen
                  </div>
                )}
              </div>
            )}

            {/* Nav Links */}
            {links.map((link, i) => {
              const active = location.pathname === link.path
              const isMyImpact = link.path === '/my-reports'
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={link.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      textDecoration: 'none',
                      background: active ? 'rgba(244,196,48,0.1)' : 'transparent',
                      borderLeft: active ? '2px solid #f4c430' : '2px solid transparent',
                      marginBottom: '6px',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{link.icon}</span>
                    <span style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: active ? '#f4c430' : '#c8c6bd',
                    }}>
                      {link.label}
                    </span>
                    {/* NEW badge for My Impact (Mobile) */}
                    {isMyImpact && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '9px',
                        color: '#f4c430',
                        background: 'rgba(244,196,48,0.15)',
                        padding: '2px 6px',
                        fontFamily: "'Oswald', sans-serif",
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                      }}>
                        NEW
                      </span>
                    )}
                  </Link>
                </motion.div>
              )
            })}

            {/* Mobile Auth Section */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(244,196,48,0.15)' }}>
              {user ? (
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    background: 'rgba(232,69,60,0.1)',
                    border: '1px solid #e8453c',
                    color: '#e8453c',
                    padding: '12px',
                    cursor: 'pointer',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  🚪 Sign out
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to="/login" style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#9b9a93',
                    textDecoration: 'none',
                    padding: '12px',
                    border: '1px solid rgba(244,196,48,0.3)',
                    textAlign: 'center',
                  }}>
                    Sign in
                  </Link>
                  <Link to="/signup" style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#1a1a1f',
                    textDecoration: 'none',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                    textAlign: 'center',
                    clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                  }}>
                    Sign up →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 968px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  )
}

export default Navbar