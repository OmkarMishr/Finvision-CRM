import { cn } from '../../utils/helpers'

const Input = ({ 
  type = 'text', 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          type={type}
          className={cn(
            'w-full h-12 px-4 pl-11 rounded-2xl border-2 bg-white/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20',
            error ? 'border-red-300 bg-red-50/50 focus:border-red-400' : 'border-gray-200 focus:border-blue-500',
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

export default Input
