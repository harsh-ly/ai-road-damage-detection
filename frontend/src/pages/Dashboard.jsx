import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'

function Dashboard() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 })
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('http://127.0.0.1:8000/dashboard/reports'),
      axios.get('http://127.0.0.1:8000/stats'),
    ]).then(([r1, r2]) => {
      setReports(r1.data)
      setStats(r2.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const filtered = reports.filter(r => {
    const statusMatch = filter === 'all' || r.status === filter
    const searchMatch = !search ||
      r.tracking_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.location_address?.toLowerCase().includes(search.toLowerCase())
    return statusMatch && searchMatch
  })

  const pieData = [
    { name: 'Pending', value: stats.pending, color: '#ff6b35' },
    { name: 'Resolved', value: stats.resolved, color: '#5fb87a' },
    { name: 'In Review', value: Math.max(stats.total - stats.pending - stats.resolved, 0), color: '#f4c430' },
  ]

  const severityData = [
    { range: 'LOW', count: reports.filter(r => r.severity <= 3).length, color: '#5fb87a' },
    { range: 'MED', count: reports.filter(r => r.severity >= 4 && r.severity <= 6).length, color: '#f4c430' },
    { range: 'HIGH', count: reports.filter(r => r.severity >= 7).length, color: '#e8453c' },
  ]

  // Mock trend data (last 7 days)
  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const day = date.toLocaleDateString('en', { weekday: 'short' })
    const dayReports = reports.filter(r => {
      const rDate = new Date(r.created_at)
      return rDate.toDateString() === date.toDateString()
    })
    return {
      day,
      reports: dayReports.length,
      resolved: dayReports.filter(r => r.status === 'resolved').length,
    }
  })

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  const Counter = ({ value }) => {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
      const duration = 1200
      const start = Date.now()
      const animate = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.floor(value * eased))
        if (progress < 1) requestAnimationFrame(animate)
      }
      animate()
    }, [value])
    return <>{display}</>
  }

  return (
    <div style={{
      minHeight: '100vh', padding: '60px 20px 80px',
      background: '#0f1014', position: 'relative', overflow: 'hidden',
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
        background: 'radial-gradient(circle, rgba(244,196,48,0.06), transparent 70%)',
        pointerEvents: 'none', zIndex: 1, filter: 'blur(20px)',
      }} />

      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', width: '3px', height: '3px',
            background: i % 3 === 0 ? '#f4c430' : i % 3 === 1 ? '#ff6b35' : '#5fb87a',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            boxShadow: `0 0 10px currentColor`,
            zIndex: 1,
          }}
          animate={{ y: [0, -80, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '40px' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}
          >
            <div style={{ width: '32px', height: '2px', background: '#f4c430' }} />
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b6a64',
            }}>
              Municipal Command Center
            </span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                marginLeft: 'auto',
                fontFamily: "'Oswald', sans-serif", fontSize: '11px',
                color: '#5fb87a', letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5fb87a', boxShadow: '0 0 8px #5fb87a' }} />
              LIVE
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700,
              fontSize: 'clamp(34px, 5vw, 52px)',
              color: '#ece9e2', textTransform: 'uppercase',
              margin: 0, lineHeight: 1.05,
            }}
          >
            City <span style={{
              background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>dashboard</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontFamily: "'Inter', sans-serif", color: '#9b9a93', fontSize: '15px', marginTop: '12px' }}
          >
            Real-time overview of all pothole reports across the JIIT Noida municipal zone.
          </motion.p>
        </div>

        {/* STATS GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px', marginBottom: '30px',
        }}>
          {[
            { label: 'Total Reports', value: stats.total, color: '#f4c430', icon: '📋', sub: 'All time' },
            { label: 'Resolved', value: stats.resolved, color: '#5fb87a', icon: '✓', sub: 'Completed' },
            { label: 'Pending', value: stats.pending, color: '#ff6b35', icon: '⏳', sub: 'Awaiting action' },
            { label: 'Resolution Rate', value: `${resolutionRate}%`, color: '#7b9eff', icon: '📊', sub: 'Success ratio' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              style={{
                padding: '24px 26px',
                background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
                border: `1px solid ${s.color}30`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, ${s.color}, transparent)`,
              }} />
              <div style={{
                position: 'absolute', top: '50%', right: '20px',
                transform: 'translateY(-50%)',
                fontSize: '52px', opacity: 0.1,
              }}>{s.icon}</div>

              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '42px', fontWeight: 700,
                color: '#ece9e2', lineHeight: 1,
                textShadow: `0 0 20px ${s.color}40`,
              }}>
                {typeof s.value === 'number' ? <Counter value={s.value} /> : s.value}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: s.color,
                marginTop: '10px', fontWeight: 600,
              }}>
                ● {s.label}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px', color: '#6b6a64',
                marginTop: '4px', letterSpacing: '0.08em',
              }}>
                {s.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CHARTS ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px', marginBottom: '30px',
        }}>
          {/* Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
              border: '1px solid rgba(244,196,48,0.15)',
              padding: '24px',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, #f4c430, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '24px', height: '2px', background: '#f4c430' }} />
              <h3 style={{
                fontFamily: "'Oswald', sans-serif", color: '#ece9e2',
                margin: 0, fontSize: '14px', letterSpacing: '0.14em',
                textTransform: 'uppercase', fontWeight: 600,
              }}>
                7-Day Activity Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,196,48,0.08)" />
                <XAxis dataKey="day" stroke="#6b6a64" tick={{ fontSize: 11, fontFamily: 'Oswald' }} />
                <YAxis stroke="#6b6a64" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{
                  background: '#1a1a1f',
                  border: '1px solid rgba(244,196,48,0.3)',
                  fontFamily: 'Inter',
                }} />
                <Legend wrapperStyle={{ fontFamily: 'Oswald', fontSize: '11px', letterSpacing: '0.1em' }} />
                <Line type="monotone" dataKey="reports" stroke="#f4c430" strokeWidth={2} dot={{ fill: '#f4c430' }} />
                <Line type="monotone" dataKey="resolved" stroke="#5fb87a" strokeWidth={2} dot={{ fill: '#5fb87a' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Severity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
              border: '1px solid rgba(232,69,60,0.15)',
              padding: '24px',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, #e8453c, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '24px', height: '2px', background: '#e8453c' }} />
              <h3 style={{
                fontFamily: "'Oswald', sans-serif", color: '#ece9e2',
                margin: 0, fontSize: '14px', letterSpacing: '0.14em',
                textTransform: 'uppercase', fontWeight: 600,
              }}>
                Severity Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,196,48,0.08)" />
                <XAxis dataKey="range" stroke="#6b6a64" tick={{ fontSize: 11, fontFamily: 'Oswald' }} />
                <YAxis stroke="#6b6a64" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{
                  background: '#1a1a1f',
                  border: '1px solid rgba(244,196,48,0.3)',
                  fontFamily: 'Inter',
                }} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Status Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
              border: '1px solid rgba(255,107,53,0.15)',
              padding: '24px',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, #ff6b35, transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '24px', height: '2px', background: '#ff6b35' }} />
              <h3 style={{
                fontFamily: "'Oswald', sans-serif", color: '#ece9e2',
                margin: 0, fontSize: '14px', letterSpacing: '0.14em',
                textTransform: 'uppercase', fontWeight: 600,
              }}>
                Status Breakdown
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} innerRadius={45}
                  dataKey="value" paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                  style={{ fontFamily: 'Oswald', fontSize: '11px' }}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{
                  background: '#1a1a1f',
                  border: '1px solid rgba(244,196,48,0.3)',
                  fontFamily: 'Inter',
                }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* FILTERS + SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'in_review', 'resolved'].map(f => (
              <motion.button key={f}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f
                    ? 'linear-gradient(135deg, #f4c430, #ffd966)'
                    : 'rgba(28,29,34,0.6)',
                  border: filter === f ? 'none' : '1px solid rgba(244,196,48,0.2)',
                  color: filter === f ? '#1a1a1f' : '#9b9a93',
                  padding: '10px 22px',
                  cursor: 'pointer',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                  boxShadow: filter === f ? '0 4px 20px rgba(244,196,48,0.3)' : 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {f.replace('_', ' ')}
              </motion.button>
            ))}
          </div>

          <input
            type="text"
            placeholder="🔍 Search by ID or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '240px',
              background: 'rgba(23,24,25,0.8)',
              border: '1px solid rgba(244,196,48,0.2)',
              padding: '11px 16px',
              color: '#ece9e2',
              fontFamily: "'Inter', sans-serif", fontSize: '13px',
              outline: 'none',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#f4c430'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(244,196,48,0.2)'}
          />

          <div style={{
            fontFamily: "'Oswald', sans-serif", fontSize: '11px',
            color: '#6b6a64', letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 600,
            padding: '8px 14px',
            background: 'rgba(244,196,48,0.05)',
            border: '1px solid rgba(244,196,48,0.15)',
          }}>
            {filtered.length} found
          </div>
        </motion.div>

        {/* REPORTS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{
              textAlign: 'center', padding: '60px',
              fontFamily: "'Oswald', sans-serif", color: '#f4c430',
              letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '13px',
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '40px', height: '40px',
                  border: '3px solid rgba(244,196,48,0.2)',
                  borderTopColor: '#f4c430',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                }}
              />
              Loading cases...
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(28,29,34,0.4)',
                border: '1px dashed rgba(244,196,48,0.2)',
                fontFamily: "'Inter', sans-serif", color: '#6b6a64',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: '0.15em', textTransform: 'uppercase',
                fontSize: '13px', color: '#9b9a93',
              }}>
                No reports match your filter
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filtered.map((report, i) => {
                const sevColor = report.severity >= 7 ? '#e8453c' : report.severity >= 4 ? '#ff6b35' : '#5fb87a'
                const statusInfo = {
                  resolved: { color: '#5fb87a', label: 'Resolved' },
                  in_review: { color: '#f4c430', label: 'In Review' },
                  pending: { color: '#ff6b35', label: 'Pending' },
                }[report.status] || { color: '#9b9a93', label: report.status }

                return (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ x: 4 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(28,29,34,0.7), rgba(20,21,26,0.7))',
                      border: '1px solid rgba(244,196,48,0.1)',
                      borderLeft: `3px solid ${sevColor}`,
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap',
                      backdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{
                        fontFamily: "'Oswald', sans-serif",
                        color: '#f4c430', fontWeight: 700,
                        fontSize: '14px', marginBottom: '6px',
                        letterSpacing: '0.08em',
                      }}>
                        ◉ {report.tracking_id}
                      </div>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        color: '#c8c6bd', fontSize: '13px',
                        marginBottom: '4px',
                      }}>
                        📍 {report.location_address}
                      </div>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        color: '#6b6a64', fontSize: '11px',
                        display: 'flex', gap: '14px', flexWrap: 'wrap',
                        letterSpacing: '0.04em',
                      }}>
                        <span>🕳 {report.pothole_count} potholes</span>
                        <span>•</span>
                        <span>🕐 {new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '28px', fontWeight: 700,
                          color: sevColor, lineHeight: 1,
                          textShadow: `0 0 15px ${sevColor}40`,
                        }}>
                          {report.severity}/10
                        </div>
                        <div style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '10px', color: '#6b6a64',
                          marginTop: '4px', letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}>
                          Severity
                        </div>
                      </div>

                      <div style={{
                        background: `${statusInfo.color}15`,
                        border: `1px solid ${statusInfo.color}`,
                        color: statusInfo.color,
                        padding: '8px 16px',
                        fontSize: '11px',
                        fontFamily: "'Oswald', sans-serif",
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}>
                        {statusInfo.label}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard