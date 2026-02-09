import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp } from 'lucide-react';

const BranchPerformance = ({ branches }) => {
  const [branchData, setBranchData] = useState([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockData = branches.map(branch => ({
      name: branch,
      leads: Math.floor(Math.random() * 100) + 20,
      students: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 500000) + 100000,
      conversion: (Math.random() * 30 + 10).toFixed(1)
    }));

    setBranchData(mockData);
  }, [branches]);

  const maxRevenue = Math.max(...branchData.map(b => b.revenue));

  return (
    <div className="space-y-4">
      {branchData.map((branch, index) => (
        <div key={branch.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-800">{branch.name}</h4>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{branch.conversion}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-600">Leads</p>
              <p className="text-lg font-bold text-gray-800">{branch.leads}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Students</p>
              <p className="text-lg font-bold text-blue-600">{branch.students}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Revenue</p>
              <p className="text-lg font-bold text-green-600">
                ₹{(branch.revenue / 100000).toFixed(1)}L
              </p>
            </div>
          </div>

          {/* Revenue Progress Bar */}
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(branch.revenue / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BranchPerformance;
