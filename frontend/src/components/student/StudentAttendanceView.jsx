import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Award, AlertCircle, RefreshCw } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const StudentAttendanceView = ({ studentId }) => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchAttendance();
    } else {
      setLoading(false);
      setError('Student ID not found');
    }
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching attendance for student:', studentId);
      
      const response = await axiosInstance.get(
        API_ENDPOINTS.studentAttendance.byStudent(studentId)
      );
      
      console.log('Attendance response:', response.data);
      
      setAttendance(response.data.data || []);
      setStats(response.data.statistics || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        percentage: 0
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error.response?.data?.message || 'Failed to load attendance data');
      
      // Set empty data on error
      setAttendance([]);
      setStats({
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        percentage: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'text-green-600 bg-green-50';
      case 'Absent': return 'text-red-600 bg-red-50';
      case 'Late': return 'text-yellow-600 bg-yellow-50';
      case 'Half Day': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isCertificateEligible = stats && parseFloat(stats.percentage) >= 75;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Attendance</h3>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchAttendance}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500 text-sm">Attendance data is not available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attended</p>
              <p className="text-3xl font-bold text-green-600">{stats.present || 0}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance %</p>
              <p className="text-3xl font-bold text-blue-600">{stats.percentage || 0}%</p>
            </div>
            <AlertCircle className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Certificate</p>
              <p className={`text-sm font-semibold ${isCertificateEligible ? 'text-green-600' : 'text-red-600'}`}>
                {isCertificateEligible ? 'Eligible ✓' : 'Not Eligible'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Need 75%</p>
            </div>
            <Award className={`w-10 h-10 ${isCertificateEligible ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>

      {/* Attendance Progress Bar */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Progress</h3>
          <span className="text-sm font-medium text-gray-700">{stats.percentage || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6">
          <div
            className={`h-6 rounded-full transition-all duration-500 flex items-center justify-center ${
              parseFloat(stats.percentage || 0) >= 75 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              parseFloat(stats.percentage || 0) >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${stats.percentage || 0}%` }}
          >
            {parseFloat(stats.percentage || 0) > 10 && (
              <span className="text-white text-xs font-semibold">{stats.percentage || 0}%</span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {isCertificateEligible 
            ? '✓ You meet the minimum attendance requirement for certificate' 
            : `⚠ You need ${(75 - parseFloat(stats.percentage || 0)).toFixed(1)}% more attendance to be eligible for certificate`
          }
        </p>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <button
              onClick={fetchAttendance}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Slot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No attendance records found</p>
                      <p className="text-sm text-gray-400 mt-1">Your attendance will appear here once classes begin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {new Date(record.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        record.batchType === 'Free' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.batchType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.course}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.timeSlot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {attendance.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{attendance.length}</span> record{attendance.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceView;
