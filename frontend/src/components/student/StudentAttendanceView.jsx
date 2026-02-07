import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Award, AlertCircle } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { STUDENT_ATTENDANCE_ENDPOINTS } from '../../config/api';

const StudentAttendanceView = ({ studentId }) => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        STUDENT_ATTENDANCE_ENDPOINTS.GET_BY_STUDENT(studentId)
      );
      
      setAttendance(response.data.data);
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Error fetching attendance:', error);
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
    return <div className="p-6 text-center">Loading attendance...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attended</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance %</p>
                <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Certificate</p>
                <p className={`text-sm font-semibold ${isCertificateEligible ? 'text-green-600' : 'text-red-600'}`}>
                  {isCertificateEligible ? 'Eligible' : 'Not Eligible'}
                </p>
                <p className="text-xs text-gray-500">Need 75%</p>
              </div>
              <Award className={`w-8 h-8 ${isCertificateEligible ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Attendance Progress Bar */}
      {stats && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Attendance Progress</span>
            <span className="text-sm font-medium text-gray-700">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                parseFloat(stats.percentage) >= 75 ? 'bg-green-500' :
                parseFloat(stats.percentage) >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isCertificateEligible 
              ? '✓ You meet the minimum attendance requirement' 
              : `⚠ You need ${(75 - parseFloat(stats.percentage)).toFixed(1)}% more to be eligible for certificate`
            }
          </p>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
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
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.batchType === 'Free' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.batchType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.course}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.timeSlot}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
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
      </div>
    </div>
  );
};

export default StudentAttendanceView;
