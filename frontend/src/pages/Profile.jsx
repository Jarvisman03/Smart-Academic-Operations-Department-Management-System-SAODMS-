import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import { roleLabels } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    const res = await authApi.updateProfile({ name, phone });
    setUser({ ...user, ...res.data });
    toast.success('Profile updated');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await authApi.changePassword(pw);
      toast.success('Password changed. Please log in again.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account details" />
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            <Avatar name={user?.name} src={user?.avatar} size="w-20 h-20" />
            <div>
              <div className="font-bold text-slate-900">{user?.name}</div>
              <div className="text-sm text-slate-500">{roleLabels[user?.role]}</div>
              <div className="text-xs text-slate-400 mt-1">{user?.email}</div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4">Account Details</h3>
          <form onSubmit={saveProfile} className="space-y-4 max-w-md">
            <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <button className="btn-primary">Save changes</button>
          </form>

          <h3 className="font-semibold text-slate-800 mt-8 mb-4">Change Password</h3>
          <form onSubmit={changePassword} className="space-y-4 max-w-md">
            <div><label className="label">Current password</label><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
            <div><label className="label">New password</label><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
            <button className="btn-ghost">Update password</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
