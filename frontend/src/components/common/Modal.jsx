import { useEffect } from 'react'
import { X } from 'lucide-react'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={cn('bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transform animate-in fade-in zoom-in duration-200', sizes[size])}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-8 py-6 rounded-b-3xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button className="btn-primary px-6 py-2.5">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
