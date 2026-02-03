import { Search, X } from 'lucide-react'
import { useState } from 'react'

const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  const [focused, setFocused] = useState(false)

  return (
    <div className={cn('relative group', className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full h-12 pl-12 pr-12 rounded-2xl border-2 bg-white/80 backdrop-blur-sm transition-all duration-200 group-focus-within:border-blue-500 group-focus-within:ring-4 group-focus-within:ring-blue-500/20"
        placeholder={placeholder}
      />
      
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-900" />
        </button>
      )}
    </div>
  )
}

export default SearchBar
