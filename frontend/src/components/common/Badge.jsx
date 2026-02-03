import { cn } from '../../utils/helpers'

const Badge = ({ children, variant = 'default', className = '', size = 'md' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-orange-100 text-orange-800 border border-orange-200',
    danger: 'bg-red-100 text-red-800 border border-red-200'
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  )
}

export default Badge
