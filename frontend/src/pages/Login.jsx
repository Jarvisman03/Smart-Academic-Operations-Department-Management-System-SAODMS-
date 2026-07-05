import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

const demoAccounts = [
  { role: 'Admin', email: 'admin@sirtcse.edu' },
  { role: 'Dean', email: 'dean@sirtcse.edu' },
  { role: 'HOD', email: 'hod1@sirtcse.edu' },
  { role: 'Co-HOD', email: 'cohod@sirtcse.edu' },
  { role: 'Faculty', email: 'faculty1@sirtcse.edu' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('hod1@sirtcse.edu');
  const [password, setPassword] = useState('Sirt@123');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to SAODMS');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-xl">S</div>
          <div>
            <div className="font-bold text-lg">SAODMS</div>
            <div className="text-xs text-brand-200">Smart Academic Operations</div>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Academic Operations<br />Command Center</h1>
          <p className="mt-4 text-brand-100 max-w-md">
            Monitor faculty, classrooms, labs, and attendance across the CSE department in real time.
            Built for HODs, Deans, Co-HODs, and Administrators at SIRT.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {['Live Faculty', 'Floor Maps', 'Smart Timetable', 'Attendance AI', 'Substitutes', 'Reports'].map((f) => (
              <div key={f} className="bg-white/10 rounded-lg px-3 py-2 text-xs font-medium">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-xs text-brand-200">Sagar Institute of Research And Technology · Computer Science & Engineering</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 bg-slate-100">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center font-extrabold text-white">S</div>
            <span className="font-bold text-slate-800">SAODMS · SIRT CSE</span>
          </div>
          <div className="card card-pad">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Access your operations dashboard</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner className="w-5 h-5 text-white" /> : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-2">Demo accounts (password: Sirt@123)</p>
              <div className="flex flex-wrap gap-2">
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => { setEmail(a.email); setPassword('Sirt@123'); }}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-brand-100 hover:text-brand-700 transition"
                  >
                    {a.role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
