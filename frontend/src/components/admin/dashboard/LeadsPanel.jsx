import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Eye, Trash2, RefreshCw, Download,
  ChevronLeft, ChevronRight, Phone, Mail, Calendar, X,
  TrendingUp, UserCheck, MessageSquare, Clock, CheckCircle,
  XCircle, AlertCircle, User
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

// ─── Stage Badge Config ───────────────────────────────────────────────────────
const STAGE_CONFIG = {
  'Enquiry':     { color: 'bg-gray-100 text-gray-700',    dot: 'bg-gray-400'   },
  'Counselling': { color: 'bg-[#C8294A]/10 text-[#C8294A]', dot: 'bg-[#C8294A]' },
  'Free Batch':  { color: 'bg-[#1a1a1a]/10 text-[#1a1a1a]', dot: 'bg-[#1a1a1a]' },
  'Paid Batch':  { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  'Admission':   { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
};

const StageBadge = ({ stage }) => {
  const cfg = STAGE_CONFIG[stage] || { color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {stage || 'Unknown'}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, bg }) => (
  <div className={`${bg} text-white p-5 rounded-xl shadow-lg flex justify-between items-start`}>
    <div>
      <p className="text-white/80 text-sm font-medium">{label}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
    </div>
    <div className="bg-white/20 p-2.5 rounded-lg">
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

// ─── Lead Detail Modal ────────────────────────────────────────────────────────
const LeadModal = ({ lead, onClose }) => {
  if (!lead) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Lead Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Profile Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C8294A]/10 flex items-center justify-center">
                <span className="text-[#C8294A] text-xl font-bold">
                  {lead.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a]">{lead.fullName}</h3>
                <p className="text-sm text-gray-500">#{lead._id?.slice(-8).toUpperCase()}</p>
              </div>
            </div>
            <StageBadge stage={lead.stage} />
          </div>

          {/* Contact & Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Phone,    label: 'Mobile',      value: lead.mobile                          },
              { icon: Mail,     label: 'Email',        value: lead.email                           },
              { icon: User,     label: 'Assigned To',  value: lead.assignedTo?.name || lead.counselor || 'Unassigned' },
              { icon: Users,    label: 'Source',       value: lead.source || 'N/A'                },
              { icon: Calendar, label: 'Created',      value: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : 'N/A' },
              { icon: Clock,    label: 'Last Updated', value: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('en-IN') : 'N/A' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Icon className="w-4 h-4 text-[#C8294A] shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lead Stage Pipeline */}
          <div>
            <h4 className="font-semibold text-[#1a1a1a] mb-3 text-sm">Lead Pipeline</h4>
            <div className="flex items-center gap-1">
              {['Enquiry', 'Counselling', 'Free Batch', 'Paid Batch', 'Admission'].map((stage, idx, arr) => {
                const stages   = ['Enquiry', 'Counselling', 'Free Batch', 'Paid Batch', 'Admission'];
                const current  = stages.indexOf(lead.stage);
                const thisIdx  = stages.indexOf(stage);
                const isPassed = thisIdx <= current;
                return (
                  <React.Fragment key={stage}>
                    <div className={`flex-1 text-center py-1.5 px-1 rounded text-xs font-medium transition-colors ${
                      isPassed ? 'bg-[#C8294A] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {stage}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-3 h-0.5 shrink-0 ${isPassed && thisIdx < current ? 'bg-[#C8294A]' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Remarks Timeline */}
          {lead.remarks?.length > 0 && (
            <div>
              <h4 className="font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-[#C8294A]" />
                Remarks ({lead.remarks.length})
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {[...lead.remarks]
                  .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
                  .map((remark, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-[#C8294A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-[#1a1a1a]">{remark.addedBy || 'Staff'}</p>
                          <span className="text-xs text-gray-400 shrink-0">
                            {remark.timestamp || remark.createdAt
                              ? new Date(remark.timestamp || remark.createdAt).toLocaleDateString('en-IN')
                              : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{remark.text}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main LeadsPanel ──────────────────────────────────────────────────────────
const LeadsPanel = () => {
  const [leads,          setLeads]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterStage,    setFilterStage]    = useState('all');
  const [filterStaff,    setFilterStaff]    = useState('all');
  const [filterSource,   setFilterSource]   = useState('all');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [selectedLead,   setSelectedLead]   = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);

  const PER_PAGE = 10;

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.leads.base);
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.data) ? res.data.data
        : res.data?.leads || [];
      setLeads(data);
    } catch (e) {
      console.error('Error fetching leads:', e);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.leads.byId(id));
      setLeads(prev => prev.filter(l => l._id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Error deleting lead:', e);
    }
  };

  // ─── Derived Lists for Filters ──────────────────────────────────────────
  const staffList = [...new Set(
    leads
      .map(l => l.assignedTo?.name || l.counselor || null)
      .filter(Boolean)
  )].sort();

  const sourceList = [...new Set(
    leads.map(l => l.source).filter(Boolean)
  )].sort();

  // ─── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    total:       leads.length,
    enquiry:     leads.filter(l => l.stage === 'Enquiry').length,
    counselling: leads.filter(l => l.stage === 'Counselling').length,
    converted:   leads.filter(l => l.stage === 'Admission').length,
    conversionRate: leads.length > 0
      ? ((leads.filter(l => l.stage === 'Admission').length / leads.length) * 100).toFixed(1)
      : 0
  };

  // ─── Filter + Search + Paginate ──────────────────────────────────────────
  const filtered = leads.filter(l => {
    const staffName = l.assignedTo?.name || l.counselor || '';
    const matchSearch = !search ||
      l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      l.mobile?.includes(search) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage  = filterStage  === 'all' || l.stage   === filterStage;
    const matchStaff  = filterStaff  === 'all' || staffName === filterStaff;
    const matchSource = filterSource === 'all' || l.source  === filterSource;
    return matchSearch && matchStage && matchStaff && matchSource;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const exportCSV = () => {
    const headers = ['Name', 'Mobile', 'Email', 'Stage', 'Source', 'Assigned To', 'Remarks Count', 'Created'];
    const rows = filtered.map(l => [
      l.fullName, l.mobile, l.email, l.stage, l.source || '',
      l.assignedTo?.name || l.counselor || 'Unassigned',
      l.remarks?.length || 0,
      l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : ''
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `Leads_${filterStaff !== 'all' ? filterStaff + '_' : ''}${new Date().toISOString().split('T')[0]}.csv`
    });
    a.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <RefreshCw className="w-10 h-10 animate-spin text-[#C8294A] mb-3" />
      <p className="text-gray-500 text-sm">Loading Leads...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Lead Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stats.total} total leads · {stats.conversionRate}% conversion rate
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={fetchLeads}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Total Leads"  value={stats.total}          bg="bg-[#C8294A]"   />
        <StatCard icon={Phone}       label="Enquiry"      value={stats.enquiry}        bg="bg-[#1a1a1a]"   />
        <StatCard icon={UserCheck}   label="Counselling"  value={stats.counselling}    bg="bg-orange-500"  />
        <StatCard icon={CheckCircle} label="Converted"    value={stats.converted}      bg="bg-green-600"   />
      </div>

      {/* Stage Pipeline Summary */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pipeline Overview</h3>
        <div className="grid grid-cols-5 gap-2">
          {['Enquiry', 'Counselling', 'Free Batch', 'Paid Batch', 'Admission'].map(stage => {
            const count = leads.filter(l => l.stage === stage).length;
            const pct   = leads.length > 0 ? ((count / leads.length) * 100).toFixed(0) : 0;
            const cfg   = STAGE_CONFIG[stage] || { color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
            return (
              <button
                key={stage}
                onClick={() => { setFilterStage(filterStage === stage ? 'all' : stage); setCurrentPage(1); }}
                className={`p-3 rounded-xl text-center border-2 transition-all ${
                  filterStage === stage ? 'border-[#C8294A] shadow-md' : 'border-transparent hover:border-gray-200'
                } ${cfg.color}`}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-0.5">{stage}</p>
                <p className="text-xs opacity-70">{pct}%</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, mobile, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Staff Filter — KEY FEATURE */}
        <select
          value={filterStaff}
          onChange={e => { setFilterStaff(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white min-w-40"
        >
          <option value="all">All Staff</option>
          {staffList.map(staff => (
            <option key={staff} value={staff}>{staff}</option>
          ))}
          <option value="">Unassigned</option>
        </select>

        {/* Stage Filter */}
        <select
          value={filterStage}
          onChange={e => { setFilterStage(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white"
        >
          <option value="all">All Stages</option>
          {['Enquiry', 'Counselling', 'Free Batch', 'Paid Batch', 'Admission'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Source Filter */}
        {sourceList.length > 0 && (
          <select
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white"
          >
            <option value="all">All Sources</option>
            {sourceList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Staff Filter Active Banner */}
      {filterStaff !== 'all' && (
        <div className="bg-[#C8294A]/5 border border-[#C8294A]/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-[#C8294A]" />
            <span className="text-[#1a1a1a] font-medium">
              Showing leads assigned to: <strong>{filterStaff || 'Unassigned'}</strong>
            </span>
            <span className="text-gray-500">({filtered.length} leads)</span>
          </div>
          <button
            onClick={() => { setFilterStaff('all'); setCurrentPage(1); }}
            className="text-xs text-[#C8294A] hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Clear Filter
          </button>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Lead', 'Contact', 'Stage', 'Source', 'Assigned To', 'Remarks', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No leads found</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : paginated.map(lead => (
                <tr key={lead._id} className="hover:bg-gray-50 transition-colors">

                  {/* Lead Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#C8294A] text-xs font-bold">
                          {lead.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a1a]">{lead.fullName}</p>
                        <p className="text-xs text-gray-400">#{lead._id?.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-[#1a1a1a]">{lead.mobile}</p>
                    <p className="text-xs text-gray-400">{lead.email}</p>
                  </td>

                  {/* Stage */}
                  <td className="px-4 py-3">
                    <StageBadge stage={lead.stage} />
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {lead.source || '—'}
                  </td>

                  {/* Assigned Staff */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1a1a1a]/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-[#1a1a1a]" />
                      </div>
                      <span className="text-sm text-[#1a1a1a]">
                        {lead.assignedTo?.name || lead.counselor || (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Remarks Count */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">{lead.remarks?.length || 0}</span>
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {lead.createdAt
                      ? new Date(lead.createdAt).toLocaleDateString('en-IN')
                      : 'N/A'
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="p-1.5 hover:bg-[#C8294A]/10 hover:text-[#C8294A] text-gray-400 rounded-lg transition-colors"
                        title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(lead)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors"
                        title="Delete Lead">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="text-gray-400 text-sm">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#C8294A] text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}>
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a]">Delete Lead</h3>
                <p className="text-sm text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Delete lead <span className="font-semibold text-[#1a1a1a]">{deleteConfirm.fullName}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPanel;
