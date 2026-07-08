import React from 'react';
import { Vehicle, Transfer, Maintenance, CostCenter } from '../types';
import { Truck, CheckSquare, Compass, RefreshCw, AlertTriangle, ArrowRight, Wrench, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  vehicles: Vehicle[];
  transfers: Transfer[];
  maintenance: Maintenance[];
  costCenters: CostCenter[];
  dismissedOnboarding: boolean;
  onDismissOnboarding: () => void;
  onNavigate: (page: string) => void;
  currency: string;
}

export default function DashboardView({
  vehicles,
  transfers,
  maintenance,
  costCenters,
  dismissedOnboarding,
  onDismissOnboarding,
  onNavigate,
  currency
}: DashboardViewProps) {
  // Stats calculations
  const totalVehicles = vehicles.length;
  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, { available: 0, in_use: 0, maintenance: 0, out_of_service: 0 } as Record<string, number>);

  const activeVehicles = statusCounts.available + statusCounts.in_use;
  const utilization = totalVehicles ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
  const pendingTransfersCount = transfers.filter(t => t.status === 'pending').length;

  // Compliance alerting (documents expiring in <= 30 days)
  const isDocExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const diffTime = new Date(dateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const expiringCount = vehicles.filter(v => 
    isDocExpiringSoon(v.docs.insurance) || 
    isDocExpiringSoon(v.docs.registration) || 
    isDocExpiringSoon(v.docs.inspection)
  ).length;

  // Recent 5 transfers
  const recentTransfers = transfers.slice(0, 5);

  // Next 4 urgent or scheduled maintenance items
  const upcomingMaint = maintenance
    .filter(m => m.status !== 'completed')
    .slice(0, 4);

  const getCcName = (id: number | null) => {
    if (id === null) return 'Unassigned';
    return costCenters.find(c => c.id === id)?.name || 'Unknown';
  };

  const formatCurrency = (val: number) => {
    return `${currency} ${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* ONBOARDING BANNER */}
      {!dismissedOnboarding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#4f8ef7]/15 to-[#9b59b6]/10 border border-[#4f8ef7]/30 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🎉 Welcome to Fleet Ops Pro Workspace</span>
            </h3>
            <p className="text-xs text-[#8b92b8] leading-relaxed">
              Your dashboard is active and live. Add vehicles to the register, schedule maintenance jobs, or initiate a cost-center relocation transfer.
            </p>
            <div className="flex gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-[#4f8ef7]" />
              <span className="w-2 h-2 rounded-full bg-[#4f8ef7]" />
              <span className="w-2 h-2 rounded-full bg-[#4f8ef7]" />
              <span className="w-2 h-2 rounded-full bg-[#555e84]" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0 self-end md:self-auto">
            <button 
              onClick={() => onNavigate('fleet')}
              className="bg-[#4f8ef7] hover:bg-[#7aaeff] text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Configure Fleet →
            </button>
            <button 
              onClick={onDismissOnboarding}
              className="bg-transparent hover:bg-[#1f2335] border border-[#252a3d] text-[#8b92b8] hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 flex flex-col justify-between hover:border-[#313757] transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#4f8ef7]/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#7aaeff]" />
            </div>
            <span className="text-[10px] text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded font-mono font-bold">Live</span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#8b92b8]">Total Vehicles</span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-0.5">{totalVehicles}</div>
            <span className="text-[10px] text-[#555e84]">Registered fleet items</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 flex flex-col justify-between hover:border-[#313757] transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#2ecc71]/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-[#2ecc71]" />
            </div>
            <span className="text-[10px] text-[#8b92b8] font-mono">Running</span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#8b92b8]">Active Fleet</span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-0.5">{activeVehicles}</div>
            <span className="text-[10px] text-[#8b92b8]">of {totalVehicles} deployed</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 flex flex-col justify-between hover:border-[#313757] transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#9b59b6]/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-[#9b59b6]" />
            </div>
            <span className={`text-[10px] font-mono ${utilization >= 75 ? 'text-[#2ecc71]' : 'text-[#f39c12]'}`}>
              {utilization >= 75 ? 'Optimal' : 'Low'}
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#8b92b8]">Utilization</span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-0.5">{utilization}%</div>
            <span className="text-[10px] text-[#555e84]">Available & In Use</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 flex flex-col justify-between hover:border-[#313757] transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#f39c12]/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-[#f39c12]" />
            </div>
            {pendingTransfersCount > 0 && (
              <span className="animate-pulse w-2 h-2 rounded-full bg-[#f39c12]" />
            )}
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#8b92b8]">Pending Transfers</span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-0.5">{pendingTransfersCount}</div>
            <span className="text-[10px] text-[#555e84]">Awaiting approval</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 flex flex-col justify-between hover:border-[#313757] transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#e74c3c]/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#e74c3c]" />
            </div>
            {expiringCount > 0 && (
              <span className="text-[10px] text-[#e74c3c] bg-[#e74c3c]/10 px-1.5 py-0.5 rounded font-bold font-mono">Alert</span>
            )}
          </div>
          <div className="mt-4">
            <span className="text-xs text-[#8b92b8]">Compliance Alerts</span>
            <div className="text-2xl font-bold font-mono tracking-tight mt-0.5 text-[#e74c3c]">{expiringCount}</div>
            <span className="text-[10px] text-[#8b92b8]">Docs expiring (30d)</span>
          </div>
        </div>
      </div>

      {/* CORE INFO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TRANSFERS BOARD */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Relocation Transfers</h3>
              <p className="text-[11px] text-[#555e84]">Historical and active vehicle movements</p>
            </div>
            <button 
              onClick={() => onNavigate('transfers')}
              className="text-xs text-[#7aaeff] hover:text-[#4f8ef7] font-semibold flex items-center gap-1 hover:underline"
            >
              See all transfers <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentTransfers.length === 0 ? (
              <div className="text-center py-12 text-[#555e84]">No transfer logs recorded.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#252a3d]">
                    <th className="py-3 text-[10px] font-bold text-[#555e84] uppercase tracking-wider">Vehicle</th>
                    <th className="py-3 text-[10px] font-bold text-[#555e84] uppercase tracking-wider">Route Mapping</th>
                    <th className="py-3 text-[10px] font-bold text-[#555e84] uppercase tracking-wider">Status</th>
                    <th className="py-3 text-[10px] font-bold text-[#555e84] uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252a3d]">
                  {recentTransfers.map(t => {
                    const vehicle = vehicles.find(v => v.id === t.vehicleId);
                    return (
                      <tr key={t.id} className="hover:bg-[#181c29]/50 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-semibold text-white text-xs">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</div>
                          <div className="text-[10px] text-[#555e84] font-mono mt-0.5">{vehicle?.fleet || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1.5 text-xs text-[#8b92b8]">
                            <span className="font-medium truncate max-w-[80px] md:max-w-[120px]">{getCcName(t.fromCcId)}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#555e84] shrink-0" />
                            <span className="font-bold text-[#7aaeff] truncate max-w-[80px] md:max-w-[120px]">{getCcName(t.toCcId)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          {t.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#2ecc71]/10 text-[#2ecc71] px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71]" /> Completed
                            </span>
                          )}
                          {t.status === 'in_progress' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#4f8ef7]/10 text-[#7aaeff] px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] animate-pulse" /> Moving
                            </span>
                          )}
                          {t.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#f39c12]/10 text-[#f39c12] px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f39c12]" /> Pending
                            </span>
                          )}
                          {t.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/5 text-[#555e84] px-2.5 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pl-2 text-[10px] font-medium text-[#555e84]">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FLEET STATUS MIX & URGENT MAINTENANCE */}
        <div className="space-y-6">
          {/* Status Breakdown Card */}
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white mb-4">Deploys & Operational Load</h4>
            <div className="space-y-3">
              {[
                { label: 'Available / Active Ready', count: statusCounts.available, color: '#2ecc71', bg: 'bg-[#2ecc71]' },
                { label: 'In Use / Deployed', count: statusCounts.in_use, color: '#4f8ef7', bg: 'bg-[#4f8ef7]' },
                { label: 'Under Maintenance', count: statusCounts.maintenance, color: '#f39c12', bg: 'bg-[#f39c12]' },
                { label: 'Out of Service', count: statusCounts.out_of_service, color: '#e74c3c', bg: 'bg-[#e74c3c]' }
              ].map(item => {
                const percentage = totalVehicles ? Math.round((item.count / totalVehicles) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#8b92b8] font-medium">{item.label}</span>
                      <span className="font-bold text-white font-mono">{item.count} <span className="text-[#555e84]">({percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-[#181c29] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.bg} rounded-full transition-all`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Maintenance List */}
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white">Pending Workshop Jobs</h4>
              <button onClick={() => onNavigate('maintenance')} className="text-[10px] text-[#7aaeff] hover:underline font-semibold">
                Schedules →
              </button>
            </div>
            
            <div className="divide-y divide-[#252a3d]">
              {upcomingMaint.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-[#555e84]">Workshop queue is empty.</div>
              ) : (
                upcomingMaint.map(m => {
                  const veh = vehicles.find(v => v.id === m.vehicleId);
                  const prioColors = {
                    critical: 'text-[#e74c3c] bg-[#e74c3c]/10',
                    high: 'text-[#f39c12] bg-[#f39c12]/10',
                    medium: 'text-[#7aaeff] bg-[#4f8ef7]/10',
                    low: 'text-[#8b92b8] bg-white/5'
                  };
                  return (
                    <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{veh ? `${veh.make} ${veh.model}` : 'Unknown'}</div>
                        <div className="text-[10px] text-[#8b92b8] truncate mt-0.5">{m.type}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${prioColors[m.priority]}`}>
                          {m.priority}
                        </span>
                        <div className="text-[10px] text-[#555e84] font-semibold mt-1 font-mono">{m.scheduledDate}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COST CENTER BUDGET TRACKING */}
      <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Cost Center Budget Performance YTD</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {costCenters.filter(cc => cc.active).map(cc => {
            const utilizationRate = cc.budget ? Math.min(Math.round((cc.spent / cc.budget) * 100), 100) : 0;
            const paceColor = utilizationRate > 85 ? 'bg-[#e74c3c]' : utilizationRate > 65 ? 'bg-[#f39c12]' : 'bg-[#2ecc71]';
            const textColor = utilizationRate > 85 ? 'text-[#e74c3c]' : utilizationRate > 65 ? 'text-[#f39c12]' : 'text-[#2ecc71]';

            return (
              <div key={cc.id} className="p-4 bg-[#181c29] border border-[#252a3d] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{cc.name}</h4>
                    <span className="text-[10px] bg-white/5 text-[#8b92b8] px-2 py-0.5 rounded-md font-mono mt-0.5 inline-block">{cc.code}</span>
                  </div>
                  <span className={`text-sm font-extrabold font-mono ${textColor}`}>{utilizationRate}%</span>
                </div>

                <div className="w-full bg-[#12151f] h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${paceColor} rounded-full transition-all`} 
                    style={{ width: `${utilizationRate}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <div>
                    <span className="text-[#555e84] block">Consumed</span>
                    <span className="font-mono font-bold text-[#8b92b8]">{formatCurrency(cc.spent)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#555e84] block">Total Budget Allocation</span>
                    <span className="font-mono font-bold text-[#8b92b8]">{formatCurrency(cc.budget)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
