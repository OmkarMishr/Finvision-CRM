import { useState } from 'react';
import { MapPin, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import axiosInstance from '../../config/axios';
import StudentAttendanceView from './StudentAttendanceView';

const StudentAttendanceTab = ({ studentData, onAttendanceMarked }) => {
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [markMessage, setMarkMessage] = useState(null);
  const [markError, setMarkError] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);

  const markSelfAttendance = async () => {
    try {
      setMarkingAttendance(true);
      setMarkMessage(null);
      setMarkError(null);
      setLocationInfo(null);

      if (!navigator.geolocation) {
        setMarkError('Geolocation is not supported by your browser');
        setMarkingAttendance(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await axiosInstance.post('/api/student-attendance/mark-self', {
              latitude,
              longitude
            });

            setMarkMessage(response.data.message || 'Attendance marked successfully!');
            
            if (response.data.locationInfo) {
              setLocationInfo(response.data.locationInfo);
            }
            
            if (onAttendanceMarked) {
              onAttendanceMarked();
            }
          } catch (error) {
            if (error.response?.status === 400) {
              setMarkError(error.response.data.message || 'Attendance already marked for today');
            } else if (error.response?.status === 403) {
              setMarkError(error.response.data.message || 'You must be at the institute to mark attendance');
            } else if (error.response?.status === 404) {
              setMarkError('Student profile not found. Please contact administration.');
            } else {
              setMarkError('Failed to mark attendance. Please try again.');
            }
          } finally {
            setMarkingAttendance(false);
          }
        },
        (error) => {
          setMarkingAttendance(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setMarkError('Location permission denied. Please enable location access in your browser settings.');
              break;
            case error.POSITION_UNAVAILABLE:
              setMarkError('Location information is unavailable. Please check your GPS/WiFi and try again.');
              break;
            case error.TIMEOUT:
              setMarkError('Location request timed out. Please try again.');
              break;
            default:
              setMarkError('Unable to get your location. Please try again.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      setMarkError('An unexpected error occurred. Please try again.');
      setMarkingAttendance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mark Attendance Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Mark Today's Attendance</h3>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {markMessage && (
          <div className="mb-4 flex items-start gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{markMessage}</p>
              {locationInfo && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Marked at {locationInfo.branch} ({locationInfo.distance}m away)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {markError && (
          <div className="mb-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{markError}</p>
              {markError.includes('permission denied') && (
                <p className="text-xs text-red-600 mt-1">
                  Tip: Go to browser settings → Site settings → Location → Allow
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={markSelfAttendance}
          disabled={markingAttendance || !studentData._id}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg ${
            markingAttendance || !studentData._id
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5'
          }`}
        >
          {markingAttendance ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Getting Location...</span>
            </>
          ) : !studentData._id ? (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>Profile Not Linked</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              <span>Mark My Attendance (With Location)</span>
            </>
          )}
        </button>

        {!studentData._id && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Contact administration to link your student profile
          </p>
        )}
      </div>

      {/* Attendance History */}
      {studentData._id ? (
        <StudentAttendanceView studentId={studentData._id} />
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl shadow border border-gray-200">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calendar className="w-10 h-10 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Linked</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Your account is not linked to a student profile yet. Please contact the administration to link your account and view attendance history.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceTab;
