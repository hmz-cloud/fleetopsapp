import React, { useState } from 'react';
import { Vehicle, Transfer, CostCenter } from '../types';
import { Compass, RefreshCw, Plus, ArrowRight, UserCheck, Calendar, XCircle, Search } from 'lucide-react';

interface TransfersViewProps {
  transfers: Transfer[];
  vehicles: Vehicle[];
  costCenters: CostCenter[];
  onAddTransfer: (t: Omit<Transfer, 'id' | 'status' | 'approvedBy' | 'createdAt' | 'completedAt'>) => void;
  onApproveTransfer: (id: number, approver: string) => void;
  onCancelTransfer: (id: number) => void;
  userRole: 'admin' | 'manager' | 'viewer';
}

export default function TransfersView({
  transfers,
  vehicles,
  costCenters,
  onAddTransfer,
  onApproveTransfer,
  onCancelTransfer,
  userRole
}: TransfersViewProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [toCcId, setToCcId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [reqBy, setReqBy] = useState('');

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const handleOpenAdd = () => {
    setSelectedVehicleId(null);
    setToCcId(null);
    setReason('');
    setReqBy('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !toCcId) {
      alert('Please select a vehicle and a destination cost center.');
      return;
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    onAddTransfer({
      vehicleId: selectedVehicleId,
      fromCcId: vehicle.ccId,
      toCcId: toCcId,
      reason: reason.trim(),
      reqBy: reqBy.trim() || 'Supervisor'
    });

    setIsModalOpen(false);
  };

  const getCcName = (id: number | null) => {
    if (id === null) return 'Unassigned';
    return costCenters.find(c => c.id === id)?.name || 'Unknown';
  };

  const getVehicleLabel = (id: number) => {
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.make} ${v.model} (${v.fleet})` : 'Unknown Vehicle';
  };

  const filteredTransfers = transfers.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const vehName = getVehicleLabel(t.vehicleId).toLowerCase();
      const matchText = `${vehName} ${t.reqBy} ${t.reason}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* FILTER AND ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
          <input 
            type="text" 
            placeholder="Search transfers, vehicles, or supervisors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
          />
        </div>

        {/* Action Button */}
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#4f8ef7]/10"
          >
            <Plus className="w-4 h-4" />
            Initiate Transfer
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(st => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`text-xs px-3.5 py-1.5 rounded-full border transition shrink-0 ${filter === st ? 'bg-[#4f8ef7]/15 border-[#4f8ef7] text-[#7aaeff] font-semibold' : 'bg-[#12151f] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
          >
            {st === 'all' ? 'All Transfers' : st.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* TRANSFERS LISTING */}
      {filteredTransfers.length === 0 ? (
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-16 text-center text-[#8b92b8]">
          <RefreshCw className="w-12 h-12 text-[#555e84] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white">No Relocation Logs Found</h3>
          <p className="text-xs text-[#555e84] mt-1">Try refining the status tags.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map(t => {
            const v = vehicles.find(x => x.id === t.vehicleId);
            return (
              <div 
                key={t.id}
                className="bg-[#12151f] border border-[#252a3d] hover:border-[#313757] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition"
              >
                {/* Vehicle and Routing */}
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] bg-white/5 text-[#8b92b8] px-2 py-0.5 rounded font-mono font-bold">{v?.fleet || 'N/A'}</span>
                    <h4 className="text-sm font-bold text-white mt-1">{v ? `${v.make} ${v.model}` : 'Unknown Vehicle'}</h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#8b92b8] flex-wrap">
                    <span className="bg-[#181c29] border border-[#252a3d] px-2.5 py-1 rounded-md">{getCcName(t.fromCcId)}</span>
                    <ArrowRight className="w-4 h-4 text-[#555e84] shrink-0" />
                    <span className="bg-[#4f8ef7]/5 border border-[#4f8ef7]/20 text-[#7aaeff] px-2.5 py-1 rounded-md font-bold">{getCcName(t.toCcId)}</span>
                  </div>
                </div>

                {/* Audit details / Supervisor / Reason */}
                <div className="space-y-1 text-xs text-[#8b92b8] max-w-sm">
                  {t.reason && (
                    <div className="italic">
                      <strong className="text-white not-italic font-bold">Reason:</strong> "{t.reason}"
                    </div>
                  )}
                  <div className="text-[11px] text-[#555e84]">
                    <span>Requested by: <strong className="text-[#8b92b8] font-bold">{t.reqBy}</strong></span>
                    {t.approvedBy && (
                      <span className="ml-3">Approved: <strong className="text-[#8b92b8] font-bold">{t.approvedBy}</strong></span>
                    )}
                  </div>
                </div>

                {/* Status state / Approve/Cancel Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-end md:self-auto">
                  {t.status === 'completed' && (
                    <span className="text-[10px] font-bold bg-[#2ecc71]/10 text-[#2ecc71] px-3 py-1 rounded-full border border-[#2ecc71]/20">Completed</span>
                  )}
                  {t.status === 'in_progress' && (
                    <span className="text-[10px] font-bold bg-[#4f8ef7]/10 text-[#7aaeff] px-3 py-1 rounded-full border border-[#4f8ef7]/20">In Transit</span>
                  )}
                  {t.status === 'pending' && (
                    <span className="text-[10px] font-bold bg-[#f39c12]/10 text-[#f39c12] px-3 py-1 rounded-full border border-[#f39c12]/20">Awaiting Auth</span>
                  )}
                  {t.status === 'cancelled' && (
                    <span className="text-[10px] font-bold bg-white/5 text-[#555e84] px-3 py-1 rounded-full">Cancelled</span>
                  )}

                  {/* Actions for pending transfers */}
                  {t.status === 'pending' && canEdit && (
                    <div className="flex gap-1.5 mt-2 sm:mt-0">
                      <button 
                        onClick={() => onApproveTransfer(t.id, 'Hassan Zarroug')}
                        className="bg-[#2ecc71] hover:bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onCancelTransfer(t.id)}
                        className="bg-transparent hover:bg-red-500/10 border border-[#e74c3c]/30 text-[#e74c3c] text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TRANSFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-md p-5 relative shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Initiate Relocation Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#8b92b8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Select Fleet Vehicle *</label>
                <select 
                  value={selectedVehicleId === null ? '' : selectedVehicleId} 
                  onChange={e => setSelectedVehicleId(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  required
                >
                  <option value="">Choose vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.fleet}) — Current: {getCcName(v.ccId)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Target Cost Center Destination *</label>
                <select 
                  value={toCcId === null ? '' : toCcId} 
                  onChange={e => setToCcId(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  required
                >
                  <option value="">Select destination...</option>
                  {costCenters.filter(c => c.active).map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Justification / Reason</label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  placeholder="Relocation for construction site project phase 2..." 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] h-16"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Requested By</label>
                <input 
                  type="text" 
                  value={reqBy} 
                  onChange={e => setReqBy(e.target.value)}
                  placeholder="Hassan Zarroug" 
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
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
                  Initiate Relocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
