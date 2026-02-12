import { useState, useEffect } from 'react';
import {
  Award,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  FileText,
  CheckCircle,
  Users,
  BarChart,
  Menu,
  Bell
} from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';
import Sidebar from '../layout/Sidebar'; 
import { useAuth } from '../../context/AuthContext';

const CertificatesManagement = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    avgAttendance: 0,
    byBatch: {}
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.certificates.getAll);

      if (response.data.success) {
        const certs = response.data.data || [];
        setCertificates(certs);
        calculateStats(certs);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (certs) => {
    const total = certs.length;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = certs.filter(
      (c) => new Date(c.issuedDate) >= firstDayOfMonth
    ).length;

    const avgAttendance =
      certs.reduce((sum, c) => sum + (c.attendancePercentage || 0), 0) / (total || 1);

    const byBatch = certs.reduce((acc, c) => {
      const batch = c.studentId?.batchType || 'Unknown';
      acc[batch] = (acc[batch] || 0) + 1;
      return acc;
    }, {});

    setStats({ total, thisMonth, avgAttendance: avgAttendance.toFixed(2), byBatch });
  };

  const filteredCertificates = certificates.filter((cert) => {
    const student = cert.studentId;
    const matchesSearch =
      searchTerm === '' ||
      student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch =
      filterBatch === 'all' || student?.batchType === filterBatch;

    const matchesCourse =
      filterCourse === 'all' || student?.courseCategory === filterCourse;

    return matchesSearch && matchesBatch && matchesCourse;
  });

  const uniqueBatches = [
    ...new Set(certificates.map((c) => c.studentId?.batchType).filter(Boolean)),
  ];
  const uniqueCourses = [
    ...new Set(certificates.map((c) => c.studentId?.courseCategory).filter(Boolean)),
  ];

  const exportToCSV = () => {
    const headers = [
      'Certificate No',
      'Student Name',
      'Admission No',
      'Course',
      'Batch Type',
      'Total Classes',
      'Present Classes',
      'Attendance %',
      'Issue Date',
    ];

    const rows = filteredCertificates.map((cert) => [
      cert.certificateNo,
      cert.studentId?.fullName || 'N/A',
      cert.studentId?.admissionNumber || 'N/A',
      cert.studentId?.courseCategory || 'N/A',
      cert.studentId?.batchType || 'N/A',
      cert.totalClasses,
      cert.presentClasses,
      cert.attendancePercentage.toFixed(2),
      new Date(cert.issuedDate).toLocaleDateString('en-IN'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-0 lg:ml-72">
          <div className="flex flex-col items-center justify-center h-screen">
            <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-600">Loading Certificates...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ✅ SIDEBAR */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ✅ MAIN CONTENT WITH MARGIN FOR SIDEBAR */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-0 lg:ml-72">
        {/* ✅ HEADER WITH MOBILE MENU BUTTON */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>

                <img src="/assets/images/finvision-logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Certificates Management</h2>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.[0] || user?.name?.[0] || 'A'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ PAGE CONTENT */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-600" />
                Certificates Issued
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and view all issued course completion certificates
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={fetchCertificates}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Certificates</p>
                  <h3 className="text-4xl font-bold mt-2">{stats.total}</h3>
                </div>
                <div className="bg-purple-400 bg-opacity-30 p-3 rounded-lg">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm font-medium">This Month</p>
                  <h3 className="text-4xl font-bold mt-2">{stats.thisMonth}</h3>
                </div>
                <div className="bg-blue-400 bg-opacity-30 p-3 rounded-lg">
                  <Calendar className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm font-medium">Avg Attendance</p>
                  <h3 className="text-4xl font-bold mt-2">{stats.avgAttendance}%</h3>
                </div>
                <div className="bg-green-400 bg-opacity-30 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Batches</p>
                  <h3 className="text-4xl font-bold mt-2">{Object.keys(stats.byBatch).length}</h3>
                </div>
                <div className="bg-orange-400 bg-opacity-30 p-3 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, admission no, certificate no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Batches</option>
                {uniqueBatches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>

              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Certificate No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Student Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Course & Batch</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Attendance</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Issue Date</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No certificates found</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Certificates will appear here once students complete their courses
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map((cert) => (
                      <tr key={cert._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {cert.certificateNo}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                              {cert.studentId?.fullName?.[0] || 'S'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {cert.studentId?.fullName || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {cert.studentId?.admissionNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {cert.studentId?.courseCategory || 'N/A'}
                            </p>
                            <span
                              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                cert.studentId?.batchType === 'Free'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {cert.studentId?.batchType || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={`text-2xl font-bold ${
                                cert.attendancePercentage >= 90
                                  ? 'text-green-600'
                                  : cert.attendancePercentage >= 75
                                  ? 'text-blue-600'
                                  : 'text-orange-600'
                              }`}
                            >
                              {cert.attendancePercentage.toFixed(1)}%
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {cert.presentClasses}/{cert.totalClasses} classes
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <Calendar className="w-5 h-5 text-gray-400 mb-1" />
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(cert.issuedDate).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => window.open(`/api/certificates/download?studentId=${cert.studentId?._id}`, '_blank')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 mx-auto shadow-md hover:shadow-lg"
                          >
                            <Download className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Batch Distribution */}
          {Object.keys(stats.byBatch).length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart className="w-6 h-6 text-purple-600" />
                Certificates by Batch Type
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byBatch).map(([batch, count]) => (
                  <div
                    key={batch}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200"
                  >
                    <p className="text-sm text-gray-600 mb-1">{batch}</p>
                    <p className="text-3xl font-bold text-purple-600">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CertificatesManagement;
