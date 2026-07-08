import React from 'react';
import { Vehicle, CostCenter, Driver, Maintenance } from '../types';
import { BarChart3, TrendingUp, DollarSign, Award, Settings, CheckCircle } from 'lucide-react';

interface AnalyticsViewProps {
  vehicles: Vehicle[];
  costCenters: CostCenter[];
  drivers: Driver[];
  maintenance: Maintenance[];
  currency: string;
}

export default function AnalyticsView({
  vehicles,
  costCenters,
  drivers,
  maintenance,
  currency
}: AnalyticsViewProps) {
  // Calculations
  const totalVehicles = vehicles.length;
  const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
  const totalSpend = costCenters.reduce((sum, cc) => sum + (cc.spent || 0), 0);
  const totalBudget = costCenters.reduce((sum, cc) => sum + (cc.budget || 0), 0);
  const completedJobs = maintenance.filter(m => m.status === 'completed').length;
  
  // Status breakdown
  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, { available: 0, in_use: 0, maintenance: 0, out_of_service: 0 } as Record<string, number>);

  // Type breakdown
  const typeCounts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort vehicles by mileage for bar chart
  const highMileageVehicles = [...vehicles]
    .sort((a, b) => b.mileage - a.mileage)
    .slice(0, 6);

  const maxMileage = highMileageVehicles.length ? Math.max(...highMileageVehicles.map(v => v.mileage)) : 10000;

  // Custom SVG pie/donut calculation helper
  const renderDonutChart = (data: { label: string; value: number; color: string }[]) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="text-xs text-[#555e84] text-center">No data available</div>;

    let accumulatedAngle = 0;
    return (
      <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
        {data.map((d, i) => {
          if (d.value === 0) return null;
          const percentage = d.value / total;
          const angle = percentage * 360;
          
          // Calculate SVG arc parameters
          const x1 = 50 + 40 * Math.cos((accumulatedAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((accumulatedAngle * Math.PI) / 180);
          accumulatedAngle += angle;
          const x2 = 50 + 40 * Math.cos((accumulatedAngle * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin((accumulatedAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          return (
            <path 
              key={i} 
              d={pathData} 
              fill={d.color} 
              className="hover:opacity-85 transition-opacity cursor-pointer"
            >
              <title>{d.label}: {d.value} ({Math.round(percentage * 100)}%)</title>
            </path>
          );
        })}
        {/* Inner circle for donut look */}
        <circle cx="50" cy="50" r="26" fill="#12151f" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* ANALYTICS HIGHLIGHTS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 hover:border-[#313757] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8b92b8]">Fleet Mileage YTD</span>
            <div className="w-7 h-7 rounded bg-[#4f8ef7]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#7aaeff]" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">{totalMileage.toLocaleString()} <span className="text-xs text-[#555e84]">km</span></div>
          <span className="text-[10px] text-[#2ecc71] font-semibold mt-1 block">↑ 8.2% vs last quarter</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 hover:border-[#313757] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8b92b8]">Operational Cost</span>
            <div className="w-7 h-7 rounded bg-[#2ecc71]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#2ecc71]" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">{currency} {totalSpend.toLocaleString()}</div>
          <span className="text-[10px] text-[#8b92b8] font-semibold mt-1 block">of {currency} {totalBudget.toLocaleString()} limit</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 hover:border-[#313757] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8b92b8]">Completed Services</span>
            <div className="w-7 h-7 rounded bg-[#9b59b6]/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#9b59b6]" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">{completedJobs} <span className="text-xs text-[#555e84]">jobs</span></div>
          <span className="text-[10px] text-[#555e84] font-semibold mt-1 block">No open critical hold-ups</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 hover:border-[#313757] transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8b92b8]">Assigned Drivers</span>
            <div className="w-7 h-7 rounded bg-[#f39c12]/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#f39c12]" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">{drivers.filter(d => d.status === 'active').length} <span className="text-xs text-[#555e84]">active</span></div>
          <span className="text-[10px] text-[#8b92b8] font-semibold mt-1 block">of {drivers.length} registered total</span>
        </div>
      </div>

      {/* DONUT GRAPH BREAKDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-5 uppercase tracking-wider">Fleet Status Allocation</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="shrink-0">
              {renderDonutChart([
                { label: 'Available', value: statusCounts.available, color: '#2ecc71' },
                { label: 'In Use', value: statusCounts.in_use, color: '#4f8ef7' },
                { label: 'Workshop', value: statusCounts.maintenance, color: '#f39c12' },
                { label: 'OOS', value: statusCounts.out_of_service, color: '#e74c3c' },
              ])}
            </div>

            <div className="space-y-2 w-full max-w-[200px]">
              {[
                { label: 'Available Ready', count: statusCounts.available, color: 'bg-[#2ecc71]' },
                { label: 'In Active Use', count: statusCounts.in_use, color: 'bg-[#4f8ef7]' },
                { label: 'In Maintenance', count: statusCounts.maintenance, color: 'bg-[#f39c12]' },
                { label: 'Out of Service', count: statusCounts.out_of_service, color: 'bg-[#e74c3c]' }
              ].map(item => {
                const pct = totalVehicles ? Math.round((item.count / totalVehicles) * 100) : 0;
                return (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                      <span className="text-[#8b92b8]">{item.label}</span>
                    </div>
                    <span className="font-bold text-white font-mono">{item.count} <span className="text-[10px] text-[#555e84]">({pct}%)</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-5 uppercase tracking-wider">Vehicle Class Deployment</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="shrink-0">
              {renderDonutChart(Object.entries(typeCounts).map(([key, value], idx) => {
                const colors = ['#4f8ef7', '#9b59b6', '#1abc9c', '#f39c12'];
                return {
                  label: key,
                  value,
                  color: colors[idx % colors.length]
                };
              }))}
            </div>

            <div className="space-y-2 w-full max-w-[200px]">
              {Object.entries(typeCounts).map(([type, count], idx) => {
                const colors = ['bg-[#4f8ef7]', 'bg-[#9b59b6]', 'bg-[#1abc9c]', 'bg-[#f39c12]'];
                const pct = totalVehicles ? Math.round((count / totalVehicles) * 100) : 0;
                return (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} shrink-0`} />
                      <span className="text-[#8b92b8] capitalize">{type}s</span>
                    </div>
                    <span className="font-bold text-white font-mono">{count} <span className="text-[10px] text-[#555e84]">({pct}%)</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MILEAGE AND BUDGET PLOT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mileage Plot */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-1.5 uppercase tracking-wider">Top 6 Vehicles by Odometer</h3>
          <p className="text-[11px] text-[#555e84] mb-6">Identifies long-haul workload parameters</p>

          <div className="space-y-4">
            {highMileageVehicles.map(v => {
              const pct = maxMileage ? Math.round((v.mileage / maxMileage) * 100) : 0;
              return (
                <div key={v.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-semibold">{v.make} {v.model} <strong className="font-mono text-[10px] bg-white/5 text-[#8b92b8] px-1.5 py-0.5 rounded ml-1.5">{v.fleet}</strong></span>
                    <span className="font-mono text-[#7aaeff] font-bold">{v.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="w-full bg-[#181c29] h-2.5 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#4f8ef7] to-[#7aaeff] h-full rounded-lg transition-all" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Performance plot */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5">
          <h3 className="text-xs font-bold text-white mb-1.5 uppercase tracking-wider">Pace Analysis by Cost Center</h3>
          <p className="text-[11px] text-[#555e84] mb-6">Actual consumption against allocations</p>

          <div className="space-y-4">
            {costCenters.map(cc => {
              const spendPct = cc.budget ? Math.round((cc.spent / cc.budget) * 100) : 0;
              const paceCol = spendPct > 85 ? 'bg-[#e74c3c]' : spendPct > 65 ? 'bg-[#f39c12]' : 'bg-[#2ecc71]';

              return (
                <div key={cc.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-semibold">{cc.name} <span className="text-[10px] text-[#555e84]">({cc.code})</span></span>
                    <span className="font-mono text-[#8b92b8] font-bold">
                      {spendPct}% spent
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-[#181c29] h-4 rounded-lg overflow-hidden">
                      <div 
                        className={`${paceCol} h-full rounded-lg transition-all`} 
                        style={{ width: `${spendPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#555e84] mt-1 font-mono">
                      <span>Spent: {currency} {cc.spent.toLocaleString()}</span>
                      <span>Budget: {currency} {cc.budget.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
