import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function MyReports() {
  const navigate = useNavigate()
  const { user, token, isAuthenticated, loading: authLoading } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedTab, setSelectedTab] = useState('all')

  useEffect(() => {
    // Wait for auth to finish initializing before checking
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchReports()
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const fetchReports = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/my-reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReports(res.data)
    } catch (err) {
      console.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user) return null

  // Calculate stats
  const totalReports = reports.length
  const resolved = reports.filter(r => r.status === 'resolved').length
  const pending = reports.filter(r => r.status === 'pending').length
  const inReview = reports.filter(r => r.status === 'in_review').length
  const totalPotholes = reports.reduce((sum, r) => sum + (r.pothole_count || 0), 0)
  const avgSeverity = reports.length > 0 
    ? (reports.reduce((sum, r) => sum + (r.severity || 0), 0) / reports.length).toFixed(1)
    : 0

  // XP and Level calculation
  const xp = totalReports * 50 + resolved * 100 + totalPotholes * 10
  const level = Math.floor(xp / 500) + 1
  const nextLevelXP = level * 500
  const progress = (xp % 500) / 500 * 100

  // Badges
  const badges = [
    { name: 'First Report', earned: totalReports >= 1, icon: '🎯' },
    { name: 'Report Hunter', earned: totalReports >= 5, icon: '🏹' },
    { name: 'Civic Hero', earned: totalReports >= 10, icon: '🦸' },
    { name: 'Resolver', earned: resolved >= 1, icon: '✅' },
    { name: 'Guardian', earned: totalReports >= 20, icon: '🛡️' },
    { name: 'Legend', earned: xp >= 1000, icon: '⚡' },
  ]

  const earnedBadges = badges.filter(b => b.earned)

  // Filter reports
  const filteredReports = selectedTab === 'all' 
    ? reports 
    : reports.filter(r => r.status === selectedTab)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1014',
      padding: '40px 20px 100px',
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

      {/* Mouse glow */}
      <div style={{
        position: 'fixed',
        left: mousePos.x - 250, top: mousePos.y - 250,
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,196,48,0.08), transparent 70%)',
        pointerEvents: 'none', zIndex: 1, filter: 'blur(20px)',
      }} />

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute',
            width: '3px', height: '3px',
            background: i % 2 === 0 ? '#f4c430' : '#ff6b35',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            boxShadow: '0 0 10px currentColor',
            zIndex: 1,
          }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '12px',
          }}>
            <div style={{ width: '32px', height: '2px', background: '#f4c430' }} />
            <span style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#6b6a64',
            }}>
              Personal Dashboard
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 48px)',
            color: '#ece9e2',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            My <span style={{
              background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Impact</span>
          </h1>
        </motion.div>

        {/* Profile Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(244,196,48,0.1), rgba(255,107,53,0.05))',
            border: '1px solid rgba(244,196,48,0.3)',
            padding: '32px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Animated background glow */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '-50%', right: '-20%',
              width: '400px', height: '400px',
              background: 'radial-gradient(circle, rgba(244,196,48,0.3), transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}>
              {/* Big Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1a1a1f',
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  fontSize: '42px',
                  boxShadow: '0 0 40px rgba(244,196,48,0.5)',
                  border: '3px solid rgba(244,196,48,0.5)',
                }}
              >
                {user.name?.[0]?.toUpperCase() || 'U'}
              </motion.div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h2 style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#ece9e2',
                  margin: 0,
                  textTransform: 'uppercase',
                }}>
                  {user.name}
                </h2>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  color: '#9b9a93',
                  fontSize: '14px',
                  marginTop: '4px',
                }}>
                  {user.email}
                </div>
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: 'rgba(95,184,122,0.15)',
                      border: '1px solid #5fb87a',
                      color: '#5fb87a',
                      padding: '4px 12px',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}>
                    ✓ Verified Citizen
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: 'rgba(244,196,48,0.15)',
                      border: '1px solid #f4c430',
                      color: '#f4c430',
                      padding: '4px 12px',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}>
                    ⭐ Level {level}
                  </motion.div>
                </div>
              </div>

              {/* XP Display */}
              <div style={{
                textAlign: 'right',
                minWidth: '150px',
              }}>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#f4c430',
                  lineHeight: 1,
                  textShadow: '0 0 30px rgba(244,196,48,0.5)',
                }}>
                  {xp}
                </div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '11px',
                  color: '#9b9a93',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                }}>
                  Total XP Points
                </div>
              </div>
            </div>

            {/* Level Progress Bar */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
              }}>
                <span style={{ color: '#9b9a93' }}>Level {level} Progress</span>
                <span style={{ color: '#f4c430', fontWeight: 600 }}>
                  {xp % 500} / 500 XP
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(15,16,20,0.6)',
                border: '1px solid rgba(244,196,48,0.2)',
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #f4c430, #ff6b35)',
                    boxShadow: '0 0 10px rgba(244,196,48,0.5)',
                  }}
                />
              </div>
              <div style={{
                marginTop: '6px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: '#6b6a64',
                textAlign: 'right',
              }}>
                {500 - (xp % 500)} XP to Level {level + 1}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Total Reports', value: totalReports, color: '#f4c430', icon: '📋', sub: 'All time' },
            { label: 'Resolved', value: resolved, color: '#5fb87a', icon: '✅', sub: 'Fixed by authority' },
            { label: 'Pending', value: pending, color: '#ff6b35', icon: '⏳', sub: 'Awaiting action' },
            { label: 'Potholes Reported', value: totalPotholes, color: '#7b9eff', icon: '🕳️', sub: 'Total detected' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
                border: `1px solid ${stat.color}30`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, ${stat.color}, transparent)`,
              }} />
              <div style={{
                position: 'absolute',
                top: '50%', right: '20px',
                transform: 'translateY(-50%)',
                fontSize: '52px',
                opacity: 0.1,
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '42px',
                fontWeight: 700,
                color: '#ece9e2',
                lineHeight: 1,
                textShadow: `0 0 20px ${stat.color}40`,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: stat.color,
                marginTop: '10px',
                fontWeight: 600,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px',
                color: '#6b6a64',
                marginTop: '4px',
              }}>
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            border: '1px solid rgba(244,196,48,0.15)',
            padding: '28px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #f4c430, transparent)',
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '18px',
                color: '#ece9e2',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Achievements
              </h2>
            </div>
            <div style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '12px',
              color: '#f4c430',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              {earnedBadges.length} / {badges.length} Unlocked
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {badges.map((badge, i) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                whileHover={badge.earned ? { scale: 1.05, y: -4 } : {}}
                style={{
                  padding: '16px',
                  background: badge.earned 
                    ? 'linear-gradient(135deg, rgba(244,196,48,0.15), rgba(255,107,53,0.1))'
                    : 'rgba(15,16,20,0.4)',
                  border: badge.earned 
                    ? '1px solid #f4c430'
                    : '1px dashed rgba(155,154,147,0.2)',
                  textAlign: 'center',
                  opacity: badge.earned ? 1 : 0.4,
                  filter: badge.earned ? 'none' : 'grayscale(1)',
                  transition: 'all 0.3s',
                  cursor: badge.earned ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {badge.earned && (
                  <motion.div
                    animate={{
                      opacity: [0, 0.5, 0],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle, rgba(244,196,48,0.3), transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {badge.earned ? badge.icon : '🔒'}
                </div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: badge.earned ? '#f4c430' : '#6b6a64',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {badge.name}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            border: '1px solid rgba(244,196,48,0.15)',
            padding: '28px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #ff6b35, transparent)',
          }} />

          {/* Header + Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '18px',
                color: '#ece9e2',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Reports Filed
              </h2>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All', count: totalReports },
                { key: 'pending', label: 'Pending', count: pending },
                { key: 'in_review', label: 'In Review', count: inReview },
                { key: 'resolved', label: 'Resolved', count: resolved },
              ].map(tab => (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedTab(tab.key)}
                  style={{
                    background: selectedTab === tab.key
                      ? 'linear-gradient(135deg, #f4c430, #ffd966)'
                      : 'rgba(28,29,34,0.6)',
                    color: selectedTab === tab.key ? '#1a1a1f' : '#9b9a93',
                    border: selectedTab === tab.key ? 'none' : '1px solid rgba(244,196,48,0.2)',
                    padding: '8px 16px',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                  }}
                >
                  {tab.label} ({tab.count})
                </motion.button>
              ))}
            </div>
          </div>

          {/* Reports */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#f4c430',
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: '0.2em',
            }}>
              LOADING REPORTS...
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(15,16,20,0.4)',
              border: '1px dashed rgba(244,196,48,0.2)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '14px',
                color: '#9b9a93',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: '16px',
              }}>
                No reports yet
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/report')}
                style={{
                  background: 'linear-gradient(135deg, #ff6b35, #ff8555)',
                  color: '#1a1a1f',
                  border: 'none',
                  padding: '12px 28px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                  boxShadow: '0 10px 30px rgba(255,107,53,0.3)',
                }}
              >
                File Your First Report →
              </motion.button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {filteredReports.slice(0, 10).map((report, i) => {
                const sevColor = report.severity >= 7 ? '#e8453c' : report.severity >= 4 ? '#ff6b35' : '#5fb87a'
                const statusColors = {
                  resolved: '#5fb87a',
                  pending: '#ff6b35',
                  in_review: '#f4c430',
                }
                
                return (
                  <motion.div
                    key={report.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/results/${report.tracking_id}`)}
                    style={{
                      background: 'linear-gradient(135deg, rgba(15,16,20,0.6), rgba(20,21,26,0.6))',
                      border: '1px solid rgba(244,196,48,0.1)',
                      borderLeft: `3px solid ${sevColor}`,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{
                        fontFamily: "'Oswald', sans-serif",
                        color: '#f4c430',
                        fontWeight: 700,
                        fontSize: '13px',
                        marginBottom: '4px',
                        letterSpacing: '0.06em',
                      }}>
                        ◉ {report.tracking_id}
                      </div>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        color: '#c8c6bd',
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}>
                        📍 {report.location_address}
                      </div>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        color: '#6b6a64',
                        fontSize: '11px',
                      }}>
                        🕳️ {report.pothole_count} potholes · 🕐 {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '24px',
                          fontWeight: 700,
                          color: sevColor,
                        }}>
                          {report.severity}/10
                        </div>
                        <div style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '9px',
                          color: '#6b6a64',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}>
                          Severity
                        </div>
                      </div>

                      <div style={{
                        background: `${statusColors[report.status]}15`,
                        border: `1px solid ${statusColors[report.status]}`,
                        color: statusColors[report.status],
                        padding: '6px 14px',
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}>
                        {report.status?.replace('_', ' ')}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/report')}
            style={{
              background: 'linear-gradient(135deg, #ff6b35, #ff8555)',
              color: '#1a1a1f',
              border: 'none',
              padding: '18px 40px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
              boxShadow: '0 10px 30px rgba(255,107,53,0.3)',
            }}
          >
            📸 Report New Damage →
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default MyReports