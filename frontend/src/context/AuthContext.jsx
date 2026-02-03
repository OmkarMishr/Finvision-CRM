import { createContext, useContext, useReducer, useEffect } from 'react'

const AuthContext = createContext()

// Mock initial state (replace with real auth later)
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  role: 'admin', // admin, staff, student
  loading: true
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token)
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        role: action.payload.role,
        loading: false
      }
    case 'LOGOUT':
      localStorage.removeItem('token')
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        role: null,
        loading: false
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check token on app start
  useEffect(() => {
    if (state.token) {
      // Verify token with backend
      dispatch({ type: 'LOGIN_SUCCESS', payload: {
        token: state.token,
        user: { name: 'Admin', email: 'admin@nalmifx.com' },
        role: 'admin'
      }})
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = (email, password) => {
    // Mock login (replace with real API call)
    return new Promise((resolve) => {
      setTimeout(() => {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: 'mock-jwt-token',
            user: { name: 'Admin User', email },
            role: 'admin'
          }
        })
        resolve()
      }, 1000)
    })
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ 
      ...state, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
