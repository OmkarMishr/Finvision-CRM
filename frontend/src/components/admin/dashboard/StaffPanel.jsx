import React, { useState, useEffect } from 'react';
import {
  Users2, Search, Filter, Eye, Trash2, RefreshCw, Download,
  ChevronLeft, ChevronRight, X, UserCheck, UserX, Shield,
  Briefcase, Clock, CheckCircle, XCircle, User, Plus,
  Phone, Mail, Calendar
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  telecaller: { color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
  counselor:  { color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'   },
  Teacher:    { color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
};

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Customer Support', 'Finance', 'HR', 'IT', 'Operations', 'Other'
];

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || { color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {role || 'Staff'}
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

// ─── Staff Detail Modal ───────────────────────────────────────────────────────
const StaffModal = ({ staff, onClose }) => {
  if (!staff) return null;

  // User model uses firstName + lastName, name is a virtual
  const displayName = staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Staff Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#C8294A]/10 flex items-center justify-center overflow-hidden">
              {staff.profilePhoto ? (
                <img src={staff.profilePhoto} alt={displayName}
                  className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-[#C8294A] text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">{displayName}</h3>
              <p className="text-sm text-gray-500">ID: {staff._id?.slice(-8).toUpperCase()}</p>
              <div className="flex items-center gap-2 mt-1">
                {/* staffRole is the sub-role (telecaller/counselor/Teacher) */}
                <RoleBadge role={staff.staffRole} />
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  staff.isActive !== false
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {staff.isActive !== false
                    ? <><CheckCircle className="w-3 h-3" /> Active</>
                    : <><XCircle    className="w-3 h-3" /> Inactive</>
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Phone,    label: 'Phone',       value: staff.phone                                                              },
              { icon: Mail,     label: 'Email',       value: staff.email                                                             },
              { icon: Shield,   label: 'Staff Role',  value: staff.staffRole                                                         },
              { icon: Briefcase,label: 'Department',  value: staff.staffInfo?.department                                             },
              { icon: User,     label: 'Subject',     value: staff.staffInfo?.subject                                                },
              { icon: Calendar, label: 'Joined',      value: staff.staffInfo?.joiningDate
                  ? new Date(staff.staffInfo.joiningDate).toLocaleDateString('en-IN')
                  : staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString('en-IN')
                    : 'N/A'
              },
              { icon: Clock,    label: 'Last Login',  value: staff.lastLogin
                  ? new Date(staff.lastLogin).toLocaleString('en-IN')
                  : 'N/A'
              },
            ].map(({ icon: Icon, label, value }) =>
              value && value !== 'N/A' ? (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-4 h-4 text-[#C8294A] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{value}</p>
                  </div>
                </div>
              ) : null
            )}
          </div>

          {/* Staff Info extras */}
          {staff.staffInfo?.salary && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-[#1a1a1a] mb-2 text-sm">Employment Info</h4>
              <div className="grid grid-cols-2 gap-3">
                {staff.staffInfo.employeeId && (
                  <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Employee ID</p>
                    <p className="text-sm font-bold text-[#1a1a1a]">{staff.staffInfo.employeeId}</p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <p className="text-xs text-gray-500">Salary</p>
                  <p className="text-sm font-bold text-green-600">₹{staff.staffInfo.salary.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
const AddStaffModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    firstName:  '',
    lastName:   '',
    email:      '',
    password:   '',
    phone:      '',
    staffRole:  'Teacher',   // matches User schema enum: telecaller | counselor | Teacher
    department: '',
    subject:    '',
    salary:     '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post(API_ENDPOINTS.staff.create, {
        firstName:  form.firstName,
        lastName:   form.lastName,
        email:      form.email,
        password:   form.password,
        phone:      form.phone,
        staffRole:  form.staffRole,
        department: form.department || undefined,
        subject:    form.subject    || undefined,
        salary:     form.salary     ? Number(form.salary) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A]";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Add Staff Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* First Name */}
            <div>
              <label className={labelCls}>First Name *</label>
              <input required value={form.firstName} onChange={set('firstName')}
                placeholder="John" className={inputCls} />
            </div>

            {/* Last Name */}
            <div>
              <label className={labelCls}>Last Name *</label>
              <input required value={form.lastName} onChange={set('lastName')}
                placeholder="Doe" className={inputCls} />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Email *</label>
              <input required type="email" value={form.email} onChange={set('email')}
                placeholder="john@finvision.com" className={inputCls} />
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password *</label>
              <input required type="password" value={form.password} onChange={set('password')}
                placeholder="Min 6 characters" className={inputCls} />
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={set('phone')}
                placeholder="9876543210" className={inputCls} />
            </div>

            {/* Staff Role — matches User.staffRole enum */}
            <div>
              <label className={labelCls}>Staff Role *</label>
              <select value={form.staffRole} onChange={set('staffRole')}
                className={`${inputCls} bg-white`}>
                <option value="Teacher">Teacher</option>
                <option value="counselor">Counselor</option>
                <option value="telecaller">Telecaller</option>
              </select>
            </div>

            {/* Department — matches User.staffInfo.department enum */}
            <div>
              <label className={labelCls}>Department</label>
              <select value={form.department} onChange={set('department')}
                className={`${inputCls} bg-white`}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className={labelCls}>Subject</label>
              <input value={form.subject} onChange={set('subject')}
                placeholder="e.g. Algebra, Organic Chemistry" className={inputCls} />
            </div>

            {/* Salary */}
            <div className="md:col-span-2">
              <label className={labelCls}>Salary (₹)</label>
              <input type="number" value={form.salary} onChange={set('salary')}
                placeholder="e.g. 35000" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</>
                : <><Plus className="w-4 h-4" /> Add Staff</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main StaffPanel ──────────────────────────────────────────────────────────
const StaffPanel = () => {
  const [staff,         setStaff]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterRole,    setFilterRole]    = useState('all');
  const [filterDept,    setFilterDept]    = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal,  setShowAddModal]  = useState(false);

  const PER_PAGE = 10;

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.staff.base);
      const data = Array.isArray(res.data)       ? res.data
                 : Array.isArray(res.data?.data) ? res.data.data
                 : res.data?.staff               || [];
      setStaff(data);
    } catch (e) {
      console.error('Error fetching staff:', e);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.staff.delete(id));
      setStaff(prev => prev.filter(s => s._id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Error deleting staff:', e);
    }
  };

  // ─── Helper to get display name from User model ───────────────────────────
  const getName = (s) =>
    s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown';

  // ─── Derived filter lists ─────────────────────────────────────────────────
  // staffRole is the meaningful sub-role (Teacher/counselor/telecaller)
  const staffRoleList = [...new Set(staff.map(s => s.staffRole).filter(Boolean))].sort();
  const deptList      = [...new Set(staff.map(s => s.staffInfo?.department).filter(Boolean))].sort();

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total:    staff.length,
    active:   staff.filter(s => s.isActive !== false).length,
    inactive: staff.filter(s => s.isActive === false).length,
    roles:    staffRoleList.length,
  };

  // ─── Filter + Search ─────────────────────────────────────────────────────
  const filtered = staff.filter(s => {
    const name = getName(s);
    const matchSearch = !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === 'all' || s.staffRole             === filterRole;
    const matchDept   = filterDept   === 'all' || s.staffInfo?.department === filterDept;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active'   && s.isActive !== false) ||
      (filterStatus === 'inactive' && s.isActive === false);
    return matchSearch && matchRole && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const exportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Staff Role', 'Department', 'Subject', 'Status', 'Joined'];
    const rows = filtered.map(s => [
      s.firstName || '', s.lastName || '', s.email,
      s.phone || '', s.staffRole || '',
      s.staffInfo?.department || '', s.staffInfo?.subject || '',
      s.isActive !== false ? 'Active' : 'Inactive',
      s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : ''
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `Staff_${new Date().toISOString().split('T')[0]}.csv`
    }).click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <RefreshCw className="w-10 h-10 animate-spin text-[#C8294A] mb-3" />
      <p className="text-gray-500 text-sm">Loading Staff...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} staff members</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#C8294A] text-white rounded-lg hover:bg-[#a01f39] flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
          <button onClick={fetchStaff}
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
        <StatCard icon={Users2}    label="Total Staff"  value={stats.total}    bg="bg-[#C8294A]"  />
        <StatCard icon={UserCheck} label="Active"       value={stats.active}   bg="bg-green-600"  />
        <StatCard icon={UserX}     label="Inactive"     value={stats.inactive} bg="bg-[#1a1a1a]"  />
        <StatCard icon={Shield}    label="Roles"        value={stats.roles}    bg="bg-orange-500" />
      </div>

      {/* Role Breakdown — uses staffRole */}
      {staffRoleList.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">By Staff Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {staffRoleList.map(role => {
              const count = staff.filter(s => s.staffRole === role).length;
              const cfg   = ROLE_CONFIG[role] || { color: 'bg-gray-100 text-gray-600' };
              return (
                <button key={role}
                  onClick={() => { setFilterRole(filterRole === role ? 'all' : role); setCurrentPage(1); }}
                  className={`p-3 rounded-xl text-center border-2 transition-all ${
                    filterRole === role
                      ? 'border-[#C8294A] shadow-md'
                      : 'border-transparent hover:border-gray-200'
                  } ${cfg.color}`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium mt-0.5">{role}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
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

        {/* Staff Role Filter */}
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="all">All Roles</option>
          {staffRoleList.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Department Filter */}
        {deptList.length > 0 && (
          <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
            <option value="all">All Departments</option>
            {deptList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        {/* Status Filter */}
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
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
                {['Staff Member', 'Contact', 'Staff Role', 'Department', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14">
                    <Users2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No staff found</p>
                    <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : paginated.map(member => {
                const name = getName(member);
                return (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">

                    {/* Name + Avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#C8294A]/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {member.profilePhoto
                            ? <img src={member.profilePhoto} alt={name} className="w-9 h-9 rounded-full object-cover" />
                            : <span className="text-[#C8294A] text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a1a1a]">{name}</p>
                          <p className="text-xs text-gray-400">#{member._id?.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <p className="text-[#1a1a1a]">{member.phone || '—'}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </td>

                    {/* Staff Role */}
                    <td className="px-4 py-3">
                      <RoleBadge role={member.staffRole} />
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {member.staffInfo?.department || '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.isActive !== false
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {member.isActive !== false
                          ? <><CheckCircle className="w-3 h-3" /> Active</>
                          : <><XCircle    className="w-3 h-3" /> Inactive</>
                        }
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString('en-IN')
                        : '—'
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedStaff(member)}
                          className="p-1.5 hover:bg-[#C8294A]/10 hover:text-[#C8294A] text-gray-400 rounded-lg transition-colors"
                          title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(member)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors"
                          title="Delete Staff">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                    <button onClick={() => setCurrentPage(page)}
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

      {/* Modals */}
      {selectedStaff && (
        <StaffModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />
      )}

      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchStaff}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1a1a1a]">Delete Staff Member</h3>
                <p className="text-sm text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Delete{' '}
              <span className="font-semibold text-[#1a1a1a]">
                {getName(deleteConfirm)}
              </span>?
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

export default StaffPanel;
