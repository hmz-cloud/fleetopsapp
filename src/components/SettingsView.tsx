import React from 'react';
import { Settings, User, Vehicle, Driver, Transfer, CostCenter, Maintenance, AuditLog } from '../types';
import { 
  Check, ShieldCheck, Mail, Smartphone, RefreshCcw, 
  ShieldAlert, Award, FileText, Download, Database, FileSpreadsheet 
} from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (s: Partial<Settings>) => void;
  currentUser: User | null;
  vehiclesCount: number;
  driversCount: number;
  usersCount: number;
  transfersCount: number;
  onResetData: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  costCenters: CostCenter[];
  transfers: Transfer[];
  maintenance: Maintenance[];
  auditLogs: AuditLog[];
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  currentUser,
  vehiclesCount,
  driversCount,
  usersCount,
  transfersCount,
  onResetData,
  vehicles = [],
  drivers = [],
  costCenters = [],
  transfers = [],
  maintenance = [],
  auditLogs = []
}: SettingsViewProps) {
  
  const handleToggle = (key: keyof Settings) => {
    onUpdateSettings({ [key]: !settings[key] });
  };

  const handleTextChange = (key: keyof Settings, value: string) => {
    onUpdateSettings({ [key]: value });
  };

  // Helper to trigger CSV file download safely via Blob & URL
  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Vehicles
  const exportVehicles = () => {
    const headers = [
      'ID', 'Plate Number', 'VIN', 'Make', 'Model', 'Year', 'Type', 'CC ID', 'Status', 
      'Fuel Type', 'Mileage', 'Last Service', 'Next Service', 'Registration Expiry', 'Insurance Expiry'
    ];
    const rows = vehicles.map(v => [
      v.id, v.plate, v.vin, v.make, v.model, v.year, v.type, v.ccId || '', v.status,
      v.fuel, v.mileage, v.lastService, v.nextService, v.docs?.registration || '', v.docs?.insurance || ''
    ]);
    downloadCSV(`vehicles_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // 2. Export Drivers
  const exportDrivers = () => {
    const headers = [
      'ID', 'Name', 'License Number', 'Status', 'Phone', 'Email', 
      'Current Vehicle ID', 'Join Date', 'Trips'
    ];
    const rows = drivers.map(d => [
      d.id, d.name, d.license, d.status, d.phone, d.email,
      d.vehicleId || '', d.joinDate, d.trips
    ]);
    downloadCSV(`drivers_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // 3. Export Cost Centers
  const exportCostCenters = () => {
    const headers = ['ID', 'Name', 'Code', 'Description', 'Active', 'Budget', 'Spent'];
    const rows = costCenters.map(cc => [
      cc.id, cc.name, cc.code, cc.desc, cc.active ? 'Yes' : 'No', cc.budget, cc.spent
    ]);
    downloadCSV(`cost_centers_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // 4. Export Relocations
  const exportRelocations = () => {
    const headers = [
      'ID', 'Vehicle ID', 'From CC ID', 'To CC ID', 'Requested By', 
      'Requested Date', 'Status', 'Approved By', 'Completed Date', 'Reason'
    ];
    const rows = transfers.map(t => [
      t.id, t.vehicleId, t.fromCcId || '', t.toCcId, t.reqBy,
      t.createdAt, t.status, t.approvedBy || '', t.completedAt || '', t.reason
    ]);
    downloadCSV(`relocations_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // 5. Export Maintenance
  const exportMaintenance = () => {
    const headers = [
      'ID', 'Vehicle ID', 'Type', 'Scheduled Date', 'Completed Date', 
      'Estimated Cost', 'Actual Cost', 'Status', 'Priority', 'Technician', 'Notes'
    ];
    const rows = maintenance.map(m => [
      m.id, m.vehicleId, m.type, m.scheduledDate, m.completedDate || '',
      m.estimatedCost, m.actualCost || '', m.status, m.priority, m.tech, m.notes
    ]);
    downloadCSV(`maintenance_export_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  // 6. Export Full JSON Backup
  const exportJSONBackup = () => {
    const dataObj = {
      exportedAt: new Date().toISOString(),
      vehicles,
      drivers,
      costCenters,
      transfers,
      maintenance,
      auditLogs,
      settings
    };
    const str = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fleet_ops_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const systemStats = [
    { label: 'Firmware platform', value: 'Fleet Ops v3.1 Pro Workspace' },
    { label: 'Registered fleet units', value: `${vehiclesCount} assets` },
    { label: 'Assigned operators', value: `${driversCount} drivers` },
    { label: 'Authorized user staff', value: `${usersCount} members` },
    { label: 'Historical relocation events', value: `${transfersCount} relocations` },
    { label: 'Current credential tier', value: currentUser ? `${currentUser.role.toUpperCase()} LEVEL` : 'N/A' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      
      {/* LEFT COLUMN - CONFIGS */}
      <div className="space-y-6">
        
        {/* GENERAL PLATFORM OPT */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">General Configurations</h3>
          
          {/* Option Toggle */}
          <div className="flex justify-between items-center py-2.5 border-b border-[#252a3d]">
            <div>
              <div className="text-xs font-bold text-white">Auto-Approve Relocations</div>
              <p className="text-[11px] text-[#555e84] mt-0.5">Relocations by managers bypass administrative check</p>
            </div>
            <button
              onClick={() => handleToggle('autoApprove')}
              className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.autoApprove ? 'bg-[#4f8ef7]' : 'bg-[#252a3d]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoApprove ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8b92b8]">Company Label name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={e => handleTextChange('companyName', e.target.value)}
                className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">System Currency code</label>
                <select
                  value={settings.currency}
                  onChange={e => handleTextChange('currency', e.target.value)}
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="SAR">Saudi Riyal (SAR)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8b92b8]">Distance Metric units</label>
                <select
                  value={settings.distUnit}
                  onChange={e => handleTextChange('distUnit', e.target.value)}
                  className="w-full bg-[#181c29] border border-[#252a3d] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="mi">Miles (mi)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS PIPELINES */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Alerts & System Emails</h3>
          
          <div className="flex justify-between items-center py-2.5 border-b border-[#252a3d]">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg bg-[#4f8ef7]/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#7aaeff]" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Consolidated Emails</div>
                <p className="text-[11px] text-[#555e84]">Dispatch weekly compliance logs</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailAlerts')}
              className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.emailAlerts ? 'bg-[#4f8ef7]' : 'bg-[#252a3d]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.emailAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex justify-between items-center py-2.5">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg bg-[#9b59b6]/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Emergency SMS Pings</div>
                <p className="text-[11px] text-[#555e84]">Critical wear warnings direct to mobile</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('smsAlerts')}
              className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.smsAlerts ? 'bg-[#4f8ef7]' : 'bg-[#252a3d]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.smsAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN - METADATA & WIPE */}
      <div className="space-y-6">
        
        {/* PLATFORM PARAMETERS */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Metadata</h3>
          
          <div className="divide-y divide-[#252a3d] text-xs">
            {systemStats.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5">
                <span className="text-[#8b92b8] font-medium">{item.label}</span>
                <span className="text-white font-mono font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ENTERPRISE DATA EXPORT SYSTEM */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#7aaeff] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Corporate Data Export Station
            </h3>
            <p className="text-xs text-[#8b92b8] mt-1 leading-relaxed">
              Securely download structured fleet registers, historical compliance reports, active driver logs, and complete operational backups.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={exportJSONBackup}
              className="w-full bg-[#1e2330] hover:bg-[#252b3d] border border-[#252a3d] text-[#e2e5f3] py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-[#7aaeff]" />
              Export Full Database Backup (.JSON)
            </button>

            <div className="border-t border-[#252a3d] pt-3">
              <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider block mb-2">Export Specific Registers (CSV)</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportVehicles}
                  className="bg-[#181c29] hover:bg-[#1f2435] border border-[#252a3d] text-white py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Vehicles Register
                </button>
                <button
                  onClick={exportDrivers}
                  className="bg-[#181c29] hover:bg-[#1f2435] border border-[#252a3d] text-white py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Drivers Register
                </button>
                <button
                  onClick={exportCostCenters}
                  className="bg-[#181c29] hover:bg-[#1f2435] border border-[#252a3d] text-white py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Cost Centers
                </button>
                <button
                  onClick={exportRelocations}
                  className="bg-[#181c29] hover:bg-[#1f2435] border border-[#252a3d] text-white py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Relocation Logs
                </button>
                <button
                  onClick={exportMaintenance}
                  className="bg-[#181c29] hover:bg-[#1f2435] border border-[#252a3d] text-white py-2 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Workshop Jobs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DOWNLOAD STANDALONE SINGLE-FILE VERSION */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#4f8ef7] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              SaaS Standalone Bundle
            </h3>
            <p className="text-xs text-[#8b92b8] mt-1 leading-relaxed">
              Export this entire web application as a single, self-contained HTML file. All operational views, driver portals, styling, and charts run completely offline or can be deployed to any cloud storage or web server.
            </p>
          </div>

          <a
            href="/index-single.html"
            download="fleet-ops-saas.html"
            className="w-full bg-gradient-to-r from-[#4f8ef7] to-[#7b5ea7] hover:from-[#7aaeff] hover:to-[#9b59b6] text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-[#4f8ef7]/10"
          >
            <ShieldCheck className="w-4 h-4" />
            Download Standalone index.html File
          </a>
        </div>

        {/* FACTORY WIPE */}
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#e74c3c] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Destructive Operations
            </h3>
            <p className="text-xs text-[#555e84] mt-1 leading-relaxed">
              Reset your corporate space. This removes custom operator profiles, service logs, relocation events, and resets workspace parameters to factory settings.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('⚠️ WARNING: This completely wipes out the database and restores the default mock seed. Proceed?')) {
                onResetData();
              }
            }}
            className="w-full bg-[#e74c3c]/10 hover:bg-[#e74c3c]/20 border border-[#e74c3c]/30 hover:border-[#e74c3c]/40 text-[#e74c3c] py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Wipe Platform Database & Restore default seed
          </button>
        </div>

      </div>

    </div>
  );
}
