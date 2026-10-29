import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Filter, CheckCircle, XCircle } from 'lucide-react';
import { auditApi } from '../services/api';
import { AuditEventItem } from '../types';

export const AuditExplorer: React.FC = () => {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [searchRxId, setSearchRxId] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getEvents(searchRxId || undefined);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType !== 'ALL' && ev.event_type !== filterType) return false;
    if (searchRxId && !ev.target_resource_id.includes(searchRxId)) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-teal-700" />
            <span>Hospital Audit & Compliance Explorer</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident regulatory audit trail tracking digital issuance, cryptographic verification, and dispensing history.
          </p>
        </div>
        <div className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Immutable Ledger Records
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchRxId}
            onChange={(e) => setSearchRxId(e.target.value)}
            placeholder="Search by Prescription UUID or Blockchain Tx ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-teal-600 outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:border-teal-600 outline-none"
          >
            <option value="ALL">All Lifecycle Events</option>
            <option value="ISSUANCE">Issuance</option>
            <option value="VERIFICATION">Verification</option>
            <option value="DISPENSE">Dispense</option>
            <option value="REVOCATION">Revocation</option>
            <option value="TAMPER_ATTEMPT">Tamper Rejections</option>
          </select>
        </div>
      </div>

      {/* Event Timeline Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold">
            <tr>
              <th className="px-6 py-4">Time (UTC)</th>
              <th className="px-6 py-4">Event Type</th>
              <th className="px-6 py-4">Resource Target</th>
              <th className="px-6 py-4">Actor / MSP</th>
              <th className="px-6 py-4">Blockchain Tx ID</th>
              <th className="px-6 py-4">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    ev.event_type === 'ISSUANCE' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                    ev.event_type === 'DISPENSE' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                    ev.event_type === 'TAMPER_ATTEMPT' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {ev.event_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-800 font-bold truncate max-w-[180px]">
                  {ev.target_resource_id}
                </td>
                <td className="px-6 py-4 text-slate-600 font-sans">
                  <div className="font-semibold text-slate-800">{ev.actor_id}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{ev.organization_id}</div>
                </td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-[140px]">
                  {ev.blockchain_tx_id || 'N/A (Off-Chain)'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 font-bold">
                    {ev.status === 'SUCCESS' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span className={ev.status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'}>
                      {ev.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
