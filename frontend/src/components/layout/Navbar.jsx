import { Bell, Search, ChevronDown } from 'lucide-react'

const Navbar = () => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Search */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students, staff, fees..."
              className="pl-12 pr-4 py-2 w-80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
          </button>

          <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="hidden md:block">
              <p className="font-medium text-gray-900">Admin</p>
              <p className="text-sm text-gray-500">Super Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar
