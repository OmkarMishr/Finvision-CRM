import { useState } from 'react'
import { ArrowRight, User, Users, Shield, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LoginTypeSelector = () => {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState(null)

  const loginTypes = [
    {
      type: 'student',
      title: 'Student Login',
      icon: User,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      type: 'staff',
      title: 'Staff Login', 
      icon: User,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      type: 'admin',
      title: 'Admin Login',
      icon: Shield,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      type: 'unregistered',
      title: 'Unregistered Student',
      icon: UserPlus,
      gradient: 'from-blue-500 to-blue-600'
    }
  ]

  const handleSelectType = (type) => {
    setSelectedType(type)
    setTimeout(() => {
      navigate(`/login?type=${type}`)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Header Logo */}
        <div className="text-center mb-3">
          <div className="inline-block mb-3">
            <img 
              src="/assets/images/finvision-logo.png" 
              alt="Institute Logo" 
              className="w-40 h-46 mx-auto object-contain"
            />
          </div>
        </div>

        {/* Login Type Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-5">
            <div className="flex items-center gap-3 text-white">
              <ArrowRight className="w-6 h-6" />
              <h2 className="text-xl font-semibold tracking-wide">SELECT LOGIN TYPE</h2>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loginTypes.map((loginType) => {
                const Icon = loginType.icon
                const isSelected = selectedType === loginType.type
                
                return (
                  <button
                    key={loginType.type}
                    onClick={() => handleSelectType(loginType.type)}
                    className={`group relative bg-gradient-to-r ${loginType.gradient} hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                      isSelected ? 'ring-4 ring-blue-300 scale-105' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {loginType.title}
                        </h3>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Select your role to continue to the login page
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginTypeSelector
