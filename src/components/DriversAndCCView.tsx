import React, { useState } from 'react';
import { Driver, CostCenter, Vehicle } from '../types';
import { Users, FolderKanban, Plus, Search, Edit2, Trash2, ShieldCheck, Mail, Phone, DollarSign, Activity } from 'lucide-react';

interface DriversAndCCViewProps {
  viewType: 'drivers' | 'costcenters';
  drivers: Driver[];
  costCenters: CostCenter[];
  vehicles: Vehicle[];
  onAddDriver: (d: Omit<Driver, 'id' | 'trips'>) => void;
  onEditDriver: (id: number, d: Partial<Driver>) => void;
  onDeleteDriver: (id: number) => void;
  onAddCostCenter: (cc: Omit<CostCenter, 'id'>) => void;
  onEditCostCenter: (id: number, cc: Partial<CostCenter>) => void;
  onDeleteCostCenter: (id: number) => void;
  userRole: 'admin' | 'manager' | 'viewer';
  currency: string;
}

export default function DriversAndCCView({
  viewType,
  drivers,
  costCenters,
  vehicles,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onAddCostCenter,
  onEditCostCenter,
  onDeleteCostCenter,
  userRole,
  currency
}: DriversAndCCViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // Modal forms
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [dName, setDName] = useState('');
  const [dLicense, setDLicense] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dEmail, setDEmail] = useState('');
  const [dStatus, setDStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [dVehicleId, setDVehicleId] = useState<number | null>(null);
  const [dColor, setDColor] = useState('#4f8ef7');

  const [isCcModalOpen, setIsCcModalOpen] = useState(false);
  const [editingCc, setEditingCc] = useState<CostCenter | null>(null);
  const [ccNameField, setCcNameField] = useState('');
  const [ccCode, setCcCode] = useState('');
  const [ccDesc, setCcDesc] = useState('');
  const [ccBudget, setCcBudget] = useState(0);
  const [ccSpent, setCcSpent] = useState(0);
  const [ccActive, setCcActive] = useState(true);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  // Driver Submission
  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName.trim() || !dLicense.trim()) {
      alert('Please fill out required fields');
      return;
    }

    const payload = {
      name: dName.trim(),
      license: dLicense.toUpperCase().trim(),
      phone: dPhone.trim(),
      email: dEmail.toLowerCase().trim(),
      status: dStatus,
      vehicleId: dVehicleId,
      joinDate: editingDriver ? editingDriver.joinDate : new Date().toISOString().split('T')[0],
      color: dColor
    };

    if (editingDriver) {
      onEditDriver(editingDriver.id, payload);
    } else {
      onAddDriver(payload);
    }
    setIsDriverModalOpen(false);
  };

  const handleOpenEditDriver = (d: Driver) => {
    setEditingDriver(d);
    setDName(d.name);
    setDLicense(d.license);
    setDPhone(d.phone);
    setDEmail(d.email);
    setDStatus(d.status);
    setDVehicleId(d.vehicleId);
    setDColor(d.color || '#4f8ef7');
    setIsDriverModalOpen(true);
  };

  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setDName('');
    setDLicense('');
    setDPhone('');
    setDEmail('');
    setDStatus('active');
    setDVehicleId(null);
    setDColor('#4f8ef7');
    setIsDriverModalOpen(true);
  };

  // Cost Center Submission
  const handleCcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ccNameField.trim() || !ccCode.trim()) {
      alert('Please fill out Name and Code fields.');
      return;
    }

    const payload = {
      name: ccNameField.trim(),
      code: ccCode.toUpperCase().trim(),
      desc: ccDesc.trim(),
      budget: Number(ccBudget),
      spent: Number(ccSpent),
      active: ccActive
    };

    if (editingCc) {
      onEditCostCenter(editingCc.id, payload);
    } else {
      onAddCostCenter(payload);
    }
    setIsCcModalOpen(false);
  };

  const handleOpenEditCc = (cc: CostCenter) => {
    setEditingCc(cc);
    setCcNameField(cc.name);
    setCcCode(cc.code);
    setCcDesc(cc.desc);
    setCcBudget(cc.budget);
    setCcSpent(cc.spent);
    setCcActive(cc.active);
    setIsCcModalOpen(true);
  };

  const handleOpenAddCc = () => {
    setEditingCc(null);
    setCcNameField('');
    setCcCode('');
    setCcDesc('');
    setCcBudget(0);
    setCcSpent(0);
    setCcActive(true);
    setIsCcModalOpen(true);
  };

  const getVehicleLabel = (id: number | null) => {
    if (id === null) return 'Unallocated';
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.make} ${v.model} (${v.fleet})` : 'Unassigned';
  };

  // Filter lists
  const filteredDrivers = drivers.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return `${d.name} ${d.license} ${d.email} ${d.phone}`.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCostCenters = costCenters.filter(cc => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return `${cc.name} ${cc.code} ${cc.desc}`.toLowerCase().includes(q);
    }
    return true;
  });

  const avatarColors = ['#4f8ef7', '#9b59b6', '#1abc9c', '#e74c3c', '#f39c12', '#27ae60', '#e91e63'];

  return (
    <div className="space-y-6">
      {/* DRIVERS VIEW PANEL */}
      {viewType === 'drivers' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
              <input 
                type="text" 
                placeholder="Search drivers, email address, phone..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
              />
            </div>

            {canEdit && (
              <button 
                onClick={handleOpenAddDriver}
                className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add New Driver
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {['all', 'active', 'on_leave', 'inactive'].map(st => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition shrink-0 ${filter === st ? 'bg-[#4f8ef7]/15 border-[#4f8ef7] text-[#7aaeff] font-semibold' : 'bg-[#12151f] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
              >
                {st === 'all' ? 'All Drivers' : st.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {filteredDrivers.length === 0 ? (
            <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-16 text-center text-[#8b92b8]">
              <Users className="w-12 h-12 text-[#555e84] mx-auto mb-4" />
              <h3 className="text-sm font-bold text-white">No Driver Registry Found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDrivers.map(d => {
                const initials = d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={d.id} className="bg-[#12151f] border border-[#252a3d] hover:border-[#313757] rounded-2xl p-5 flex flex-col justify-between transition group">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0" 
                            style={{ backgroundColor: d.color || '#4f8ef7' }}
                          >
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs group-hover:text-[#7aaeff] transition-colors">{d.name}</h4>
                            <span className="text-[10px] text-[#8b92b8] font-mono mt-0.5 inline-block bg-white/5 px-2 py-0.5 rounded">{d.license}</span>
                          </div>
                        </div>

                        {d.status === 'active' && (
                          <span className="text-[9px] font-bold bg-[#2ecc71]/10 text-[#2ecc71] px-2 py-0.5 border border-[#2ecc71]/20 rounded-full">Active</span>
                        )}
                        {d.status === 'on_leave' && (
                          <span className="text-[9px] font-bold bg-[#f39c12]/10 text-[#f39c12] px-2 py-0.5 border border-[#f39c12]/20 rounded-full">On Leave</span>
                        )}
                        {d.status === 'inactive' && (
                          <span className="text-[9px] font-bold bg-white/5 text-[#555e84] px-2 py-0.5 rounded-full">Retired</span>
                        )}
                      </div>

                      <div className="space-y-2 mt-4 text-[11px] text-[#8b92b8]">
                        <div className="flex justify-between items-center bg-[#181c29]/50 p-2.5 rounded-lg border border-[#252a3d]">
                          <span className="text-[#555e84]">Assigned Vehicle</span>
                          <span className="text-white font-semibold truncate max-w-[150px]">{getVehicleLabel(d.vehicleId)}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-center pt-2">
                          <div className="bg-[#181c29]/30 p-2 rounded-lg border border-[#252a3d]/50">
                            <span className="text-[#555e84] text-[9px] block uppercase font-bold">Trips Done</span>
                            <span className="text-white font-bold text-xs font-mono">{d.trips || 0}</span>
                          </div>
                          <div className="bg-[#181c29]/30 p-2 rounded-lg border border-[#252a3d]/50">
                            <span className="text-[#555e84] text-[9px] block uppercase font-bold">Join Date</span>
                            <span className="text-[#8b92b8] font-semibold text-[10px] font-mono">{d.joinDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-5 pt-3.5 border-t border-[#252a3d]/50 justify-between items-center text-xs">
                      <div className="flex items-center gap-2 text-[10px] text-[#555e84]">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{d.phone || 'No Phone'}</span>
                      </div>

                      {canEdit && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenEditDriver(d)}
                            className="p-1 hover:bg-[#252a3d] text-[#7aaeff] rounded transition"
                            title="Edit profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => { if (confirm('Retire driver from roster? This unassigns scheduled vehicles.')) onDeleteDriver(d.id); }}
                            className="p-1 hover:bg-red-500/10 text-[#e74c3c] rounded transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DRIVER ADD/EDIT MODAL */}
          {isDriverModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-md p-5 relative shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">{editingDriver ? 'Edit Operator Profile' : 'Register Operator Profile'}</h3>
                  <button onClick={() => setIsDriverModalOpen(false)} className="text-[#8b92b8] hover:text-white">✕</button>
                </div>

                <form onSubmit={handleDriverSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Operator Full Name *</label>
                    <input 
                      type="text" 
                      value={dName} 
                      onChange={e => setDName(e.target.value)}
                      placeholder="Ahmed Al-Rashid" 
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Licence Code ID *</label>
                      <input 
                        type="text" 
                        value={dLicense} 
                        onChange={e => setDLicense(e.target.value)}
                        placeholder="DL-44821" 
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Phone contact</label>
                      <input 
                        type="text" 
                        value={dPhone} 
                        onChange={e => setDPhone(e.target.value)}
                        placeholder="+966-50..." 
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Work Status</label>
                      <select 
                        value={dStatus} 
                        onChange={e => setDStatus(e.target.value as any)}
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      >
                        <option value="active">Active On-Duty</option>
                        <option value="on_leave">On Holiday / Leave</option>
                        <option value="inactive">Suspended / Inactive</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Email Account</label>
                      <input 
                        type="email" 
                        value={dEmail} 
                        onChange={e => setDEmail(e.target.value)}
                        placeholder="operator@company.sa" 
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Assign Initial Vehicle</label>
                    <select 
                      value={dVehicleId === null ? '' : dVehicleId} 
                      onChange={e => setDVehicleId(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.fleet})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold text-[#8b92b8] block">Avatar Badge Color</label>
                    <div className="flex gap-2.5 flex-wrap">
                      {avatarColors.map(color => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setDColor(color)}
                          className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: color, outline: dColor === color ? '2px solid white' : 'none' }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsDriverModalOpen(false)} className="bg-[#1f2335] hover:bg-[#252a3d] text-white text-xs font-bold px-4 py-2 rounded-xl transition">Cancel</button>
                    <button type="submit" className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-5 py-2 rounded-xl transition">Save operator</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* COST CENTERS VIEW PANEL */}
      {viewType === 'costcenters' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
              <input 
                type="text" 
                placeholder="Search center descriptions, names, or code tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
              />
            </div>

            {canEdit && (
              <button 
                onClick={handleOpenAddCc}
                className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Cost Center
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredCostCenters.map(cc => {
              const assignedVehCount = vehicles.filter(v => v.ccId === cc.id).length;
              const ratio = cc.budget ? Math.min(Math.round((cc.spent / cc.budget) * 100), 100) : 0;
              const ratioColor = ratio > 85 ? 'text-[#e74c3c]' : ratio > 65 ? 'text-[#f39c12]' : 'text-[#2ecc71]';
              const fillCol = ratio > 85 ? 'bg-[#e74c3c]' : ratio > 65 ? 'bg-[#f39c12]' : 'bg-[#2ecc71]';

              return (
                <div key={cc.id} className="bg-[#12151f] border border-[#252a3d] hover:border-[#313757] rounded-2xl p-5 flex flex-col justify-between transition">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#4f8ef7]/10 flex items-center justify-center">
                          <FolderKanban className="w-4 h-4 text-[#7aaeff]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs">{cc.name}</h4>
                          <span className="text-[10px] text-[#555e84] font-mono tracking-wider font-bold">{cc.code}</span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cc.active ? 'bg-[#2ecc71]/10 text-[#2ecc71] border border-[#2ecc71]/20' : 'bg-white/5 text-[#555e84]'}`}>
                        {cc.active ? 'Active' : 'Closed'}
                      </span>
                    </div>

                    {cc.desc && <p className="text-[11px] text-[#8b92b8] leading-relaxed">{cc.desc}</p>}

                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-[#181c29]/40 p-2.5 rounded-lg border border-[#252a3d]">
                        <span className="text-[#555e84] text-[9px] block font-semibold">Active Fleet</span>
                        <span className="text-white font-bold text-sm font-mono">{assignedVehCount}</span>
                      </div>
                      <div className="bg-[#181c29]/40 p-2.5 rounded-lg border border-[#252a3d]">
                        <span className="text-[#555e84] text-[9px] block font-semibold">Budget (YTD)</span>
                        <span className="text-white font-bold text-[11px] font-mono">{currency} {cc.budget.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#181c29]/40 p-2.5 rounded-lg border border-[#252a3d]">
                        <span className="text-[#555e84] text-[9px] block font-semibold">Spending</span>
                        <span className={`font-bold text-[11px] font-mono ${ratioColor}`}>{currency} {cc.spent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#252a3d]/50 space-y-2">
                    <div className="flex justify-between text-[10px] text-[#555e84]">
                      <span>Budget depletion scale</span>
                      <span className={`font-semibold font-mono ${ratioColor}`}>{ratio}% consumed</span>
                    </div>
                    <div className="w-full bg-[#181c29] h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${fillCol} rounded-full`} style={{ width: `${ratio}%` }} />
                    </div>

                    {canEdit && (
                      <div className="flex gap-2 justify-end pt-2">
                        <button 
                          onClick={() => handleOpenEditCc(cc)}
                          className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-md transition"
                        >
                          Modify Setup
                        </button>
                        <button 
                          onClick={() => { if (confirm('Are you sure you want to deactivate or delete this Cost center?')) onDeleteCostCenter(cc.id); }}
                          className="bg-transparent hover:bg-red-500/10 text-[#e74c3c] text-[10px] font-bold px-3 py-1 rounded-md transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* COST CENTER SETUP MODAL */}
          {isCcModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-md p-5 relative shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white">{editingCc ? 'Modify Cost Center Parameters' : 'Register Corporate Cost Center'}</h3>
                  <button onClick={() => setIsCcModalOpen(false)} className="text-[#8b92b8] hover:text-white">✕</button>
                </div>

                <form onSubmit={handleCcSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Center Title *</label>
                      <input 
                        type="text" 
                        value={ccNameField} 
                        onChange={e => setCcNameField(e.target.value)}
                        placeholder="Logistics Riyadh" 
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Shorthand Code *</label>
                      <input 
                        type="text" 
                        value={ccCode} 
                        onChange={e => setCcCode(e.target.value)}
                        placeholder="LOG-RYD" 
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Scope & Description</label>
                    <textarea 
                      value={ccDesc} 
                      onChange={e => setCcDesc(e.target.value)}
                      placeholder="Northern logistics hub central vehicles..." 
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] h-16"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Allocated Budget Limit ({currency})</label>
                      <input 
                        type="number" 
                        value={ccBudget} 
                        onChange={e => setCcBudget(Number(e.target.value))}
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8b92b8]">Consumed spend to date</label>
                      <input 
                        type="number" 
                        value={ccSpent} 
                        onChange={e => setCcSpent(Number(e.target.value))}
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <input 
                      type="checkbox" 
                      id="cc-active-chk"
                      checked={ccActive} 
                      onChange={e => setCcActive(e.target.checked)}
                      className="w-4 h-4 accent-[#4f8ef7] cursor-pointer"
                    />
                    <label htmlFor="cc-active-chk" className="text-xs font-bold text-[#8b92b8] cursor-pointer">Active and open for new fleet transfers</label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsCcModalOpen(false)} className="bg-[#1f2335] hover:bg-[#252a3d] text-white text-xs font-bold px-4 py-2 rounded-xl transition">Cancel</button>
                    <button type="submit" className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-5 py-2 rounded-xl transition">Confirm Setup</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
