import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const getAccessToken = () => {
    return localStorage.getItem('accessToken')
  }

  const checkAuth = async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else if (response.status === 401) {
        // Token expired, try to refresh
        await refreshToken()
      } else {
        throw new Error('Failed to fetch user data')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('accessToken')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    navigate('/dashboard')
  }

  const register = async (email: string, password: string, name?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()
    localStorage.setItem('accessToken', data.accessToken)
    setUser(data.user)
    navigate('/dashboard')
  }

  const logout = async () => {
    const token = getAccessToken()
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }
    localStorage.removeItem('accessToken')
    setUser(null)
    navigate('/login')
  }

  const refreshToken = async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      return
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      localStorage.setItem('accessToken', data.accessToken)
      setUser(data.user)
    } catch (error) {
      console.error('Token refresh failed:', error)
      localStorage.removeItem('accessToken')
      setUser(null)
      navigate('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 