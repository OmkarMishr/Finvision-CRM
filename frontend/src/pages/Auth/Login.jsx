import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const loginType = searchParams.get('type') || 'admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const result = await login(email, password)

      if (!result.success) {
        setError(result.message || 'Invalid email or password')
        return
      }

      // Role-based redirect
      const role = result.user.role
      
      console.log(' Login successful, redirecting...', role)

      switch (role) {
        case 'admin':
          navigate('/dashboard', { replace: true })
          break
        case 'staff':
          navigate('/staff/dashboard', { replace: true })
          break
        case 'student':
          navigate('/student/dashboard', { replace: true })
          break
        default:
          navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error(' Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const handleBackToSelector = () => {
    navigate('/')
  }

  // Get login type label
  const getLoginTypeLabel = () => {
    switch (loginType) {
      case 'admin':
        return 'Admin Panel'
      case 'staff':
        return 'Staff Portal'
      case 'student':
        return 'Student Portal'
      case 'unregistered':
        return 'Unregistered Student'
      default:
        return 'Account'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBackToSelector}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to login type</span>
        </button>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-gray-100 p-2">
            <img 
              src="/assets/images/finvision-logo.png" 
              alt="Finvision CRM Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Finvision CRM
          </h1>
          <p className="text-gray-600 text-sm">
            Sign in to {getLoginTypeLabel()}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="text-red-500 font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => alert('Forgot password feature coming soon')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-xl shadow-xl hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2026 Finvision CRM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
