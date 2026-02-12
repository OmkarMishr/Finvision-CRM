import { 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  Award, 
  Clock, 
  Bell 
} from 'lucide-react';

const StudentOverview = ({ studentData }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100">Attendance</span>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-4xl font-bold mb-2">{studentData.attendancePercentage}%</p>
          <p className="text-sm text-blue-100">
            {studentData.attendedClasses}/{studentData.totalClasses} Classes
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-100">Fees Paid</span>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
          <p className="text-4xl font-bold mb-2">₹{studentData.paidFees.toLocaleString()}</p>
          <p className="text-sm text-green-100">
            of ₹{studentData.totalFees.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-100">Batch Type</span>
            <BookOpen className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-2xl font-bold mb-2">{studentData.batchType}</p>
          <p className="text-sm text-purple-100">{studentData.batchSection}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-orange-100">Status</span>
            <Award className="w-8 h-8 text-orange-200" />
          </div>
          <p className="text-2xl font-bold mb-2">{studentData.status}</p>
          <p className="text-sm text-orange-100">Currently Active</p>
        </div>
      </div>

      {/* Fee Status and Attendance Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Fee Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Fees</span>
              <span className="font-semibold text-gray-900">
                ₹{studentData.totalFees.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid</span>
              <span className="font-semibold text-green-600">
                ₹{studentData.paidFees.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-red-600">
                ₹{studentData.pendingFees.toLocaleString()}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                  style={{ 
                    width: `${(studentData.paidFees / studentData.totalFees) * 100}%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {Math.round((studentData.paidFees / studentData.totalFees) * 100)}% Paid
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            Attendance Report
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Classes</span>
              <span className="font-semibold text-gray-900">
                {studentData.totalClasses}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Attended</span>
              <span className="font-semibold text-green-600">
                {studentData.attendedClasses}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Missed</span>
              <span className="font-semibold text-red-600">
                {studentData.totalClasses - studentData.attendedClasses}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full ${
                    studentData.attendancePercentage >= 75 
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${studentData.attendancePercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {studentData.attendancePercentage >= 75 
                  ? 'Eligible for Certificate' 
                  : 'Need 75% for Certificate'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-orange-600" />
          Upcoming Events
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Next Class</p>
              <p className="text-sm text-gray-600">{studentData.nextClass}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">Upcoming Exam</p>
              <p className="text-sm text-gray-600">{studentData.upcomingExam}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
