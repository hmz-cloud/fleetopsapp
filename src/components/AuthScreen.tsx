import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, ShieldAlert, Users, Compass, BarChart3, Truck, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

export default function AuthScreen({ users, onLogin, onSignup }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [sfName, setSfName] = useState('');
  const [slName, setSlName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');
  const [sOrg, setSOrg] = useState('');
  const [sRole, setSRole] = useState<'admin' | 'manager' | 'viewer' | 'driver'>('viewer');
  const [signupError, setSignupError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const emailNorm = loginEmail.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === emailNorm && u.password === loginPassword);
    if (!user) {
      setLoginError('Invalid email or password. Try a demo account shortcut below.');
      return;
    }
    if (!user.active) {
      setLoginError('This account has been suspended by an administrator.');
      return;
    }
    onLogin(user);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (!sfName.trim() || !slName.trim() || !sEmail.trim() || !sPassword.trim() || !sOrg.trim()) {
      setSignupError('Please fill out all required fields.');
      return;
    }
    if (sPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    const emailNorm = sEmail.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailNorm)) {
      setSignupError('An account with this email address already exists.');
      return;
    }

    const newUser: User = {
      id: Date.now(),
      email: emailNorm,
      password: sPassword,
      firstName: sfName.trim(),
      lastName: slName.trim(),
      role: sRole,
      org: sOrg.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      color: ['#4f8ef7', '#9b59b6', '#1abc9c', '#f39c12', '#e74c3c'][Math.floor(Math.random() * 5)],
      active: true
    };
    onSignup(newUser);
  };

  const handleDemoLogin = (role: 'admin' | 'manager' | 'viewer' | 'driver') => {
    const emailMap = {
      admin: 'admin@fleetops.sa',
      manager: 'manager@fleetops.sa',
      viewer: 'viewer@fleetops.sa',
      driver: 'ahmed@fleetops.sa'
    };
    const user = users.find(u => u.email === emailMap[role]);
    if (user) onLogin(user);
  };

  return (
    <div className="flex min-height-screen min-h-screen bg-[#0b0d14] text-[#e2e5f3] font-sans">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1 bg-[#12151f] border-r border-[#252a3d] flex-col items-center justify-center p-16 relative overflow-hidden">
        {/* Background Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,42,61,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(37,42,61,0.4)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(79,142,247,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(155,89,182,0.06)_0%,transparent_50%)] pointer-events-none" />

        <div className="relative z-10 max-w-[480px] text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-[#4f8ef7] to-[#7b5ea7] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_8px_32px_rgba(79,142,247,0.35)]"
          >
            <Truck className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-none mb-4">
            Operate your fleet with <span className="bg-gradient-to-r from-[#4f8ef7] to-[#a78bfa] bg-clip-text text-transparent">precision</span>
          </h1>
          <p className="text-[#8b92b8] text-base leading-relaxed mb-10">
            Fleet Ops gives your team a single command center for vehicles, drivers, cost-center transfers, and real-time maintenance logging. Built for industrial scale.
          </p>

          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-4 p-3 bg-[#181c29] border border-[#252a3d] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#4f8ef7]/10 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-[#7aaeff]" />
              </div>
              <span className="text-xs font-semibold text-[#8b92b8]">Real-time telemetry and compliance checks</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-[#181c29] border border-[#252a3d] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#2ecc71]/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#2ecc71]" />
              </div>
              <span className="text-xs font-semibold text-[#8b92b8]">Multi-user with secure role hierarchies</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-[#181c29] border border-[#252a3d] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#f39c12]/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-[#f39c12]" />
              </div>
              <span className="text-xs font-semibold text-[#8b92b8]">Budget analytics, log audits, and CSV pipelines</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[380px]">
          {/* Mobile Header Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4f8ef7] to-[#7b5ea7] rounded-xl flex items-center justify-center shadow-lg shadow-[#4f8ef7]/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Fleet<span className="text-[#7aaeff]">Ops</span></div>
              <div className="text-[10px] text-[#555e84] font-semibold tracking-wider uppercase">Operations Platform</div>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex bg-[#181c29] border border-[#252a3d] rounded-lg p-1 mb-8">
            <button 
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded transition-all ${activeTab === 'login' ? 'bg-[#4f8ef7] text-white' : 'text-[#555e84] hover:text-[#8b92b8]'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded transition-all ${activeTab === 'signup' ? 'bg-[#4f8ef7] text-white' : 'text-[#555e84] hover:text-[#8b92b8]'}`}
            >
              Create Account
            </button>
          </div>

          {/* LOGIN VIEW */}
          {activeTab === 'login' && (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleLogin} 
              className="space-y-4"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-xs text-[#555e84] mt-1">Sign in to access your Fleet Ops dashboard</p>
              </div>

              {loginError && (
                <div className="flex items-start gap-2 bg-[#e74c3c]/10 border border-[#e74c3c]/30 text-[#e74c3c] text-xs p-3 rounded-lg">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b92b8]">Email address</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@fleetops.sa" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] focus:bg-[#1f2335] transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#8b92b8]">Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] focus:bg-[#1f2335] transition"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#4f8ef7] hover:bg-[#7aaeff] text-white py-3 rounded-lg text-sm font-bold tracking-wide transition flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#4f8ef7]/20"
              >
                <KeyRound className="w-4 h-4" />
                Sign In →
              </button>

              <div className="flex items-center gap-3 my-6 text-[11px] text-[#555e84] font-semibold uppercase tracking-wider">
                <span className="h-px bg-[#252a3d] flex-1" />
                <span>Demo shortcuts</span>
                <span className="h-px bg-[#252a3d] flex-1" />
              </div>

              <div className="space-y-2">
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="w-full bg-transparent border border-[#252a3d] hover:bg-[#181c29] hover:border-[#313757] py-2 px-3 rounded-lg text-xs font-medium text-[#8b92b8] hover:text-[#e2e5f3] transition flex items-center justify-between"
                >
                  <span>👑 Administrator</span>
                  <span className="text-[10px] bg-[#4f8ef7]/10 text-[#7aaeff] px-2 py-0.5 rounded font-mono">Full Access</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('manager')}
                  className="w-full bg-transparent border border-[#252a3d] hover:bg-[#181c29] hover:border-[#313757] py-2 px-3 rounded-lg text-xs font-medium text-[#8b92b8] hover:text-[#e2e5f3] transition flex items-center justify-between"
                >
                  <span>🚛 Fleet Manager</span>
                  <span className="text-[10px] bg-[#9b59b6]/10 text-[#9b59b6] px-2 py-0.5 rounded font-mono">Manager</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('viewer')}
                  className="w-full bg-transparent border border-[#252a3d] hover:bg-[#181c29] hover:border-[#313757] py-2 px-3 rounded-lg text-xs font-medium text-[#8b92b8] hover:text-[#e2e5f3] transition flex items-center justify-between"
                >
                  <span>👁️ Auditor / Viewer</span>
                  <span className="text-[10px] bg-[#1abc9c]/10 text-[#1abc9c] px-2 py-0.5 rounded font-mono">Read Only</span>
                </button>
                <button 
                  type="button"
                  onClick={() => handleDemoLogin('driver')}
                  className="w-full bg-transparent border border-[#252a3d] hover:bg-[#181c29] hover:border-[#313757] py-2 px-3 rounded-lg text-xs font-medium text-[#8b92b8] hover:text-[#e2e5f3] transition flex items-center justify-between"
                >
                  <span>🔑 Active Fleet Driver</span>
                  <span className="text-[10px] bg-[#e67e22]/10 text-[#e67e22] px-2 py-0.5 rounded font-mono">Driver</span>
                </button>
              </div>
            </motion.form>
          )}

          {/* SIGNUP VIEW */}
          {activeTab === 'signup' && (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSignup} 
              className="space-y-3"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
                <p className="text-xs text-[#555e84] mt-1">Register a team admin account for your organization</p>
              </div>

              {signupError && (
                <div className="flex items-start gap-2 bg-[#e74c3c]/10 border border-[#e74c3c]/30 text-[#e74c3c] text-xs p-3 rounded-lg">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{signupError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8b92b8]">First name</label>
                  <input 
                    type="text" 
                    value={sfName}
                    onChange={(e) => setSfName(e.target.value)}
                    placeholder="Hassan" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#8b92b8]">Last name</label>
                  <input 
                    type="text" 
                    value={slName}
                    onChange={(e) => setSlName(e.target.value)}
                    placeholder="Zarroug" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8b92b8]">Email address</label>
                <input 
                  type="email" 
                  value={sEmail}
                  onChange={(e) => setSEmail(e.target.value)}
                  placeholder="you@company.sa" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8b92b8]">Password</label>
                <input 
                  type="password" 
                  value={sPassword}
                  onChange={(e) => setSPassword(e.target.value)}
                  placeholder="Min 6 characters" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8b92b8]">Organization</label>
                <input 
                  type="text" 
                  value={sOrg}
                  onChange={(e) => setSOrg(e.target.value)}
                  placeholder="My Transport Company" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
                  required
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-[#8b92b8]">System Role</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setSRole('admin')}
                    className={`p-2.5 border rounded-lg text-center transition flex flex-col items-center justify-center ${sRole === 'admin' ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-white' : 'border-[#252a3d] bg-transparent text-[#8b92b8] hover:border-[#313757]'}`}
                  >
                    <span className="text-base mb-0.5">👑</span>
                    <span className="text-[10px] font-bold">Admin</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSRole('manager')}
                    className={`p-2.5 border rounded-lg text-center transition flex flex-col items-center justify-center ${sRole === 'manager' ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-white' : 'border-[#252a3d] bg-transparent text-[#8b92b8] hover:border-[#313757]'}`}
                  >
                    <span className="text-base mb-0.5">🚛</span>
                    <span className="text-[10px] font-bold">Mgr</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSRole('viewer')}
                    className={`p-2.5 border rounded-lg text-center transition flex flex-col items-center justify-center ${sRole === 'viewer' ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-white' : 'border-[#252a3d] bg-transparent text-[#8b92b8] hover:border-[#313757]'}`}
                  >
                    <span className="text-base mb-0.5">👁️</span>
                    <span className="text-[10px] font-bold">Audt</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSRole('driver')}
                    className={`p-2.5 border rounded-lg text-center transition flex flex-col items-center justify-center ${sRole === 'driver' ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-white' : 'border-[#252a3d] bg-transparent text-[#8b92b8] hover:border-[#313757]'}`}
                  >
                    <span className="text-base mb-0.5">🔑</span>
                    <span className="text-[10px] font-bold">Driver</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#4f8ef7] hover:bg-[#7aaeff] text-white py-2.5 rounded-lg text-xs font-bold tracking-wide transition mt-4 flex items-center justify-center gap-2 shadow-lg shadow-[#4f8ef7]/20"
              >
                Create Account →
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
