import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, adminOnly = false, requireAuth = true }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1014',
        color: '#f4c430',
        fontFamily: 'Oswald, sans-serif',
        letterSpacing: '0.2em',
      }}>
        VERIFYING ACCESS...
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1014',
        padding: '40px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔒</div>
        <h1 style={{ color: '#e8453c', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>
          Access Denied
        </h1>
        <p style={{ color: '#9b9a93', maxWidth: '500px', margin: '20px 0' }}>
          You need admin privileges to access this area.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/" style={{
            background: 'transparent',
            border: '1px solid rgba(244,196,48,0.3)',
            color: '#9b9a93',
            padding: '12px 24px',
            textDecoration: 'none',
            fontFamily: 'Oswald, sans-serif',
            textTransform: 'uppercase',
          }}>
            ← Home
          </Link>
          <Link to="/login" style={{
            background: '#f4c430',
            color: '#1a1a1f',
            padding: '12px 24px',
            textDecoration: 'none',
            fontFamily: 'Oswald, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            🔑 Sign in
          </Link>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
