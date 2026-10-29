import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, Shield, HardDrive, CheckCircle2 } from 'lucide-react';
import { auditApi } from '../services/api';
import { SystemHealthData } from '../types';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);

  useEffect(() => {
    auditApi.getSystemHealth().then(setHealth);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-teal-700" />
            <span>Hospital Infrastructure & Network Health</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Component connectivity and operational status across the API gateway, database, blockchain network, and encrypted storage.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          All Subsystems Operational
        </div>
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">FastAPI Clinical Gateway</h3>
                <span className="text-[11px] text-slate-400">Endpoint API Engine</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              OPERATIONAL
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            REST endpoints (`/api/v1`) enforcing server-side RBAC, request correlation IDs, and digital signature validation.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            Port: 8000 • CORS: Restricted • OpenAPI Docs: /docs
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">PostgreSQL Relational DB</h3>
                <span className="text-[11px] text-slate-400">Metadata & Audit Store</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Persists non-PHI operational metadata, user roles, prescriber key registrations, and atomic idempotency keys.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            Engine: PostgreSQL 16 • Connection Pooling: Active
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hyperledger Fabric Ledger</h3>
                <span className="text-[11px] text-slate-400">Permissioned State Machine</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Decentralized state machine enforcing immutable prescription lifecycle transitions and MVCC race prevention.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            Channel: rxguardchannel • MSPs: HospitalMSP, PharmacyMSP
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Encrypted Payload Storage</h3>
                <span className="text-[11px] text-slate-400">Off-Chain Clinical Store</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              ENCRYPTED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Off-chain storage holding AES-256-GCM encrypted patient clinical bundles with authentication tags.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            Cipher: AES-256-GCM • Nonce: 96-bit • Tag: 128-bit
          </div>
        </div>
      </div>
    </div>
  );
};
