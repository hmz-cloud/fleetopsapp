import React, { useState } from 'react';
import { User, AuditLog } from '../types';
import { Users, FileCode, CheckCircle2, ShieldAlert, Sparkles, UserPlus, Search, Clock, ShieldCheck, Ban, ArrowDownAZ } from 'lucide-react';

interface AdminAndAuditViewProps {
  viewType: 'users' | 'auditlog';
  users: User[];
  auditLogs: AuditLog[];
  onToggleUserSuspended: (id: number) => void;
  onAddUser: (u: Omit<User, 'id' | 'createdAt' | 'color' | 'active'>) => void;
  onDeleteUser: (id: number) => void;
  currentUser: User | null;
}

export default function AdminAndAuditView({
  viewType,
  users,
  auditLogs,
  onToggleUserSuspended,
  onAddUser,
  onDeleteUser,
  currentUser
}: AdminAndAuditViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'viewer'>('viewer');
  const [org, setOrg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    onAddUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      org: org.trim() || 'Fleet Ops Partner'
    });

    setIsModalOpen(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setRole('viewer');
    setOrg('');
  };

  const filteredUsers = users.filter(u => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return `${u.firstName} ${u.lastName} ${u.email} ${u.role} ${u.org}`.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return `${log.action} ${log.detail} ${log.user}`.toLowerCase().includes(q);
    }
    return true;
  });

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'admin':
        return <span className="text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">ADMIN</span>;
      case 'manager':
        return <span className="text-[10px] font-bold bg-[#4f8ef7]/10 text-[#7aaeff] border border-[#4f8ef7]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">MANAGER</span>;
      default:
        return <span className="text-[10px] font-bold bg-white/5 text-[#8b92b8] border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">AUDITOR</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* USERS MANAGER VIEW */}
      {viewType === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
              <input 
                type="text" 
                placeholder="Search staff names, role levels, active emails..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
              />
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Invite Team Member
            </button>
          </div>

          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#252a3d] bg-[#181c29]">
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">User Identity</th>
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Email Account</th>
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Security Tier</th>
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Organization / Dept</th>
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Created</th>
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Status</th>
                    <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider text-right">Administrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252a3d]">
                  {filteredUsers.map(u => {
                    const self = u.id === currentUser?.id;
                    const initials = `${u.firstName[0] || ''}${u.lastName[0] || ''}`.toUpperCase();
                    return (
                      <tr key={u.id} className="hover:bg-[#181c29]/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow-sm shrink-0"
                              style={{ backgroundColor: u.color || '#4f8ef7' }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{u.firstName} {u.lastName} {self && <span className="text-[10px] text-[#7aaeff] bg-[#4f8ef7]/10 px-1.5 py-0.5 rounded font-bold font-mono ml-1">You</span>}</div>
                              <span className="text-[10px] text-[#555e84] mt-0.5 inline-block">Staff ID: #{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#8b92b8] font-mono">{u.email}</td>
                        <td className="p-4">{getRoleBadge(u.role)}</td>
                        <td className="p-4 text-[#8b92b8] font-semibold">{u.org}</td>
                        <td className="p-4 text-[#555e84] font-semibold">{u.createdAt}</td>
                        <td className="p-4">
                          {u.active ? (
                            <span className="text-[9px] font-bold text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded-full border border-[#2ecc71]/15">Active</span>
                          ) : (
                            <span className="text-[9px] font-bold text-[#e74c3c] bg-[#e74c3c]/10 px-2 py-0.5 rounded-full border border-[#e74c3c]/15">Suspended</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => onToggleUserSuspended(u.id)}
                              disabled={self}
                              className={`font-semibold text-[10px] px-2.5 py-1 rounded transition ${self ? 'opacity-40 cursor-not-allowed text-[#555e84]' : u.active ? 'bg-transparent hover:bg-white/5 border border-[#252a3d] text-[#8b92b8]' : 'bg-[#2ecc71]/10 hover:bg-[#2ecc71]/20 text-[#2ecc71]'}`}
                            >
                              {u.active ? 'Suspend' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => { if (confirm('Remove user permanently from this platform?')) onDeleteUser(u.id); }}
                              disabled={self}
                              className={`font-semibold text-[10px] px-2.5 py-1 rounded transition ${self ? 'opacity-40 cursor-not-allowed text-[#555e84]' : 'bg-transparent hover:bg-red-500/10 text-[#e74c3c]'}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM AUDIT TRAIL LOGS */}
      {viewType === 'auditlog' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
              <input 
                type="text" 
                placeholder="Filter logs by operation keyword, user brand..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
              />
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-[#8b92b8] bg-[#181c29] border border-[#252a3d] px-3.5 py-2 rounded-xl shrink-0 font-mono">
              <Clock className="w-4 h-4 text-[#555e84]" />
              <span>Audit logs: <strong className="text-white">{auditLogs.length} events</strong></span>
            </div>
          </div>

          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5">
            <div className="flow-root">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-[#555e84]">No operation audits matching filters.</div>
              ) : (
                <ul className="-mb-8">
                  {filteredLogs.map((log, logIdx) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {logIdx !== filteredLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#252a3d]" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-[#12151f] bg-[#181c29] border border-[#252a3d]">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: log.color || '#4f8ef7' }} />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div className="text-xs text-[#8b92b8]">
                              <span className="font-bold text-white mr-1.5">{log.action}</span>
                              <span className="text-[#8b92b8]">{log.detail}</span>
                              <div className="text-[11px] text-[#555e84] mt-1">
                                Modified by: <strong className="text-white font-semibold">{log.user}</strong>
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap text-[10px] text-[#555e84] font-mono font-bold">
                              {new Date(log.time).toLocaleDateString()} {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW USER MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-md p-5 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Create Security Profile</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8b92b8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">First name *</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Omar" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Last name *</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Hassan" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Email Account address *</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="omar@company.sa" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Security Password *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Authorized tier role</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="manager">Manager (Read & Edit)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Company Department</label>
                  <input 
                    type="text" 
                    value={org} 
                    onChange={e => setOrg(e.target.value)}
                    placeholder="Operations Head" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-[#1f2335] hover:bg-[#252a3d] text-white text-xs font-bold px-4 py-2 rounded-xl transition">Cancel</button>
                <button type="submit" className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-5 py-2 rounded-xl transition">Invite staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
