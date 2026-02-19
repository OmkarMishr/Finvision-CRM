import { useState, useEffect } from 'react';
import { Plus, Video, Edit, Trash2, Eye, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';
import CreateLiveClassModal from '../../../components/admin/CreateLiveClassModal';
import EditLiveClassModal from '../../../components/admin/EditLiveClassModal';

const LiveClassesPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    courseCategory: 'All',
    batchType: 'All'
  });
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    live: 0,
    completed: 0
  });

  useEffect(() => {
    fetchLiveClasses();
    fetchStats();
  }, [filters]);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status !== 'All') params.append('status', filters.status);
      if (filters.courseCategory !== 'All') params.append('courseCategory', filters.courseCategory);
      if (filters.batchType !== 'All') params.append('batchType', filters.batchType);

      const response = await axiosInstance.get(`${API_ENDPOINTS.liveClasses.admin}?${params}`);
      
      if (response.data.success) {
        setLiveClasses(response.data.liveClasses);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
      alert('Failed to fetch live classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.liveClasses.stats);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this live class?')) return;

    try {
      const response = await axiosInstance.delete(API_ENDPOINTS.liveClasses.byId(id));
      
      if (response.data.success) {
        alert('Live class deleted successfully');
        fetchLiveClasses();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting live class:', error);
      alert('Failed to delete live class');
    }
  };

  const handleEdit = (liveClass) => {
    setSelectedClass(liveClass);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      Scheduled: 'bg-blue-100 text-blue-700',
      Live: 'bg-green-100 text-green-700 animate-pulse',
      Completed: 'bg-gray-100 text-gray-700',
      Cancelled: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getPlatformIcon = (platform) => {
    if (platform === 'Google Meet') return '📹';
    if (platform === 'Zoom') return '🎥';
    return '💻';
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-0 ">
        <div className="">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes Management</h1>
            <p className="text-gray-600">Create and manage live class sessions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Live Now</p>
                  <p className="text-2xl font-bold text-green-600">{stats.live}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-green-600 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Create Button */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 flex-1">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={filters.courseCategory}
                  onChange={(e) => setFilters({ ...filters, courseCategory: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Courses</option>
                  <option value="Basic">Basic</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Basic + Advanced">Basic + Advanced</option>
                  <option value="Advisory">Advisory</option>
                </select>

                <select
                  value={filters.batchType}
                  onChange={(e) => setFilters({ ...filters, batchType: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Batches</option>
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Live Class
              </button>
            </div>
          </div>

          {/* Classes List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : liveClasses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Classes Found</h3>
              <p className="text-gray-600 mb-6">Create your first live class to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
              >
                Create Live Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveClasses.map((liveClass) => (
                <div key={liveClass._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{getPlatformIcon(liveClass.platform)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{liveClass.title}</h3>
                        <p className="text-sm text-gray-600">{liveClass.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(liveClass.status)}`}>
                      {liveClass.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
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
                      <span>{liveClass.instructorName} • {liveClass.courseCategory} • {liveClass.batchType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <a
                      href={liveClass.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Class
                    </a>
                    <button
                      onClick={() => handleEdit(liveClass)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(liveClass._id)}
                      className="px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateLiveClassModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchLiveClasses();
            fetchStats();
            setShowCreateModal(false);
          }}
        />
      )}

      {showEditModal && selectedClass && (
        <EditLiveClassModal
          liveClass={selectedClass}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClass(null);
          }}
          onSuccess={() => {
            fetchLiveClasses();
            setShowEditModal(false);
            setSelectedClass(null);
          }}
        />
      )}
    </>
  );
};

export default LiveClassesPanel;
