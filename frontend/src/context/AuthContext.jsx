import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// API base URL
const API_URL = 'http://127.0.0.1:8000'

// Token expiration check (7 days)
const TOKEN_EXPIRY_DAYS = 7

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const persistSession = useCallback((userData, accessToken) => {
    if (!userData || !accessToken) return

    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token_timestamp', Date.now().toString())
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUser(userData)
    setToken(accessToken)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('token_timestamp')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setToken(null)
  }, [])

  const verifyToken = useCallback(async (tokenToVerify) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenToVerify}` },
        timeout: 5000,
      })

      if (response.data) {
        const freshUser = response.data
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
        setToken(tokenToVerify)
      }
      return true
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('🔒 Invalid token, clearing session')
        clearSession()
        return false
      }
      return true
    }
  }, [clearSession])

  // ============================================
  // 🔐 INITIALIZE — Check stored session on mount
  // ============================================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        const tokenTimestamp = localStorage.getItem('token_timestamp')

        // Check if token exists and is not expired
        if (storedToken && storedUser && tokenTimestamp) {
          const tokenAge = Date.now() - parseInt(tokenTimestamp)
          const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000

          if (tokenAge < maxAge) {
            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            
            // Restore user state
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setToken(storedToken)
            
            // Optional: Verify token with backend
            await verifyToken(storedToken)
          } else {
            // Token expired, clear it
            console.log('🔒 Session expired, please login again')
            clearSession()
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        clearSession()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])


  // ============================================
  // 🔓 LOGIN
  // ============================================
  const login = useCallback((userData, accessToken) => {
    try {
      // Save to localStorage
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token_timestamp', Date.now().toString())

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      // Update state
      setUser(userData)
      setToken(accessToken)
      setError(null)

      console.log(`✅ Logged in as ${userData.name} (${userData.role})`)
      return true
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to save session')
      return false
    }
  }, [])

  // ============================================
  // 🚪 LOGOUT
  // ============================================
  const logout = useCallback(async () => {
    try {
      // Optional: Notify backend (if you have a logout endpoint)
      // await axios.post(`${API_URL}/auth/logout`)
    } catch (err) {
      console.log('Logout notification failed (not critical)')
    } finally {
      clearSession()
      console.log('👋 Logged out successfully')
    }
  }, [])


  // ============================================
  // 🔄 UPDATE USER PROFILE
  // ============================================
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  // ============================================
  // 🛡️ PERMISSION CHECKERS
  // ============================================
  const hasRole = useCallback((role) => {
    return user?.role === role
  }, [user])

  const isAdmin = useCallback(() => {
    return user?.role === 'admin'
  }, [user])

  const hasAnyRole = useCallback((roles = []) => {
    return roles.includes(user?.role)
  }, [user])

  // ============================================
  // ⚠️ AXIOS INTERCEPTOR — Auto-logout on 401
  // ============================================
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Auto-logout on 401 Unauthorized
        if (error.response?.status === 401 && user) {
          console.log('🔒 Session expired, logging out...')
          clearSession()
          
          // Redirect to login (optional)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true'
          }
        }
        return Promise.reject(error)
      }
    )

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [user])

  // ============================================
  // 🌐 LISTEN FOR STORAGE CHANGES (multi-tab sync)
  // ============================================
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token was removed in another tab → logout here too
          setUser(null)
          setToken(null)
          delete axios.defaults.headers.common['Authorization']
        } else if (e.newValue !== token) {
          // Token changed → reload user
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            setUser(JSON.parse(storedUser))
            setToken(e.newValue)
            axios.defaults.headers.common['Authorization'] = `Bearer ${e.newValue}`
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [token])

  // ============================================
  // 📦 CONTEXT VALUE
  // ============================================
  const value = {
    // State
    user,
    token,
    loading,
    error,

    // Auth status
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',

    // Methods
    login,
    logout,
    updateUser,
    clearSession,

    // Permission helpers
    hasRole,
    hasAnyRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================
// 🎯 CUSTOM HOOK
// ============================================
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error(
      '❌ useAuth must be used within an AuthProvider. ' +
      'Wrap your App component with <AuthProvider>.'
    )
  }
  
  return context
}

// ============================================
// 🎁 ADDITIONAL EXPORTS
// ============================================
export default AuthContext