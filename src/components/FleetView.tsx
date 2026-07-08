import React, { useState } from 'react';
import { Vehicle, Driver, CostCenter } from '../types';
import { Search, Plus, Filter, Calendar, ShieldCheck, FileText, Sparkles, SlidersHorizontal, Info, Edit2, Trash2 } from 'lucide-react';

interface FleetViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  costCenters: CostCenter[];
  onAddVehicle: (v: Omit<Vehicle, 'id' | 'gps' | 'docs' | 'costYTD'>) => void;
  onEditVehicle: (id: number, v: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: number) => void;
  userRole: 'admin' | 'manager' | 'viewer';
  currency: string;
}

export default function FleetView({
  vehicles,
  drivers,
  costCenters,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  userRole,
  currency
}: FleetViewProps) {
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // Form fields
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2024);
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [fleet, setFleet] = useState('');
  const [status, setStatus] = useState<'available' | 'in_use' | 'maintenance' | 'out_of_service'>('available');
  const [ccId, setCcId] = useState<number | null>(null);
  const [mileage, setMileage] = useState(0);
  const [fuel, setFuel] = useState('diesel');
  const [type, setType] = useState('car');
  const [driverId, setDriverId] = useState<number | null>(null);
  const [lastService, setLastService] = useState('');
  const [nextService, setNextService] = useState('');
  const [notes, setNotes] = useState('');

  // Selected vehicle for details modal
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const resetForm = () => {
    setMake('');
    setModel('');
    setYear(2024);
    setPlate('');
    setVin('');
    setFleet('');
    setStatus('available');
    setCcId(null);
    setMileage(0);
    setFuel('diesel');
    setType('car');
    setDriverId(null);
    setLastService('');
    setNextService('');
    setNotes('');
    setEditingVehicle(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setFleet(`FL-${String(vehicles.length ? Math.max(...vehicles.map(v => v.id)) + 1 : 1).padStart(3, '0')}`);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVehicle(v);
    setMake(v.make);
    setModel(v.model);
    setYear(v.year);
    setPlate(v.plate);
    setVin(v.vin);
    setFleet(v.fleet);
    setStatus(v.status);
    setCcId(v.ccId);
    setMileage(v.mileage);
    setFuel(v.fuel);
    setType(v.type);
    setDriverId(v.driverId);
    setLastService(v.lastService);
    setNextService(v.nextService);
    setNotes(v.notes);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !plate.trim() || !fleet.trim()) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    const payload = {
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      plate: plate.trim().toUpperCase(),
      vin: vin.trim() || `VIN-${Date.now()}`,
      fleet: fleet.trim().toUpperCase(),
      status,
      ccId,
      mileage: Number(mileage),
      fuel,
      type,
      driverId,
      lastService,
      nextService,
      notes: notes.trim()
    };

    if (editingVehicle) {
      onEditVehicle(editingVehicle.id, payload);
    } else {
      onAddVehicle(payload);
    }
    setIsModalOpen(false);
    resetForm();
  };

  // Filtering logic
  const filteredVehicles = vehicles.filter(v => {
    // Status Filter
    if (filter !== 'all' && v.status !== filter) return false;
    // Type Filter
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${v.make} ${v.model} ${v.plate} ${v.fleet} ${v.vin} ${v.notes}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const getDriverName = (id: number | null) => {
    if (id === null) return 'Unassigned';
    return drivers.find(d => d.id === id)?.name || 'Unknown';
  };

  const getCcCode = (id: number | null) => {
    if (id === null) return 'Unallocated';
    return costCenters.find(c => c.id === id)?.code || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* FILTER & SEARCH ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
          <input 
            type="text" 
            placeholder="Search make, model, plate, or fleet #..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
          />
        </div>

        {/* Action button */}
        {canEdit && (
          <button 
            onClick={handleOpenAdd}
            className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#4f8ef7]/10"
          >
            <Plus className="w-4 h-4" />
            Add New Vehicle
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          <span className="text-[11px] font-bold text-[#555e84] uppercase tracking-wider pr-2">Status:</span>
          {['all', 'available', 'in_use', 'maintenance', 'out_of_service'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`text-xs px-3.5 py-1.5 rounded-full border transition shrink-0 ${filter === st ? 'bg-[#4f8ef7]/15 border-[#4f8ef7] text-[#7aaeff] font-semibold' : 'bg-[#12151f] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
            >
              {st === 'all' ? 'All Vehicles' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          <span className="text-[11px] font-bold text-[#555e84] uppercase tracking-wider pr-2">Type:</span>
          {['all', 'suv', 'truck', 'van', 'car'].map(tp => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`text-xs px-3 py-1 rounded-lg border transition shrink-0 ${typeFilter === tp ? 'bg-[#9b59b6]/15 border-[#9b59b6] text-purple-300 font-semibold' : 'bg-transparent border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
            >
              {tp === 'all' ? 'All Types' : tp.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS GRID */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-16 text-center text-[#8b92b8]">
          <SlidersHorizontal className="w-12 h-12 text-[#555e84] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white">No Vehicles Match Criteria</h3>
          <p className="text-xs text-[#555e84] mt-1">Try adjusting your filters or lookups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map(v => {
            const mileagePct = Math.min(Math.round((v.mileage / 100000) * 100), 100);
            const isMaintenance = v.status === 'maintenance';
            const isOutOfService = v.status === 'out_of_service';
            const progressColor = mileagePct > 80 ? 'bg-[#e74c3c]' : mileagePct > 60 ? 'bg-[#f39c12]' : 'bg-[#4f8ef7]';

            return (
              <div 
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className="bg-[#12151f] border border-[#252a3d] hover:border-[#313757] hover:bg-[#181c29] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 group"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-[#7aaeff] transition-colors">{v.make} {v.model}</h3>
                      <div className="text-[10px] text-[#8b92b8] font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{v.fleet}</span>
                        <span className="text-[#252a3d]">•</span>
                        <span>{getCcCode(v.ccId)}</span>
                      </div>
                    </div>
                    {/* Status Pill */}
                    {v.status === 'available' && (
                      <span className="text-[9px] font-bold bg-[#2ecc71]/10 text-[#2ecc71] px-2.5 py-0.5 rounded-full border border-[#2ecc71]/20">Available</span>
                    )}
                    {v.status === 'in_use' && (
                      <span className="text-[9px] font-bold bg-[#4f8ef7]/10 text-[#7aaeff] px-2.5 py-0.5 rounded-full border border-[#4f8ef7]/20">In Use</span>
                    )}
                    {isMaintenance && (
                      <span className="text-[9px] font-bold bg-[#f39c12]/10 text-[#f39c12] px-2.5 py-0.5 rounded-full border border-[#f39c12]/20">Workshop</span>
                    )}
                    {isOutOfService && (
                      <span className="text-[9px] font-bold bg-[#e74c3c]/10 text-[#e74c3c] px-2.5 py-0.5 rounded-full border border-[#e74c3c]/20">Disabled</span>
                    )}
                  </div>

                  {/* Attributes */}
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-1.5 mt-4 text-[11px] text-[#8b92b8]">
                    <div>
                      <span className="text-[#555e84] block">Plate Number</span>
                      <span className="font-semibold font-mono text-white">{v.plate}</span>
                    </div>
                    <div>
                      <span className="text-[#555e84] block">Model Year</span>
                      <span className="font-semibold text-white">{v.year}</span>
                    </div>
                    <div>
                      <span className="text-[#555e84] block">Active Operator</span>
                      <span className="font-semibold text-white truncate block">{getDriverName(v.driverId)}</span>
                    </div>
                    <div>
                      <span className="text-[#555e84] block">Fuel Type</span>
                      <span className="font-semibold text-white capitalize">{v.fuel}</span>
                    </div>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#252a3d] space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-[#555e84] mb-1">
                      <span>Service Pacing</span>
                      <span className="font-semibold font-mono text-[#8b92b8]">{v.mileage.toLocaleString()} km / 100k</span>
                    </div>
                    <div className="w-full bg-[#181c29] h-1 rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${mileagePct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#555e84]">Next Service: <strong className="text-[#8b92b8] font-semibold">{v.nextService || '—'}</strong></span>
                    
                    {/* Actions */}
                    {canEdit && (
                      <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={(e) => handleOpenEdit(v, e)}
                          className="p-1 hover:bg-[#252a3d] text-[#7aaeff] rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to retire this vehicle?')) onDeleteVehicle(v.id); }}
                          className="p-1 hover:bg-[#e74c3c]/10 text-[#e74c3c] rounded transition"
                          title="Retire / Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] bg-[#4f8ef7]/10 text-[#7aaeff] font-mono px-2 py-0.5 rounded font-bold">{selectedVehicle.fleet}</span>
                <h3 className="text-base font-bold text-white mt-1">{selectedVehicle.make} {selectedVehicle.model}</h3>
                <p className="text-xs text-[#555e84] font-mono">{selectedVehicle.vin}</p>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="text-[#8b92b8] hover:text-white p-1 rounded-md bg-[#181c29] border border-[#252a3d] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-[#181c29] p-4 border border-[#252a3d] rounded-xl text-xs">
                <div>
                  <span className="text-[#555e84] block">Registration Plate</span>
                  <span className="text-white font-bold font-mono">{selectedVehicle.plate}</span>
                </div>
                <div>
                  <span className="text-[#555e84] block">Status</span>
                  <span className="text-white font-bold capitalize">{selectedVehicle.status.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[#555e84] block">Cost Center Location</span>
                  <span className="text-white font-semibold">{getCcCode(selectedVehicle.ccId)}</span>
                </div>
                <div>
                  <span className="text-[#555e84] block">Active Operator</span>
                  <span className="text-[#7aaeff] font-bold">{getDriverName(selectedVehicle.driverId)}</span>
                </div>
                <div>
                  <span className="text-[#555e84] block">Fuel Class</span>
                  <span className="text-white font-semibold capitalize">{selectedVehicle.fuel}</span>
                </div>
                <div>
                  <span className="text-[#555e84] block">Mileage</span>
                  <span className="text-white font-mono font-semibold">{selectedVehicle.mileage.toLocaleString()} km</span>
                </div>
              </div>

              {/* DOCUMENT COMPLIANCE EXPIRIES */}
              <div className="border border-[#252a3d] rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#2ecc71]" />
                  Compliance & Document Verification
                </h4>
                {[
                  { name: 'Commercial Insurance', date: selectedVehicle.docs.insurance },
                  { name: 'Vehicle Registration (Istimara)', date: selectedVehicle.docs.registration },
                  { name: 'Periodic Inspection (MVPI)', date: selectedVehicle.docs.inspection }
                ].map(doc => {
                  const diffTime = new Date(doc.date).getTime() - new Date().getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isSoon = diffDays >= 0 && diffDays <= 30;
                  const isExpired = diffDays < 0;

                  return (
                    <div key={doc.name} className="flex justify-between items-center text-[11px] py-1">
                      <span className="text-[#8b92b8]">{doc.name}</span>
                      <div className="text-right">
                        <span className="font-semibold text-white mr-2">{doc.date}</span>
                        {isExpired && <span className="text-[9px] bg-[#e74c3c]/10 text-[#e74c3c] px-1.5 py-0.5 rounded font-bold font-mono">EXPIRED</span>}
                        {isSoon && <span className="text-[9px] bg-[#f39c12]/10 text-[#f39c12] px-1.5 py-0.5 rounded font-bold font-mono">RENEW SOON</span>}
                        {!isExpired && !isSoon && <span className="text-[9px] bg-[#2ecc71]/10 text-[#2ecc71] px-1.5 py-0.5 rounded font-bold font-mono">VALID</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedVehicle.notes && (
                <div className="bg-[#181c29]/50 border border-[#252a3d] rounded-xl p-3 text-xs">
                  <span className="text-[#555e84] font-semibold block mb-1">Internal Supervisor Notes</span>
                  <p className="text-[#8b92b8] leading-relaxed italic">"{selectedVehicle.notes}"</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="bg-[#1f2335] hover:bg-[#252a3d] border border-[#252a3d] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-lg p-5 relative shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">{editingVehicle ? 'Edit Vehicle Profile' : 'Add New Vehicle to Register'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#8b92b8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Identity */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-[#555e84] uppercase tracking-wider block border-b border-[#252a3d] pb-1">Manufacturer & Build</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Manufacturer Brand *</label>
                    <input 
                      type="text" 
                      value={make} 
                      onChange={e => setMake(e.target.value)}
                      placeholder="Toyota" 
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Model Class *</label>
                    <input 
                      type="text" 
                      value={model} 
                      onChange={e => setModel(e.target.value)}
                      placeholder="Hilux" 
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Year</label>
                    <input 
                      type="number" 
                      value={year} 
                      onChange={e => setYear(Number(e.target.value))}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">License Plate *</label>
                    <input 
                      type="text" 
                      value={plate} 
                      onChange={e => setPlate(e.target.value)}
                      placeholder="ABC-1234" 
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Fleet # Code *</label>
                    <input 
                      type="text" 
                      value={fleet} 
                      onChange={e => setFleet(e.target.value)}
                      placeholder="FL-010" 
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Chassis Serial # (VIN)</label>
                  <input 
                    type="text" 
                    value={vin} 
                    onChange={e => setVin(e.target.value)}
                    placeholder="1HG5YF..." 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                  />
                </div>
              </div>

              {/* Class & Specs */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-[#555e84] uppercase tracking-wider block border-b border-[#252a3d] pb-1">Specifications</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Vehicle Class Type</label>
                    <select 
                      value={type} 
                      onChange={e => setType(e.target.value)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    >
                      <option value="car">Passenger Car</option>
                      <option value="suv">Sports Utility Vehicle (SUV)</option>
                      <option value="truck">Flatbed / Utility Truck</option>
                      <option value="van">Commercial cargo van</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Status state</label>
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use / Active deployed</option>
                      <option value="maintenance">Maintenance / Workshop</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Fuel Category</label>
                    <select 
                      value={fuel} 
                      onChange={e => setFuel(e.target.value)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="gasoline">Octane Gasoline</option>
                      <option value="electric">Battery Electric (EV)</option>
                      <option value="hybrid">Gas/Diesel Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Odometer Mileage (km)</label>
                    <input 
                      type="number" 
                      value={mileage} 
                      onChange={e => setMileage(Number(e.target.value))}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-[#555e84] uppercase tracking-wider block border-b border-[#252a3d] pb-1">Allocations</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Cost Center Center</label>
                    <select 
                      value={ccId === null ? '' : ccId} 
                      onChange={e => setCcId(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    >
                      <option value="">Unassigned</option>
                      {costCenters.filter(c => c.active).map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Assigned Driver</label>
                    <select 
                      value={driverId === null ? '' : driverId} 
                      onChange={e => setDriverId(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    >
                      <option value="">Unassigned</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Last Routine Service</label>
                    <input 
                      type="date" 
                      value={lastService} 
                      onChange={e => setLastService(e.target.value)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8b92b8]">Next Service Target</label>
                    <input 
                      type="date" 
                      value={nextService} 
                      onChange={e => setNextService(e.target.value)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8b92b8]">Internal Audit Comments</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Executive reserve, brake pads replaced recently..." 
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-[#e2e5f3] h-14"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
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
                  {editingVehicle ? 'Update Profile' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
