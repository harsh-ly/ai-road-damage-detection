import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Counter = ({ value }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 1500
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
  return <>{String(display).padStart(2, '0')}</>
}

// Realistic pothole SVG component (3D look)
const Pothole3D = ({ size = 200, depth: _depth = 1 }) => (
  <svg viewBox="0 0 200 200" style={{ width: size, height: size, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))' }}>
    <defs>
      <radialGradient id="potholeGrad" cx="40%" cy="35%">
        <stop offset="0%" stopColor="#0a0a0c" />
        <stop offset="40%" stopColor="#1a1a1f" />
        <stop offset="70%" stopColor="#2a2a30" />
        <stop offset="100%" stopColor="#3a3a40" />
      </radialGradient>
      <radialGradient id="asphalt" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#3a3a3f" />
        <stop offset="100%" stopColor="#1e1e22" />
      </radialGradient>
      <filter id="rough">
        <feTurbulence baseFrequency="0.9" numOctaves="3" />
        <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0 0.3  0 0 0 0.3 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
    {/* Asphalt background */}
    <circle cx="100" cy="100" r="95" fill="url(#asphalt)" />
    <circle cx="100" cy="100" r="95" fill="url(#asphalt)" filter="url(#rough)" opacity="0.6" />
    
    {/* Pothole rim - light edge */}
    <ellipse cx="100" cy="100" rx="65" ry="58" fill="#4a4a50" />
    
    {/* Inner pothole - dark */}
    <ellipse cx="103" cy="103" rx="58" ry="51" fill="url(#potholeGrad)" />
    
    {/* Deepest part */}
    <ellipse cx="95" cy="92" rx="35" ry="28" fill="#0a0a0c" opacity="0.8" />
    
    {/* Cracks */}
    <path d="M 100 40 L 95 80 M 160 100 L 130 105 M 100 160 L 105 130 M 40 100 L 70 95" 
          stroke="#0a0a0c" strokeWidth="1.5" fill="none" opacity="0.7" />
    <path d="M 50 60 L 75 78 M 150 60 L 130 80 M 50 140 L 75 122 M 150 140 L 130 122" 
          stroke="#0a0a0c" strokeWidth="1" fill="none" opacity="0.5" />
    
    {/* Highlight on rim */}
    <ellipse cx="85" cy="65" rx="20" ry="6" fill="#5a5a60" opacity="0.4" transform="rotate(-20 85 65)" />
  </svg>
)

function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  
  const bgY = useTransform(scrollY, [0, 1000], [0, 300])
  const titleY = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { stiffness: 100, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { stiffness: 100, damping: 20 })

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats({ total: 25, resolved: 3, pending: 22 }))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        mouseX.set(x)
        mouseY.set(y)
        setMousePos({ x: e.clientX, y: e.clientY })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div style={{ minHeight: '100vh', background: '#0f1014', overflow: 'hidden', position: 'relative' }}>
      
      {/* Animated grid background */}
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(244,196,48,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(244,196,48,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          y: bgY,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Mouse glow */}
      <div
        style={{
          position: 'fixed',
          left: mousePos.x - 250,
          top: mousePos.y - 250,
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,196,48,0.08), transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
          filter: 'blur(20px)',
        }}
      />

      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: i % 3 === 0 ? '#f4c430' : i % 3 === 1 ? '#ff6b35' : '#5fb87a',
            borderRadius: '50%',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            boxShadow: `0 0 12px ${i % 3 === 0 ? '#f4c430' : i % 3 === 1 ? '#ff6b35' : '#5fb87a'}`,
            zIndex: 1,
          }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5 }}
        />
      ))}

      {/* HERO SECTION */}
      <div
        ref={heroRef}
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 20px 0',
          zIndex: 2,
        }}
      >
        {/* Floating 3D potholes around hero */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            opacity: 0.4,
            transform: 'perspective(800px) rotateX(60deg) rotateZ(-15deg)',
          }}
        >
          <Pothole3D size={140} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '20%',
            right: '10%',
            opacity: 0.4,
            transform: 'perspective(800px) rotateX(60deg) rotateZ(20deg)',
          }}
        >
          <Pothole3D size={120} />
        </motion.div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '12%',
            opacity: 0.35,
            transform: 'perspective(800px) rotateX(55deg) rotateZ(10deg)',
          }}
        >
          <Pothole3D size={100} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '8%',
            opacity: 0.35,
            transform: 'perspective(800px) rotateX(55deg) rotateZ(-20deg)',
          }}
        >
          <Pothole3D size={110} />
        </motion.div>

        {/* Radial glows */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(244,196,48,0.15), transparent 60%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }}
        />

        <motion.div style={{ y: titleY, opacity, position: 'relative', zIndex: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, #f4c430, #f9d558)',
              color: '#1a1a1f',
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '8px 18px',
              marginBottom: '32px',
              clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
              boxShadow: '0 8px 30px rgba(244,196,48,0.4)',
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1a1a1f' }}
            />
            SYSTEM ACTIVE — JIIT NOIDA MUNICIPAL ZONE
          </motion.div>

          <motion.div
            style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(40px, 8vw, 90px)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                color: '#ece9e2',
                margin: '0 0 22px',
                textTransform: 'uppercase',
                maxWidth: '1000px',
                textShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            >
              Every pothole<br />
              <motion.span
                animate={{
                  textShadow: [
                    '0 0 20px rgba(244,196,48,0.5)',
                    '0 0 40px rgba(244,196,48,0.8)',
                    '0 0 20px rgba(244,196,48,0.5)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background: 'linear-gradient(135deg, #f4c430, #ffd966, #f4c430)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%',
                  display: 'inline-block',
                }}
              >
                becomes a case file.
              </motion.span>
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '18px',
              color: '#a8a79f',
              maxWidth: '580px',
              margin: '0 auto 48px',
              lineHeight: 1.7,
            }}
          >
            Photograph the damage. A trained vision model finds it, scores it,
            and an AI co-writes the municipal complaint — filed and tracked
            before you've left the spot.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto 70px',
            }}
          >
            <motion.div
              animate={{ backgroundPositionX: ['0px', '60px'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '4px',
                background: 'repeating-linear-gradient(90deg, #f4c430 0 22px, transparent 22px 38px)',
                transform: 'translateY(-50%)',
                zIndex: 0,
                filter: 'drop-shadow(0 0 8px rgba(244,196,48,0.5))',
              }}
            />
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 20px 50px rgba(255,107,53,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/report')}
              style={{
                position: 'relative',
                zIndex: 1,
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                fontSize: '17px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #ff6b35, #ff8555)',
                color: '#1a1a1f',
                padding: '20px 50px',
                border: 'none',
                cursor: 'pointer',
                clipPath: 'polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%)',
                boxShadow: '0 10px 30px rgba(255,107,53,0.4)',
              }}
            >
              Report damage now →
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            style={{
              display: 'flex',
              border: '1px solid rgba(244,196,48,0.2)',
              background: 'linear-gradient(135deg, rgba(28,29,34,0.9), rgba(20,21,26,0.9))',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {[
              { label: 'Filed', value: stats.total, accent: '#f4c430' },
              { label: 'Resolved', value: stats.resolved, accent: '#5fb87a' },
              { label: 'Pending', value: stats.pending, accent: '#ff6b35' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                whileHover={{ y: -4, background: 'rgba(244,196,48,0.05)' }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  padding: '26px 44px',
                  textAlign: 'left',
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(244,196,48,0.15)',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '40px',
                    fontWeight: 700,
                    color: '#ece9e2',
                    lineHeight: 1,
                    textShadow: `0 0 20px ${s.accent}40`,
                  }}
                >
                  <Counter value={s.value} />
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: s.accent,
                    marginTop: '8px',
                    fontWeight: 600,
                  }}
                >
                  ● {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#6b6a64',
            fontFamily: "'Oswald', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Scroll
          <div style={{ width: '1px', height: '30px', background: 'linear-gradient(180deg, #f4c430, transparent)' }} />
        </motion.div>
      </div>

      {/* HERO POTHOLE SHOWCASE - Large 3D centerpiece */}
      <div style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '50px' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '2px', background: '#f4c430' }} />
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '13px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#6b6a64',
              margin: 0,
            }}>
              The Problem We Solve
            </h2>
            <div style={{ width: '40px', height: '2px', background: '#f4c430' }} />
          </div>
          <h3 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#ece9e2',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            India's roads, <span style={{ color: '#ff6b35' }}>scarred.</span>
          </h3>
        </motion.div>

        {/* Three big 3D potholes side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          marginBottom: '40px',
        }}>
          {[
            { severity: 'HIGH', color: '#ff4444', size: 260, label: 'Severe Damage', desc: 'Deep cavity, >10cm', count: '12' },
            { severity: 'MEDIUM', color: '#f4c430', size: 220, label: 'Moderate Damage', desc: 'Surface cracking, 5-10cm', count: '08' },
            { severity: 'LOW', color: '#5fb87a', size: 180, label: 'Minor Damage', desc: 'Edge wear, <5cm', count: '05' },
          ].map((item, i) => (
            <motion.div
              key={item.severity}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              whileHover={{ y: -10 }}
              style={{
                background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
                border: `1px solid ${item.color}30`,
                padding: '40px 30px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Severity badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: item.color,
                color: '#1a1a1f',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 10px',
                letterSpacing: '0.15em',
              }}>
                {item.severity}
              </div>

              {/* 3D pothole with floating animation */}
              <motion.div
                animate={{ y: [0, -8, 0], rotateZ: [0, 3, 0] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '30px',
                  transform: 'perspective(1000px) rotateX(50deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <Pothole3D size={item.size} />
              </motion.div>

              {/* Glow ring under pothole */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: `${item.size / 2 + 60}px`,
                transform: 'translateX(-50%)',
                width: `${item.size * 0.8}px`,
                height: '20px',
                background: `radial-gradient(ellipse, ${item.color}40, transparent 70%)`,
                filter: 'blur(15px)',
                pointerEvents: 'none',
              }} />

              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '22px',
                fontWeight: 600,
                color: '#ece9e2',
                textTransform: 'uppercase',
                marginBottom: '8px',
                marginTop: '20px',
              }}>
                {item.label}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: '#9b9a93',
                marginBottom: '20px',
              }}>
                {item.desc}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: '8px',
                paddingTop: '20px',
                borderTop: `1px solid ${item.color}20`,
              }}>
                <span style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '32px',
                  fontWeight: 700,
                  color: item.color,
                }}>{item.count}</span>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: '#6b6a64',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}>cases this week</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* DETECTION PREVIEW with real pothole image */}
      <div style={{ padding: '40px 24px 80px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(244,196,48,0.2)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            background: '#1a1a1f',
            aspectRatio: '16/7',
          }}
        >
          {/* Asphalt road background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 30% 50%, rgba(244,196,48,0.15), transparent 50%),
              radial-gradient(ellipse at center, #2a2a2f 0%, #14141a 80%)
            `,
          }}>
            {/* Realistic asphalt texture */}
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              <defs>
                <filter id="noise">
                  <feTurbulence baseFrequency="0.85" numOctaves="3" />
                  <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.5 0" />
                </filter>
              </defs>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>

            {/* Large center pothole */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '30%',
              transform: 'translate(-50%, -50%) perspective(800px) rotateX(65deg)',
            }}>
              <Pothole3D size={280} />
            </div>

            {/* Two smaller potholes */}
            <div style={{
              position: 'absolute',
              top: '60%',
              left: '60%',
              transform: 'translate(-50%, -50%) perspective(800px) rotateX(65deg)',
            }}>
              <Pothole3D size={150} />
            </div>

            <div style={{
              position: 'absolute',
              top: '40%',
              left: '78%',
              transform: 'translate(-50%, -50%) perspective(800px) rotateX(65deg)',
            }}>
              <Pothole3D size={110} />
            </div>

            {/* Detection bounding boxes */}
            {[
              { top: '32%', left: '18%', w: '24%', h: '38%', conf: '94%', sev: 'HIGH', color: '#ff4444' },
              { top: '48%', left: '52%', w: '15%', h: '24%', conf: '87%', sev: 'MED', color: '#f4c430' },
              { top: '32%', left: '72%', w: '12%', h: '18%', conf: '76%', sev: 'LOW', color: '#5fb87a' },
            ].map((box, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + i * 0.2, type: 'spring' }}
                style={{
                  position: 'absolute',
                  top: box.top,
                  left: box.left,
                  width: box.w,
                  height: box.h,
                  border: `2px solid ${box.color}`,
                  boxShadow: `0 0 20px ${box.color}80`,
                }}
              >
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    top: '-26px',
                    left: '-2px',
                    background: box.color,
                    color: '#1a1a1f',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  POTHOLE {box.conf} · {box.sev}
                </motion.div>
              </motion.div>
            ))}

            {/* Scan line */}
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #f4c430, transparent)',
                boxShadow: '0 0 20px #f4c430',
              }}
            />

            {/* HUD corners */}
            {[
              { top: 15, left: 15, borders: 'top left' },
              { top: 15, right: 15, borders: 'top right' },
              { bottom: 15, left: 15, borders: 'bottom left' },
              { bottom: 15, right: 15, borders: 'bottom right' },
            ].map((corner, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...corner,
                  width: '24px',
                  height: '24px',
                  borderTop: corner.borders.includes('top') ? '2px solid #f4c430' : 'none',
                  borderBottom: corner.borders.includes('bottom') ? '2px solid #f4c430' : 'none',
                  borderLeft: corner.borders.includes('left') ? '2px solid #f4c430' : 'none',
                  borderRight: corner.borders.includes('right') ? '2px solid #f4c430' : 'none',
                }}
              />
            ))}

            {/* HUD text */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '11px',
              color: '#f4c430',
              letterSpacing: '0.15em',
            }}>
              ◉ YOLOv8 · LIVE DETECTION · 30FPS
            </div>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              fontFamily: "'Oswald', sans-serif",
              fontSize: '11px',
              color: '#5fb87a',
              letterSpacing: '0.15em',
            }}>
              3 OBJECTS DETECTED
            </div>
          </div>
        </motion.div>
      </div>

      {/* CASE PROCESSING SEQUENCE */}
      <div style={{ padding: '60px 24px 80px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '70px' }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 60 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ height: '2px', background: '#f4c430' }}
          />
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#6b6a64',
            margin: 0,
          }}>
            Case processing sequence
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          {[
            { n: '01', title: 'Capture', desc: 'Photograph the damage on site — no special equipment needed.', icon: '📸', color: '#f4c430' },
            { n: '02', title: 'Detect', desc: 'A YOLOv8 model trained on 665 annotated road images locates each pothole and scores severity.', icon: '🎯', color: '#ff6b35' },
            { n: '03', title: 'Draft', desc: 'Gemini converts the detection into a formal municipal complaint, written in official language.', icon: '✍️', color: '#5fb87a' },
            { n: '04', title: 'File', desc: 'A tracking ID is issued, the case is logged, and the authority is notified by email.', icon: '📋', color: '#7b9eff' },
          ].map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              style={{
                position: 'relative',
                padding: '32px 28px',
                background: 'linear-gradient(135deg, rgba(28,29,34,0.6), rgba(20,21,26,0.6))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(244,196,48,0.1)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${item.color}, transparent)`,
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: item.color,
                  letterSpacing: '0.12em',
                }}>
                  STEP {item.n}
                </div>
                <div style={{ fontSize: '24px' }}>{item.icon}</div>
              </div>

              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '24px',
                fontWeight: 600,
                color: '#ece9e2',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                {item.title}
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#9b9a93',
                lineHeight: 1.65,
              }}>
                {item.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ padding: '40px 24px 100px', position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '60px 40px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(244,196,48,0.08), rgba(255,107,53,0.08))',
            border: '1px solid rgba(244,196,48,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent, rgba(244,196,48,0.05), transparent)',
              pointerEvents: 'none',
            }}
          />
          <h3 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            color: '#ece9e2',
            textTransform: 'uppercase',
            margin: '0 0 20px',
            position: 'relative',
          }}>
            Ready to file your first <span style={{ color: '#f4c430' }}>case?</span>
          </h3>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#9b9a93',
            fontSize: '15px',
            marginBottom: '30px',
            position: 'relative',
          }}>
            Join citizens making roads safer, one report at a time.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/report')}
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: '#f4c430',
              color: '#1a1a1f',
              padding: '16px 40px',
              border: 'none',
              cursor: 'pointer',
              clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(244,196,48,0.3)',
            }}
          >
            Start reporting →
          </motion.button>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer style={{
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(180deg, transparent, rgba(10,10,14,0.8))',
        borderTop: '1px solid rgba(244,196,48,0.15)',
        padding: '60px 24px 30px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Top footer grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '50px',
          }}>
            {/* Brand */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: '#f4c430',
                  clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                }} />
                <span style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ece9e2',
                  letterSpacing: '0.05em',
                }}>
                  PotholeAI
                </span>
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: '#7b7a73',
                lineHeight: 1.6,
                margin: 0,
              }}>
                Citizen-powered road damage reporting. Built with computer vision and AI for the JIIT Noida Municipal Zone.
              </p>
            </div>

            {/* Product */}
            <div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#f4c430',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: '18px',
              }}>
                Product
              </div>
              {['Report Damage', 'Track Case', 'Dashboard', 'API Documentation'].map(link => (
                <a key={link} href="#" style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#9b9a93',
                  textDecoration: 'none',
                  marginBottom: '10px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = '#f4c430'}
                onMouseLeave={e => e.target.style.color = '#9b9a93'}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#f4c430',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: '18px',
              }}>
                Legal
              </div>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Data Protection'].map(link => (
                <a key={link} href="#" style={{
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#9b9a93',
                  textDecoration: 'none',
                  marginBottom: '10px',
                }}
                onMouseEnter={e => e.target.style.color = '#f4c430'}
                onMouseLeave={e => e.target.style.color = '#9b9a93'}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#f4c430',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: '18px',
              }}>
                Contact
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: '#9b9a93',
                lineHeight: 1.8,
              }}>
                JIIT Noida<br />
                Sector 62, Noida<br />
                Uttar Pradesh, India<br />
                <a href="mailto:admin@potholeai.in" style={{ color: '#f4c430', textDecoration: 'none' }}>
                  admin@potholeai.in
                </a>
              </div>

              {/* Social icons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {['𝕏', 'in', 'GH'].map(icon => (
                  <motion.a
                    key={icon}
                    href="#"
                    whileHover={{ y: -3, background: '#f4c430', color: '#1a1a1f' }}
                    style={{
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(244,196,48,0.3)',
                      color: '#9b9a93',
                      textDecoration: 'none',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(244,196,48,0.3), transparent)',
            marginBottom: '25px',
          }} />

          {/* Bottom row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px',
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: '#6b6a64',
              letterSpacing: '0.02em',
            }}>
              © 2024 <span style={{ color: '#f4c430', fontWeight: 600 }}>PotholeAI</span> Municipal Systems. All rights reserved.
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '11px',
                color: '#5fb87a',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
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
                All systems operational
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: '#6b6a64',
                letterSpacing: '0.05em',
              }}>
                v2.4.1 · Built with ❤️ at JIIT
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home