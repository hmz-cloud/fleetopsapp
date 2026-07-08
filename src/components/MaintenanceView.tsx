import React, { useState } from 'react';
import { Vehicle, Maintenance } from '../types';
import { Wrench, Calendar, ClipboardList, Plus, Search, Hammer, CheckCircle, FileCode } from 'lucide-react';

interface MaintenanceViewProps {
  maintenance: Maintenance[];
  vehicles: Vehicle[];
  onAddMaintenance: (m: Omit<Maintenance, 'id' | 'status' | 'completedDate' | 'actualCost'>) => void;
  onCompleteMaintenance: (id: number, cost: number) => void;
  onDeleteMaintenance: (id: number) => void;
  userRole: 'admin' | 'manager' | 'viewer';
  currency: string;
}

export default function MaintenanceView({
  maintenance,
  vehicles,
  onAddMaintenance,
  onCompleteMaintenance,
  onDeleteMaintenance,
  userRole,
  currency
}: MaintenanceViewProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [type, setType] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [scheduledDate, setScheduledDate] = useState('');
  const [tech, setTech] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [notes, setNotes] = useState('');

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const handleOpenAdd = () => {
    setSelectedVehicleId(null);
    setType('');
    setPriority('medium');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setTech('');
    setEstimatedCost(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !type.trim() || !scheduledDate) {
      alert('Please fill out all required fields.');
      return;
    }

    onAddMaintenance({
      vehicleId: selectedVehicleId,
      type: type.trim(),
      priority,
      scheduledDate,
      tech: tech.trim() || 'Unassigned Tech',
      estimatedCost: Number(estimatedCost),
      notes: notes.trim()
    });

    setIsModalOpen(false);
  };

  const getVehicleLabel = (id: number) => {
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.make} ${v.model} (${v.fleet})` : 'Unknown Vehicle';
  };

  const filteredMaint = maintenance.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const vehName = getVehicleLabel(m.vehicleId).toLowerCase();
      const matchText = `${vehName} ${m.type} ${m.tech} ${m.notes}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ACTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
          <input 
            type="text" 
            placeholder="Search mechanics, vehicle models, or job categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
          />
        </div>

        {/* Create schedule trigger */}
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#4f8ef7]/10"
          >
            <Plus className="w-4 h-4" />
            Schedule Workshop
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {['all', 'pending', 'in_progress', 'scheduled', 'completed'].map(st => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition shrink-0 ${filter === st ? 'bg-[#4f8ef7]/15 border-[#4f8ef7] text-[#7aaeff] font-semibold' : 'bg-[#12151f] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
          >
            {st === 'all' ? 'All Workshop Jobs' : st.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* JOBS DISPLAY LIST */}
      {filteredMaint.length === 0 ? (
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-16 text-center text-[#8b92b8]">
          <Wrench className="w-12 h-12 text-[#555e84] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white">No Servicing Events Recorded</h3>
          <p className="text-xs text-[#555e84] mt-1">Schedules are currently fully up to date.</p>
        </div>
      ) : (
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#252a3d] bg-[#181c29]">
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Fleet Vehicle</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Servicing & Repair Scope</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Urgency</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Stage</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Target Date</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Technician</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Est. Budget</th>
                  {canEdit && <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252a3d]">
                {filteredMaint.map(m => {
                  const v = vehicles.find(x => x.id === m.vehicleId);
                  
                  const prioColors = {
                    critical: 'bg-[#e74c3c]/10 text-[#e74c3c]',
                    high: 'bg-[#f39c12]/10 text-[#f39c12]',
                    medium: 'bg-[#4f8ef7]/10 text-[#7aaeff]',
                    low: 'bg-white/5 text-[#8b92b8]'
                  };

                  return (
                    <tr key={m.id} className="hover:bg-[#181c29]/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{v ? `${v.make} ${v.model}` : 'Unknown'}</div>
                        <div className="text-[10px] text-[#8b92b8] font-mono mt-0.5">{v?.fleet || '—'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{m.type}</div>
                        {m.notes && <div className="text-[10px] text-[#555e84] mt-0.5 truncate max-w-xs">{m.notes}</div>}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${prioColors[m.priority]}`}>
                          {m.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        {m.status === 'completed' ? (
                          <span className="text-[10px] font-bold text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded-full">Completed</span>
                        ) : m.status === 'in_progress' ? (
                          <span className="text-[10px] font-bold text-[#7aaeff] bg-[#4f8ef7]/10 px-2 py-0.5 rounded-full">Active</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#f39c12] bg-[#f39c12]/10 px-2 py-0.5 rounded-full capitalize">{m.status}</span>
                        )}
                      </td>
                      <td className="p-4 text-[#8b92b8] font-mono font-medium">{m.scheduledDate}</td>
                      <td className="p-4 text-[#8b92b8] font-semibold">{m.tech}</td>
                      <td className="p-4 text-[#8b92b8] font-mono font-semibold">{currency} {m.estimatedCost.toLocaleString()}</td>
                      {canEdit && (
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {m.status !== 'completed' && (
                              <button 
                                onClick={() => {
                                  const actual = prompt('Please confirm actual cost of maintenance (default estimates):', String(m.estimatedCost));
                                  if (actual !== null) onCompleteMaintenance(m.id, Number(actual) || m.estimatedCost);
                                }}
                                className="bg-[#2ecc71]/10 hover:bg-[#2ecc71]/20 text-[#2ecc71] font-bold text-[10px] px-2.5 py-1 rounded"
                              >
                                Done
                              </button>
                            )}
                            <button 
                              onClick={() => { if (confirm('Are you sure you want to remove this record?')) onDeleteMaintenance(m.id); }}
                              className="bg-transparent hover:bg-[#e74c3c]/15 text-[#e74c3c] font-bold text-[10px] px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEDULING FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-md p-5 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Create Servicing Allocation</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#8b92b8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Assign Vehicle *</label>
                <select 
                  value={selectedVehicleId === null ? '' : selectedVehicleId} 
                  onChange={e => setSelectedVehicleId(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  required
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.fleet}) — {v.status}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Servicing Category Scope *</label>
                <input 
                  type="text" 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  placeholder="Engine oil overhaul, tire alignment..." 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Urgency priority</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">CRITICAL / EMER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Scheduled Service Date *</label>
                  <input 
                    type="date" 
                    value={scheduledDate} 
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Assign Mechanic / Tech</label>
                  <input 
                    type="text" 
                    value={tech} 
                    onChange={e => setTech(e.target.value)}
                    placeholder="Ali Hassan" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Est. Workshop Fee ({currency})</label>
                  <input 
                    type="number" 
                    value={estimatedCost} 
                    onChange={e => setEstimatedCost(Number(e.target.value))}
                    placeholder="2500" 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Diagnostic Logs</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Rear brake pad width less than 3.5mm..." 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] h-14"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-[#1f2335] hover:bg-[#252a3d] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-5 py-2 rounded-xl transition"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
