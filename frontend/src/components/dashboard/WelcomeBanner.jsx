const WelcomeBanner = () => {
    const stats = [
      { label: 'Total Students', value: '1,234', change: '+12%', trend: 'up', color: 'blue' },
      { label: 'Total Staff', value: '45', change: '+2%', trend: 'up', color: 'green' },
      { label: 'Total Courses', value: '120', change: '0%', trend: 'neutral', color: 'purple' },
      { label: 'Upcoming Birthdays', value: '5', change: '+1%', trend: 'up', color: 'orange' }
    ]
  
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-3xl p-8 shadow-2xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">Welcome back Admin!</h2>
            <p className="text-blue-100 text-lg">Here's what's happening with your institute today.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-right lg:text-center">
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  export default WelcomeBanner
  