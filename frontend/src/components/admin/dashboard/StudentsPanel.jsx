import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Plus, Eye, Edit2, Trash2,
  RefreshCw, Download, ChevronLeft, ChevronRight,
  GraduationCap, UserCheck, UserX, DollarSign, Phone,
  Mail, Calendar, BookOpen, X, CheckCircle, XCircle
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';
import ExportButton from '../../common/ExportButton';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
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

// ─── Student Detail Modal ─────────────────────────────────────────────────────
const StudentModal = ({ student, onClose }) => {
  if (!student) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Student Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#C8294A]/10 flex items-center justify-center">
              {student.photo ? (
                <img src={student.photo} alt={student.fullName}
                  className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <GraduationCap className="w-8 h-8 text-[#C8294A]" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">{student.fullName}</h3>
              <p className="text-sm text-gray-500">ID: {student._id?.slice(-8).toUpperCase()}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                student.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {student.status === 'active'
                  ? <CheckCircle className="w-3 h-3" />
                  : <XCircle className="w-3 h-3" />
                }
                {student.status || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Phone,       label: 'Mobile',      value: student.mobile         },
              { icon: Mail,        label: 'Email',       value: student.email          },
              { icon: BookOpen,    label: 'Batch Type',  value: student.batchType      },
              { icon: Users,       label: 'Batch',       value: student.batch?.name || student.batchName || 'N/A' },
              { icon: Calendar,    label: 'Joined',      value: student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN') : 'N/A' },
              { icon: GraduationCap, label: 'Course',    value: student.course || 'N/A' },
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

          {/* Fee Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#C8294A]" /> Fee Summary
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-gray-500">Total Fees</p>
                <p className="text-base font-bold text-[#1a1a1a]">₹{(student.totalFees || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-base font-bold text-green-600">₹{(student.paidFees || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-base font-bold text-red-500">₹{(student.pendingFees || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main StudentsPanel ───────────────────────────────────────────────────────
const StudentsPanel = () => {
  const [students,       setStudents]       = useState([]);
  const [stats,          setStats]          = useState({ total: 0, active: 0, inactive: 0, free: 0, paid: 0 });
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterBatch,    setFilterBatch]    = useState('all');
  const [currentPage,    setCurrentPage]    = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);

  const PER_PAGE = 10;

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.students.base);
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.data) ? res.data.data
        : res.data?.students || [];
      setStudents(data);
    } catch (e) {
      console.error('Error fetching students:', e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.students.stats);
      const data = res.data.data || res.data || {};
      setStats({
        total:    data.total    || data.totalStudents  || 0,
        active:   data.active   || data.activeStudents || 0,
        inactive: data.inactive || 0,
        free:     data.freeBatch || 0,
        paid:     data.paidBatch || 0,
      });
    } catch (e) {
      console.error('Error fetching student stats:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.students.byId(id));
      setStudents(prev => prev.filter(s => s._id !== id));
      setDeleteConfirm(null);
      fetchStats();
    } catch (e) {
      console.error('Error deleting student:', e);
    }
  };

  const buildExportRows = () => ({
    headers: ['Name', 'Mobile', 'Email', 'Batch Type', 'Status', 'Total Fees', 'Paid', 'Pending', 'Joined'],
    rows: filtered.map(s => [
      s.fullName, s.mobile, s.email, s.batchType, s.status,
      s.totalFees || 0, s.paidFees || 0, s.pendingFees || 0,
      s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : ''
    ]),
  });

  // ─── Filter + Search + Paginate ──────────────────────────────────────────
  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile?.includes(search) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchBatch  = filterBatch  === 'all' || s.batchType === filterBatch;
    return matchSearch && matchStatus && matchBatch;
  });

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const getBatchBadge = (type) => {
    if (type === 'paid') return 'bg-green-100 text-green-700';
    if (type === 'free') return 'bg-[#1a1a1a]/10 text-[#1a1a1a]';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <RefreshCw className="w-10 h-10 animate-spin text-[#C8294A] mb-3" />
      <p className="text-gray-500 text-sm">Loading Students...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Student Management</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} students enrolled</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={fetchStudents}
            className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2d2d2d] flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <ExportButton
            filename="Students"
            title="Student Management"
            getRows={buildExportRows}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Students" value={stats.total}    bg="bg-[#C8294A]"   />
        <StatCard icon={UserCheck}     label="Active"         value={stats.active}   bg="bg-green-600"  />
        <StatCard icon={UserX}         label="Inactive"       value={stats.inactive} bg="bg-[#1a1a1a]"  />
        <StatCard icon={DollarSign}    label="Paid Batch"     value={stats.paid}     bg="bg-orange-500" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Batch Filter */}
        <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="all">All Batches</option>
          <option value="free">Free Batch</option>
          <option value="paid">Paid Batch</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student', 'Contact', 'Batch', 'Status', 'Fees', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No students found</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : paginated.map(student => (
                <tr key={student._id} className="hover:bg-gray-50 transition-colors">

                  {/* Student Name + Avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0">
                        {student.photo
                          ? <img src={student.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                          : <span className="text-[#C8294A] text-xs font-bold">
                              {student.fullName?.charAt(0).toUpperCase()}
                            </span>
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a1a]">{student.fullName}</p>
                        <p className="text-xs text-gray-400">#{student._id?.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-[#1a1a1a]">{student.mobile}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </td>

                  {/* Batch */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getBatchBadge(student.batchType)}`}>
                      {student.batchType || 'N/A'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {student.status === 'active'
                        ? <CheckCircle className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />
                      }
                      {student.status || 'N/A'}
                    </span>
                  </td>

                  {/* Fees */}
                  <td className="px-4 py-3">
                    <p className="text-green-600 font-medium text-xs">
                      ₹{(student.paidFees || 0).toLocaleString()} paid
                    </p>
                    <p className="text-red-500 text-xs">
                      ₹{(student.pendingFees || 0).toLocaleString()} pending
                    </p>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString('en-IN')
                      : 'N/A'
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedStudent(student)}
                        className="p-1.5 hover:bg-[#C8294A]/10 hover:text-[#C8294A] text-gray-400 rounded-lg transition-colors"
                        title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(student)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors"
                        title="Delete Student">
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
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
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
                <h3 className="font-bold text-[#1a1a1a]">Delete Student</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-[#1a1a1a]">{deleteConfirm.fullName}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPanel;
