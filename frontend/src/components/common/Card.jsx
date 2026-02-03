import { cn } from '../../utils/helpers'

const Card = ({ children, className = '', shadow = 'default', ...props }) => {
  const shadows = {
    default: 'shadow-sm hover:shadow-md',
    elevated: 'shadow-lg hover:shadow-2xl',
    glass: 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl'
  }

  return (
    <div 
      className={cn(
        'bg-white rounded-3xl overflow-hidden transition-all duration-300',
        shadows[shadow],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
