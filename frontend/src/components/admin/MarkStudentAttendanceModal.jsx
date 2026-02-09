import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const MarkStudentAttendanceModal = ({ onClose, onSuccess, batches }) => {
  const [mode, setMode] = useState('single'); // 'single' or 'batch'
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batchType: '',
    course: '',
    branch: '',
    timeSlot: '',
  });

  // Single student mode
  const [singleStudent, setSingleStudent] = useState({
    studentId: '',
    status: 'Present',
    remarks: ''
  });

  // Batch mode - array of students with attendance
  const [batchStudents, setBatchStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      const batch = batches.find(b => b._id === selectedBatch);
      if (batch) {
        setFormData(prev => ({
          ...prev,
          batchType: batch.batchType,
          course: batch.course,
          branch: batch.branch,
          timeSlot: batch.timeSlot
        }));
        
        // Populate batch students
        const enrolledStudents = batch.enrolledStudents.map(student => ({
          studentId: student._id,
          studentName: student.fullName,
          admissionNumber: student.admissionNumber,
          status: 'Present',
          remarks: ''
        }));
        setBatchStudents(enrolledStudents);
      }
    }
  }, [selectedBatch, batches]);

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.students.base);
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(API_ENDPOINTS.studentAttendance.markSingle, {
        ...formData,
        ...singleStudent
      });

      alert('Attendance marked successfully!');
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBatch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.studentAttendance.markBatch, {
        ...formData,
        students: batchStudents.map(s => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks
        }))
      });

      const { data, errors } = response.data;
      
      if (errors && errors.length > 0) {
        alert(`Marked ${data.length} students. ${errors.length} errors occurred.`);
      } else {
        alert(`Successfully marked attendance for ${data.length} students!`);
      }
      
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Error marking batch attendance');
    } finally {
      setLoading(false);
    }
  };

  const updateBatchStudentStatus = (index, field, value) => {
    const updated = [...batchStudents];
    updated[index][field] = value;
    setBatchStudents(updated);
  };

  const markAllAs = (status) => {
    setBatchStudents(prev => prev.map(s => ({ ...s, status })));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Mark Student Attendance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="px-6 py-4 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-lg font-medium ${
                mode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Single Student
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`px-4 py-2 rounded-lg font-medium ${
                mode === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Batch Attendance
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {mode === 'single' ? (
            // Single Student Form
            <form onSubmit={handleSubmitSingle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student *
                  </label>
                  <select
                    value={singleStudent.studentId}
                    onChange={(e) => setSingleStudent({ ...singleStudent, studentId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student._id} value={student._id}>
                        {student.fullName} - {student.admissionNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Type *
                  </label>
                  <select
                    value={formData.batchType}
                    onChange={(e) => setFormData({ ...formData, batchType: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Batch Type</option>
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Course</option>
                    <option value="Basic">Basic</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Basic + Advanced">Basic + Advanced</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch *
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                    placeholder="e.g., Mumbai"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    required
                    placeholder="e.g., 10:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={singleStudent.status}
                    onChange={(e) => setSingleStudent({ ...singleStudent, status: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={singleStudent.remarks}
                    onChange={(e) => setSingleStudent({ ...singleStudent, remarks: e.target.value })}
                    rows="2"
                    placeholder="Optional remarks..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Attendance
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Batch Attendance Form
            <form onSubmit={handleSubmitBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Batch *
                  </label>
                  <select
                    value={selectedBatch || ''}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a batch</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.batchName} - {batch.batchType} ({batch.enrolledStudents?.length || 0} students)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {batchStudents.length > 0 && (
                <>
                  <div className="flex justify-between items-center pt-4 pb-2">
                    <h3 className="font-semibold text-gray-800">
                      Students ({batchStudents.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markAllAs('Present')}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => markAllAs('Absent')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Mark All Absent
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Student
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Admission No
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {batchStudents.map((student, index) => (
                          <tr key={student.studentId}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {student.studentName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {student.admissionNumber}
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={student.status}
                                onChange={(e) => updateBatchStudentStatus(index, 'status', e.target.value)}
                                className="px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Half Day">Half Day</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={student.remarks}
                                onChange={(e) => updateBatchStudentStatus(index, 'remarks', e.target.value)}
                                placeholder="Optional..."
                                className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || batchStudents.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Batch Attendance
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkStudentAttendanceModal;
