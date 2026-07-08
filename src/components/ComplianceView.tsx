import React, { useState } from 'react';
import { Vehicle, Driver } from '../types';
import { ShieldCheck, Calendar, Search, AlertCircle, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface ComplianceViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  onRenewDocument: (vehicleId: number, type: 'insurance' | 'registration' | 'inspection', newDate: string) => void;
  userRole: 'admin' | 'manager' | 'viewer';
}

export default function ComplianceView({
  vehicles,
  drivers,
  onRenewDocument,
  userRole
}: ComplianceViewProps) {
  const [filter, setFilter] = useState<'all' | 'soon' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const getDaysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusNode = (dateStr: string) => {
    const days = getDaysUntil(dateStr);
    if (days === null) return <span className="text-[10px] text-[#555e84]">Unknown</span>;
    if (days < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#e74c3c]/10 text-[#e74c3c] px-2 py-0.5 rounded font-mono">
          EXPIRED ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#f39c12]/10 text-[#f39c12] px-2 py-0.5 rounded font-mono">
          SOON ({days}d left)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#2ecc71]/10 text-[#2ecc71] px-2 py-0.5 rounded font-mono">
        VALID
      </span>
    );
  };

  const getDriverLabel = (id: number | null) => {
    if (id === null) return 'Unassigned';
    return drivers.find(d => d.id === id)?.name || 'Unknown';
  };

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    const d1 = getDaysUntil(v.docs.insurance);
    const d2 = getDaysUntil(v.docs.registration);
    const d3 = getDaysUntil(v.docs.inspection);

    const hasExpired = (d1 !== null && d1 < 0) || (d2 !== null && d2 < 0) || (d3 !== null && d3 < 0);
    const hasSoon = (d1 !== null && d1 >= 0 && d1 <= 30) || (d2 !== null && d2 >= 0 && d2 <= 30) || (d3 !== null && d3 >= 0 && d3 <= 30);

    if (filter === 'expired' && !hasExpired) return false;
    if (filter === 'soon' && !hasSoon) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${v.make} ${v.model} ${v.plate} ${v.fleet}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const handleRenew = (vId: number, type: 'insurance' | 'registration' | 'inspection', currentVal: string) => {
    const currentYear = new Date(currentVal).getFullYear();
    const plusOneYear = new Date(currentVal);
    plusOneYear.setFullYear(currentYear + 1);
    const dateSuggestion = plusOneYear.toISOString().split('T')[0];

    const input = prompt(`Renew ${type.toUpperCase()} for 1 Year? Please confirm new expiry target date:`, dateSuggestion);
    if (input) {
      onRenewDocument(vId, type, input);
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
          <input 
            type="text" 
            placeholder="Search license plate, fleet code, brand class..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#e2e5f3] placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setFilter('all')}
            className={`text-xs px-3.5 py-1.5 rounded-lg border transition ${filter === 'all' ? 'bg-[#4f8ef7]/15 border-[#4f8ef7] text-[#7aaeff] font-bold' : 'bg-[#181c29] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
          >
            All Papers
          </button>
          <button 
            onClick={() => setFilter('soon')}
            className={`text-xs px-3.5 py-1.5 rounded-lg border transition ${filter === 'soon' ? 'bg-[#f39c12]/15 border-[#f39c12] text-[#f39c12] font-bold' : 'bg-[#181c29] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
          >
            Expiring Soon (30d)
          </button>
          <button 
            onClick={() => setFilter('expired')}
            className={`text-xs px-3.5 py-1.5 rounded-lg border transition ${filter === 'expired' ? 'bg-[#e74c3c]/15 border-[#e74c3c] text-[#e74c3c] font-bold' : 'bg-[#181c29] border-[#252a3d] text-[#8b92b8] hover:border-[#313757]'}`}
          >
            Expired Overdue
          </button>
        </div>
      </div>

      {/* COMPLIANCE SHEET TABLE */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-16 text-center text-[#8b92b8]">
          <ShieldCheck className="w-12 h-12 text-[#2ecc71] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white">All Documents Compliant</h3>
          <p className="text-xs text-[#555e84] mt-1">No registration alerts for the selected criteria.</p>
        </div>
      ) : (
        <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#252a3d] bg-[#181c29]">
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Fleet Vehicle / operator</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Plate Number</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Insurance Policy</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Registration (Istimara)</th>
                  <th className="p-4 font-bold text-[#555e84] uppercase tracking-wider">Periodic test (MVPI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252a3d]">
                {filteredVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-[#181c29]/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{v.make} {v.model} <strong className="font-mono text-[10px] text-[#555e84] ml-1 bg-white/5 px-1.5 py-0.5 rounded">{v.fleet}</strong></div>
                      <span className="text-[10px] text-[#8b92b8] mt-1 inline-block">Driver: <strong className="text-white font-semibold">{getDriverLabel(v.driverId)}</strong></span>
                    </td>
                    <td className="p-4 text-white font-semibold font-mono text-xs">{v.plate}</td>
                    
                    {/* Insurance Expiry */}
                    <td className="p-4">
                      <div className="font-mono font-medium text-white mb-1.5">{v.docs.insurance}</div>
                      {getStatusNode(v.docs.insurance)}
                      {canEdit && (
                        <button 
                          onClick={() => handleRenew(v.id, 'insurance', v.docs.insurance)}
                          className="text-[9px] hover:text-[#4f8ef7] text-[#555e84] font-bold uppercase tracking-wider hover:underline ml-2 block mt-1"
                        >
                          Renew +1y
                        </button>
                      )}
                    </td>

                    {/* Registration Expiry */}
                    <td className="p-4">
                      <div className="font-mono font-medium text-white mb-1.5">{v.docs.registration}</div>
                      {getStatusNode(v.docs.registration)}
                      {canEdit && (
                        <button 
                          onClick={() => handleRenew(v.id, 'registration', v.docs.registration)}
                          className="text-[9px] hover:text-[#4f8ef7] text-[#555e84] font-bold uppercase tracking-wider hover:underline ml-2 block mt-1"
                        >
                          Renew +1y
                        </button>
                      )}
                    </td>

                    {/* Inspection Expiry */}
                    <td className="p-4">
                      <div className="font-mono font-medium text-white mb-1.5">{v.docs.inspection}</div>
                      {getStatusNode(v.docs.inspection)}
                      {canEdit && (
                        <button 
                          onClick={() => handleRenew(v.id, 'inspection', v.docs.inspection)}
                          className="text-[9px] hover:text-[#4f8ef7] text-[#555e84] font-bold uppercase tracking-wider hover:underline ml-2 block mt-1"
                        >
                          Renew +1y
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
