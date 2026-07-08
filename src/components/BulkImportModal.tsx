import React, { useState } from 'react';
import { Download, FileSpreadsheet, ShieldAlert } from 'lucide-react';

interface BulkImportModalProps {
  onClose: () => void;
  onImport: (type: 'vehicles' | 'costcenters' | 'drivers', data: any[]) => void;
  costCenters: { id: number; name: string; code: string }[];
}

export default function BulkImportModal({
  onClose,
  onImport,
  costCenters
}: BulkImportModalProps) {
  const [bulkType, setBulkType] = useState<'vehicles' | 'costcenters' | 'drivers'>('vehicles');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const matchRequiredError = (missing: string[], headers: string[]) => {
    if (headers.length === 0) return true;
    return missing.length > 0;
  };

  const handleParse = (text: string) => {
    setCsvText(text);
    if (!text.trim()) {
      setParsedRows([]);
      setErrors([]);
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setErrors(['CSV must include a header line and at least one item row.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
    
    // Check required headers
    const reqs = bulkType === 'vehicles' ? ['make', 'model', 'plate', 'fleet'] :
                 bulkType === 'costcenters' ? ['name', 'code'] : ['name', 'license'];
    
    const missing = reqs.filter(r => !headers.includes(r));
    if (matchRequiredError(missing, headers)) {
      setErrors([`Missing required headers: ${reqs.join(', ')}. Header row detected: ${lines[0]}`]);
      setParsedRows([]);
      return;
    }

    const parsed: any[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const item: any = {};
      headers.forEach((h, index) => {
        item[h] = columns[index] || '';
      });

      // validation check
      reqs.forEach(req => {
        if (!item[req]) {
          errs.push(`Row ${i + 1}: "${req}" cannot be blank`);
        }
      });

      parsed.push(item);
    }

    setErrors(errs);
    setParsedRows(parsed);
  };

  const downloadTemplateFile = () => {
    const templates = {
      vehicles: 'make,model,year,plate,fleet,vin,type,fuel,status,mileage,notes\nToyota,Hilux,2023,XYZ-001,FL-010,VIN9012,truck,diesel,available,45000,Overhaul done\nNissan,Navara,2022,XYZ-002,FL-011,,truck,gasoline,available,65000,',
      costcenters: 'name,code,desc,budget,spent,active\nOperations West,OPS-W,Western regional hub,60000,0,true\nMarketing Fleet,MKT-F,Sales and marketing reps,25000,1200,true',
      drivers: 'name,license,phone,email,status,joinDate\nKhalil Ibrahim,DL-88123,+966-50-999-8811,khalid@company.sa,active,2024-03-01'
    };
    const csv = templates[bulkType];
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fleet_ops_${bulkType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePasteSample = () => {
    const samples = {
      vehicles: 'make,model,year,plate,fleet,type,fuel,status,mileage\nToyota,Hilux,2023,XYZ-001,FL-010,truck,diesel,available,42000\nFord,Ranger,2022,XYZ-002,FL-011,truck,gasoline,in_use,53000\nHyundai,Elantra,2024,XYZ-003,FL-012,car,gasoline,available,1500',
      costcenters: 'name,code,desc,budget,spent\nOperations East,OPS-E,Eastern regional center,55000,12000\nSales Hub Riyadh,SLS-RYD,Capital sales vehicles,45000,3200',
      drivers: 'name,license,phone,email,status\nSaeed Al-Ghamdi,DL-90823,+966-55-900-1122,saeed@company.sa,active\nYasmin Riyadh,DL-88124,+966-56-112-2334,yasmin@company.sa,active'
    };
    setCsvText(samples[bulkType]);
    handleParse(samples[bulkType]);
  };

  const handleImportSubmit = () => {
    if (parsedRows.length === 0 || errors.length > 0) return;
    onImport(bulkType, parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0d14]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl my-8">
        <div className="flex justify-between items-center mb-5 border-b border-[#252a3d] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#f39c12]" />
            Bulk CSV System Parser
          </h3>
          <button onClick={onClose} className="text-[#8b92b8] hover:text-white">✕</button>
        </div>

        {/* BULK TABS */}
        <div className="flex bg-[#181c29] border border-[#252a3d] rounded-lg p-1 mb-5">
          {(['vehicles', 'costcenters', 'drivers'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setBulkType(type); setCsvText(''); setParsedRows([]); setErrors([]); }}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded transition capitalize ${bulkType === type ? 'bg-[#f39c12] text-white' : 'text-[#8b92b8] hover:text-white'}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="text-[11px] text-[#8b92b8] leading-relaxed">
              Required headers: <strong className="text-white">
                {bulkType === 'vehicles' ? 'make, model, plate, fleet' :
                 bulkType === 'costcenters' ? 'name, code' : 'name, license'}
              </strong>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={downloadTemplateFile}
                className="text-[11px] font-bold text-white bg-transparent border border-[#252a3d] hover:bg-[#181c29] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Template CSV
              </button>
              <button 
                onClick={handlePasteSample}
                className="text-[11px] font-bold text-[#f39c12] bg-[#f39c12]/10 border border-[#f39c12]/20 hover:bg-[#f39c12]/20 px-3 py-1.5 rounded-lg transition"
              >
                Paste Mock CSV
              </button>
            </div>
          </div>

          {/* PASTE FIELD */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8b92b8]">Paste raw CSV spreadsheet payload:</label>
            <textarea
              value={csvText}
              onChange={e => handleParse(e.target.value)}
              placeholder="make,model,year,plate,fleet&#10;Toyota,Hilux,2023,XYZ-001,FL-010&#10;Nissan,Navara,2022,XYZ-002,FL-011"
              className="w-full h-36 bg-[#181c29] border border-[#252a3d] rounded-xl p-3 text-xs text-[#e2e5f3] placeholder-[#555e84] font-mono leading-relaxed focus:outline-none focus:border-[#f39c12]"
            />
          </div>

          {/* ERROR BOARD */}
          {errors.length > 0 && (
            <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/20 p-3 rounded-lg flex gap-2 items-start text-xs text-[#e74c3c]">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Parsing / validation issue:</span>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {errors.slice(0, 3).map((err, idx) => <li key={idx}>{err}</li>)}
                  {errors.length > 3 && <li>... and {errors.length - 3} more errors</li>}
                </ul>
              </div>
            </div>
          )}

          {/* SUCCESS STATUS BOARD */}
          {parsedRows.length > 0 && errors.length === 0 && (
            <div className="bg-[#2ecc71]/10 border border-[#2ecc71]/20 p-3 rounded-lg flex gap-2 items-center text-xs text-[#2ecc71] font-medium">
              <span className="text-base">✓</span>
              <span>Successfully parsed <strong>{parsedRows.length}</strong> items! Click "Import payload" below.</span>
            </div>
          )}

          {/* PREVIEW OF VALUES */}
          {parsedRows.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8b92b8]">Parsed Spreadsheet Preview (First 3 rows):</label>
              <div className="overflow-x-auto border border-[#252a3d] rounded-lg bg-[#181c29]/50">
                <table className="w-full text-left border-collapse text-[11px] text-[#8b92b8]">
                  <thead>
                    <tr className="border-b border-[#252a3d] bg-[#181c29]">
                      {Object.keys(parsedRows[0]).map(k => <th key={k} className="p-2 font-bold text-[#555e84] capitalize">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252a3d]">
                    {parsedRows.slice(0, 3).map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val: any, j) => <td key={j} className="p-2 font-mono text-white max-w-[120px] truncate">{String(val)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYSTEM BUTTON ACTIONS */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#252a3d] mt-5">
            <button
              onClick={onClose}
              className="bg-[#1f2335] hover:bg-[#252a3d] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={parsedRows.length === 0 || errors.length > 0}
              className={`text-xs font-bold px-5 py-2 rounded-xl transition ${parsedRows.length === 0 || errors.length > 0 ? 'bg-white/5 border border-transparent text-[#555e84] cursor-not-allowed' : 'bg-[#f39c12] hover:bg-amber-500 text-white shadow-lg'}`}
            >
              Import {parsedRows.length > 0 ? `${parsedRows.length} ` : ''}Payload items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
