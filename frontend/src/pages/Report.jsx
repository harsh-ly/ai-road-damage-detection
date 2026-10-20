import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

function Report() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState(28.6139)
  const [longitude, setLongitude] = useState(77.3910)
  const [markerPos, setMarkerPos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [step, setStep] = useState(1)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const containerRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [4, -4]), { stiffness: 100, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-4, 4]), { stiffness: 100, damping: 20 })

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleImageChange = (file) => {
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setStep(2)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageChange(file)
  }

  const handleMapClick = (lat, lng) => {
    setLatitude(lat)
    setLongitude(lng)
    setMarkerPos([lat, lng])
    setLocation(`Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`)
    if (image) setStep(3)
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lng)
        setMarkerPos([lat, lng])
        setLocation(`Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`)
        if (image) setStep(3)
      })
    }
  }

  const handleSubmit = async () => {
    if (!image || !location) {
      setError('Upload a photo and select a location on the map first.')
      return
    }
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('image', image)
    formData.append('location_address', location)
    formData.append('latitude', latitude)
    formData.append('longitude', longitude)

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.post('http://127.0.0.1:8000/report', formData, { headers })
      navigate(`/results/${res.data.tracking_id}`, { state: res.data })
    } catch (err) {
      const detailMsg = err.response?.data?.detail
      const statusMsg = err.response?.status ? `Server returned error (${err.response.status}).` : null
      setError(detailMsg || statusMsg || 'Could not reach the server. Make sure the backend is running.')
      setLoading(false)
    }

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
            boxShadow: `0 0 10px ${i % 2 === 0 ? '#f4c430' : '#ff6b35'}`,
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
        style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 2 }}
        ref={containerRef}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '36px' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}
          >
            <button onClick={() => navigate('/')} style={{
              background: 'transparent', border: '1px solid rgba(244,196,48,0.3)', color: '#9b9a93',
              fontFamily: "'Oswald', sans-serif", fontSize: '11px', padding: '6px 12px',
              cursor: 'pointer', letterSpacing: '0.08em',
            }}>
              ← BACK
            </button>
            <div style={{ width: '32px', height: '2px', background: '#f4c430' }} />
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b6a64'
            }}>New case file</span>
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
            Report road <span style={{
              background: 'linear-gradient(135deg, #f4c430, #ff6b35)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>damage</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontFamily: "'Inter', sans-serif", color: '#9b9a93', fontSize: '15px', marginTop: '12px' }}
          >
            Attach a photo, mark the spot on the map, and the AI handles the rest.
          </motion.p>
        </div>

        {/* PROGRESS BAR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
            padding: '14px 20px',
            background: 'rgba(28,29,34,0.6)',
            border: '1px solid rgba(244,196,48,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {[
            { label: 'Photo', done: !!preview },
            { label: 'Location', done: !!markerPos },
            { label: 'Submit', done: false },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '10px' }}>
              <motion.div
                animate={{
                  background: s.done ? '#5fb87a' : step === i + 1 ? '#f4c430' : '#2c2c31',
                  scale: step === i + 1 ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 1.5, repeat: step === i + 1 ? Infinity : 0 }}
                style={{
                  width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1a1a1f',
                  fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '12px',
                  boxShadow: step === i + 1 ? '0 0 20px rgba(244,196,48,0.5)' : 'none',
                }}
              >
                {s.done ? '✓' : i + 1}
              </motion.div>
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px',
                color: s.done ? '#5fb87a' : step === i + 1 ? '#f4c430' : '#6b6a64',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                {s.label}
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1,
                  height: '1px',
                  background: s.done ? '#5fb87a' : '#2c2c31',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </motion.div>

        {/* STEP 1: IMAGE UPLOAD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            mouseX.set(e.clientX - rect.left - rect.width / 2)
            mouseY.set(e.clientY - rect.top - rect.height / 2)
          }}
          onMouseLeave={() => { mouseX.set(0); mouseY.set(0) }}
          style={{
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            border: '1px solid rgba(244,196,48,0.15)',
            padding: '28px',
            marginBottom: '22px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            rotateX, rotateY,
            transformStyle: 'preserve-3d',
            transformPerspective: 1200,
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #f4c430, transparent)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{
              width: '26px', height: '26px',
              background: '#f4c430',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '13px',
              color: '#1a1a1f',
              boxShadow: '0 0 15px rgba(244,196,48,0.4)',
            }}>1</span>
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: '15px',
              color: '#ece9e2', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Evidence photo
            </span>
            <span style={{
              marginLeft: 'auto',
              fontFamily: "'Inter', sans-serif", fontSize: '11px',
              color: '#6b6a64', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              JPG · PNG · Max 10MB
            </span>
          </div>

          {!preview ? (
            <label
              htmlFor="imageInput"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ cursor: 'pointer', display: 'block' }}
            >
              <motion.div
                animate={{
                  borderColor: dragOver ? '#f4c430' : 'rgba(244,196,48,0.3)',
                  background: dragOver ? 'rgba(244,196,48,0.05)' : 'rgba(23,24,25,0.6)',
                }}
                style={{
                  border: '2px dashed',
                  padding: '60px 24px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Animated icon */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '48px', marginBottom: '16px' }}
                >
                  📸
                </motion.div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif", color: '#ece9e2',
                  fontSize: '18px', marginBottom: '8px', textTransform: 'uppercase',
                  letterSpacing: '0.05em', fontWeight: 600,
                }}>
                  {dragOver ? 'Drop to upload' : 'Drag photo here'}
                </div>
                <div style={{
                  fontFamily: "'Inter', sans-serif", color: '#6b6a64',
                  fontSize: '13px', marginBottom: '20px',
                }}>
                  or click to browse
                </div>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '13px',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: '#f4c430', color: '#1a1a1f',
                    padding: '12px 26px',
                    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                  }}
                >
                  Browse files
                </motion.span>
              </motion.div>
            </label>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <img src={preview} alt="Preview" style={{
                width: '100%', maxHeight: '380px', objectFit: 'cover', display: 'block',
                filter: 'contrast(1.05) saturate(0.95)',
              }} />
              
              {/* Scan effect on preview */}
              <motion.div
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent, #f4c430, transparent)',
                  boxShadow: '0 0 20px #f4c430',
                  pointerEvents: 'none',
                }}
              />

              {/* HUD corners */}
              {[
                { top: 10, left: 10, borders: 'top left' },
                { top: 10, right: 10, borders: 'top right' },
                { bottom: 10, left: 10, borders: 'bottom left' },
                { bottom: 10, right: 10, borders: 'bottom right' },
              ].map((c, i) => (
                <div key={i} style={{
                  position: 'absolute', ...c, width: '20px', height: '20px',
                  borderTop: c.borders.includes('top') ? '2px solid #f4c430' : 'none',
                  borderBottom: c.borders.includes('bottom') ? '2px solid #f4c430' : 'none',
                  borderLeft: c.borders.includes('left') ? '2px solid #f4c430' : 'none',
                  borderRight: c.borders.includes('right') ? '2px solid #f4c430' : 'none',
                  pointerEvents: 'none',
                }} />
              ))}

              {/* Replace button */}
              <label htmlFor="imageInput" style={{
                position: 'absolute', bottom: '14px', right: '14px', cursor: 'pointer',
                background: '#1a1a1f', color: '#f4c430',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '10px 18px',
                border: '1px solid #f4c430',
                backdropFilter: 'blur(10px)',
              }}>
                ↻ Replace
              </label>

              {/* Status badge */}
              <div style={{
                position: 'absolute', top: '14px', left: '14px',
                background: 'rgba(95,184,122,0.15)',
                border: '1px solid #5fb87a',
                color: '#5fb87a',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: '6px',
                backdropFilter: 'blur(10px)',
              }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5fb87a' }}
                />
                Photo loaded
              </div>
            </motion.div>
          )}
          <input type="file" accept="image/*"
            onChange={(e) => handleImageChange(e.target.files[0])}
            id="imageInput" style={{ display: 'none' }}
          />
        </motion.div>

        {/* STEP 2: LOCATION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(28,29,34,0.8), rgba(20,21,26,0.8))',
            border: '1px solid rgba(244,196,48,0.15)',
            padding: '28px',
            marginBottom: '22px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, #ff6b35, transparent)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{
              width: '26px', height: '26px',
              background: '#ff6b35',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '13px',
              color: '#1a1a1f',
              boxShadow: '0 0 15px rgba(255,107,53,0.4)',
            }}>2</span>
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: '15px',
              color: '#ece9e2', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              Pin the location
            </span>
            <span style={{
              marginLeft: 'auto',
              fontFamily: "'Inter', sans-serif", fontSize: '11px',
              color: '#6b6a64', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Click map to drop pin
            </span>
          </div>

          <div style={{
            border: '1px solid rgba(244,196,48,0.2)',
            overflow: 'hidden',
            height: '340px',
            position: 'relative',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
          }}>
            <MapContainer
              center={[28.6139, 77.3910]}
              zoom={12}
              style={{
                height: '100%', width: '100%',
                filter: 'saturate(0.6) brightness(0.85) hue-rotate(-10deg)',
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <LocationPicker onLocationSelect={handleMapClick} />
              {markerPos && <Marker position={markerPos} />}
            </MapContainer>

            {/* Crosshair overlay */}
            {!markerPos && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none', zIndex: 1000,
                }}
              >
                <div style={{
                  width: '40px', height: '40px',
                  border: '2px solid #f4c430',
                  borderRadius: '50%',
                  position: 'relative',
                  boxShadow: '0 0 20px rgba(244,196,48,0.5)',
                }}>
                  <div style={{ position: 'absolute', top: '50%', left: '-8px', right: '-8px', height: '2px', background: '#f4c430' }} />
                  <div style={{ position: 'absolute', left: '50%', top: '-8px', bottom: '-8px', width: '2px', background: '#f4c430' }} />
                </div>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {markerPos && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: '14px', padding: '12px 16px',
                  background: 'rgba(95,184,122,0.08)',
                  border: '1px solid rgba(95,184,122,0.3)',
                  fontFamily: "'Inter', sans-serif", fontSize: '13px',
                  color: '#5fb87a',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5fb87a' }}
                />
                <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '12px' }}>
                  Pinned:
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Or type an address — e.g. Sector 62, Noida"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(23,24,25,0.8)',
                border: '1px solid rgba(244,196,48,0.2)',
                padding: '13px 16px',
                color: '#ece9e2',
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                outline: 'none',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#f4c430'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(244,196,48,0.2)'}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleGetLocation}
              style={{
                background: 'rgba(244,196,48,0.1)',
                border: '1px solid #f4c430',
                color: '#f4c430',
                fontFamily: "'Oswald', sans-serif",
                fontSize: '12px', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '13px 22px',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              📍 Use my location
            </motion.button>
          </div>
        </motion.div>

        {/* ERROR */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{
                border: '1px solid #e8453c',
                background: 'rgba(232,69,60,0.08)',
                color: '#e8453c',
                padding: '14px 18px', marginBottom: '18px',
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              <span style={{ fontSize: '18px' }}>⚠</span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUBMIT BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ position: 'relative' }}
        >
          {/* Animated dashed road line */}
          <motion.div
            animate={{ backgroundPositionX: ['0px', '60px'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '50%', left: 0, right: 0, height: '4px',
              background: 'repeating-linear-gradient(90deg, #ff6b35 0 22px, transparent 22px 38px)',
              transform: 'translateY(-50%)',
              filter: 'drop-shadow(0 0 8px rgba(255,107,53,0.4))',
              pointerEvents: 'none',
              opacity: loading ? 0 : 1,
            }}
          />
          
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 20px 50px rgba(255,107,53,0.5)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              position: 'relative',
              width: '100%',
              background: loading
                ? 'linear-gradient(135deg, #2c2c31, #1f1f24)'
                : 'linear-gradient(135deg, #ff6b35, #ff8555)',
              color: loading ? '#9b9a93' : '#1a1a1f',
              fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: '16px',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '20px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              clipPath: 'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
              boxShadow: loading ? 'none' : '0 10px 30px rgba(255,107,53,0.4)',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '18px', height: '18px',
                    border: '2px solid #f4c430',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                Analyzing scene · 10-15 seconds
              </span>
            ) : (
              'Submit & analyze →'
            )}
          </motion.button>
        </motion.div>

        {/* Helper text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: '#6b6a64',
            letterSpacing: '0.05em',
          }}
        >
          🔒 Your data is encrypted and only used for civic reporting purposes.
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Report