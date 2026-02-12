import { useState, useEffect } from 'react';
import { Camera, Edit, X, Save, CheckCircle, AlertCircle, Trash2, Upload } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const StudentDetails = ({ studentData, onDataUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [editedData, setEditedData] = useState({
    dob: '',
    gender: '',
    fatherName: '',
    city: '',
    education: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (studentData) {
      setEditedData({
        dob: studentData.dob ? new Date(studentData.dob).toISOString().split('T')[0] : '',
        gender: studentData.gender || '',
        fatherName: studentData.fatherName || '',
        city: studentData.city || '',
        education: studentData.education || ''
      });
    }
  }, [studentData]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should not exceed 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploadingPhoto(true);
      const response = await axiosInstance.post(
        API_ENDPOINTS.students.uploadPhoto,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        onDataUpdate({ ...studentData, profilePhoto: response.data.photoUrl });
        setShowPhotoMenu(false);
        alert('Profile photo uploaded successfully!');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      setUploadingPhoto(true);
      const response = await axiosInstance.delete(API_ENDPOINTS.students.removePhoto);

      if (response.data.success) {
        onDataUpdate({ ...studentData, profilePhoto: null });
        setShowPhotoMenu(false);
        alert('Profile photo removed successfully!');
      }
    } catch (error) {
      console.error('Remove photo error:', error);
      alert(error.response?.data?.message || 'Failed to remove photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      setSaveError(null);

      const response = await axiosInstance.put(
        API_ENDPOINTS.students.updateProfile,
        editedData
      );

      if (response.data.success) {
        onDataUpdate({
          ...studentData,
          ...editedData
        });
        setSaveMessage('Profile updated successfully!');
        setEditMode(false);
        
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Save profile error:', error);
      setSaveError(error.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header with Photo */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 sm:p-8 rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex-shrink-0 relative">
            {/* Profile Picture */}
            <div className="relative group">
              {studentData.profilePhoto ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${studentData.profilePhoto}`}
                  alt="Profile"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-xl border-4 border-white"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {studentData.fullName[0]}
                </div>
              )}
            </div>

            {/* Change/Remove Photo Buttons */}
            <div className="mt-3 flex gap-2">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className={`flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{studentData.profilePhoto ? 'Change' : 'Upload'}</span>
                  </>
                )}
              </label>

              {studentData.profilePhoto && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2 text-center">
              Max 5MB • JPG, PNG, GIF
            </p>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Admission No.</p>
              <p className="text-sm font-semibold text-gray-900">{studentData.admissionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Course</p>
              <p className="text-sm font-semibold text-gray-900">{studentData.courseCategory}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Batch Type</p>
              <p className="text-sm font-semibold text-gray-900">{studentData.batchType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Batch Section</p>
              <p className="text-sm font-semibold text-gray-900">{studentData.batchSection}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Admission Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(studentData.admissionDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                {studentData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            editMode
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {editMode ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="w-4 h-4" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* NON-EDITABLE: Full Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
          <input
            type="text"
            value={studentData.fullName}
            disabled
            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        {/* NON-EDITABLE: Mobile */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mobile</label>
          <input
            type="text"
            value={studentData.mobile}
            disabled
            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        {/* NON-EDITABLE: Email */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={studentData.email}
            disabled
            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed"
          />
        </div>

        {/* EDITABLE: D.O.B */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Date of Birth {editMode && <span className="text-blue-600">*</span>}
          </label>
          <input
            type="date"
            value={editMode ? editedData.dob : studentData.dob ? new Date(studentData.dob).toISOString().split('T')[0] : ''}
            onChange={(e) => setEditedData({ ...editedData, dob: e.target.value })}
            disabled={!editMode}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
              editMode
                ? 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 cursor-not-allowed'
            }`}
          />
        </div>

        {/* EDITABLE: Gender */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Gender {editMode && <span className="text-blue-600">*</span>}
          </label>
          <select
            value={editMode ? editedData.gender : studentData.gender}
            onChange={(e) => setEditedData({ ...editedData, gender: e.target.value })}
            disabled={!editMode}
            className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
              editMode
                ? 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 cursor-not-allowed'
            }`}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* EDITABLE: City */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            City {editMode && <span className="text-blue-600">*</span>}
          </label>
          <input
            type="text"
            value={editMode ? editedData.city : studentData.city}
            onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
            disabled={!editMode}
            placeholder="Enter your city"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
              editMode
                ? 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 cursor-not-allowed'
            }`}
          />
        </div>

        {/* EDITABLE: Education */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Education {editMode && <span className="text-blue-600">*</span>}
          </label>
          <input
            type="text"
            value={editMode ? editedData.education : studentData.education}
            onChange={(e) => setEditedData({ ...editedData, education: e.target.value })}
            disabled={!editMode}
            placeholder="E.g., Bachelor's in Commerce"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
              editMode
                ? 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 cursor-not-allowed'
            }`}
          />
        </div>

        {/* EDITABLE: Father's Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Father's Name {editMode && <span className="text-blue-600">*</span>}
          </label>
          <input
            type="text"
            value={editMode ? editedData.fatherName : studentData.fatherName}
            onChange={(e) => setEditedData({ ...editedData, fatherName: e.target.value })}
            disabled={!editMode}
            placeholder="Enter father's name"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
              editMode
                ? 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 cursor-not-allowed'
            }`}
          />
        </div>
      </div>

      {/* Save Button */}
      {editMode && (
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => setEditMode(false)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Success/Error Messages */}
      {saveMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {saveMessage}
        </div>
      )}
      {saveError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {saveError}
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
