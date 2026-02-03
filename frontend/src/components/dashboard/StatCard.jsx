const StatCard = ({ title, value, change, trend = 'up', color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 ring-blue-600/20',
      green: 'bg-green-100 text-green-800 ring-green-600/20',
      purple: 'bg-purple-100 text-purple-800 ring-purple-600/20',
      orange: 'bg-orange-100 text-orange-800 ring-orange-600/20'
    }
  
    return (
      <div className="card p-6 h-32 flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center ring-8 ring-white/50`}>
            <span className="font-bold text-lg">{value}</span>
          </div>
          <div className={`w-3 h-3 rounded-full ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-center gap-1">
            <span className="font-bold text-xl">{value}</span>
            <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  export default StatCard
  