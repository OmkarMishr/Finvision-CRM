import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings, User, Shield, Bell, Palette, Database,
  Building2, Mail, Eye, EyeOff, Save, RefreshCw, Check, X,
  Lock, Smartphone, Monitor, Sun, Moon, Camera,
  Download, Upload, AlertTriangle, Trash2,
  Users, Tag, Percent, Plus,
  ToggleLeft, ToggleRight, Clock,
  CheckCircle, LogOut, GraduationCap
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { API_ENDPOINTS } from '../../../config/api';

// ─── Nav Items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'institute',     label: 'Institute',     icon: Building2 },
  { id: 'account',       label: 'Account',       icon: User      },
  { id: 'security',      label: 'Security',      icon: Shield    },
  { id: 'roles',         label: 'Permissions',   icon: Users     },
  { id: 'coupons',       label: 'Coupons',       icon: Tag       },
  { id: 'fees',          label: 'Fees Config',   icon: Percent   },
  { id: 'notifications', label: 'Notifications', icon: Bell      },
  { id: 'appearance',    label: 'Appearance',    icon: Palette   },
  { id: 'data',          label: 'Data',          icon: Database  },
];

// ─── Shared Helpers ────────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8294A] bg-white";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className={labelCls}>{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow p-6 space-y-5">
    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-[#C8294A]/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#C8294A]" />
      </div>
      <div>
        <h3 className="font-bold text-[#1a1a1a]">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[#C8294A]' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const SaveButton = ({ loading, saved, onClick }) => (
  <button onClick={onClick} disabled={loading}
    className="px-5 py-2.5 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] disabled:opacity-60 flex items-center gap-2 transition-all">
    {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
     : saved  ? <><Check     className="w-4 h-4" /> Saved!</>
     :          <><Save      className="w-4 h-4" /> Save Changes</>
    }
  </button>
);

const ErrorBox = ({ msg }) => msg ? (
  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{msg}</div>
) : null;

// ─── Institute Profile ─────────────────────────────────────────────────────────
const InstituteSection = ({ settings, onRefresh }) => {
  const [form, setForm] = useState({
    name: '', tagline: '', email: '', phone: '', address: '', website: '',
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');
  const logoRef = useRef();

  // Populate form from fetched settings
  useEffect(() => {
    if (settings?.institute) {
      setForm({
        name:    settings.institute.name    || '',
        tagline: settings.institute.tagline || '',
        email:   settings.institute.email   || '',
        phone:   settings.institute.phone   || '',
        address: settings.institute.address || '',
        website: settings.institute.website || '',
      });
      setLogoPreview(settings.institute.logoUrl || '');
    }
  }, [settings]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.institute, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update institute profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await axiosInstance.post(API_ENDPOINTS.adminSettings.logo, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoPreview(res.data.logoUrl);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.message || 'Logo upload failed');
    } finally {
      setLogoLoading(false);
    }
  };

  return (
    <SectionCard title="Institute Profile"
      subtitle="Public-facing information about your institute" icon={Building2}>

      <ErrorBox msg={error} />

      {/* Logo */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-[#C8294A]/10 flex items-center justify-center border-2 border-dashed border-[#C8294A]/30 shrink-0 overflow-hidden">
          {logoPreview
            ? <img src={`${import.meta.env.VITE_API_URL || ''}${logoPreview}`}
                alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            : <Building2 className="w-8 h-8 text-[#C8294A]/40" />
          }
        </div>
        <div>
          <button onClick={() => logoRef.current?.click()} disabled={logoLoading}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60">
            {logoLoading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
              : <><Camera className="w-4 h-4" /> Upload Logo</>
            }
          </button>
          <p className="text-xs text-gray-400 mt-1.5">PNG, JPG up to 2MB · 200×200px recommended</p>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Institute Name">
          <input value={form.name}    onChange={set('name')}    className={inputCls} />
        </Field>
        <Field label="Tagline">
          <input value={form.tagline} onChange={set('tagline')} className={inputCls} />
        </Field>
        <Field label="Email">
          <input value={form.email}   onChange={set('email')}   type="email" className={inputCls} />
        </Field>
        <Field label="Phone">
          <input value={form.phone}   onChange={set('phone')}   className={inputCls} />
        </Field>
        <Field label="Website">
          <input value={form.website} onChange={set('website')} className={inputCls} />
        </Field>
        <Field label="Address">
          <input value={form.address} onChange={set('address')} className={inputCls} />
        </Field>
      </div>

      <div className="flex justify-end">
        <SaveButton loading={loading} saved={saved} onClick={handleSave} />
      </div>
    </SectionCard>
  );
};

// ─── My Account ────────────────────────────────────────────────────────────────
const AccountSection = () => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const photoRef = useRef();
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // Load current admin profile from token/me endpoint
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosInstance.get(API_ENDPOINTS.auth.me);
        const u   = res.data?.data || res.data?.user || res.data;
        setForm({
          firstName: u.firstName || '',
          lastName:  u.lastName  || '',
          email:     u.email     || '',
          phone:     u.phone     || '',
        });
      } catch (e) { console.error(e); }
    };
    fetchMe();
  }, []);

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.account, {
        firstName: form.firstName,
        lastName:  form.lastName,
        phone:     form.phone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="My Account"
      subtitle="Update your personal admin profile" icon={User}>

      <ErrorBox msg={error} />

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative w-16 h-16 shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#C8294A]/10 flex items-center justify-center">
            <span className="text-[#C8294A] text-2xl font-bold">
              {form.firstName?.charAt(0) || 'A'}
            </span>
          </div>
          <button onClick={() => photoRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#C8294A] rounded-full flex items-center justify-center shadow">
            <Camera className="w-3 h-3 text-white" />
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" />
        </div>
        <div>
          <p className="font-semibold text-[#1a1a1a]">{form.firstName} {form.lastName}</p>
          <p className="text-sm text-gray-400">{form.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#C8294A]/10 text-[#C8294A] text-xs font-medium rounded-full">
            Admin
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="First Name">
          <input value={form.firstName} onChange={set('firstName')} className={inputCls} />
        </Field>
        <Field label="Last Name">
          <input value={form.lastName}  onChange={set('lastName')}  className={inputCls} />
        </Field>
        <Field label="Email" hint="Email cannot be changed here">
          <input value={form.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} />
        </Field>
      </div>

      <div className="flex justify-end">
        <SaveButton loading={loading} saved={saved} onClick={handleSave} />
      </div>
    </SectionCard>
  );
};

// ─── Security ──────────────────────────────────────────────────────────────────
const SecuritySection = ({ settings, onRefresh }) => {
  const [form,    setForm]    = useState({ current: '', newPass: '', confirm: '' });
  const [show,    setShow]    = useState({ current: false, newPass: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [secLoading, setSecLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [secSaved, setSecSaved] = useState(false);
  const [error,   setError]   = useState('');
  const [twoFA,   setTwoFA]   = useState(false);
  const [alerts,  setAlerts]  = useState(true);

  useEffect(() => {
    if (settings?.security) {
      setTwoFA(settings.security.twoFAEnabled    ?? false);
      setAlerts(settings.security.newDeviceAlerts ?? true);
    }
  }, [settings]);

  const set    = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const toggle = (k) => setShow(p => ({ ...p, [k]: !p[k] }));

  const handlePasswordSave = async () => {
    setError('');
    if (form.newPass !== form.confirm) { setError('New passwords do not match'); return; }
    if (form.newPass.length < 6)       { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.password, {
        currentPassword: form.current,
        newPassword:     form.newPass,
      });
      setSaved(true);
      setForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    setSecLoading(true);
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.security, {
        twoFAEnabled:    twoFA,
        newDeviceAlerts: alerts,
      });
      setSecSaved(true);
      onRefresh();
      setTimeout(() => setSecSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSecLoading(false);
    }
  };

  const PwdField = ({ label, fKey }) => (
    <Field label={label}>
      <div className="relative">
        <input type={show[fKey] ? 'text' : 'password'}
          value={form[fKey]} onChange={set(fKey)}
          placeholder="••••••••"
          className={`${inputCls} pr-10`} />
        <button type="button" onClick={() => toggle(fKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[fKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  );

  return (
    <div className="space-y-4">
      <SectionCard title="Change Password"
        subtitle="Update your admin login password" icon={Lock}>
        <ErrorBox msg={error} />
        <div className="space-y-4 max-w-md">
          <PwdField label="Current Password" fKey="current" />
          <PwdField label="New Password"     fKey="newPass" />
          <PwdField label="Confirm Password" fKey="confirm" />
        </div>
        <div className="flex justify-end">
          <SaveButton loading={loading} saved={saved} onClick={handlePasswordSave} />
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication"
        subtitle="Add extra security to your admin account" icon={Smartphone}>
        <Toggle checked={twoFA}  onChange={setTwoFA}  label="Enable 2FA via Email OTP"
          description="Receive a one-time code on every login" />
        <Toggle checked={alerts} onChange={setAlerts} label="New Device Login Alerts"
          description="Get notified via email when a new device logs in" />
        <div className="flex justify-end pt-2">
          <SaveButton loading={secLoading} saved={secSaved} onClick={handleSecuritySave} />
        </div>
      </SectionCard>

      <SectionCard title="Active Sessions"
        subtitle="Devices currently logged into your account" icon={Monitor}>
        {[
          { device: 'Chrome — Windows 11', location: 'Mumbai, IN',  time: 'Now (current)', current: true  },
          { device: 'Safari — iPhone 14',  location: 'Raipur, IN',  time: '2 hours ago',   current: false },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                <Monitor className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{s.device}</p>
                <p className="text-xs text-gray-400">{s.location} · {s.time}</p>
              </div>
            </div>
            {s.current
              ? <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Current</span>
              : <button className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Revoke
                </button>
            }
          </div>
        ))}
      </SectionCard>
    </div>
  );
};

// ─── Roles & Permissions ───────────────────────────────────────────────────────
const RolesSection = ({ settings, onRefresh }) => {
  const MODULES = ['Dashboard', 'Leads', 'Students', 'Batches', 'Fees', 'Staff', 'Attendance', 'Reports'];
  const ACTIONS = ['View', 'Create', 'Edit', 'Delete'];

  const DEFAULT_PERMS = {
    admin:     { Dashboard:['View','Create','Edit','Delete'], Leads:['View','Create','Edit','Delete'], Students:['View','Create','Edit','Delete'], Batches:['View','Create','Edit','Delete'], Fees:['View','Create','Edit','Delete'], Staff:['View','Create','Edit','Delete'], Attendance:['View','Create','Edit','Delete'], Reports:['View'] },
    staff:     { Dashboard:['View'], Leads:['View','Create','Edit'], Students:['View','Edit'], Batches:['View'], Fees:['View'], Staff:[], Attendance:['View','Create'], Reports:[] },
    counselor: { Dashboard:['View'], Leads:['View','Edit'], Students:['View'], Batches:['View'], Fees:['View'], Staff:[], Attendance:[], Reports:[] },
  };

  const [permissions, setPermissions] = useState(DEFAULT_PERMS);
  const [activeRole,  setActiveRole]  = useState('staff');
  const [loading,     setLoading]     = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (settings?.permissions) {
      setPermissions({ ...DEFAULT_PERMS, ...settings.permissions });
    }
  }, [settings]);

  const hasPerm    = (m, a) => permissions[activeRole]?.[m]?.includes(a);
  const togglePerm = (m, a) => setPermissions(p => {
    const cur     = p[activeRole][m] || [];
    const updated = cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a];
    return { ...p, [activeRole]: { ...p[activeRole], [m]: updated } };
  });

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      // Send only non-admin roles — backend ignores admin anyway
      const { admin, ...editablePerms } = permissions;
      await axiosInstance.put(API_ENDPOINTS.adminSettings.permissions, {
        permissions: editablePerms,
      });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Roles & Permissions"
      subtitle="Control what each role can access across modules" icon={Users}>

      <ErrorBox msg={error} />

      <div className="flex gap-2 flex-wrap">
        {Object.keys(permissions).map(role => (
          <button key={role} onClick={() => setActiveRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeRole === role
                ? 'bg-[#C8294A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {role}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase">Module</th>
              {ACTIONS.map(a => (
                <th key={a} className="text-center py-2 px-4 text-xs font-semibold text-gray-500 uppercase">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MODULES.map(mod => (
              <tr key={mod} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 font-medium text-[#1a1a1a]">{mod}</td>
                {ACTIONS.map(action => (
                  <td key={action} className="py-3 px-4 text-center">
                    {activeRole === 'admin' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <button onClick={() => togglePerm(mod, action)}
                        className={`w-5 h-5 rounded border-2 mx-auto flex items-center justify-center transition-all ${
                          hasPerm(mod, action)
                            ? 'bg-[#C8294A] border-[#C8294A]'
                            : 'border-gray-300 hover:border-[#C8294A]/50'
                        }`}>
                        {hasPerm(mod, action) && <Check className="w-3 h-3 text-white" />}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeRole !== 'admin' && (
        <div className="flex justify-end">
          <SaveButton loading={loading} saved={saved} onClick={handleSave} />
        </div>
      )}
    </SectionCard>
  );
};

// ─── Coupon Manager ────────────────────────────────────────────────────────────
const CouponsSection = () => {
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error,    setError]    = useState('');
  const [form, setForm] = useState({
    code: '', discountType: 'PERCENT', discountValue: '',
    maxDiscount: '', maxUsage: '', expiryDate: ''
  });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await axiosInstance.get(API_ENDPOINTS.adminSettings.coupons.base);
      setCoupons(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleAdd = async () => {
    if (!form.code || !form.discountValue) {
      setError('Code and discount value are required'); return;
    }
    setFormLoading(true); setError('');
    try {
      await axiosInstance.post(API_ENDPOINTS.adminSettings.coupons.base, {
        code:          form.code.toUpperCase(),
        discountType:  form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount:   form.maxDiscount   ? Number(form.maxDiscount)   : null,
        maxUsage:      form.maxUsage      ? Number(form.maxUsage)      : 100,
        expiryDate:    form.expiryDate    || null,
      });
      setForm({ code: '', discountType: 'PERCENT', discountValue: '', maxDiscount: '', maxUsage: '', expiryDate: '' });
      setShowForm(false);
      fetchCoupons();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create coupon');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axiosInstance.patch(API_ENDPOINTS.adminSettings.coupons.toggle(id));
      setCoupons(p => p.map(c => c._id === id ? res.data.data : c));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_ENDPOINTS.adminSettings.coupons.delete(id));
      setCoupons(p => p.filter(c => c._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SectionCard title="Coupon Manager"
      subtitle="Create and manage discount coupons for fee payments" icon={Tag}>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{coupons.length} coupons</p>
        <button onClick={() => { setShowForm(p => !p); setError(''); }}
          className="px-4 py-2 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <ErrorBox msg={error} />

      {/* Add Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
          <h4 className="font-semibold text-[#1a1a1a] text-sm">New Coupon</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Code *</label>
              <input value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select value={form.discountType} onChange={set('discountType')} className={inputCls}>
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Value *</label>
              <input type="number" value={form.discountValue} onChange={set('discountValue')}
                placeholder={form.discountType === 'PERCENT' ? 'e.g. 20' : 'e.g. 500'}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Discount (₹)</label>
              <input type="number" value={form.maxDiscount} onChange={set('maxDiscount')}
                placeholder="e.g. 2000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Usage</label>
              <input type="number" value={form.maxUsage} onChange={set('maxUsage')}
                placeholder="e.g. 100" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={set('expiryDate')} className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={formLoading}
              className="px-4 py-2 bg-[#C8294A] text-white rounded-lg text-sm font-medium hover:bg-[#a01f39] disabled:opacity-60 flex items-center gap-2">
              {formLoading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</>
                : <><Plus className="w-4 h-4" /> Add Coupon</>
              }
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-[#C8294A]" />
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No coupons yet. Create your first one!</p>
          )}
          {coupons.map(c => {
            const usagePct = c.maxUsage ? (c.usedCount / c.maxUsage) * 100 : 0;
            return (
              <div key={c._id} className={`border border-gray-100 rounded-xl p-4 transition-all ${!c.isActive && 'opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-[#C8294A] bg-[#C8294A]/10 px-3 py-1 rounded-lg text-sm">
                      {c.code}
                    </span>
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      {c.discountType === 'PERCENT'
                        ? `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount.toLocaleString()})` : ''}`
                        : `₹${c.discountValue} off`
                      }
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(c._id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                      title={c.isActive ? 'Deactivate' : 'Activate'}>
                      {c.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft  className="w-5 h-5" />
                      }
                    </button>
                    <button onClick={() => handleDelete(c._id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires: {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'Never'}
                  </span>
                  <span>{c.usedCount} / {c.maxUsage} used</span>
                </div>
                {c.maxUsage > 0 && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${usagePct >= 80 ? 'bg-red-500' : 'bg-[#C8294A]'}`}
                      style={{ width: `${Math.min(usagePct, 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};

// ─── Fees Configuration ────────────────────────────────────────────────────────
const FeesConfigSection = ({ settings, onRefresh }) => {
  const [feeHeads, setFeeHeads] = useState(['Course Fee', 'Exam Fee', 'Certification Fee', 'Other']);
  const [newHead,  setNewHead]  = useState('');
  const [gst,      setGst]      = useState({ enabled: false, percentage: 18 });
  const [receipt,  setReceipt]  = useState({ footerText: 'Thank you for your payment!', showLogo: true });
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (settings?.fees) {
      setFeeHeads(settings.fees.feeHeads  || ['Course Fee', 'Exam Fee', 'Certification Fee', 'Other']);
      setGst(settings.fees.gst            || { enabled: false, percentage: 18 });
      setReceipt(settings.fees.receipt    || { footerText: 'Thank you for your payment!', showLogo: true });
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.fees, {
        feeHeads, gst, receipt,
      });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update fees config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Fee Heads"
        subtitle="Customize categories used during fee collection" icon={GraduationCap}>
        <ErrorBox msg={error} />
        <div className="flex flex-wrap gap-2 mb-3">
          {feeHeads.map(h => (
            <span key={h}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8294A]/10 text-[#C8294A] rounded-lg text-sm font-medium">
              {h}
              {h !== 'Course Fee' && (
                <button onClick={() => setFeeHeads(p => p.filter(f => f !== h))}>
                  <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newHead} onChange={e => setNewHead(e.target.value)}
            placeholder="New fee head name..."
            onKeyDown={e => {
              if (e.key === 'Enter' && newHead.trim()) {
                setFeeHeads(p => [...p, newHead.trim()]); setNewHead('');
              }
            }}
            className={`${inputCls} flex-1`} />
          <button onClick={() => { if (newHead.trim()) { setFeeHeads(p => [...p, newHead.trim()]); setNewHead(''); } }}
            className="px-4 py-2 bg-[#C8294A] text-white rounded-lg hover:bg-[#a01f39]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Tax & Receipt"
        subtitle="Configure GST and receipt PDF appearance" icon={Percent}>
        <Toggle checked={gst.enabled} onChange={v => setGst(p => ({ ...p, enabled: v }))}
          label="Enable GST on Receipts"
          description="Adds a GST line item to all payment receipts" />
        {gst.enabled && (
          <div className="max-w-xs mt-2 mb-2">
            <Field label="GST Percentage (%)">
              <input type="number" value={gst.percentage}
                onChange={e => setGst(p => ({ ...p, percentage: Number(e.target.value) }))}
                className={inputCls} />
            </Field>
          </div>
        )}
        <Toggle checked={receipt.showLogo}
          onChange={v => setReceipt(p => ({ ...p, showLogo: v }))}
          label="Show Logo on PDF Receipts"
          description="Prints the institute logo at the top of PDF receipts" />
        <Field label="Receipt Footer Text">
          <input value={receipt.footerText}
            onChange={e => setReceipt(p => ({ ...p, footerText: e.target.value }))}
            className={inputCls} />
        </Field>
        <div className="flex justify-end">
          <SaveButton loading={loading} saved={saved} onClick={handleSave} />
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Notifications ─────────────────────────────────────────────────────────────
const NotificationsSection = ({ settings, onRefresh }) => {
  const [email, setEmail] = useState({
    newLead: true, feePayment: true, newStudent: true,
    staffAdded: false, batchFull: true, dailySummary: false,
  });
  const [inApp, setInApp] = useState({
    newLead: true, feePayment: true, attendance: false, batchFull: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (settings?.notifications) {
      if (settings.notifications.email) setEmail(settings.notifications.email);
      if (settings.notifications.inApp) setInApp(settings.notifications.inApp);
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.notifications, { email, inApp });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorBox msg={error} />
      <SectionCard title="Email Notifications"
        subtitle="Get notified via email for key CRM events" icon={Mail}>
        <Toggle checked={email.newLead}      onChange={v => setEmail(p=>({...p,newLead:v}))}      label="New Lead Added"        description="Notify when a new lead is created" />
        <Toggle checked={email.feePayment}   onChange={v => setEmail(p=>({...p,feePayment:v}))}   label="Fee Payment Received"  description="Notify when a student pays fees" />
        <Toggle checked={email.newStudent}   onChange={v => setEmail(p=>({...p,newStudent:v}))}   label="New Student Admitted"  description="Notify on new student registration" />
        <Toggle checked={email.staffAdded}   onChange={v => setEmail(p=>({...p,staffAdded:v}))}   label="Staff Member Added"    description="Notify when new staff is created" />
        <Toggle checked={email.batchFull}    onChange={v => setEmail(p=>({...p,batchFull:v}))}    label="Batch Full Alert"      description="Notify when a batch reaches capacity" />
        <Toggle checked={email.dailySummary} onChange={v => setEmail(p=>({...p,dailySummary:v}))} label="Daily Summary Email"   description="Receive daily activity digest every morning" />
      </SectionCard>

      <SectionCard title="In-App Notifications"
        subtitle="Manage bell icon alerts in the dashboard" icon={Bell}>
        <Toggle checked={inApp.newLead}    onChange={v => setInApp(p=>({...p,newLead:v}))}    label="New Leads"         description="Show alert for new lead assignments" />
        <Toggle checked={inApp.feePayment} onChange={v => setInApp(p=>({...p,feePayment:v}))} label="Fee Payments"      description="Show alert when payment is collected" />
        <Toggle checked={inApp.attendance} onChange={v => setInApp(p=>({...p,attendance:v}))} label="Attendance Marked" description="Show alert when attendance is marked" />
        <Toggle checked={inApp.batchFull}  onChange={v => setInApp(p=>({...p,batchFull:v}))}  label="Batch Full"        description="Show alert when a batch is full" />
        <div className="flex justify-end pt-2">
          <SaveButton loading={loading} saved={saved} onClick={handleSave} />
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Appearance ────────────────────────────────────────────────────────────────
const AppearanceSection = ({ settings, onRefresh }) => {
  const [theme,   setTheme]   = useState('light');
  const [sidebar, setSidebar] = useState(false);
  const [dateFmt, setDateFmt] = useState('DD/MM/YYYY');
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (settings?.appearance) {
      setTheme(settings.appearance.theme           || 'light');
      setSidebar(settings.appearance.sidebarCollapsed ?? false);
      setDateFmt(settings.appearance.dateFormat    || 'DD/MM/YYYY');
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      await axiosInstance.put(API_ENDPOINTS.adminSettings.appearance, {
        theme, dateFormat: dateFmt, sidebarCollapsed: sidebar,
      });
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update appearance');
    } finally {
      setLoading(false);
    }
  };

  const THEMES = [
    { id: 'light',  label: 'Light',  icon: Sun     },
    { id: 'dark',   label: 'Dark',   icon: Moon    },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <SectionCard title="Appearance"
      subtitle="Customize how the dashboard looks and behaves" icon={Palette}>

      <ErrorBox msg={error} />

      <Field label="Theme">
        <div className="flex gap-3 mt-1">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTheme(id)}
              className={`flex-1 py-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-sm font-medium transition-all ${
                theme === id
                  ? 'border-[#C8294A] bg-[#C8294A]/5 text-[#C8294A]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Date Format">
        <select value={dateFmt} onChange={e => setDateFmt(e.target.value)} className={inputCls}>
          <option value="DD/MM/YYYY">DD/MM/YYYY (Indian)</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
        </select>
      </Field>

      <Toggle checked={sidebar} onChange={setSidebar}
        label="Collapse Sidebar by Default"
        description="Start the dashboard with sidebar in icon-only mode" />

      <div className="flex justify-end">
        <SaveButton loading={loading} saved={saved} onClick={handleSave} />
      </div>
    </SectionCard>
  );
};

// ─── Data Management ───────────────────────────────────────────────────────────
const DataSection = () => {
  const [backupLoading,  setBackupLoading]  = useState(false);
  const [clearLoading,   setClearLoading]   = useState(false);
  const [clearConfirm,   setClearConfirm]   = useState(false);
  const [clearResult,    setClearResult]    = useState(null);
  const [error,          setError]          = useState('');
  const restoreRef = useRef();

  const handleBackup = async () => {
    setBackupLoading(true); setError('');
    try {
      const res = await axiosInstance.get(
        API_ENDPOINTS.adminSettings.data.archived.replace('archived', 'backup') 
        || API_ENDPOINTS.admin?.backup,
        { responseType: 'blob' }
      );
      Object.assign(document.createElement('a'), {
        href:     URL.createObjectURL(new Blob([res.data])),
        download: `Backup_${new Date().toISOString().split('T')[0]}.json`
      }).click();
    } catch (e) {
      setError('Backup failed. Check if backup endpoint is configured.');
      console.error(e);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleClearArchived = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearLoading(true); setError('');
    try {
      const res = await axiosInstance.delete(API_ENDPOINTS.adminSettings.data.archived);
      setClearResult(res.data?.deleted);
      setClearConfirm(false);
      setTimeout(() => setClearResult(null), 4000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to clear archived data');
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <SectionCard title="Data Management"
      subtitle="Backup, restore and manage your CRM data" icon={Database}>

      <ErrorBox msg={error} />

      {/* Backup */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-[#1a1a1a] text-sm">Export Backup</p>
            <p className="text-xs text-gray-400">Download full database backup as JSON</p>
          </div>
        </div>
        <button onClick={handleBackup} disabled={backupLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
          {backupLoading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Exporting...</>
            : <><Download  className="w-4 h-4" /> Backup</>
          }
        </button>
      </div>

      {/* Restore */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-[#1a1a1a] text-sm">Restore Backup</p>
            <p className="text-xs text-gray-400">Upload a previously exported backup JSON file</p>
          </div>
        </div>
        <button onClick={() => restoreRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Restore
        </button>
        <input ref={restoreRef} type="file" accept=".json" className="hidden" />
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h4 className="font-bold text-red-700 text-sm">Danger Zone</h4>
        </div>

        {clearResult && (
          <div className="bg-white border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
            ✓ Cleared — {clearResult.students} students, {clearResult.leads} leads removed
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Clear Archived Data</p>
            <p className="text-xs text-red-400">Permanently remove soft-deleted records from the database</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {clearConfirm && (
              <button onClick={() => setClearConfirm(false)}
                className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
                Cancel
              </button>
            )}
            <button onClick={handleClearArchived} disabled={clearLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-60 ${
                clearConfirm
                  ? 'bg-red-700 text-white hover:bg-red-800'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}>
              {clearLoading
                ? <><RefreshCw className="w-3 h-3 animate-spin" /> Clearing...</>
                : clearConfirm
                  ? <><AlertTriangle className="w-3 h-3" /> Confirm Clear</>
                  : <><Trash2 className="w-3 h-3" /> Clear</>
              }
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

// ─── Main SettingsPanel ────────────────────────────────────────────────────────
const SettingsPanel = () => {
  const [active,   setActive]   = useState('institute');
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);

  // ── Single fetch for all settings — passed as props to each section ────────
  const fetchSettings = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.adminSettings.base);
      setSettings(res.data?.data || null);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Pass settings + onRefresh into every section that needs it ────────────
  const SECTIONS = {
    institute:     <InstituteSection     settings={settings} onRefresh={fetchSettings} />,
    account:       <AccountSection />,
    security:      <SecuritySection      settings={settings} onRefresh={fetchSettings} />,
    roles:         <RolesSection         settings={settings} onRefresh={fetchSettings} />,
    coupons:       <CouponsSection />,
    fees:          <FeesConfigSection    settings={settings} onRefresh={fetchSettings} />,
    notifications: <NotificationsSection settings={settings} onRefresh={fetchSettings} />,
    appearance:    <AppearanceSection    settings={settings} onRefresh={fetchSettings} />,
    data:          <DataSection />,
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your institute, account and system preferences
        </p>
      </div>

      {/* Navbar Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="overflow-x-auto">
          <div className="flex min-w-max border-b border-gray-100">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActive(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  active === id
                    ? 'border-[#C8294A] text-[#C8294A] bg-[#C8294A]/5'
                    : 'border-transparent text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C8294A] mb-3" />
            <p className="text-gray-500 text-sm">Loading settings...</p>
          </div>
        ) : (
          SECTIONS[active] ?? (
            <div className="bg-white rounded-xl shadow flex flex-col items-center justify-center h-64 text-gray-400">
              <Settings className="w-10 h-10 mb-2 text-gray-200" />
              <p className="font-medium">Coming Soon</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
