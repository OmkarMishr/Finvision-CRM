// src/components/admin/dashboard/SettingsPanel.jsx
import { Settings } from 'lucide-react';
const SettingsPanel = () => (
  <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow">
    <Settings className="w-16 h-16 text-gray-300 mb-4" />
    <h2 className="text-xl font-semibold text-gray-700">Settings</h2>
    <p className="text-gray-500 mt-2">System settings coming soon</p>
  </div>
);
export default SettingsPanel;
