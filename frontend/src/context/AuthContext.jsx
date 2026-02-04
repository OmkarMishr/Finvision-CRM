import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)

  // optional: load from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('fv_token')
    const savedUser = localStorage.getItem('fv_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      })

      const { token, user } = res.data

      setToken(token)
      setUser(user)

      localStorage.setItem('fv_token', token)
      localStorage.setItem('fv_user', JSON.stringify(user))

      return { success: true }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message)
      return {
        success: false,
        message:
          err.response?.data?.message || 'Unable to login. Please try again.',
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('fv_token')
    localStorage.removeItem('fv_user')
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
