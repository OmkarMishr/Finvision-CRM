import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Bucket size that pairs naturally with the dashboard time-range filter:
//   daily   → 7 day-buckets (last 7 calendar days)
//   weekly  → 4 week-buckets (last 4 weeks)
//   monthly → 6 month-buckets (last 6 months)
const BUCKETS = {
  daily:   { count: 7, unit: 'day'   },
  weekly:  { count: 4, unit: 'week'  },
  monthly: { count: 6, unit: 'month' },
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const labelFor = (date, unit) => {
  if (unit === 'day') {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  }
  if (unit === 'week') {
    return `Wk ${date.getDate()}/${date.getMonth() + 1}`;
  }
  return date.toLocaleDateString('en-IN', { month: 'short' });
};

// Build evenly-spaced buckets ending today and sum payment amounts into them.
const buildBuckets = (payments, timeRange) => {
  const cfg    = BUCKETS[timeRange] || BUCKETS.daily;
  const buckets = [];
  const today  = startOfDay(new Date());

  for (let i = cfg.count - 1; i >= 0; i--) {
    const start = new Date(today);
    if (cfg.unit === 'day')   start.setDate(today.getDate()   - i);
    if (cfg.unit === 'week')  start.setDate(today.getDate()   - i * 7);
    if (cfg.unit === 'month') start.setMonth(today.getMonth() - i);
    buckets.push({ start, value: 0, label: labelFor(start, cfg.unit) });
  }

  for (const p of payments || []) {
    if (p.status && p.status !== 'SUCCESS' && p.status !== 'Completed') continue;
    const paid = new Date(p.paidDate || p.createdAt);
    if (isNaN(paid.getTime())) continue;
    // Pick the latest bucket whose start <= paid.
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (paid >= buckets[i].start) {
        buckets[i].value += Number(p.amount) || 0;
        break;
      }
    }
  }
  return buckets;
};

const RevenueChart = ({ timeRange = 'daily', payments = [] }) => {
  const chartData = useMemo(() => buildBuckets(payments, timeRange), [payments, timeRange]);

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  // Compare last bucket vs previous to show a trend arrow.
  let percentageChange = 0;
  if (chartData.length >= 2) {
    const last = chartData[chartData.length - 1].value;
    const prev = chartData[chartData.length - 2].value;
    percentageChange = prev === 0
      ? (last > 0 ? 100 : 0)
      : ((last - prev) / prev) * 100;
  }

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800">
            {totalRevenue >= 100000
              ? `₹${(totalRevenue / 100000).toFixed(2)}L`
              : `₹${totalRevenue.toLocaleString('en-IN')}`}
          </p>
          <p className="text-sm text-gray-600">
            Revenue · {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
          </p>
        </div>
        {chartData.length >= 2 && (
          <div className={`flex items-center gap-1 ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentageChange >= 0
              ? <TrendingUp   className="w-5 h-5" />
              : <TrendingDown className="w-5 h-5" />
            }
            <span className="font-semibold">{Math.abs(percentageChange).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-16">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                {item.value > 0 && (
                  <span className="text-white text-xs font-semibold">
                    {item.value >= 100000
                      ? `₹${(item.value / 100000).toFixed(1)}L`
                      : `₹${(item.value / 1000).toFixed(0)}K`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {totalRevenue === 0 && (
          <p className="text-xs text-gray-400 text-center pt-1">
            No payments recorded in this period.
          </p>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
