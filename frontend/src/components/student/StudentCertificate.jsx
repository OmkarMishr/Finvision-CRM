import { useState, useEffect } from 'react';
import { Award, Download, CheckCircle, AlertCircle, Calendar, Users, Clock, User, GraduationCap } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const StudentCertificate = ({ studentData }) => {
  const [certificateEligibility, setCertificateEligibility] = useState(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    if (studentData?._id) {
      checkCertificateEligibility();
    }
  }, [studentData]);

  const checkCertificateEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const response = await axiosInstance.get(API_ENDPOINTS.certificates.eligibility);
      
      if (response.data.success) {
        setCertificateEligibility(response.data);
      }
    } catch (error) {
      console.error('Eligibility check error:', error);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      setLoadingCertificate(true);
      const response = await axiosInstance.get(API_ENDPOINTS.certificates.download, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${studentData.admissionNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(error.response?.data?.message || 'Failed to download certificate. Please try again.');
    } finally {
      setLoadingCertificate(false);
    }
  };

  if (checkingEligibility) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking certificate eligibility...</p>
        </div>
      </div>
    );
  }

  if (!certificateEligibility) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Award className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600 text-lg">Certificate information not available</p>
          <button
            onClick={checkCertificateEligibility}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
  const { eligible, data } = certificateEligibility;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Course Certificate</h2>
              <p className="text-purple-100">Download your completion certificate</p>
            </div>
          </div>
          <button
            onClick={checkCertificateEligibility}
            disabled={checkingEligibility}
            className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/30 transition-all"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {eligible ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-orange-600" />
              )}
              Certificate Status: {eligible ? 'Eligible' : 'Not Eligible'}
            </h3>
            {data.certificateStatus === 'issued' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Already Issued
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Student Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-8 h-8 text-purple-600 bg-purple-100 p-2 rounded-lg" />
                <div>
                  <h4 className="font-semibold text-gray-900">{data.student.fullName}</h4>
                  <p className="text-sm text-gray-600">{data.student.admissionNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-8 h-8 text-blue-600 bg-blue-100 p-2 rounded-lg" />
                <div>
                  <h4 className="font-semibold text-gray-900">{data.student.courseCategory}</h4>
                  <p className="text-sm text-gray-600">{data.student.batchType} Batch</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-green-600 bg-green-100 p-2 rounded-lg" />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {new Date(data.course.startDate).toLocaleDateString('en-IN')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    to {new Date(data.course.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Attendance Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Attendance Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Total Classes</span>
                  <span className="font-bold text-2xl text-gray-900">{data.attendance.totalClasses}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-sm text-gray-600">Present Classes</span>
                  <span className="font-bold text-2xl text-green-600">{data.attendance.presentClasses}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg">
                  <span className="text-sm font-medium">Attendance %</span>
                  <span className="font-bold text-xl">{data.attendance.attendancePercentage}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="text-sm text-orange-700 font-medium">Required</span>
                  <span className="font-bold text-orange-700">75%</span>
                </div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-600" />
                Course Progress
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Admission Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(data.student.admissionDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Course Duration</span>
                  <span className="font-semibold text-gray-900">3 Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion Status</span>
                  <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    data.course.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {data.course.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full shadow-lg"
                    style={{ width: `${Math.min((data.attendance.attendancePercentage / 75) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Download/Not Eligible Section */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            {eligible ? (
              <div className="flex-1 text-center p-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-xl">
                <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                <p className="text-lg mb-6">You are eligible for certificate</p>
                <button
                  onClick={downloadCertificate}
                  disabled={loadingCertificate}
                  className="px-8 py-3 bg-white text-green-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2 mx-auto"
                >
                  {loadingCertificate ? (
                    <>
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download Certificate</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex-1 text-center p-12 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-xl">
                <AlertCircle className="w-20 h-20 mx-auto mb-6 opacity-80" />
                <h3 className="text-2xl font-bold mb-4">Certificate Not Eligible</h3>
                <div className="space-y-2 mb-8 text-lg">
                  <div>Attendance: <span className="font-bold">{data.attendance.attendancePercentage}%</span> (Need 75%)</div>
                  <div>Course Status: <span className={`font-bold ${data.course.isCompleted ? 'text-green-200' : 'text-orange-200'}`}>
                    {data.course.isCompleted ? 'Completed' : 'In Progress'}
                  </span></div>
                </div>
                <p className="text-lg opacity-90">Improve attendance and complete course duration</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCertificate;
