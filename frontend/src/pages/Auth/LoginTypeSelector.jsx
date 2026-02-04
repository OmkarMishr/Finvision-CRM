import { useState } from 'react'
import { ArrowRight, User, Users, Shield, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'

const LoginTypeSelector = () => {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState(null)

  const loginTypes = [
    {
      type: 'admin',
      title: 'Admin Panel',
      description: 'Manage students, staff, fees, attendance & institute settings',
      icon: Shield,
      color: 'from-indigo-500 to-purple-600',
      users: 'For Institute Admins'
    },
    {
      type: 'staff',
      title: 'Staff Portal', 
      description: 'Manage classes, attendance, student records & reports',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      users: 'For Teachers & Staff'
    },
    {
      type: 'student',
      title: 'Student Portal',
      description: 'View fees, attendance, grades, certificates & announcements',
      icon: User,
      color: 'from-blue-500 to-cyan-600',
      users: 'For Students'
    }
  ]

  const handleSelectType = (type) => {
    setSelectedType(type)
    // Auto-redirect to login after selection (or keep selection flow)
    setTimeout(() => {
      navigate(`/login?type=${type}`)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-3xl shadow-2xl border border-white/50 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">F</span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                FINVISION CRM
              </h1>
              <p className="text-lg text-gray-600 mt-2">Select your login type</p>
            </div>
          </div>
        </div>

        {/* Login Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loginTypes.map((loginType, index) => {
            const Icon = loginType.icon
            const isSelected = selectedType === loginType.type
            
            return (
              <div
                key={index}
                className={`group relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-gray-200 cursor-pointer ${
                  isSelected ? 'ring-4 ring-blue-500/20 shadow-2xl scale-105' : 'hover:scale-105'
                }`}
                onClick={() => handleSelectType(loginType.type)}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white p-3 rounded-2xl shadow-lg border-4 border-white">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300 ${loginType.color}`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800">
                    {loginType.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {loginType.description}
                  </p>
                  <p className="text-sm font-semibold text-gray-500 bg-gray-100/50 px-3 py-1 rounded-xl inline-block">
                    {loginType.users}
                  </p>
                </div>

                {/* Arrow */}
                <div className={`absolute bottom-6 right-6 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center transform transition-all group-hover:translate-x-2 ${isSelected ? 'bg-blue-500 text-white' : ''}`}>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Continue Button */}
        {selectedType && (
          <div className="text-center mt-16">
            <Button 
              size="xl" 
              variant="primary"
              onClick={() => navigate(`/login?type=${selectedType}`)}
              className="shadow-2xl !px-12 !py-6"
            >
              Continue to {selectedType.toUpperCase()} Login
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginTypeSelector
