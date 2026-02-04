import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'

const Login = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  
  const loginType = searchParams.get('type') || 'admin'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const loginTypes = {
    admin: { title: 'Admin Panel', color: 'from-indigo-500 to-purple-600', subtitle: 'Institute Management' },
    staff: { title: 'Staff Portal', color: 'from-green-500 to-emerald-600', subtitle: 'Teaching & Records' },
    student: { title: 'Student Portal', color: 'from-blue-500 to-cyan-600', subtitle: 'Academic Dashboard' }
  }

  const currentType = loginTypes[loginType]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFormLoading(true)

    try {
      // Call AuthContext login (connects to backend later)
      await login(email, password)
      // Redirect based on role (admin → dashboard, student → student portal)
      navigate('/')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Loader size="lg" color="blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Type Selector */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 p-3 rounded-2xl hover:bg-white/50 backdrop-blur transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Change Login Type</span>
        </button>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className={`mx-auto w-20 h-20 ${currentType.color} rounded-2xl flex items-center justify-center mb-4 shadow-xl`}>
            <span className="text-2xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {currentType.title}
          </h1>
          <p className="text-gray-600">{currentType.subtitle}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg placeholder-gray-400"
                placeholder="admin@nalmifx.com"
                required
                disabled={formLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-4 pr-14 rounded-2xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-lg placeholder-gray-400"
                  placeholder="••••••••"
                  required
                  disabled={formLoading}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={formLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  disabled={formLoading}
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={formLoading}
              disabled={formLoading}
              className="!w-full !h-14 !text-lg shadow-2xl hover:shadow-3xl"
            >
              {formLoading ? 'Signing In...' : `Sign In as ${loginType.toUpperCase()}`}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 bg-white text-gray-500 tracking-wider">or</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            <button 
              disabled={formLoading}
              className="w-full h-14 flex items-center justify-center gap-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all duration-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button 
              disabled={formLoading}
              className="w-full h-14 flex items-center justify-center gap-3 border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all duration-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
              Continue with Twitter
            </button>
          </div>

          {/* Sign Up */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/signup')}
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              disabled={formLoading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
