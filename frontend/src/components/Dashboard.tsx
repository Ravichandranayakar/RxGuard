import React from 'react';
import { 
  FileCheck2, 
  ShieldCheck, 
  Pill, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  Layers,
  HeartPulse
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const metrics = [
    { label: 'Total Registered Prescriptions', value: '1,428', icon: FileCheck2, change: '+12% this week', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
    { label: 'Authenticity Checks Completed', value: '3,892', icon: ShieldCheck, change: '100% cryptographic match', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100' },
    { label: 'Atomic Dispense Operations', value: '2,104', icon: Pill, change: 'Zero double-dispense events', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Tamper Incidents Blocked', value: '14', icon: ShieldAlert, change: 'Forged payloads rejected', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-teal-700" />
            <span>Hospital Security & Verification Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring across Metro General Hospital (HospitalMSP) and CareFirst Retail Pharmacy network.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
          <CheckCircle2 className="w-4 h-4 text-teal-700" />
          <span>HIPAA & On-Chain Audit Compliant</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-hospital-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{m.label}</span>
                <div className={`w-9 h-9 rounded-xl ${m.bg} ${m.border} border flex items-center justify-center ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{m.value}</div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>{m.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical Trust Architecture */}
      <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-700" />
              <span>Active Cryptographic & Privacy Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise security invariants governing patient health records and ledger consensus.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            ENFORCED ON-CHAIN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Cpu className="w-4 h-4 text-teal-700" />
              <span>PHYSICIAN SIGNATURES</span>
            </div>
            <div className="text-teal-800 font-bold font-mono text-sm">ECDSA (SECP256R1)</div>
            <p className="text-slate-600 leading-relaxed">
              Every prescription is digitally signed on a canonical JSON payload using the doctor’s registered private key.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Lock className="w-4 h-4 text-sky-700" />
              <span>OFF-CHAIN PRIVACY (PHI)</span>
            </div>
            <div className="text-sky-800 font-bold font-mono text-sm">AES-256-GCM Authenticated</div>
            <p className="text-slate-600 leading-relaxed">
              Sensitive diagnosis and dosage details are never published to the blockchain. Encrypted with 96-bit unique nonces.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>DOUBLE-DISPENSE LOCK</span>
            </div>
            <div className="text-emerald-800 font-bold font-mono text-sm">MVCC Atomic Balance Engine</div>
            <p className="text-slate-600 leading-relaxed">
              Smart contract verifies remaining balance atomically. Multi-version concurrency control blocks simultaneous claims.
            </p>
          </div>
        </div>
      </div>

      {/* Role Architecture & Separation of Duties (Academic & Regulatory Highlight) */}
      <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <span>Healthcare Role-Based Access Control (RBAC) Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict separation between Prescribing Authority (HospitalMSP) and Dispensing Authority (PharmacyMSP).
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            REGULATORY INVARIANT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Doctor Sarah Role Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-teal-50/50 to-white border border-teal-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span>Dr. Sarah Smith, MD (Physician)</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                HospitalMSP
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              <strong>Allowed Functions:</strong> Enters patient demographics, clinical diagnosis, and prescribed drug regimen. Authorizes and digitally signs with ECDSA private key.
            </p>
            <div className="p-2.5 rounded-lg bg-white border border-teal-100 text-[11px] text-teal-900 font-medium">
              ⛔ <strong>Strict Restriction:</strong> Physicians CANNOT dispense physical medications or alter inventory balances.
            </div>
          </div>

          {/* Marcus Vance Role Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-sky-50/50 to-white border border-sky-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-700 text-white flex items-center justify-center text-xs font-bold">2</span>
                <span>Marcus Vance, PharmD (Pharmacist)</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
                PharmacyMSP
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              <strong>Allowed Functions:</strong> Scans patient QR verification pass, executes blockchain cryptographic tamper checks, inspects balance, and commits atomic dispensing.
            </p>
            <div className="p-2.5 rounded-lg bg-white border border-sky-100 text-[11px] text-sky-900 font-medium">
              ⛔ <strong>Strict Restriction:</strong> Pharmacists CANNOT create prescriptions, enter patient diagnosis, or sign medical orders.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
