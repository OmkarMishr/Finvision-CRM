import { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Users, ExternalLink, Info } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const StudentLiveClasses = () => {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.liveClasses.student);
      
      if (response.data.success) {
        setUpcomingClasses(response.data.upcomingClasses);
        setPastClasses(response.data.pastClasses);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (classId, meetingLink) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.liveClasses.join(classId));
      window.open(meetingLink, '_blank');
    } catch (error) {
      console.error('Error joining class:', error);
      alert('Failed to join class');
    }
  };

  const getPlatformIcon = (platform) => {
    if (platform === 'Google Meet') return 'Google Meet';
    if (platform === 'Zoom') return 'Zoom meeting';
    return 'Live class';
  };

  const getStatusBadge = (status) => {
    if (status === 'Live') return 'bg-green-100 text-green-700 animate-pulse';
    if (status === 'Scheduled') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 font-medium transition-all ${
            activeTab === 'upcoming'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upcoming Classes ({upcomingClasses.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 px-4 font-medium transition-all ${
            activeTab === 'past'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Past Classes ({pastClasses.length})
        </button>
      </div>

      {/* Classes List */}
      {activeTab === 'upcoming' ? (
        upcomingClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Classes</h3>
            <p className="text-gray-600 text-sm">Check back later for scheduled live classes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingClasses.map((liveClass) => (
              <div key={liveClass._id} className="bg-gradient-to-br from-white to-indigo-50 rounded-xl p-6 shadow-sm border border-indigo-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{getPlatformIcon(liveClass.platform)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{liveClass.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{liveClass.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(liveClass.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{liveClass.startTime} - {liveClass.endTime} ({liveClass.duration} mins)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Instructor: {liveClass.instructorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(liveClass.status)}`}>
                    {liveClass.status}
                  </span>
                </div>

                {liveClass.meetingId && (
                  <div className="bg-white rounded-lg p-3 mb-4 border border-indigo-100">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-gray-700"><strong>Meeting ID:</strong> {liveClass.meetingId}</p>
                        {liveClass.password && (
                          <p className="text-gray-700"><strong>Password:</strong> {liveClass.password}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleJoinClass(liveClass._id, liveClass.meetingLink)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <ExternalLink className="w-5 h-5" />
                  Join Live Class
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        pastClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Past Classes</h3>
            <p className="text-gray-600 text-sm">Your completed classes will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastClasses.map((liveClass) => (
              <div key={liveClass._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl opacity-50">{getPlatformIcon(liveClass.platform)}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{liveClass.title}</h3>
                    <p className="text-sm text-gray-600">{liveClass.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(liveClass.scheduledDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{liveClass.instructorName}</span>
                  </div>
                </div>

                {liveClass.recordingLink && (
                  <a
                    href={liveClass.recordingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    <Video className="w-4 h-4" />
                    Watch Recording
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default StudentLiveClasses;
