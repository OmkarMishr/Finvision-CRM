import React, { useState, useEffect } from 'react';
import {Calendar,Users,CheckCircle,XCircle,Clock,Download,Search,Filter,Plus,RefreshCw} from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('Morning');
  const [loading, setLoading] = useState(false);
  const [showMarkForm, setShowMarkForm] = useState(false);

  const timeSlots = ['Morning', 'Afternoon', 'Evening'];

  useEffect(() => {
    fetchBatches();
    fetchAttendanceForDate();
  }, [selectedDate]);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchStudents();
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.batches.getAll);
      setBatches(response.data.batches || response.data.data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchBatchStudents = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.batches.getOne(selectedBatch));
      const batch = response.data.batch || response.data.data || {};
      setStudents(batch.enrolledStudents || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendanceForDate = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${API_ENDPOINTS.studentAttendance.getAll}?date=${selectedDate}`
      );
      setAttendanceRecords(response.data.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      const batch = batches.find(b => b._id === selectedBatch);
      if (!batch) {
        alert('Please select a batch first');
        return;
      }

      await axiosInstance.post(API_ENDPOINTS.studentAttendance.markSingle, {
        studentId,
        date: selectedDate,
        batchType: batch.batchType,
        course: batch.course,
        branch: batch.branch || 'Main',
        timeSlot: selectedTimeSlot,
        status,
        remarks: ''
      });

      alert('Attendance marked successfully!');
      fetchAttendanceForDate();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const markBulkAttendance = async () => {
    try {
      if (!selectedBatch) {
        alert('Please select a batch');
        return;
      }

      const batch = batches.find(b => b._id === selectedBatch);
      const studentsData = students.map(student => ({
        studentId: student._id,
        status: 'Present',
        remarks: ''
      }));

      await axiosInstance.post(API_ENDPOINTS.studentAttendance.markBatch, {
        date: selectedDate,
        batchType: batch.batchType,
        course: batch.course,
        branch: batch.branch || 'Main',
        timeSlot: selectedTimeSlot,
        students: studentsData
      });

      alert('Bulk attendance marked successfully!');
      fetchAttendanceForDate();
      setShowMarkForm(false);
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
      alert(error.response?.data?.message || 'Failed to mark bulk attendance');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Mark and track student attendance</p>
        </div>
        <button
          onClick={() => setShowMarkForm(!showMarkForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Mark Attendance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchName} ({batch.course})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Slot
            </label>
            <select
              value={selectedTimeSlot}
              onChange={(e) => setSelectedTimeSlot(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchAttendanceForDate}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Mark Attendance Form */}
      {showMarkForm && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Mark Attendance</h3>
          
          {!selectedBatch ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Please select a batch to mark attendance</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No students enrolled in this batch</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students.map(student => {
                  const hasAttendance = attendanceRecords.find(
                    a => a.studentId?._id === student._id && a.timeSlot === selectedTimeSlot
                  );

                  return (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{student.fullName}</p>
                        <p className="text-sm text-gray-600">{student.admissionNumber}</p>
                      </div>
                      
                      {hasAttendance ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          hasAttendance.status === 'Present' 
                            ? 'bg-green-100 text-green-700'
                            : hasAttendance.status === 'Absent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {hasAttendance.status}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markAttendance(student._id, 'Present')}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(student._id, 'Absent')}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            <XCircle className="w-4 h-4 inline mr-1" />
                            Absent
                          </button>
                          <button
                            onClick={() => markAttendance(student._id, 'Late')}
                            className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                          >
                            <Clock className="w-4 h-4 inline mr-1" />
                            Late
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={markBulkAttendance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => setShowMarkForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Attendance Records for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Admission No.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Course</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time Slot</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendanceRecords.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {record.studentId?.fullName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.studentId?.admissionNumber || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.course}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.timeSlot}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'Present' 
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'Absent'
                            ? 'bg-red-100 text-red-700'
                            : record.status === 'Late'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.markedBy?.fullName || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
