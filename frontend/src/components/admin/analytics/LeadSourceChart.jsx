import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

const LeadSourceChart = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadSources();
  }, []);

  const fetchLeadSources = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.leads.base);
      const leads = response.data.data || [];

      // Group by source
      const sourceCount = {};
      leads.forEach(lead => {
        const source = lead.leadSource || 'Unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });

      // Convert to array and sort
      const sourceArray = Object.entries(sourceCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setSources(sourceArray);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500'
  ];

  const total = sources.reduce((sum, s) => sum + s.count, 0);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {sources.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No lead source data available</p>
      ) : (
        <>
          {/* Pie Chart Visualization (Simple) */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                {sources.map((source, index) => {
                  const percentage = (source.count / total) * 100;
                  const offset = sources
                    .slice(0, index)
                    .reduce((sum, s) => sum + (s.count / total) * 100, 0);

                  return (
                    <circle
                      key={source.name}
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="32"
                      strokeDasharray={`${percentage * 5.03} 503`}
                      strokeDashoffset={-offset * 5.03}
                      className={colors[index % colors.length].replace('bg-', 'text-')}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-800">{total}</p>
                  <p className="text-sm text-gray-600">Total Leads</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-3">
            {sources.map((source, index) => (
              <div key={source.name} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{source.name}</p>
                  <p className="text-xs text-gray-500">
                    {source.count} ({((source.count / total) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LeadSourceChart;
