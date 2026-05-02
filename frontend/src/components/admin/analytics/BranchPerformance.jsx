import React, { useState, useEffect, useMemo } from 'react';
import { Building2, TrendingUp } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

// BranchPerformance now accepts pre-filtered `leads` and `students` from
// OverviewPanel so it always reflects the active timeRange. If the parent
// doesn't supply them (e.g. mounted standalone), it falls back to fetching.
//
// `highlightBranch` ('all' | branch name) ring-highlights the row that
// matches the dashboard's active branch filter.
const matches = (record, branch) => {
  const target = branch.toLowerCase();
  return [record?.branch, record?.city, record?.location]
    .some(v => typeof v === 'string' && v.toLowerCase() === target);
};

const BranchPerformance = ({ branches = [], leads, students, highlightBranch = 'all' }) => {
  const [fetchedLeads,    setFetchedLeads]    = useState(null);
  const [fetchedStudents, setFetchedStudents] = useState(null);
  const [loading,         setLoading]         = useState(false);

  const needFetch = !Array.isArray(leads) || !Array.isArray(students);

  useEffect(() => {
    if (!needFetch || branches.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [lr, sr] = await Promise.all([
          axiosInstance.get(API_ENDPOINTS.leads.base),
          axiosInstance.get(API_ENDPOINTS.students.base),
        ]);
        if (cancelled) return;
        setFetchedLeads(Array.isArray(lr.data) ? lr.data : lr.data?.data || lr.data?.leads || []);
        setFetchedStudents(Array.isArray(sr.data) ? sr.data : sr.data?.data || sr.data?.students || []);
      } catch (e) {
        console.error('BranchPerformance fetch error:', e);
        if (!cancelled) { setFetchedLeads([]); setFetchedStudents([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [needFetch, branches]);

  const sourceLeads    = leads    ?? fetchedLeads    ?? [];
  const sourceStudents = students ?? fetchedStudents ?? [];

  const branchData = useMemo(() => branches.map(branch => {
    const branchLeads    = sourceLeads.filter(l => matches(l, branch));
    const branchStudents = sourceStudents.filter(s => matches(s, branch));
    const converted      = branchLeads.filter(l => l.stage === 'Admission').length;
    const conversionRate = branchLeads.length > 0
      ? ((converted / branchLeads.length) * 100).toFixed(1)
      : '0.0';
    const revenue = branchStudents.reduce(
      (sum, s) => sum + (Number(s.paidFees) || Number(s.totalFeePaid) || 0),
      0
    );
    return {
      name:       branch,
      leads:      branchLeads.length,
      students:   branchStudents.length,
      revenue,
      conversion: conversionRate,
    };
  }), [branches, sourceLeads, sourceStudents]);

  const maxRevenue = Math.max(...branchData.map(b => b.revenue), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
      Loading branch data...
    </div>
  );

  return (
    <div className="space-y-4">
      {branchData.map(branch => {
        const highlighted = highlightBranch !== 'all' &&
          branch.name.toLowerCase() === highlightBranch.toLowerCase();
        return (
          <div key={branch.name}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              highlighted ? 'ring-2 ring-[#C8294A] border-[#C8294A]/40' : ''
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">{branch.name}</h4>
                {highlighted && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C8294A]/10 text-[#C8294A] font-semibold">
                    Selected
                  </span>
                )}
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

            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(branch.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BranchPerformance;
