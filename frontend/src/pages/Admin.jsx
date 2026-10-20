import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://127.0.0.1:8000'

function Admin() {
  const navigate = useNavigate()
  const { user, token, loading: authLoading, isAuthenticated } = useAuth()
  const [authChecked, setAuthChecked] = useState(false)
  const [reports, setReports] = useState([])
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportFilter, setExportFilter] = useState('all')

  // 🔐 Auth Guard — wait for auth context to initialize, then check admin role
  useEffect(() => {
    if (authLoading) return  // Wait for auth to finish loading

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user?.role !== 'admin') {
      navigate('/')
      return
    }

    // Set auth header from context token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setAuthChecked(true)
    fetchReports()
  }, [authLoading, isAuthenticated, user])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const fetchReports = () => {
    setLoading(true)
    const authToken = token || localStorage.getItem('token')
    axios.get(`${API_URL}/reports`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(res => { setReports(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const updateStatus = async (tracking_id, status) => {
    setUpdating(tracking_id)
    try {
      const authToken = token || localStorage.getItem('token')
      await axios.put(`${API_URL}/reports/${tracking_id}/status?status=${status}`, null, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      setMessage(`✓ Status updated to "${status}" for ${tracking_id}`)
      fetchReports()
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setMessage('✗ Unauthorized. Admin token may have expired. Please re-login.')
      } else {
        setMessage('✗ Update failed — check backend connection')
      }
    }
    setUpdating(null)
    setTimeout(() => setMessage(''), 3500)
  }

  // 📊 EXPORT CSV
  const exportCSV = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const url = `${API_URL}/export/csv${exportFilter !== 'all' ? `?status_filter=${exportFilter}` : ''}`
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      })

      const blob = new Blob([response.data], { type: 'text/csv' })
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const now = new Date()
      a.download = `pothole_reports_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
      setMessage(`✓ CSV exported successfully (${exportFilter === 'all' ? 'all reports' : exportFilter + ' reports'})`)
    } catch (err) {
      setMessage('✗ Export failed — ensure you are logged in as admin')
    }
    setExporting(false)
    setTimeout(() => setMessage(''), 3500)
  }

  const statusColor = (status) => {
    if (status === 'resolved') return { color: '#5fb87a', label: 'Resolved' }
    if (status === 'in_review') return { color: '#f4c430', label: 'In Review' }
    return { color: '#ff6b35', label: 'Pending' }
  }

  const filtered = reports.filter(r => {
    const statusMatch = statusFilter === 'all' || r.status === statusFilter
    const searchMatch = !search ||
      r.tracking_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.location_address?.toLowerCase().includes(search.toLowerCase())
    return statusMatch && searchMatch
  })

  const counts = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    in_review: reports.filter(r => r.status === 'in_review').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }

  // Don't render until auth is verified
  if (!authChecked) return null

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
            background: i % 2 === 0 ? '#f4c430' : '#ff6b35',
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
        style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 2 }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '36px' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}
          >
            <div style={{ width: '32px', height: '2px', background: '#ff6b35' }} />
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b6a64',
            }}>
              ◉ Restricted Access · Admin Console
            </span>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
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
              {user?.name} · Admin
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
            Admin <span style={{
              background: 'linear-gradient(135deg, #ff6b35, #f4c430)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>panel</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontFamily: "'Inter', sans-serif", color: '#9b9a93', fontSize: '15px', marginTop: '12px' }}
          >
            Review, manage, update statuses, and export complaint data.
          </motion.p>
        </div>

        {/* SUMMARY BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            border: '1px solid rgba(244,196,48,0.15)',
            padding: '20px 28px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '20px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #f4c430, #ff6b35, transparent)',
          }} />

          {[
            { label: 'Total', value: counts.total, color: '#ece9e2' },
            { label: 'Pending', value: counts.pending, color: '#ff6b35' },
            { label: 'In Review', value: counts.in_review, color: '#f4c430' },
            { label: 'Resolved', value: counts.resolved, color: '#5fb87a' },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: '11px',
                color: '#6b6a64', letterSpacing: '0.14em',
                textTransform: 'uppercase', marginBottom: '4px',
              }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '30px', fontWeight: 700,
                color: s.color, lineHeight: 1,
                textShadow: `0 0 15px ${s.color}30`,
              }}>
                {String(s.value).padStart(2, '0')}
              </div>
            </div>
          ))}
        </motion.div>

        {/* 📊 EXPORT PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            background: 'linear-gradient(135deg, rgba(28,29,34,0.9), rgba(20,21,26,0.9))',
            border: '1px solid rgba(95,184,122,0.25)',
            padding: '20px 24px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #5fb87a, transparent)',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <div style={{
                fontFamily: "'Oswald', sans-serif", fontWeight: 700,
                fontSize: '15px', color: '#ece9e2',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '18px' }}>📊</span>
                Export Reports
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: '12px',
                color: '#9b9a93', marginTop: '4px',
              }}>
                Download complaint data as CSV for analysis or repair scheduling
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter selector */}
              <select
                value={exportFilter}
                onChange={(e) => setExportFilter(e.target.value)}
                style={{
                  background: 'rgba(15,16,20,0.8)',
                  border: '1px solid rgba(244,196,48,0.3)',
                  color: '#ece9e2',
                  padding: '10px 14px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '12px',
                  letterSpacing: '0.08em',
                  outline: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <option value="all">All Reports</option>
                <option value="pending">Pending Only</option>
                <option value="in_review">In Review Only</option>
                <option value="resolved">Resolved Only</option>
              </select>

              {/* CSV Export Button */}
              <motion.button
                id="export-csv-btn"
                whileHover={{ scale: exporting ? 1 : 1.04 }}
                whileTap={{ scale: exporting ? 1 : 0.96 }}
                onClick={exportCSV}
                disabled={exporting}
                style={{
                  background: exporting
                    ? 'rgba(95,184,122,0.2)'
                    : 'linear-gradient(135deg, #5fb87a, #4a9d63)',
                  border: 'none',
                  color: '#1a1a1f',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '10px 22px',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                  boxShadow: exporting ? 'none' : '0 6px 20px rgba(95,184,122,0.4)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: exporting ? 0.7 : 1,
                }}
              >
                {exporting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #1a1a1f', borderTopColor: 'transparent', borderRadius: '50%' }}
                    />
                    Exporting...
                  </>
                ) : (
                  <>⬇️ Export CSV</>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* MESSAGE TOAST */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: message.includes('✓')
                  ? 'rgba(95,184,122,0.1)'
                  : 'rgba(232,69,60,0.1)',
                border: `1px solid ${message.includes('✓') ? '#5fb87a' : '#e8453c'}`,
                padding: '14px 18px',
                color: message.includes('✓') ? '#5fb87a' : '#e8453c',
                marginBottom: '16px',
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                backdropFilter: 'blur(10px)',
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FILTERS + SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                onClick={() => setStatusFilter(f)}
                style={{
                  background: statusFilter === f
                    ? 'linear-gradient(135deg, #ff6b35, #ff8555)'
                    : 'rgba(28,29,34,0.6)',
                  border: statusFilter === f ? 'none' : '1px solid rgba(244,196,48,0.2)',
                  color: statusFilter === f ? '#1a1a1f' : '#9b9a93',
                  padding: '10px 22px',
                  cursor: 'pointer',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: statusFilter === f ? '0 4px 20px rgba(255,107,53,0.3)' : 'none',
                }}
              >
                {f.replace('_', ' ')}
              </motion.button>
            ))}
          </div>

          <input
            type="text"
            placeholder="🔍 Search by tracking ID or location..."
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

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchReports}
            style={{
              background: 'rgba(244,196,48,0.1)',
              border: '1px solid #f4c430',
              color: '#f4c430',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '11px 18px',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </motion.button>
        </motion.div>

        {/* REPORTS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              Loading admin queue...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'rgba(28,29,34,0.4)',
              border: '1px dashed rgba(244,196,48,0.2)',
              fontFamily: "'Inter', sans-serif", color: '#6b6a64',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                letterSpacing: '0.15em', textTransform: 'uppercase',
                fontSize: '13px', color: '#9b9a93',
              }}>
                No reports match your filter
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((report, i) => {
                const sc = statusColor(report.status)
                const sevColor = report.severity >= 7 ? '#e8453c' : report.severity >= 4 ? '#ff6b35' : '#5fb87a'
                const isExpanded = expanded === report.id

                return (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(28,29,34,0.7), rgba(20,21,26,0.7))',
                      border: '1px solid rgba(244,196,48,0.1)',
                      borderLeft: `3px solid ${sevColor}`,
                      padding: '22px 26px',
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Top Row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: '14px',
                      gap: '20px', flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{
                          fontFamily: "'Oswald', sans-serif",
                          color: '#f4c430', fontWeight: 700,
                          fontSize: '16px', marginBottom: '6px',
                          letterSpacing: '0.08em',
                        }}>
                          ◉ {report.tracking_id}
                          {report.reporter_name && (
                            <span style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '11px',
                              color: '#9b9a93',
                              marginLeft: '10px',
                              fontWeight: 400,
                              textTransform: 'none',
                              letterSpacing: '0',
                            }}>
                              by {report.reporter_name}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontFamily: "'Inter', sans-serif",
                          color: '#c8c6bd', fontSize: '13px',
                          marginBottom: '8px',
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
                          <span>⚠ Severity: <strong style={{ color: sevColor }}>{report.severity}/10</strong></span>
                          <span>•</span>
                          <span>🕐 {new Date(report.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <motion.div
                        animate={{ boxShadow: report.status === 'pending'
                          ? ['0 0 0 0 rgba(255,107,53,0.5)', '0 0 0 10px rgba(255,107,53,0)']
                          : 'none' }}
                        transition={{ duration: 2, repeat: report.status === 'pending' ? Infinity : 0 }}
                        style={{
                          background: `${sc.color}15`,
                          border: `1px solid ${sc.color}`,
                          color: sc.color,
                          padding: '8px 16px',
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '11px', fontWeight: 700,
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                        }}
                      >
                        {sc.label}
                      </motion.div>
                    </div>

                    {/* AI Report Preview */}
                    <div
                      onClick={() => setExpanded(isExpanded ? null : report.id)}
                      style={{
                        background: 'rgba(15,16,20,0.6)',
                        borderLeft: '2px solid #f4c430',
                        padding: '12px 16px',
                        color: '#9b9a93', fontSize: '12px',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.6,
                        maxHeight: isExpanded ? '500px' : '60px',
                        overflow: 'hidden',
                        marginBottom: '14px',
                        cursor: 'pointer',
                        transition: 'max-height 0.4s ease',
                        position: 'relative',
                      }}
                    >
                      {report.report_text}
                      {!isExpanded && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: '30px',
                          background: 'linear-gradient(180deg, transparent, rgba(15,16,20,0.95))',
                          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '10px', color: '#f4c430',
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          paddingBottom: '4px',
                        }}>
                          Click to expand ↓
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: 'flex', gap: '8px', flexWrap: 'wrap',
                      alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{
                        fontFamily: "'Oswald', sans-serif", fontSize: '11px',
                        color: '#6b6a64', letterSpacing: '0.12em',
                        textTransform: 'uppercase', fontWeight: 600,
                      }}>
                        ◆ Update Status:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { key: 'pending', label: 'Pending', icon: '⏳' },
                          { key: 'in_review', label: 'In Review', icon: '🔍' },
                          { key: 'resolved', label: 'Resolved', icon: '✓' },
                        ].map(status => {
                          const isCurrent = report.status === status.key
                          const isUpdating = updating === report.tracking_id
                          const c = statusColor(status.key).color

                          return (
                            <motion.button
                              key={status.key}
                              whileHover={{ scale: isCurrent ? 1 : 1.04 }}
                              whileTap={{ scale: isCurrent ? 1 : 0.96 }}
                              disabled={isCurrent || isUpdating}
                              onClick={() => updateStatus(report.tracking_id, status.key)}
                              style={{
                                background: isCurrent ? `${c}15` : 'rgba(23,24,25,0.6)',
                                border: `1px solid ${isCurrent ? c : 'rgba(244,196,48,0.15)'}`,
                                color: isCurrent ? c : '#9b9a93',
                                padding: '8px 16px',
                                cursor: isCurrent || isUpdating ? 'default' : 'pointer',
                                fontFamily: "'Oswald', sans-serif",
                                fontSize: '11px', fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                opacity: isUpdating ? 0.5 : 1,
                                transition: 'all 0.2s',
                              }}
                            >
                              {isUpdating ? (
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  style={{
                                    width: '10px', height: '10px',
                                    border: '2px solid currentColor',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                  }}
                                />
                              ) : (
                                <span>{status.icon}</span>
                              )}
                              {status.label}
                            </motion.button>
                          )
                        })}
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

export default Admin