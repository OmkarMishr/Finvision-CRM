import { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, Edit2, Trash2, Users, UserCheck, UserX, GraduationCap } from 'lucide-react'
import axiosInstance from '../../config/axios'
import { API_ENDPOINTS } from '../../config/api'
import StudentDetailsModal from './StudentDetailsModal'

const StudentList = () => {
    const [students, setStudents] = useState([])
    const [filteredStudents, setFilteredStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [filters, setFilters] = useState({
        status: '',
        batchType: '',
        courseCategory: ''
    })
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        free: 0,
        paid: 0
    })

    useEffect(() => {
        fetchStudents()
        fetchStats()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [students, searchTerm, filters])

    const fetchStudents = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.get(API_ENDPOINTS.students.base)
            setStudents(response.data.students)
            setFilteredStudents(response.data.students)
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.students.stats)
            const data = response.data.stats

            const activeCount = data.byStatus.find(s => s._id === 'Active')?.count || 0
            const inactiveCount = data.byStatus.find(s => s._id === 'Inactive')?.count || 0
            const freeCount = data.byBatchType.find(b => b._id === 'Free')?.count || 0
            const paidCount = data.byBatchType.find(b => b._id === 'Paid')?.count || 0

            setStats({
                total: activeCount + inactiveCount,
                active: activeCount,
                inactive: inactiveCount,
                free: freeCount,
                paid: paidCount
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const applyFilters = () => {
        let filtered = [...students]

        if (searchTerm) {
            filtered = filtered.filter(student =>
                student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.mobile.includes(searchTerm) ||
                student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (filters.status) {
            filtered = filtered.filter(student => student.status === filters.status)
        }

        if (filters.batchType) {
            filtered = filtered.filter(student => student.batchType === filters.batchType)
        }

        if (filters.courseCategory) {
            filtered = filtered.filter(student => student.courseCategory === filters.courseCategory)
        }

        setFilteredStudents(filtered)
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }
    const handleViewDetails = (student) => {
        setSelectedStudent(student)
        setShowDetailsModal(true)
    }

    const handleCloseDetails = () => {
        setSelectedStudent(null)
        setShowDetailsModal(false)
    }

    const exportToExcel = () => {
        const csv = [
            ['Admission No', 'Name', 'Mobile', 'Email', 'Course', 'Batch Type', 'Status', 'Fees Pending', 'Attendance %'],
            ...filteredStudents.map(student => [
                student.admissionNumber,
                student.fullName,
                student.mobile,
                student.email || '',
                student.courseCategory,
                student.batchType,
                student.status,
                student.pendingFees,
                student.attendancePercentage
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const getStatusColor = (status) => {
        const colors = {
            'Active': 'bg-green-100 text-green-700',
            'Inactive': 'bg-gray-100 text-gray-700',
            'Completed': 'bg-blue-100 text-blue-700',
            'Dropped': 'bg-red-100 text-red-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    const getBatchTypeColor = (type) => {
        return type === 'Paid'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-orange-100 text-orange-700'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
                <p className="text-gray-600">Manage all enrolled students</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100">Total Students</span>
                        <Users className="w-8 h-8 text-blue-200" />
                    </div>
                    <p className="text-3xl font-bold">{stats.total}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100">Active</span>
                        <UserCheck className="w-8 h-8 text-green-200" />
                    </div>
                    <p className="text-3xl font-bold">{stats.active}</p>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-100">Inactive</span>
                        <UserX className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-3xl font-bold">{stats.inactive}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-100">Free Batch</span>
                        <GraduationCap className="w-8 h-8 text-orange-200" />
                    </div>
                    <p className="text-3xl font-bold">{stats.free}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100">Paid Batch</span>
                        <GraduationCap className="w-8 h-8 text-purple-200" />
                    </div>
                    <p className="text-3xl font-bold">{stats.paid}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, email, or admission number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                        />
                    </div>

                    <button
                        onClick={exportToExcel}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Filters:</span>
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Completed">Completed</option>
                        <option value="Dropped">Dropped</option>
                    </select>

                    <select
                        value={filters.batchType}
                        onChange={(e) => handleFilterChange('batchType', e.target.value)}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                    >
                        <option value="">All Batch Types</option>
                        <option value="Free">Free Batch</option>
                        <option value="Paid">Paid Batch</option>
                    </select>

                    <select
                        value={filters.courseCategory}
                        onChange={(e) => handleFilterChange('courseCategory', e.target.value)}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                    >
                        <option value="">All Courses</option>
                        <option value="Basic">Basic</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Basic + Advanced">Basic + Advanced</option>
                        <option value="Advisory">Advisory</option>
                    </select>

                    {(filters.status || filters.batchType || filters.courseCategory) && (
                        <button
                            onClick={() => setFilters({ status: '', batchType: '', courseCategory: '' })}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                    Showing {filteredStudents.length} of {students.length} students
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Admission No
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Student Info
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Course
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Batch
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Fees
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Attendance
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-semibold text-blue-600">
                                                {student.admissionNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{student.fullName}</span>
                                                <span className="text-sm text-gray-500">{student.mobile}</span>
                                                {student.email && (
                                                    <span className="text-xs text-gray-400">{student.email}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">{student.courseCategory}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getBatchTypeColor(student.batchType)}`}>
                                                {student.batchType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-sm">
                                                <span className="text-gray-900">Total: ₹{student.totalFees}</span>
                                                <span className="text-green-600">Paid: ₹{student.paidFees}</span>
                                                <span className="text-red-600">Pending: ₹{student.pendingFees}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                                                    <div
                                                        className={`h-2 rounded-full ${student.attendancePercentage >= 75 ? 'bg-green-500' :
                                                            student.attendancePercentage >= 50 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                        style={{ width: `${student.attendancePercentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {student.attendancePercentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(student.status)}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(student)}
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {showDetailsModal && selectedStudent && (
                <StudentDetailsModal
                    student={selectedStudent}
                    onClose={handleCloseDetails}
                    onStudentUpdated={() => {
                        fetchStudents()
                        fetchStats()
                    }}
                />
            )}
        </div>
    )
}

export default StudentList
