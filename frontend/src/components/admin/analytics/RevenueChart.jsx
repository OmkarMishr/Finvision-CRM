import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RevenueChart = ({ timeRange }) => {
  const [chartData, setChartData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockData = {
      daily: [
        { label: 'Mon', value: 45000 },
        { label: 'Tue', value: 52000 },
        { label: 'Wed', value: 48000 },
        { label: 'Thu', value: 61000 },
        { label: 'Fri', value: 55000 },
        { label: 'Sat', value: 67000 },
        { label: 'Sun', value: 43000 }
      ],
      weekly: [
        { label: 'Week 1', value: 280000 },
        { label: 'Week 2', value: 320000 },
        { label: 'Week 3', value: 295000 },
        { label: 'Week 4', value: 350000 }
      ],
      monthly: [
        { label: 'Jan', value: 1200000 },
        { label: 'Feb', value: 1350000 },
        { label: 'Mar', value: 1280000 },
        { label: 'Apr', value: 1450000 },
        { label: 'May', value: 1520000 },
        { label: 'Jun', value: 1480000 }
      ]
    };

    const data = mockData[timeRange] || mockData.daily;
    setChartData(data);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    setTotalRevenue(total);

    // Calculate percentage change (comparing last vs previous)
    if (data.length >= 2) {
      const lastValue = data[data.length - 1].value;
      const previousValue = data[data.length - 2].value;
      const change = ((lastValue - previousValue) / previousValue) * 100;
      setPercentageChange(change);
    }
  }, [timeRange]);

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800">
            ₹{(totalRevenue / 100000).toFixed(2)}L
          </p>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>
        <div className={`flex items-center gap-1 ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {percentageChange >= 0 ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
          <span className="font-semibold">{Math.abs(percentageChange).toFixed(1)}%</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-16">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                <span className="text-white text-xs font-semibold">
                  ₹{(item.value / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
