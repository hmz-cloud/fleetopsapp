import React, { useState, useEffect } from 'react';
import { Vehicle, Transfer, Maintenance, CostCenter, User, Driver } from '../types';
import { 
  Truck, 
  Wrench, 
  RefreshCw, 
  Gauge, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Send, 
  Plus, 
  User as UserIcon, 
  Play, 
  Pause 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DriverDashboardViewProps {
  currentUser: User;
  vehicles: Vehicle[];
  drivers: Driver[];
  costCenters: CostCenter[];
  transfers: Transfer[];
  maintenance: Maintenance[];
  onUpdateVehicleMileage: (vehicleId: number, newMileage: number) => void;
  onAddMaintenance: (maint: Omit<Maintenance, 'id'>) => void;
  onAddTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt' | 'approvedBy' | 'completedAt'>) => void;
  onUpdateDriverStatus: (driverId: number, status: 'active' | 'on_leave' | 'inactive') => void;
  currency: string;
  distUnit: string;
}

export default function DriverDashboardView({
  currentUser,
  vehicles,
  drivers,
  costCenters,
  transfers,
  maintenance,
  onUpdateVehicleMileage,
  onAddMaintenance,
  onAddTransfer,
  onUpdateDriverStatus,
  currency,
  distUnit
}: DriverDashboardViewProps) {
  // Find associated driver profile
  const driverProfile = drivers.find(
    d => d.email.toLowerCase() === currentUser.email.toLowerCase()
  ) || {
    id: 999,
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    license: 'DL-99999',
    phone: '+966-50-000-0000',
    email: currentUser.email,
    status: 'active' as const,
    vehicleId: null,
    joinDate: currentUser.createdAt,
    trips: 0,
    color: currentUser.color
  };

  // Find assigned vehicle
  const assignedVehicle = vehicles.find(v => v.driverId === driverProfile.id) || vehicles.find(v => v.id === 1); // Fallback to first vehicle if none assigned

  // States
  const [newMileage, setNewMileage] = useState<string>('');
  const [mileageError, setMileageError] = useState<string>('');
  const [mileageSuccess, setMileageSuccess] = useState<boolean>(false);

  // Maintenance Ticket form
  const [maintType, setMaintType] = useState<string>('');
  const [maintPriority, setMaintPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [maintNotes, setMaintNotes] = useState<string>('');
  const [techName, setTechName] = useState<string>('Ali Hassan');
  const [maintSuccess, setMaintSuccess] = useState<boolean>(false);

  // Transfer request form
  const [targetCcId, setTargetCcId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);

  // Speed Simulation States
  const [isSimulatingSpeed, setIsSimulatingSpeed] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(0);
  const [telemetryMessage, setTelemetryMessage] = useState<string>('Vehicle stationary. System ready.');

  // Simulated live speed ticks
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulatingSpeed) {
      setTelemetryMessage('Simulated drive engaged. Telemetry uploading live...');
      interval = setInterval(() => {
        setSimSpeed(prev => {
          const delta = Math.floor(Math.random() * 21) - 10; // -10 to +10
          const next = Math.max(0, Math.min(120, prev + delta));
          return next;
        });
      }, 1000);
    } else {
      setSimSpeed(0);
      setTelemetryMessage('Vehicle stationary. System ready.');
    }
    return () => clearInterval(interval);
  }, [isSimulatingSpeed]);

  // Handle mileage submit
  const handleUpdateMileage = (e: React.FormEvent) => {
    e.preventDefault();
    setMileageError('');
    setMileageSuccess(false);

    if (!assignedVehicle) return;

    const mileageNum = parseInt(newMileage, 10);
    if (isNaN(mileageNum)) {
      setMileageError('Please enter a valid number');
      return;
    }

    if (mileageNum <= assignedVehicle.mileage) {
      setMileageError(`New mileage must exceed current mileage (${assignedVehicle.mileage} ${distUnit})`);
      return;
    }

    onUpdateVehicleMileage(assignedVehicle.id, mileageNum);
    setMileageSuccess(true);
    setNewMileage('');
    setTimeout(() => setMileageSuccess(false), 4000);
  };

  // Handle maintenance report
  const handleAddMaintenanceTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintSuccess(false);

    if (!assignedVehicle || !maintType.trim()) return;

    onAddMaintenance({
      vehicleId: assignedVehicle.id,
      type: maintType,
      status: 'pending',
      priority: maintPriority,
      scheduledDate: new Date().toISOString().split('T')[0],
      completedDate: null,
      tech: techName,
      estimatedCost: 250,
      actualCost: null,
      notes: maintNotes
    });

    setMaintSuccess(true);
    setMaintType('');
    setMaintNotes('');
    setTimeout(() => setMaintSuccess(false), 4000);
  };

  // Handle transfer request
  const handleRequestTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferSuccess(false);

    if (!assignedVehicle || !targetCcId) return;

    onAddTransfer({
      vehicleId: assignedVehicle.id,
      fromCcId: assignedVehicle.ccId,
      toCcId: parseInt(targetCcId, 10),
      status: 'pending',
      reason: transferReason,
      reqBy: driverProfile.name
    });

    setTransferSuccess(true);
    setTargetCcId('');
    setTransferReason('');
    setTimeout(() => setTransferSuccess(false), 4000);
  };

  // Calculations for document expiry warnings
  const getDocStatus = (dateStr: string) => {
    if (!dateStr) return { label: 'Unknown', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
    const diffTime = new Date(dateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `EXPIRED (${Math.abs(diffDays)}d ago)`, color: 'text-red-400 bg-red-500/10 border-red-500/20 font-bold' };
    }
    if (diffDays <= 30) {
      return { label: `Expiring Soon (${diffDays}d)`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
    return { label: 'Active', color: 'text-[#2ecc71] bg-[#2ecc71]/10 border-[#2ecc71]/20' };
  };

  // Filter transfers & maintenance for logs
  const myTransfers = transfers.filter(t => t.vehicleId === assignedVehicle?.id);
  const myMaintenance = maintenance.filter(m => m.vehicleId === assignedVehicle?.id);

  return (
    <div className="space-y-6" id="driver-dashboard-view">
      {/* HEADER HERO PANEL */}
      <div className="bg-gradient-to-r from-[#12151f] to-[#181c29] border border-[#252a3d] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,42,61,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(37,42,61,0.2)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient(ellipse_at_right,rgba(79,142,247,0.06)_0%,transparent_70%) pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg"
              style={{ backgroundColor: `${driverProfile.color}20`, color: driverProfile.color, border: `1.5px solid ${driverProfile.color}40` }}
            >
              {driverProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{driverProfile.name}</h1>
                <span className="text-[10px] bg-[#e67e22]/10 text-[#e67e22] border border-[#e67e22]/20 font-bold uppercase px-2 py-0.5 rounded-full">
                  Fleet Operator
                </span>
              </div>
              <p className="text-xs text-[#8b92b8] mt-1">
                License: <span className="font-mono text-[#e2e5f3]">{driverProfile.license}</span> • Joined: <span className="text-[#e2e5f3]">{driverProfile.joinDate}</span>
              </p>
            </div>
          </div>

          {/* STATUS SELECTOR */}
          <div className="flex items-center gap-3 bg-[#1e2335] border border-[#2d334d] rounded-xl p-1.5 self-start md:self-auto">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#555e84] pl-2">Duty Status</span>
            {(['active', 'on_leave', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onUpdateDriverStatus(driverProfile.id, st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  driverProfile.status === st 
                    ? st === 'active' 
                      ? 'bg-[#2ecc71] text-white shadow-sm'
                      : st === 'on_leave'
                      ? 'bg-[#f39c12] text-white shadow-sm'
                      : 'bg-[#555e84] text-white shadow-sm'
                    : 'text-[#8b92b8] hover:text-[#e2e5f3]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ASSIGNED VEHICLE COCKPIT & LIVE TELEMETRY */}
        <div className="lg:col-span-8 space-y-6">
          {assignedVehicle ? (
            <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl overflow-hidden shadow-xl">
              <div className="border-b border-[#252a3d] bg-[#181c29] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-[#4f8ef7]" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Assigned Vehicle Cockpit</h2>
                    <p className="text-[10px] text-[#555e84]">Operational details & registration documents</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono bg-[#4f8ef7]/10 text-[#7aaeff] border border-[#4f8ef7]/20 px-2.5 py-1 rounded-md font-semibold">
                    {assignedVehicle.plate}
                  </span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Meta */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-[#555e84] uppercase font-bold tracking-wider">Vehicle Details</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {assignedVehicle.year} {assignedVehicle.make} {assignedVehicle.model}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#8b92b8]">Fleet Identifier:</span>
                      <span className="text-xs font-mono text-[#7aaeff] font-semibold">{assignedVehicle.fleet}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#181c29] border border-[#252a3d] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[#8b92b8] mb-1">
                        <Gauge className="w-3.5 h-3.5 text-[#4f8ef7]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Odometer</span>
                      </div>
                      <div className="text-base font-extrabold font-mono text-[#e2e5f3]">
                        {assignedVehicle.mileage.toLocaleString()} <span className="text-[10px] text-[#8b92b8] font-sans">{distUnit}</span>
                      </div>
                    </div>

                    <div className="bg-[#181c29] border border-[#252a3d] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[#8b92b8] mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2ecc71]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Location</span>
                      </div>
                      <div className="text-xs font-bold text-[#e2e5f3] truncate">
                        {costCenters.find(c => c.id === assignedVehicle.ccId)?.name || 'Central Hub'}
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Simulator Widget */}
                  <div className="bg-[#181c29]/50 border border-[#252a3d] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#a78bfa] animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-[#a78bfa] tracking-wider">Live Sim Odometer & GPS Tracker</span>
                      </div>
                      <button
                        onClick={() => setIsSimulatingSpeed(!isSimulatingSpeed)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                          isSimulatingSpeed 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-[#2ecc71]/10 text-[#2ecc71] border border-[#2ecc71]/20'
                        }`}
                      >
                        {isSimulatingSpeed ? (
                          <>
                            <Pause className="w-2.5 h-2.5" /> Stop Drive
                          </>
                        ) : (
                          <>
                            <Play className="w-2.5 h-2.5" /> Simulate Driving
                          </>
                        )}
                      </button>
                    </div>

                    {/* speedometer style visual */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-[#12151f] rounded-full border-2 border-[#252a3d]">
                        {/* Circular progress bar mock */}
                        <div className="absolute inset-2 rounded-full border border-dashed border-[#4f8ef7]/20 flex flex-col items-center justify-center">
                          <span className="text-xl font-mono font-black text-white">{simSpeed}</span>
                          <span className="text-[8px] text-[#555e84] font-bold">KM/H</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#8b92b8]">{telemetryMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-ping" />
                          <span className="text-[10px] font-mono text-[#555e84]">GPS: {assignedVehicle.gps.x.toFixed(2)}, {assignedVehicle.gps.y.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance & Papers */}
                <div className="space-y-3">
                  <span className="text-[10px] text-[#555e84] uppercase font-bold tracking-wider">Document Compliance Check</span>
                  
                  <div className="space-y-2">
                    {/* Insurance */}
                    <div className="flex items-center justify-between p-2.5 bg-[#181c29] border border-[#252a3d] rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#4f8ef7]" />
                        <div>
                          <p className="font-semibold text-white">Vehicle Insurance</p>
                          <p className="text-[9px] text-[#555e84] font-mono">Exp: {assignedVehicle.docs.insurance}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getDocStatus(assignedVehicle.docs.insurance).color}`}>
                        {getDocStatus(assignedVehicle.docs.insurance).label}
                      </span>
                    </div>

                    {/* Registration */}
                    <div className="flex items-center justify-between p-2.5 bg-[#181c29] border border-[#252a3d] rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2ecc71]" />
                        <div>
                          <p className="font-semibold text-white">Istemara (Registration)</p>
                          <p className="text-[9px] text-[#555e84] font-mono">Exp: {assignedVehicle.docs.registration}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getDocStatus(assignedVehicle.docs.registration).color}`}>
                        {getDocStatus(assignedVehicle.docs.registration).label}
                      </span>
                    </div>

                    {/* MVPI */}
                    <div className="flex items-center justify-between p-2.5 bg-[#181c29] border border-[#252a3d] rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#f39c12]" />
                        <div>
                          <p className="font-semibold text-white">Periodic Inspection (MVPI)</p>
                          <p className="text-[9px] text-[#555e84] font-mono">Exp: {assignedVehicle.docs.inspection}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getDocStatus(assignedVehicle.docs.inspection).color}`}>
                        {getDocStatus(assignedVehicle.docs.inspection).label}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#8b92b8] bg-[#4f8ef7]/5 p-2 rounded-lg border border-[#4f8ef7]/10">
                    💡 <span className="font-semibold text-white">Notice:</span> Report to fleet coordinator immediately if any of your vehicle's certificates are warning of expiry within 30 days.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-8 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-[#f39c12] mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">No Vehicle Assigned</h3>
                <p className="text-xs text-[#8b92b8] max-w-md mx-auto mt-1">
                  You are currently registered as an active operator but have not been assigned to a vehicle. Please contact your Fleet Manager.
                </p>
              </div>
            </div>
          )}

          {/* DRIVER ACTIONS GRID */}
          {assignedVehicle && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ACTION 1: REPORT ODOMETER */}
              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <Gauge className="w-5 h-5 text-[#e67e22]" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Log Current Odometer</h3>
                    <p className="text-[10px] text-[#555e84]">Report vehicle mileage daily</p>
                  </div>
                </div>

                {mileageSuccess && (
                  <div className="bg-[#2ecc71]/10 border border-[#2ecc71]/30 text-[#2ecc71] text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Odometer logged successfully!</span>
                  </div>
                )}

                {mileageError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{mileageError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateMileage} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">New Reading ({distUnit})</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={newMileage}
                        onChange={(e) => setNewMileage(e.target.value)}
                        placeholder={`e.g. ${(assignedVehicle.mileage + 150).toString()}`}
                        className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#555e84] focus:outline-none focus:border-[#e67e22] transition"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#555e84]">{distUnit}</span>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#e67e22] hover:bg-[#f39c12] text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Upload Reading
                  </button>
                </form>
              </div>

              {/* ACTION 2: REQUEST VEHICLE RELOCATION */}
              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="w-5 h-5 text-[#a78bfa]" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Request Cost Center Transfer</h3>
                    <p className="text-[10px] text-[#555e84]">Request vehicle deployment shift</p>
                  </div>
                </div>

                {transferSuccess && (
                  <div className="bg-[#2ecc71]/10 border border-[#2ecc71]/30 text-[#2ecc71] text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Relocation request submitted!</span>
                  </div>
                )}

                <form onSubmit={handleRequestTransfer} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">Target Cost Center</label>
                    <select
                      value={targetCcId}
                      onChange={(e) => setTargetCcId(e.target.value)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#a78bfa] transition"
                      required
                    >
                      <option value="">Select target center...</option>
                      {costCenters.filter(cc => cc.id !== assignedVehicle.ccId && cc.active).map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">Reason for Transfer</label>
                    <input 
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="e.g. Relocating for daily service work"
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#555e84] focus:outline-none focus:border-[#a78bfa] transition"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#a78bfa] hover:bg-[#c084fc] text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Submit Request
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MAINTENANCE TICKETS & PREVIOUS TRANFERS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* FILE WORKSHOP REPAIR TICKET */}
          {assignedVehicle && (
            <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-[#4f8ef7]" />
                <div>
                  <h3 className="text-sm font-bold text-white">File Workshop Ticket</h3>
                  <p className="text-[10px] text-[#555e84]">Submit repair or maintenance issues</p>
                </div>
              </div>

              {maintSuccess && (
                <div className="bg-[#2ecc71]/10 border border-[#2ecc71]/30 text-[#2ecc71] text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Workshop ticket logged!</span>
                </div>
              )}

              <form onSubmit={handleAddMaintenanceTicket} className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">Issue Category / Title</label>
                  <input 
                    type="text"
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value)}
                    placeholder="e.g. Brake noise, Oil change"
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-3.5 py-2 text-sm text-white placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">Priority</label>
                    <select
                      value={maintPriority}
                      onChange={(e) => setMaintPriority(e.target.value as any)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#4f8ef7] transition"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="critical">🔴 Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">Preferred Tech</label>
                    <select
                      value={techName}
                      onChange={(e) => setTechName(e.target.value)}
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#4f8ef7] transition"
                    >
                      <option value="Ali Hassan">Ali Hassan</option>
                      <option value="Mohammed Al-Ghamdi">M. Al-Ghamdi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#8b92b8] font-semibold uppercase tracking-wider block mb-1">Detailed Symptoms</label>
                  <textarea 
                    value={maintNotes}
                    onChange={(e) => setMaintNotes(e.target.value)}
                    placeholder="Describe what feels off or needs replacement..."
                    rows={2}
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#4f8ef7] to-[#7b5ea7] hover:from-[#7aaeff] hover:to-[#9b59b6] text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#4f8ef7]/10"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Submit Ticket
                </button>
              </form>
            </div>
          )}

          {/* MY ACTIVITY HISTORY LOGS */}
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">My Vehicle Logs</h3>
            <p className="text-[10px] text-[#555e84] -mt-3">Real-time update stream for your assigned vehicle</p>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {/* Combine and sort logs */}
              {myMaintenance.length === 0 && myTransfers.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-xs text-[#555e84]">No logged actions found</span>
                </div>
              ) : (
                <>
                  {/* Maintenance items */}
                  {myMaintenance.map(m => (
                    <div key={`m-${m.id}`} className="bg-[#181c29] border border-[#252a3d] rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-[#4f8ef7]" /> {m.type}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          m.status === 'completed' ? 'bg-[#2ecc71]/10 text-[#2ecc71]' : 'bg-[#f39c12]/10 text-[#f39c12]'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-[#8b92b8] text-[10px] leading-relaxed">{m.notes || 'No symptoms notes provided.'}</p>
                      <div className="flex items-center justify-between text-[9px] text-[#555e84] font-mono pt-1">
                        <span>Tech: {m.tech}</span>
                        <span>Date: {m.scheduledDate}</span>
                      </div>
                    </div>
                  ))}

                  {/* Transfer items */}
                  {myTransfers.map(t => (
                    <div key={`t-${t.id}`} className="bg-[#181c29] border border-[#252a3d] rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-[#a78bfa]" /> Relocation Code
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          t.status === 'completed' ? 'bg-[#2ecc71]/10 text-[#2ecc71]' : t.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[#8b92b8] text-[10px] leading-relaxed">
                        Moving to: <span className="font-bold text-white">{costCenters.find(c => c.id === t.toCcId)?.name || 'New Center'}</span>
                      </p>
                      <p className="text-[10px] text-[#555e84] italic">"{t.reason}"</p>
                      <div className="flex items-center justify-between text-[9px] text-[#555e84] font-mono pt-1">
                        <span>By: {t.reqBy}</span>
                        <span>Time: {new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
