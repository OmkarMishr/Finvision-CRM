import React, { useState } from 'react';
import { X, Save, Trash2, Loader } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { STUDENT_ATTENDANCE_ENDPOINTS } from '../../config/api';

const StudentAttendanceDetailsModal = ({ attendance, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    status: attendance.status,
    remarks: attendance.remarks || ''
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axiosInstance.put(
        STUDENT_ATTENDANCE_ENDPOINTS.UPDATE(attendance._id),
        formData
      );
      
      alert('Attendance updated successfully!');
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(STUDENT_ATTENDANCE_ENDPOINTS.DELETE(attendance._id));
      
      alert('Attendance deleted successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Attendance Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{attendance.studentId?.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Admission Number</p>
                <p className="font-medium">{attendance.studentId?.admissionNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{attendance.studentId?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="font-medium">{attendance.studentId?.mobile || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Attendance Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Attendance Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(attendance.date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Slot</p>
                <p className="font-medium">{attendance.timeSlot}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Batch Type</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  attendance.batchType === 'Free' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {attendance.batchType}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Course</p>
                <p className="font-medium">{attendance.course}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium">{attendance.branch}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Marked By</p>
                <p className="font-medium">{attendance.markedBy?.fullName || 'System'}</p>
              </div>
            </div>
          </div>

          {/* Editable Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Status & Remarks</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                ) : (
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    attendance.status === 'Present' ? 'bg-green-100 text-green-800' :
                    attendance.status === 'Absent' ? 'bg-red-100 text-red-800' :
                    attendance.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {attendance.status}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows="3"
                    placeholder="Add remarks..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                    {attendance.remarks || 'No remarks'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <p>Created: {new Date(attendance.createdAt).toLocaleString('en-IN')}</p>
            <p>Updated: {new Date(attendance.updatedAt).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-between">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex gap-3">
            {isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      status: attendance.status,
                      remarks: attendance.remarks || ''
                    });
                  }}
                  disabled={loading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceDetailsModal;
