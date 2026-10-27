import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Pill, 
  Building2, 
  Calendar, 
  ShieldAlert, 
  ArrowRight,
  ShieldCheck,
  Check,
  ClipboardPaste,
  Sparkles
} from 'lucide-react';
import { pharmacyApi } from '../services/api';
import { VerifiedPrescription, DispenseResult, UserProfile } from '../types';

interface PharmacyWorkspaceProps {
  initialToken?: string;
  currentUser?: UserProfile | null;
}

export const PharmacyWorkspace: React.FC<PharmacyWorkspaceProps> = ({ initialToken, currentUser }) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRx, setVerifiedRx] = useState<VerifiedPrescription | null>(null);
  const [tamperError, setTamperError] = useState<string | null>(null);
  const [latestCachedToken, setLatestCachedToken] = useState<string | null>(null);

  // Dispense State
  const [dispenseQty, setDispenseQty] = useState(15);
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseResult, setDispenseResult] = useState<DispenseResult | null>(null);

  useEffect(() => {
    // Check if a prescription was recently issued in Doctor Workspace
    const cached = localStorage.getItem('rxguard_latest_token');
    if (cached) {
      setLatestCachedToken(cached);
    }
  }, []);

  const handleVerify = async (tokenToVerify?: string) => {
    const target = (tokenToVerify !== undefined ? tokenToVerify : tokenInput).trim();
    if (!target) {
      setTamperError("Please enter, paste, or scan a Prescription QR Token before verifying authenticity.");
      setVerifiedRx(null);
      return;
    }

    setIsVerifying(true);
    setTamperError(null);
    setDispenseResult(null);

    try {
      const data = await pharmacyApi.verify(target);
      setVerifiedRx(data);
    } catch (err: any) {
      setVerifiedRx(null);
      setTamperError(err.message || 'Verification rejected: Invalid token.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        handleVerify(text.trim());
      }
    } catch {
      alert('Clipboard access denied or empty. Please paste manually into the input box.');
    }
  };

  const handleUseLatest = (token: string) => {
    setTokenInput(token);
    handleVerify(token);
  };

  const handleDispense = async () => {
    if (!verifiedRx) return;
    setIsDispensing(true);
    const idempKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    try {
      const res = await pharmacyApi.dispense(verifiedRx.prescription_id, dispenseQty, idempKey);
      setDispenseResult(res);
      setVerifiedRx({
        ...verifiedRx,
        remaining_quantity: res.remaining_quantity,
        status: res.status
      });
    } catch (err: any) {
      alert('Dispense failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Pill className="w-6 h-6 text-teal-700" />
            <span>Pharmacy Verification & Dispensary</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authenticate prescription QR tokens, verify doctor signatures against HospitalMSP, and commit atomic dispensing.
          </p>
        </div>
        <div className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Dispensary: {currentUser?.name || 'Marcus Vance, PharmD'} ({currentUser?.organization_name || 'CareFirst Pharmacy Network'})
        </div>
      </div>

      {/* Role Scope Notice */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-900">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-teal-700/20">
            <Pill className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">Pharmacy Dispensary Counter</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                PharmacyMSP • {currentUser?.name || 'Marcus Vance, PharmD'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized to verify patient QR tokens, execute blockchain cryptographic audits, and dispense medications.
            </p>
          </div>
        </div>
        <div className="sm:text-right text-left flex-shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-teal-200/70 sm:pl-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Security Invariant</span>
          <span className="text-xs font-semibold text-rose-700">Pharmacists cannot prescribe</span>
        </div>
      </div>

      {/* Quick Auto-Fill Banner if a prescription was recently issued */}
      {latestCachedToken && latestCachedToken !== tokenInput && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Recently Issued Prescription Ready: <strong>{latestCachedToken}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => handleUseLatest(latestCachedToken)}
            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] transition-all shadow-sm shadow-teal-700/20"
          >
            Auto-Fill & Verify Now
          </button>
        </div>
      )}

      {/* QR / Token Verification Search Bar */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Scan QR or enter verification token (e.g. RXG-7F8B9E12-TOKEN)"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none font-mono"
            />
          </div>

          {/* Paste from Clipboard Button */}
          <button
            type="button"
            onClick={handlePasteClipboard}
            title="Paste from clipboard"
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <ClipboardPaste className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-teal-700/20 disabled:opacity-50"
          >
            <QrCode className="w-4 h-4" />
            <span>{isVerifying ? 'Checking Ledger...' : 'Verify Authenticity'}</span>
          </button>
        </form>
      </div>

      {/* Tamper & Invalid Key Rejection Notice */}
      {tamperError && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-800 shadow-sm animate-in fade-in duration-200">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-2">
                <span>Verification Rejection / Token Error</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  DISPENSE LOCKED
                </span>
              </h4>
            </div>
            <p className="text-xs text-rose-800 bg-white/80 p-3 rounded-xl border border-rose-200/80 font-mono leading-relaxed">
              {tamperError}
            </p>
            <p className="text-[11px] text-slate-500">
              Prescription verification requires an authentic QR verification token generated by an authorized physician. If you do not have a token, switch to Dr. Sarah's portal, issue a prescription, and copy its verification token.
            </p>
          </div>
        </div>
      )}

      {/* Verified Prescription Outcome */}
      {verifiedRx && (
        <div className="space-y-6">
          {/* Authenticity Badge */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-950">Cryptographic Authenticity Verified</div>
                <div className="text-xs text-emerald-700 font-medium">Payload hash matches ledger anchor • Doctor signature valid • Not revoked</div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-emerald-800 text-xs font-mono font-bold border border-emerald-200 shadow-sm">
              STATUS: {verifiedRx.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Issuer & Authority */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prescribing Authority</div>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                <Building2 className="w-4 h-4 text-teal-700" />
                <span>{verifiedRx.issuer.hospital_org}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Doctor: {verifiedRx.issuer.prescriber_id}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Key ID: {verifiedRx.issuer.key_id}
              </div>
            </div>

            {/* Expiry & Lifecycle */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Validity Period</div>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>Expires: {new Date(verifiedRx.expires_at).toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Active & Unexpired</span>
              </div>
            </div>

            {/* Dispensable Balance Meter */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remaining Balance</div>
              <div className="text-2xl font-extrabold font-mono text-slate-900">
                {verifiedRx.remaining_quantity} <span className="text-xs font-semibold text-slate-400">/ {verifiedRx.total_quantity} units</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-teal-700 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(verifiedRx.remaining_quantity / verifiedRx.total_quantity) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Prescribed Medications */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-700" />
              <span>Authorized Medication Details</span>
            </h3>

            <div className="space-y-3">
              {verifiedRx.medications.map((med, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{med.medication_name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{med.frequency}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">NDC: {med.medication_code}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-teal-800">{med.quantity} Units Total</div>
                    <div className="text-xs text-slate-500">{med.dosage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atomic Dispense Action Panel */}
          {verifiedRx.remaining_quantity > 0 && verifiedRx.status !== 'REVOKED' ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Execute Atomic Dispense</h3>
                <p className="text-xs text-slate-500">Decrements remaining quantity on the Hyperledger Fabric ledger atomically.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Units to Dispense</label>
                  <input
                    type="number"
                    min="1"
                    max={verifiedRx.remaining_quantity}
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(Math.min(verifiedRx.remaining_quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDispense}
                    disabled={isDispensing}
                    className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-teal-700/20 disabled:opacity-50"
                  >
                    <span>{isDispensing ? 'Committing to Ledger...' : 'Commit Dispense Operation'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-medium">
              Prescription is fully dispensed or inactive. Further dispensing is locked by smart contract policy.
            </div>
          )}

          {/* Dispense Success Receipt */}
          {dispenseResult && (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>Dispense Operation Successfully Committed to Blockchain</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-slate-700">
                <div>DISPENSE ID: <span className="text-slate-900 font-bold">{dispenseResult.dispense_id}</span></div>
                <div>UNITS DISPENSED: <span className="text-teal-800 font-bold">{dispenseResult.dispensed_quantity}</span></div>
                <div>REMAINING BALANCE: <span className="text-slate-900 font-bold">{dispenseResult.remaining_quantity}</span></div>
                <div>TRANSACTION ID: <span className="text-slate-600 break-all">{dispenseResult.blockchain_tx_id}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
