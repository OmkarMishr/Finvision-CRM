import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [])

  const variants = {
    success: 'bg-green-500 border-green-400 text-white',
    error: 'bg-red-500 border-red-400 text-white',
    warning: 'bg-orange-500 border-orange-400 text-white',
    info: 'bg-blue-500 border-blue-400 text-white'
  }

  if (!visible) return null

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className={cn(
        'max-w-md w-full bg-white/95 backdrop-blur-xl shadow-2xl border rounded-2xl overflow-hidden transform translate-x-0',
        variants[type]
      )}>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${type === 'success' ? 'bg-green-400' : type === 'error' ? 'bg-red-400' : 'bg-blue-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-6">{message}</p>
            </div>
            <button
              onClick={() => {
                setVisible(false)
                setTimeout(onClose, 300)
              }}
              className="flex-shrink-0 p-1.5 -m-1.5 ml-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Toast
