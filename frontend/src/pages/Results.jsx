import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import axios from 'axios'

// Share helper functions
const buildShareText = (data) => {
  const severityLabel = data.severity >= 7 ? 'HIGH' : data.severity >= 4 ? 'MEDIUM' : 'LOW'
  return `🚨 I just reported a ${severityLabel} severity pothole at ${data.location_address || 'my city'} using PotholeAI! ${data.pothole_count} pothole(s) detected (Severity: ${data.severity}/10). Let's make our roads safer! 🛣️ #PotholeAI #CivicAction #JIITNoida`
}

const shareToTwitter = (data) => {
  const text = encodeURIComponent(buildShareText(data))
  const url = encodeURIComponent(window.location.href)
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400')
}

const shareToWhatsApp = (data) => {
  const text = encodeURIComponent(
    `${buildShareText(data)}\n\nTrack this report: ${window.location.href}`
  )
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

const shareToLinkedIn = (data) => {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent('PotholeAI - Civic Action Report')
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'width=600,height=500')
}

const copyShareLink = async (trackingId, setCopied) => {
  const link = window.location.href
  try {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = link
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
}

function Results() {
  const { tracking_id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(state || null)
  const [copied, setCopied] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!data) {
      axios.get(`http://127.0.0.1:8000/reports/${tracking_id}`)
        .then(res => setData(res.data))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const copyTrackingId = () => {
    navigator.clipboard.writeText(data.tracking_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!data) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f1014', fontFamily: "'Oswald', sans-serif", color: '#f4c430',
      flexDirection: 'column', gap: '20px',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '50px', height: '50px',
          border: '3px solid rgba(244,196,48,0.2)',
          borderTopColor: '#f4c430',
          borderRadius: '50%',
        }}
      />
      <div style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '13px' }}>
        Loading case file...
      </div>
    </div>
  )

  const severityColor = data.severity >= 7 ? '#e8453c' : data.severity >= 4 ? '#ff6b35' : '#5fb87a'
  const severityLabel = data.severity >= 7 ? 'High' : data.severity >= 4 ? 'Medium' : 'Low'
  const severityIcon = data.severity >= 7 ? '🚨' : data.severity >= 4 ? '⚠️' : '✓'

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

      {/* Mouse glow */}
      <div style={{
        position: 'fixed',
        left: mousePos.x - 250, top: mousePos.y - 250,
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${severityColor}15, transparent 70%)`,
        pointerEvents: 'none', zIndex: 1, filter: 'blur(20px)',
      }} />

      {/* Success glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          position: 'absolute', top: '0%', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(95,184,122,0.15), transparent 60%)',
          pointerEvents: 'none', filter: 'blur(50px)',
          zIndex: 1,
        }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', width: '3px', height: '3px',
            background: i % 3 === 0 ? '#5fb87a' : i % 3 === 1 ? '#f4c430' : severityColor,
            borderRadius: '50%',
            top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            boxShadow: `0 0 10px currentColor`,
            zIndex: 1,
          }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 2 }}
      >
        {/* SUCCESS BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            border: '1px solid rgba(95,184,122,0.3)',
            background: 'linear-gradient(135deg, rgba(95,184,122,0.08), rgba(28,29,34,0.8))',
            padding: '32px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Success ring animation */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            style={{
              position: 'absolute', top: '50%', left: '40px',
              transform: 'translateY(-50%)',
              width: '60px', height: '60px',
              border: '2px solid #5fb87a',
              borderRadius: '50%',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Check icon */}
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              style={{
                width: '56px', height: '56px',
                background: 'linear-gradient(135deg, #5fb87a, #4a9d63)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px',
                boxShadow: '0 10px 30px rgba(95,184,122,0.4)',
              }}
            >
              ✓
            </motion.div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5fb87a' }}
                />
                <span style={{
                  fontFamily: "'Oswald', sans-serif", fontWeight: 700,
                  fontSize: '12px', letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#5fb87a',
                }}>
                  Case filed successfully
                </span>
              </div>
              <h1 style={{
                fontFamily: "'Oswald', sans-serif", fontWeight: 700,
                fontSize: 'clamp(22px, 3vw, 30px)',
                color: '#ece9e2', margin: 0,
                textTransform: 'uppercase', letterSpacing: '-0.01em',
              }}>
                Complaint registered
              </h1>
            </div>
          </div>

          {/* Tracking ID */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            onClick={copyTrackingId}
            style={{
              border: '1px solid #f4c430',
              background: 'rgba(244,196,48,0.05)',
              padding: '14px 22px',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 0 20px rgba(244,196,48,0.15)',
            }}
          >
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: '10px',
              color: '#9b9a93', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: '4px',
            }}>
              Tracking ID
            </div>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700,
              fontSize: '18px', letterSpacing: '0.08em', color: '#f4c430',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              {data.tracking_id}
              <span style={{ fontSize: '12px', opacity: 0.7 }}>
                {copied ? '✓' : '⎘'}
              </span>
            </div>
            <AnimatePresence>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', top: '-30px', right: 0,
                    background: '#5fb87a', color: '#1a1a1f',
                    padding: '4px 10px',
                    fontFamily: "'Oswald', sans-serif", fontSize: '10px',
                    fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* STATS GRID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            marginBottom: '22px',
          }}
        >
          {[
            {
              value: String(data.pothole_count).padStart(2, '0'),
              label: 'Potholes detected',
              color: '#f4c430',
              icon: '🎯',
              sub: 'YOLOv8 model',
            },
            {
              value: `${data.severity}/10`,
              label: `Severity — ${severityLabel}`,
              color: severityColor,
              icon: severityIcon,
              sub: 'AI assessment',
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                padding: '24px 26px',
                background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
                border: `1px solid ${s.color}30`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: `linear-gradient(90deg, ${s.color}, transparent)`,
              }} />

              {/* Background icon */}
              <div style={{
                position: 'absolute', top: '50%', right: '20px',
                transform: 'translateY(-50%)',
                fontSize: '52px', opacity: 0.1,
              }}>
                {s.icon}
              </div>

              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '42px', fontWeight: 700,
                color: '#ece9e2', lineHeight: 1,
                textShadow: `0 0 20px ${s.color}40`,
              }}>
                {s.value}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: s.color,
                marginTop: '8px', fontWeight: 600,
              }}>
                {s.label}
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
        </motion.div>

        {/* SEVERITY BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            border: `1px solid ${severityColor}30`,
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            padding: '24px 28px',
            marginBottom: '22px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, ${severityColor}, transparent)`,
          }} />

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '14px',
            fontFamily: "'Oswald', sans-serif",
            fontSize: '12px', letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 600,
          }}>
            <span style={{ color: '#9b9a93' }}>● Severity scale</span>
            <span style={{ color: severityColor }}>{severityLabel} priority</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', height: '10px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                style={{
                  flex: 1,
                  background: i < data.severity ? severityColor : '#2c2c31',
                  boxShadow: i < data.severity ? `0 0 10px ${severityColor}60` : 'none',
                  transformOrigin: 'bottom',
                }}
              />
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: '8px',
            fontFamily: "'Inter', sans-serif", fontSize: '10px',
            color: '#6b6a64', letterSpacing: '0.1em',
          }}>
            <span>LOW</span>
            <span>MEDIUM</span>
            <span>HIGH</span>
          </div>
        </motion.div>

        {/* AI COMPLAINT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            border: '1px solid rgba(244,196,48,0.2)',
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            padding: '28px',
            marginBottom: '22px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #f4c430, #ff6b35, transparent)',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ fontSize: '20px' }}
              >
                ✍️
              </motion.div>
              <div style={{ width: '24px', height: '2px', background: '#f4c430' }} />
              <span style={{
                fontFamily: "'Oswald', sans-serif", fontWeight: 600,
                fontSize: '13px', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#ece9e2',
              }}>
                AI-Generated Complaint
              </span>
            </div>
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '10px',
              color: '#5fb87a', letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 600,
              padding: '4px 10px',
              border: '1px solid rgba(95,184,122,0.3)',
              background: 'rgba(95,184,122,0.05)',
            }}>
              ◉ Gemini AI
            </span>
          </div>

          <div style={{
            position: 'relative',
            padding: '20px',
            background: 'rgba(15,16,20,0.6)',
            borderLeft: '3px solid #f4c430',
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              color: '#c8c6bd', fontSize: '14px',
              lineHeight: 1.8, whiteSpace: 'pre-wrap',
              maxHeight: '340px', overflowY: 'auto',
              paddingRight: '8px',
            }}>
              {data.report_text}
            </div>
          </div>

          {/* Quote mark decorations */}
          <div style={{
            position: 'absolute', top: '50px', right: '32px',
            fontFamily: 'serif', fontSize: '80px',
            color: 'rgba(244,196,48,0.05)',
            lineHeight: 1, pointerEvents: 'none',
          }}>
            "
          </div>
        </motion.div>

        {/* STATUS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            border: '1px solid rgba(255,107,53,0.3)',
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            padding: '24px 28px',
            marginBottom: '30px',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #ff6b35, transparent)',
          }} />

          <div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px',
              color: '#6b6a64', letterSpacing: '0.14em',
              textTransform: 'uppercase', marginBottom: '4px',
            }}>
              Current Status
            </div>
            <div style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 600,
              fontSize: '20px', color: '#ece9e2',
              textTransform: 'uppercase',
            }}>
              In Processing Queue
            </div>
          </div>

          <motion.span
            animate={{ boxShadow: ['0 0 0 0 rgba(255,107,53,0.6)', '0 0 0 12px rgba(255,107,53,0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 700,
              fontSize: '13px', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#ff6b35',
              border: '1px solid #ff6b35',
              padding: '10px 22px',
              background: 'rgba(255,107,53,0.05)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b35' }} />
            {data.status}
          </motion.span>
        </motion.div>

        {/* TIMELINE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            padding: '28px',
            border: '1px solid rgba(244,196,48,0.15)',
            background: 'linear-gradient(135deg, rgba(28,29,34,0.6), rgba(20,21,26,0.6))',
            marginBottom: '30px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            fontFamily: "'Oswald', sans-serif", fontSize: '12px',
            color: '#6b6a64', letterSpacing: '0.16em',
            textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600,
          }}>
            ● Expected Timeline
          </div>
          
          {[
            { stage: 'Case Filed', done: true, time: 'Just now' },
            { stage: 'Municipal Review', done: false, time: 'Within 24 hours' },
            { stage: 'Work Assignment', done: false, time: '2-5 days' },
            { stage: 'Resolution', done: false, time: '7-14 days' },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                paddingBottom: i < 3 ? '14px' : 0,
                marginBottom: i < 3 ? '14px' : 0,
                borderBottom: i < 3 ? '1px solid rgba(244,196,48,0.08)' : 'none',
              }}
            >
              <div style={{
                width: '12px', height: '12px',
                borderRadius: '50%',
                background: t.done ? '#5fb87a' : '#2c2c31',
                border: t.done ? 'none' : '2px solid #3a3a40',
                boxShadow: t.done ? '0 0 10px rgba(95,184,122,0.5)' : 'none',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Oswald', sans-serif", fontSize: '14px',
                  color: t.done ? '#ece9e2' : '#9b9a93',
                  fontWeight: 600, letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  {t.stage}
                </div>
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: '12px',
                color: t.done ? '#5fb87a' : '#6b6a64',
                letterSpacing: '0.04em',
              }}>
                {t.time}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 📣 SOCIAL SHARE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{
            border: '1px solid rgba(244,196,48,0.2)',
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            padding: '24px 28px',
            marginBottom: '22px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #1da1f2, #25d366, #f4c430, transparent)' }} />

          <div style={{
            fontFamily: "'Oswald', sans-serif", fontWeight: 700,
            fontSize: '14px', color: '#ece9e2',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '18px' }}>📣</span>
            Spread the Word
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#9b9a93', fontSize: '12px', marginTop: 0, marginBottom: '16px', lineHeight: 1.5 }}>
            Share your report to raise awareness and encourage more citizens to help fix our roads!
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Twitter / X */}
            <motion.button
              id="share-twitter-btn"
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => shareToTwitter(data)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(29,161,242,0.12)',
                border: '1px solid rgba(29,161,242,0.5)',
                color: '#1da1f2',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(29,161,242,0.15)',
              }}
            >
              <span style={{ fontSize: '16px' }}>𝕏</span>
              Share on X
            </motion.button>

            {/* WhatsApp */}
            <motion.button
              id="share-whatsapp-btn"
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => shareToWhatsApp(data)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.5)',
                color: '#25d366',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(37,211,102,0.15)',
              }}
            >
              <span style={{ fontSize: '16px' }}>💬</span>
              WhatsApp
            </motion.button>

            {/* LinkedIn */}
            <motion.button
              id="share-linkedin-btn"
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => shareToLinkedIn(data)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(0,119,181,0.12)',
                border: '1px solid rgba(0,119,181,0.5)',
                color: '#0077b5',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(0,119,181,0.15)',
              }}
            >
              <span style={{ fontSize: '14px' }}>in</span>
              LinkedIn
            </motion.button>

            {/* Copy Link */}
            <motion.button
              id="share-copy-btn"
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => copyShareLink(data.tracking_id, setCopied)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(244,196,48,0.1)',
                border: '1px solid rgba(244,196,48,0.4)',
                color: '#f4c430',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              <span>{copied ? '✓' : '⎘'}</span>
              {copied ? 'Copied!' : 'Copy Link'}
            </motion.button>
          </div>

          {/* Share preview text */}
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            background: 'rgba(15,16,20,0.6)',
            borderLeft: '2px solid rgba(244,196,48,0.3)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px', color: '#6b6a64',
            lineHeight: 1.6,
          }}>
            <span style={{ color: '#9b9a93', fontStyle: 'italic' }}>"{buildShareText(data).slice(0, 100)}..."</span>
          </div>
        </motion.div>

        {/* ACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            style={{
              flex: 1, minWidth: '180px',
              background: 'transparent',
              border: '1px solid rgba(244,196,48,0.3)',
              color: '#9b9a93',
              fontFamily: "'Oswald', sans-serif", fontWeight: 600,
              fontSize: '14px', letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = '#f4c430'; e.target.style.color = '#f4c430' }}
            onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(244,196,48,0.3)'; e.target.style.color = '#9b9a93' }}
          >
            ← Back home
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 20px 50px rgba(244,196,48,0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/report')}
            style={{
              flex: 1, minWidth: '180px',
              background: 'linear-gradient(135deg, #f4c430, #ffd966)',
              border: 'none',
              color: '#1a1a1f',
              fontFamily: "'Oswald', sans-serif", fontWeight: 700,
              fontSize: '14px', letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '18px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(244,196,48,0.3)',
              clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
            }}
          >
            File another case →
          </motion.button>
        </motion.div>

        {/* Helper text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            textAlign: 'center', marginTop: '24px',
            fontFamily: "'Inter', sans-serif", fontSize: '12px',
            color: '#6b6a64', letterSpacing: '0.05em',
          }}
        >
          📧 Email notifications will be sent at every status update
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Results