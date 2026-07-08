import React, { useState } from 'react';
import { Vehicle, Driver } from '../types';
import { Compass, Radio, MapPin, Search, Navigation, Info, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface TrackingViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
}

export default function TrackingView({ vehicles, drivers }: TrackingViewProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedProvider, setConnectedProvider] = useState<string | null>('Samsara');

  // Filter vehicles
  const searchFiltered = vehicles.filter(v => 
    `${v.make} ${v.model} ${v.fleet} ${v.plate}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  const getDriverName = (id: number | null) => {
    if (id === null) return 'Unassigned';
    return drivers.find(d => d.id === id)?.name || 'Unknown';
  };

  const providers = [
    { name: 'Samsara API', code: 'samsara', desc: 'Enterprise GPS & dashcam feeds' },
    { name: 'Geotab Cloud', code: 'geotab', desc: 'Active engine diagnostics & pings' },
    { name: 'Fleetmatics', code: 'fleetmatics', desc: 'Basic telemetry & route mapping' },
  ];

  return (
    <div className="space-y-6">
      {/* MAP CONTROLLER AND TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAP PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 relative overflow-hidden">
            {/* Header info */}
            <div className="flex items-center justify-between mb-3 z-10 relative">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#2ecc71] animate-pulse" />
                  Fleet Telemetry Control
                </h3>
                <p className="text-[11px] text-[#555e84]">Interactive vehicle location map</p>
              </div>

              {selectedVehicle && (
                <div className="text-right">
                  <span className="text-[10px] bg-[#4f8ef7]/10 text-[#7aaeff] font-mono px-2 py-0.5 rounded font-bold">{selectedVehicle.fleet}</span>
                  <div className="text-xs text-white font-bold mt-1">{selectedVehicle.make} {selectedVehicle.model}</div>
                </div>
              )}
            </div>

            {/* THE MAP CANVAS */}
            <div className="relative w-full h-[360px] bg-gradient-to-br from-[#0d101a] to-[#141826] border border-[#252a3d] rounded-xl overflow-hidden">
              {/* Coordinates Grid Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(79,142,247,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(79,142,247,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
              
              {/* Regional Landmarks (Saudi Arabia Cities) */}
              <div className="absolute top-[20%] left-[25%] text-[10px] text-[#555e84] font-semibold tracking-widest font-mono uppercase">Tabuk</div>
              <div className="absolute top-[50%] left-[45%] text-[10px] text-[#555e84] font-semibold tracking-widest font-mono uppercase">Riyadh (HQ)</div>
              <div className="absolute top-[65%] left-[20%] text-[10px] text-[#555e84] font-semibold tracking-widest font-mono uppercase">Jeddah</div>
              <div className="absolute top-[48%] left-[75%] text-[10px] text-[#555e84] font-semibold tracking-widest font-mono uppercase">Dammam Hub</div>
              <div className="absolute top-[80%] left-[50%] text-[10px] text-[#555e84] font-semibold tracking-widest font-mono uppercase">Abha</div>

              {/* Map Route Polyline representation */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path 
                  d="M 120 180 Q 250 160 380 190 T 500 240" 
                  fill="none" 
                  stroke="rgba(79, 142, 247, 0.15)" 
                  strokeWidth="3" 
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Vehicle Pins */}
              {vehicles.map(v => {
                const isSelected = v.id === selectedVehicle?.id;
                // Scale coordinate x and y slightly to fit in the bounding box
                const posX = 15 + v.gps.x * 0.75;
                const posY = 15 + v.gps.y * 0.70;

                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="absolute group transition-transform duration-200 z-10"
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                  >
                    {/* Ring Pulse */}
                    {v.gps.online && (
                      <span className="absolute -inset-2.5 rounded-full bg-[#2ecc71]/15 animate-ping" />
                    )}
                    
                    {/* Marker Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg transition-all ${isSelected ? 'bg-[#4f8ef7] border-[#7aaeff] text-white scale-110' : v.gps.online ? 'bg-[#12151f] border-[#2ecc71] text-[#2ecc71]' : 'bg-[#12151f] border-[#555e84] text-[#555e84]'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>

                    {/* Popover label on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#0b0d14] border border-[#252a3d] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap font-mono shadow-xl z-30">
                      <strong>{v.fleet}</strong> • {v.make} • {v.gps.speed} km/h
                    </div>
                  </button>
                );
              })}

              {/* Live Info card at bottom right */}
              {selectedVehicle && (
                <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-[#0b0d14]/90 backdrop-blur border border-[#252a3d] rounded-lg p-3 w-auto sm:w-64 text-xs space-y-1.5 z-20 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-[#252a3d] pb-1.5">
                    <span className="font-bold text-white">{selectedVehicle.make} {selectedVehicle.model}</span>
                    <span className={`w-2 h-2 rounded-full ${selectedVehicle.gps.online ? 'bg-[#2ecc71]' : 'bg-[#e74c3c]'}`} />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8b92b8]">
                    <span>Current Speed</span>
                    <span className="text-white font-mono font-bold">{selectedVehicle.gps.speed} km/h</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8b92b8]">
                    <span>Assigned Operator</span>
                    <span className="text-white font-semibold">{getDriverName(selectedVehicle.driverId)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8b92b8]">
                    <span>Last telemetry ping</span>
                    <span className="text-white font-mono">{new Date(selectedVehicle.gps.lastPing).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR SELECTOR */}
        <div className="space-y-4">
          {/* GPS PROVIDER CONFIG */}
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#7aaeff]" />
              Telemetry Provider Pipeline
            </h4>
            
            <div className="space-y-2">
              {providers.map(p => {
                const isConnected = connectedProvider === p.name;
                return (
                  <button
                    key={p.code}
                    onClick={() => setConnectedProvider(p.name)}
                    className={`w-full text-left p-3 border rounded-xl transition flex items-center justify-between ${isConnected ? 'bg-[#2ecc71]/10 border-[#2ecc71]/40 text-[#2ecc71]' : 'bg-[#181c29]/50 border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-[#555e84] mt-0.5">{p.desc}</div>
                    </div>
                    {isConnected && <span className="text-[9px] bg-[#2ecc71]/15 text-[#2ecc71] px-2 py-0.5 rounded font-bold font-mono">CONNECTED</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE TELEMETRY LOGS */}
          <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-4 flex flex-col h-[280px]">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555e84]" />
              <input 
                type="text" 
                placeholder="Find active fleet..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {searchFiltered.map(v => {
                const isSelected = v.id === selectedVehicle?.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${isSelected ? 'bg-[#4f8ef7]/15 border-[#4f8ef7] text-white' : 'bg-transparent border-transparent hover:bg-[#181c29] text-[#8b92b8]'}`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{v.make} {v.model}</div>
                      <div className="text-[10px] text-[#555e84] font-mono mt-0.5">{v.fleet} • {getDriverName(v.driverId)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-white">{v.gps.speed} <span className="text-[9px] text-[#555e84]">km/h</span></div>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block mt-1 ${v.gps.online ? 'bg-[#2ecc71]' : 'bg-[#e74c3c]'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
