import React, { useState, useMemo } from 'react';
import { Search, Download, Mail, Printer, AlertTriangle, ArrowUpDown, RefreshCw, Eye } from 'lucide-react';
import { CylinderExchangeRecord } from '../types';
import elthamLogo from '../assets/images/elthamlogo18.png';

interface HistoryDrawerProps {
  exchanges: CylinderExchangeRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewHtmlPreview: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  exchanges,
  isLoading,
  onRefresh,
  onViewHtmlPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return exchanges;
    const q = searchTerm.toLowerCase().trim();
    return exchanges.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.brigadeName.toLowerCase().includes(q) ||
        (e.firefighterName && e.firefighterName.toLowerCase().includes(q)) ||
        (e.vehicleCallSign && e.vehicleCallSign.toLowerCase().includes(q))
    );
  }, [exchanges, searchTerm]);

  // Aggregate stats
  const totalDropped = exchanges.reduce((acc, cur) => acc + (cur.droppedOffCount || 0), 0);
  const totalCollected = exchanges.reduce((acc, cur) => acc + (cur.collectedCount || 0), 0);
  const netDepotShift = totalDropped - totalCollected;

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Receipt ID',
      'Timestamp',
      'Brigade',
      'District',
      'Dropped Off',
      'Collected',
      'Firefighter',
      'Vehicle',
      'Defect Reported',
      'Defect Details',
      'Recipient Email',
      'Status',
    ];

    const rows = filtered.map((e) => [
      e.id,
      e.timestamp,
      `"${e.brigadeName}"`,
      `"${e.brigadeDistrict || ''}"`,
      e.droppedOffCount,
      e.collectedCount,
      `"${e.firefighterName || ''}"`,
      `"${e.vehicleCallSign || ''}"`,
      e.defectReported ? 'YES' : 'NO',
      `"${(e.defectNotes || '').replace(/"/g, '""')}"`,
      e.recipientEmail,
      e.emailStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CFA_BA_Exchanges_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-16 rounded-xl bg-white p-1 ring-2 ring-red-500/50 shrink-0 flex items-center justify-center">
            <img
              src={elthamLogo}
              alt="Eltham Fire Brigade"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Cylinder Exchange History & Audit Log
            </h2>
            <p className="text-xs text-slate-400">
              Complete operational record of BA cylinder check-ins, check-outs, and email receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Returned (Used)
          </span>
          <span className="text-3xl font-black text-rose-600 tabular-nums mt-1 block">
            {totalDropped}
          </span>
          <span className="text-[11px] text-slate-400">Cylinders logged in for refill</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Drawn (Full)
          </span>
          <span className="text-3xl font-black text-emerald-600 tabular-nums mt-1 block">
            {totalCollected}
          </span>
          <span className="text-[11px] text-slate-400">Cylinders taken by brigades</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Depot Stock Shift
          </span>
          <span
            className={`text-3xl font-black tabular-nums mt-1 block ${
              netDepotShift >= 0 ? 'text-slate-900' : 'text-amber-600'
            }`}
          >
            {netDepotShift >= 0 ? `+${netDepotShift}` : netDepotShift}
          </span>
          <span className="text-[11px] text-slate-400">Net in depot cache</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by brigade name, crew name, or receipt ID..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 shadow-2xs"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-base">No exchange records found.</p>
            <p className="text-xs text-slate-400 mt-1">
              New transactions logged on the kiosk will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt / Date</th>
                  <th className="py-3 px-4">Brigade</th>
                  <th className="py-3 px-4 text-center">In (Drop)</th>
                  <th className="py-3 px-4 text-center">Out (Full)</th>
                  <th className="py-3 px-4">Crew / Call Sign</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-xs text-slate-900">{e.id}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(e.timestamp).toLocaleDateString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{e.brigadeName}</div>
                      {e.brigadeDistrict && (
                        <div className="text-xs text-slate-500">{e.brigadeDistrict}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md text-sm tabular-nums">
                        {e.droppedOffCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-sm tabular-nums">
                        {e.collectedCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      <div>{e.firefighterName || '—'}</div>
                      {e.vehicleCallSign && (
                        <span className="text-slate-500 text-[11px]">{e.vehicleCallSign}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Emailed
                        </span>
                        {e.defectReported && (
                          <span title="Defect reported" className="text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {e.recipientEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewHtmlPreview(e.id)}
                        title="View formatted HTML email receipt"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
