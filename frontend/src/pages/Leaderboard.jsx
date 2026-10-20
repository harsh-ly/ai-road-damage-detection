import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

function Leaderboard() {
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [currentUser, setCurrentUser] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setCurrentUser(JSON.parse(savedUser))
    fetchLeaderboard()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/leaderboard?limit=20`)
      setLeaders(res.data)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLeaderboard()
  }

  const rankStyle = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(244,196,48,0.1))', border: '#ffd700', color: '#ffd700', label: '🥇' }
    if (rank === 2) return { bg: 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(180,180,180,0.1))', border: '#c0c0c0', color: '#c0c0c0', label: '🥈' }
    if (rank === 3) return { bg: 'linear-gradient(135deg, rgba(205,127,50,0.2), rgba(180,110,40,0.1))', border: '#cd7f32', color: '#cd7f32', label: '🥉' }
    return { bg: 'rgba(28,29,34,0.7)', border: 'rgba(244,196,48,0.1)', color: '#9b9a93', label: `#${rank}` }
  }

  const isCurrentUser = (leader) => {
    return currentUser && leader.name === currentUser.name
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1014',
      padding: '60px 20px 100px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid background */}
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

      {/* Trophy glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{
          position: 'absolute', top: '0%', left: '50%',
          transform: 'translateX(-50%)',
          width: '900px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(244,196,48,0.12), transparent 60%)',
          pointerEvents: 'none', filter: 'blur(60px)',
          zIndex: 1,
        }}
      />

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', width: '3px', height: '3px',
            background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#f4c430' : '#ff6b35',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            boxShadow: '0 0 10px currentColor', zIndex: 1,
          }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 2 }}
      >
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: '60px', marginBottom: '16px' }}
          >
            🏆
          </motion.div>

          <div style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '12px', fontWeight: 600,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#f4c430', marginBottom: '12px',
          }}>
            ◉ Civic Champions · JIIT Noida
          </div>

          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(40px, 6vw, 64px)',
            color: '#ece9e2',
            textTransform: 'uppercase',
            margin: 0, lineHeight: 1,
          }}>
            Leader<span style={{
              background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>board</span>
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#9b9a93', fontSize: '15px',
            marginTop: '16px', maxWidth: '500px',
            margin: '16px auto 0',
          }}>
            Top citizens ranked by civic score. Every pothole reported earns XP and helps make our city safer.
          </p>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRefresh}
            style={{
              marginTop: '24px',
              background: 'rgba(244,196,48,0.1)',
              border: '1px solid rgba(244,196,48,0.3)',
              color: '#f4c430',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '10px 24px',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            <motion.span
              animate={refreshing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}
            >
              ↻
            </motion.span>
            Refresh Rankings
          </motion.button>
        </div>

        {/* HOW TO EARN XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          {[
            { icon: '📋', label: 'File a Report', xp: '+50 XP', color: '#f4c430' },
            { icon: '🕳️', label: 'Per Pothole', xp: '+5 XP', color: '#7b9eff' },
            { icon: '✅', label: 'Report Resolved', xp: '+100 XP', color: '#5fb87a' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{
                background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
                border: `1px solid ${item.color}25`,
                padding: '18px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${item.color}, transparent)` }} />
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#9b9a93', marginBottom: '6px' }}>{item.label}</div>
              <div style={{
                fontFamily: "'Oswald', sans-serif", fontSize: '20px',
                fontWeight: 700, color: item.color,
                textShadow: `0 0 15px ${item.color}50`,
              }}>{item.xp}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* LEADERBOARD LIST */}
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: '#f4c430',
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '13px',
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '50px', height: '50px',
                border: '3px solid rgba(244,196,48,0.2)',
                borderTopColor: '#f4c430',
                borderRadius: '50%',
                margin: '0 auto 20px',
              }}
            />
            Loading rankings...
          </div>
        ) : leaders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'rgba(28,29,34,0.4)',
            border: '1px dashed rgba(244,196,48,0.2)',
          }}>
            <div style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.5 }}>🏙️</div>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '18px', color: '#9b9a93',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: '12px',
            }}>
              No Rankings Yet
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", color: '#6b6a64', fontSize: '14px' }}>
              Be the first to file a report and claim the top spot!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/report')}
              style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                border: 'none',
                color: '#1a1a1f',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '13px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '14px 32px',
                cursor: 'pointer',
                clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
              }}
            >
              File Your First Report →
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {leaders.map((leader, i) => {
                const rs = rankStyle(leader.rank)
                const isSelf = isCurrentUser(leader)

                return (
                  <motion.div
                    key={leader.id || i}
                    layout
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                    style={{
                      background: isSelf
                        ? 'linear-gradient(135deg, rgba(244,196,48,0.15), rgba(255,107,53,0.08))'
                        : rs.bg,
                      border: `1px solid ${isSelf ? '#f4c430' : rs.border}`,
                      borderLeft: leader.rank <= 3 ? `4px solid ${rs.border}` : `4px solid rgba(244,196,48,0.15)`,
                      padding: '20px 24px',
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      cursor: 'default',
                      boxShadow: isSelf ? `0 0 20px rgba(244,196,48,0.2)` : 'none',
                    }}
                  >
                    {isSelf && (
                      <div style={{
                        position: 'absolute', top: '10px', right: '16px',
                        background: 'rgba(244,196,48,0.15)',
                        border: '1px solid #f4c430',
                        color: '#f4c430',
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        padding: '3px 8px',
                      }}>
                        ✦ You
                      </div>
                    )}

                    {/* Top 3 glow */}
                    {leader.rank <= 3 && (
                      <motion.div
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        style={{
                          position: 'absolute', inset: 0,
                          background: `radial-gradient(circle at 50% 50%, ${rs.border}15, transparent 70%)`,
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap',
                    }}>
                      {/* Rank */}
                      <div style={{
                        fontFamily: leader.rank <= 3 ? 'serif' : "'Oswald', sans-serif",
                        fontSize: leader.rank <= 3 ? '36px' : '24px',
                        fontWeight: 700,
                        color: rs.color,
                        minWidth: '48px',
                        textAlign: 'center',
                        lineHeight: 1,
                        textShadow: leader.rank <= 3 ? `0 0 20px ${rs.color}` : 'none',
                      }}>
                        {rs.label}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: '48px', height: '48px',
                        borderRadius: '50%',
                        background: leader.rank <= 3
                          ? `linear-gradient(135deg, ${rs.color}, ${rs.color}80)`
                          : 'linear-gradient(135deg, rgba(244,196,48,0.3), rgba(255,107,53,0.2))',
                        border: `2px solid ${rs.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: '20px', fontWeight: 700,
                        color: leader.rank <= 3 ? '#1a1a1f' : '#f4c430',
                        flexShrink: 0,
                        boxShadow: leader.rank <= 3 ? `0 0 15px ${rs.color}50` : 'none',
                      }}>
                        {leader.name?.[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '18px', fontWeight: 700,
                          color: isSelf ? '#f4c430' : '#ece9e2',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: '4px',
                        }}>
                          {leader.name}
                        </div>
                        <div style={{
                          display: 'flex', gap: '12px', flexWrap: 'wrap',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '11px', color: '#9b9a93',
                        }}>
                          <span>📍 {leader.city}</span>
                          <span>·</span>
                          <span>📋 {leader.reports_count} reports</span>
                          <span>·</span>
                          <span style={{ color: '#5fb87a' }}>✅ {leader.resolved_count} resolved</span>
                        </div>
                        <div style={{
                          marginTop: '6px',
                          display: 'inline-block',
                          background: 'rgba(244,196,48,0.1)',
                          border: '1px solid rgba(244,196,48,0.25)',
                          color: '#f4c430',
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '10px', fontWeight: 700,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '2px 8px',
                        }}>
                          {leader.badge}
                        </div>
                      </div>

                      {/* Score */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '36px', fontWeight: 700,
                          color: rs.color, lineHeight: 1,
                          textShadow: leader.rank <= 3 ? `0 0 20px ${rs.color}` : 'none',
                        }}>
                          {leader.civic_score.toLocaleString()}
                        </div>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '10px', color: '#6b6a64',
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          marginTop: '4px',
                        }}>
                          Civic XP
                        </div>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '11px', color: '#9b9a93',
                          marginTop: '4px',
                        }}>
                          Level {leader.level}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* CTA */}
        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: '40px',
              textAlign: 'center',
              padding: '40px',
              background: 'linear-gradient(135deg, rgba(244,196,48,0.1), rgba(255,107,53,0.05))',
              border: '1px solid rgba(244,196,48,0.25)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #f4c430, #ff6b35, transparent)' }} />
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚀</div>
            <h3 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '24px', fontWeight: 700,
              color: '#ece9e2', textTransform: 'uppercase',
              margin: '0 0 12px',
            }}>
              Want to appear here?
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: '#9b9a93', fontSize: '14px',
              marginBottom: '24px',
            }}>
              Create a free citizen account, file pothole reports, and earn XP to climb the leaderboard!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                style={{
                  background: 'linear-gradient(135deg, #f4c430, #ffd966)',
                  border: 'none',
                  color: '#1a1a1f',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '14px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '14px 32px',
                  cursor: 'pointer',
                  clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                  boxShadow: '0 10px 30px rgba(244,196,48,0.3)',
                }}
              >
                Join Free →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(244,196,48,0.4)',
                  color: '#9b9a93',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '14px', fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '14px 32px',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Leaderboard
