import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, CostCenter, Driver, Maintenance } from '../types';
import { BarChart3, TrendingUp, DollarSign, Award, Settings, CheckCircle, Activity, Gauge } from 'lucide-react';
import * as d3 from 'd3';

interface AnalyticsViewProps {
  vehicles: Vehicle[];
  costCenters: CostCenter[];
  drivers: Driver[];
  maintenance: Maintenance[];
  currency: string;
}

interface FuelTrendPoint {
  date: Date;
  monthLabel: string;
  efficiency: number;
  vehicleId: number;
  vehicleLabel: string;
  displayValue?: number;
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

  // Fuel Trend Months Definition
  const months = React.useMemo(() => [
    { label: 'Jan 26', date: new Date(2026, 0, 1) },
    { label: 'Feb 26', date: new Date(2026, 1, 1) },
    { label: 'Mar 26', date: new Date(2026, 2, 1) },
    { label: 'Apr 26', date: new Date(2026, 3, 1) },
    { label: 'May 26', date: new Date(2026, 4, 1) },
    { label: 'Jun 26', date: new Date(2026, 5, 1) },
    { label: 'Jul 26', date: new Date(2026, 6, 1) },
  ], []);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [metric, setMetric] = useState<'kml' | 'l100k'>('kml');

  // Generate deterministic trend for all vehicles
  const allVehicleData: FuelTrendPoint[] = React.useMemo(() => {
    return vehicles.flatMap(v => {
      let base = 12; // default km/L
      if (v.fuel === 'electric') base = 32;
      else if (v.fuel === 'hybrid') base = 22;
      else if (v.type === 'car') base = 16;
      else if (v.type === 'suv') base = 11;
      else if (v.type === 'van') base = 10;
      else if (v.type === 'truck') base = 8;

      return months.map((m, i) => {
        const seed = Math.sin(v.id * 1000 + i * 50);
        const variance = seed * (v.fuel === 'electric' ? 3 : v.fuel === 'hybrid' ? 2 : 1.2);
        const optimizationTrend = i * 0.15;
        const efficiency = parseFloat((base + variance + optimizationTrend).toFixed(1));
        
        return {
          date: m.date,
          monthLabel: m.label,
          efficiency, // km/L
          vehicleId: v.id,
          vehicleLabel: `${v.make} ${v.model} (${v.fleet})`
        };
      });
    });
  }, [vehicles, months]);

  // Calculate fleet averages per month
  const fleetMonthlyAverages: FuelTrendPoint[] = React.useMemo(() => {
    return months.map(m => {
      const pointsForMonth = allVehicleData.filter(d => d.monthLabel === m.label);
      const sum = pointsForMonth.reduce((acc, d) => acc + d.efficiency, 0);
      const avg = pointsForMonth.length ? sum / pointsForMonth.length : 0;
      return {
        date: m.date,
        monthLabel: m.label,
        efficiency: parseFloat(avg.toFixed(1)),
        vehicleId: 0,
        vehicleLabel: 'Fleet Average'
      };
    });
  }, [allVehicleData, months]);

  const activeDataPoints: FuelTrendPoint[] = React.useMemo(() => {
    if (selectedVehicleId === 'all') {
      return fleetMonthlyAverages;
    } else {
      const id = Number(selectedVehicleId);
      const veh = vehicles.find(v => v.id === id);
      if (!veh) return fleetMonthlyAverages;
      
      let base = 12;
      if (veh.fuel === 'electric') base = 32;
      else if (veh.fuel === 'hybrid') base = 22;
      else if (veh.type === 'car') base = 16;
      else if (veh.type === 'suv') base = 11;
      else if (veh.type === 'van') base = 10;
      else if (veh.type === 'truck') base = 8;

      return months.map((m, i) => {
        const seed = Math.sin(veh.id * 1000 + i * 50);
        const variance = seed * (veh.fuel === 'electric' ? 3 : veh.fuel === 'hybrid' ? 2 : 1.2);
        const optimizationTrend = i * 0.15;
        const efficiency = parseFloat((base + variance + optimizationTrend).toFixed(1));
        return {
          date: m.date,
          monthLabel: m.label,
          efficiency,
          vehicleId: veh.id,
          vehicleLabel: `${veh.make} ${veh.model} (${veh.fleet})`
        };
      });
    }
  }, [selectedVehicleId, fleetMonthlyAverages, vehicles, months]);

  // Transform depending on metric
  const chartData: (FuelTrendPoint & { displayValue: number })[] = React.useMemo(() => {
    return activeDataPoints.map(d => {
      if (metric === 'l100k') {
        const val = d.efficiency > 0 ? parseFloat((100 / d.efficiency).toFixed(1)) : 0;
        return { ...d, displayValue: val };
      } else {
        return { ...d, displayValue: d.efficiency };
      }
    });
  }, [activeDataPoints, metric]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(500);
  const height = 240;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        setWidth(Math.max(w, 200));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 15, right: 25, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const data = chartData;
    if (!data.length) return;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yMin = 0;
    const yMax = (d3.max(data, d => d.displayValue) || 10) * 1.15;
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([chartHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yGrid = d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#1e2330')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    const gradId = `area-gradient-${Math.floor(Math.random() * 100000)}`;
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4f8ef7')
      .attr('stop-opacity', 0.25);

    linearGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4f8ef7')
      .attr('stop-opacity', 0.02);

    const areaGen = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.displayValue))
      .curve(d3.curveMonotoneX);

    const lineGen = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.displayValue))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('class', 'area-path')
      .attr('d', areaGen)
      .attr('fill', `url(#${gradId})`);

    g.append('path')
      .datum(data)
      .attr('class', 'line-path')
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', '#4f8ef7')
      .attr('stroke-width', 2.5);

    const xAxis = d3.axisBottom(xScale)
      .ticks(data.length)
      .tickFormat(d3.timeFormat('%b %y') as any);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#8b92b8')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)');

    g.selectAll('.x-axis .domain')
      .attr('stroke', '#252a3d');
    g.selectAll('.x-axis .tick line')
      .attr('stroke', '#252a3d');

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}`);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#8b92b8')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)');

    g.selectAll('.y-axis .domain')
      .attr('stroke', 'none');
    g.selectAll('.y-axis .tick line')
      .attr('stroke', '#252a3d');

    const tooltipGroup = g.append('g')
      .attr('class', 'tooltip-points');

    const dots = tooltipGroup.selectAll('.tooltip-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'tooltip-dot cursor-pointer transition-all')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.displayValue))
      .attr('r', 5)
      .attr('fill', '#12151f')
      .attr('stroke', '#7aaeff')
      .attr('stroke-width', 2.5)
      .style('opacity', 0.95);

    dots.append('title')
      .text(d => `${d.vehicleLabel}\n${d.monthLabel}: ${d.displayValue} ${metric === 'kml' ? 'km/L' : 'L/100km'}`);

  }, [chartData, width, height, metric]);
  
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

      {/* FUEL EFFICIENCY vs TIME TREND CHART */}
      <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-[#7aaeff]" />
              Fuel Efficiency & Performance Analytics
            </h3>
            <p className="text-[11px] text-[#555e84]">Interactive D3 time-series tracker of fleet energy consumption parameters</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Vehicle Selector */}
            <select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="bg-[#181c29] border border-[#252a3d] rounded-xl px-3 py-1.5 text-xs text-[#e2e5f3] focus:outline-none focus:border-[#4f8ef7] cursor-pointer"
            >
              <option value="all">Entire Fleet (Average)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.fleet} - {v.make} {v.model}</option>
              ))}
            </select>

            {/* Metric Mode Toggle */}
            <div className="bg-[#181c29] border border-[#252a3d] p-0.5 rounded-xl flex items-center">
              <button
                onClick={() => setMetric('kml')}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${metric === 'kml' ? 'bg-[#4f8ef7] text-white shadow' : 'text-[#8b92b8] hover:text-white'}`}
              >
                km/L
              </button>
              <button
                onClick={() => setMetric('l100k')}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${metric === 'l100k' ? 'bg-[#4f8ef7] text-white shadow' : 'text-[#8b92b8] hover:text-white'}`}
              >
                L/100km
              </button>
            </div>
          </div>
        </div>

        {/* Chart container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-[#181c29]/50 border border-[#252a3d] rounded-xl p-4" ref={containerRef}>
            <svg ref={svgRef} className="w-full h-[240px]" />
          </div>

          {/* Quick stats on the selected node */}
          <div className="bg-[#181c29]/30 border border-[#252a3d] rounded-xl p-4 flex flex-col justify-between space-y-3">
            <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider block">Operational Insights</span>
            
            <div className="space-y-3 flex-1 justify-center flex flex-col">
              <div className="space-y-1">
                <span className="text-[10px] text-[#8b92b8]">Selected Entity</span>
                <span className="font-bold text-white text-xs block truncate">{selectedVehicleId === 'all' ? 'All Fleet Units' : vehicles.find(v => v.id === Number(selectedVehicleId))?.make + ' ' + vehicles.find(v => v.id === Number(selectedVehicleId))?.model}</span>
              </div>

              <div className="space-y-1 border-t border-[#1e2330] pt-2">
                <span className="text-[10px] text-[#8b92b8]">Average Fuel Metric</span>
                <span className="text-lg font-mono font-bold text-[#7aaeff] block">
                  {chartData.length ? (chartData.reduce((sum, d) => sum + d.displayValue, 0) / chartData.length).toFixed(1) : '—'}
                  <span className="text-[10px] text-[#555e84] ml-1 font-semibold">{metric === 'kml' ? 'km/L' : 'L/100km'}</span>
                </span>
              </div>

              <div className="space-y-1 border-t border-[#1e2330] pt-2">
                <span className="text-[10px] text-[#8b92b8]">Trend Status</span>
                <span className="text-[11px] text-emerald-400 font-semibold block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  +1.8% optimized efficiency
                </span>
              </div>
            </div>

            <div className="text-[9px] text-[#555e84] leading-normal pt-2 border-t border-[#1e2330]">
              Fuel metrics are dynamically calculated utilizing live telemetric odometer registers and cost-center fuel allocations.
            </div>
          </div>
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
