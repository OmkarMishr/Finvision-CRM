import React, { useState } from 'react';
import { Download, Upload, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import axiosInstance from '../../config/axios';
import { API_ENDPOINTS } from '../../config/api';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleBackup = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Call backup API
      const response = await axiosInstance.get(API_ENDPOINTS.admin.backup, {
        responseType: 'json' // Changed from 'blob' to 'json'
      });

      // Convert JSON to blob for download
      const jsonString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finvision_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create backup. Make sure you are logged in as admin.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: 'Please select a valid JSON backup file' });
      event.target.value = '';
      return;
    }

    if (!window.confirm('⚠️ WARNING: This will replace all existing data. Are you sure you want to continue?')) {
      event.target.value = '';
      return;
    }

    if (!window.confirm('⚠️ FINAL WARNING: This action cannot be undone. All current data will be lost. Continue?')) {
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Read file content
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      // Validate backup structure
      if (!backupData.data || !backupData.version) {
        throw new Error('Invalid backup file format');
      }

      // Send restore request
      await axiosInstance.post(API_ENDPOINTS.admin.restore, backupData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setMessage({ type: 'success', text: 'Database restored successfully! Reloading page...' });
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Restore error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to restore backup' 
      });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Message */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
          <p className="text-sm text-yellow-700">
            Always create a backup before making major changes. Restoring a backup will replace all current data.
          </p>
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div className={`border rounded-lg p-4 flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Backup & Restore Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Create Backup</h3>
              <p className="text-sm text-gray-600">Download current database</p>
            </div>
          </div>

          <button
            onClick={handleBackup}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Backup
              </>
            )}
          </button>

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Backup includes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>All leads data</li>
              <li>Student records</li>
              <li>Attendance records</li>
              <li>Batch information</li>
              <li>User accounts (except passwords)</li>
            </ul>
          </div>
        </div>

        {/* Restore Section */}
        <div className="border rounded-lg p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <Upload className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Restore Backup</h3>
              <p className="text-sm text-gray-600">Upload and restore database</p>
            </div>
          </div>

          <label className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium cursor-pointer transition-colors">
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Backup File
              </>
            )}
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={loading}
              className="hidden"
            />
          </label>

          <div className="mt-4 text-sm text-red-800 bg-red-100 p-3 rounded-lg">
            <p className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Caution!
            </p>
            <p className="text-xs mt-1">
              Restoring will permanently replace all existing data. This action cannot be undone. You will be asked to confirm twice.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Best Practices */}
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Backup Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Daily Backups</p>
              <p className="text-gray-600 text-xs">Create backups at end of each day</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Store Safely</p>
              <p className="text-gray-600 text-xs">Keep backups in secure location</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Test Restores</p>
              <p className="text-gray-600 text-xs">Verify backups work periodically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
