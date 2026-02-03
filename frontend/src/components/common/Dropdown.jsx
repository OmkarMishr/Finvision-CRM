import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const Dropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option',
  className = '' 
}) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-12 px-4 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 transition-all"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 z-20 max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className="w-full text-left px-6 py-3 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dropdown
