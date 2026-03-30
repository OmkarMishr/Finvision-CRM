import React, { useState, useEffect } from 'react';
import { Building2, TrendingUp } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

const BranchPerformance = ({ branches }) => {
  const [branchData, setBranchData] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!branches?.length) return;

    const fetchBranchData = async () => {
      setLoading(true);
      try {
        // Fetch leads and students in parallel
        const [leadsRes, studentsRes] = await Promise.all([
          axiosInstance.get(API_ENDPOINTS.leads.base),
          axiosInstance.get(API_ENDPOINTS.students.base),
        ]);

        const allLeads = Array.isArray(leadsRes.data)
          ? leadsRes.data
          : leadsRes.data?.data || leadsRes.data?.leads || [];

        const allStudents = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : studentsRes.data?.data || studentsRes.data?.students || [];

        const data = branches.map(branch => {
          // Match leads by branch field (case-insensitive)
          const branchLeads = allLeads.filter(l =>
            l.branch?.toLowerCase() === branch.toLowerCase() ||
            l.city?.toLowerCase()   === branch.toLowerCase() ||
            l.location?.toLowerCase() === branch.toLowerCase()
          );

          const branchStudents = allStudents.filter(s =>
            s.branch?.toLowerCase()   === branch.toLowerCase() ||
            s.city?.toLowerCase()     === branch.toLowerCase() ||
            s.location?.toLowerCase() === branch.toLowerCase()
          );

          const converted = branchLeads.filter(l => l.stage === 'Admission').length;
          const conversionRate = branchLeads.length > 0
            ? ((converted / branchLeads.length) * 100).toFixed(1)
            : '0.0';

          // Sum actual revenue from students
          const revenue = branchStudents.reduce((sum, s) => {
            return sum + (s.totalFeePaid || s.paidAmount || s.feePaid || 0);
          }, 0);

          return {
            name:       branch,
            leads:      branchLeads.length,
            students:   branchStudents.length,
            revenue,
            conversion: conversionRate,
          };
        });

        setBranchData(data);
      } catch (e) {
        console.error('BranchPerformance fetch error:', e);
        // Fallback: show branches with zero data rather than crashing
        setBranchData(branches.map(b => ({
          name: b, leads: 0, students: 0, revenue: 0, conversion: '0.0'
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchBranchData();
  }, [branches]);

  const maxRevenue = Math.max(...branchData.map(b => b.revenue), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
      Loading branch data...
    </div>
  );

  return (
    <div className="space-y-4">
      {branchData.map(branch => (
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
                {branch.revenue >= 100000
                  ? `₹${(branch.revenue / 100000).toFixed(1)}L`
                  : `₹${(branch.revenue / 1000).toFixed(1)}K`}
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