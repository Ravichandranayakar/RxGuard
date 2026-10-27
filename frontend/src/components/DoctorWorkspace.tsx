import React, { useState } from 'react';
import { 
  FilePlus, 
  Trash2, 
  KeyRound, 
  CheckCircle, 
  QrCode, 
  Stethoscope, 
  Send,
  Pill,
  Copy,
  Check,
  Download,
  ArrowRight
} from 'lucide-react';
import { prescriptionApi } from '../services/api';
import { generateQRCodeSVG, downloadPrescriptionPass } from '../utils/qrHelper';
import { UserProfile } from '../types';

interface DoctorWorkspaceProps {
  currentUser?: UserProfile | null;
  onSendToPharmacy?: (token: string) => void;
}

export const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ currentUser, onSendToPharmacy }) => {
  const [patientRef, setPatientRef] = useState('PAT-88412');
  const [patientName, setPatientName] = useState('Jane Doe');
  const [patientDob, setPatientDob] = useState('1988-04-12');
  const [expiryDays, setExpiryDays] = useState(30);
  const [allowPartial, setAllowPartial] = useState(true);

  const [items, setItems] = useState([
    {
      medication_code: 'NDC-0069-4200',
      medication_name: 'Amoxicillin 500mg',
      quantity: 30,
      dosage: '500mg Oral Capsule',
      frequency: 'Take 1 capsule three times daily with meals for 10 days',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedRx, setIssuedRx] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medication_code: 'NDC-0173-0682',
        medication_name: 'Ventolin HFA (Albuterol Inhaler)',
        quantity: 1,
        dosage: '90mcg/actuation',
        frequency: 'Inhale 2 puffs every 4 to 6 hours as needed for bronchospasm',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const totalQty = items.reduce((acc, curr) => acc + curr.quantity, 0);
      const payload = {
        patient_reference_id: patientRef,
        patient_name: patientName,
        patient_dob: patientDob,
        expires_in_days: expiryDays,
        total_authorized_quantity: totalQty,
        allow_partial_dispense: allowPartial,
        items,
      };
      const res = await prescriptionApi.create(payload);
      setIssuedRx(res);
      // Automatically cache latest issued token in localStorage for quick pharmacy lookup
      localStorage.setItem('rxguard_latest_token', res.qr_verification_token);
      localStorage.setItem('rxguard_latest_rx_id', res.prescription_id);
    } catch (err: any) {
      alert('Failed to issue prescription: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!issuedRx) return;
    navigator.clipboard.writeText(issuedRx.qr_verification_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPass = () => {
    if (!issuedRx) return;
    downloadPrescriptionPass(
      issuedRx.prescription_id,
      issuedRx.qr_verification_token,
      'Dr. Sarah Smith, MD'
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-6 h-6 text-teal-700" />
            <span>Physician Prescription Workspace</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Issue, digitally sign, and register verifiable electronic prescriptions to the hospital blockchain ledger.
          </p>
        </div>
        <div className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Signer: {currentUser?.name || 'Dr. Sarah Smith, MD'} ({currentUser?.organization_name || 'Metro General Hospital'})
        </div>
      </div>

      {/* Role Scope Notice */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-900">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-teal-700/20">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">Physician Prescribing Workstation</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                HospitalMSP • {currentUser?.name || 'Dr. Sarah Smith, MD'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized to diagnose patients, prescribe medication dosages, and generate digitally signed QR passes.
            </p>
          </div>
        </div>
        <div className="sm:text-right text-left flex-shrink-0 pt-2 sm:pt-0 sm:border-l sm:border-teal-200/70 sm:pl-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Security Invariant</span>
          <span className="text-xs font-semibold text-rose-700">Physicians cannot dispense</span>
        </div>
      </div>

      {issuedRx ? (
        /* Success Prescription Receipt & Downloadable Pass */
        <div className="p-8 rounded-2xl bg-white border border-teal-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 text-teal-700 bg-teal-50 p-4 rounded-xl border border-teal-100">
            <CheckCircle className="w-8 h-8 text-teal-700 flex-shrink-0" />
            <div>
              <h3 className="text-base font-bold text-teal-900">Prescription Digitally Signed & Anchored on Ledger</h3>
              <p className="text-xs text-teal-700">Verified transaction committed to HospitalMSP channel with zero on-chain PHI exposure.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold">PRESCRIPTION ID (OPAQUE UUID):</span>
              <div className="text-teal-800 font-bold break-all mt-1">{issuedRx.prescription_id}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-semibold">BLOCKCHAIN TRANSACTION ID:</span>
              <div className="text-slate-800 font-bold break-all mt-1">{issuedRx.blockchain_tx_id}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-full">
              <span className="text-slate-400 font-semibold">CANONICAL SHA-256 PAYLOAD HASH:</span>
              <div className="text-slate-700 font-bold break-all mt-1">{issuedRx.payload_hash}</div>
            </div>
          </div>

          {/* Interactive QR Code Pass & Quick Copy */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-teal-50/50 to-white border border-teal-200 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Real Scannable QR Code */}
            <div 
              className="w-48 h-48 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0"
              dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(issuedRx.qr_verification_token, 168) }}
            />

            {/* Token & Actions */}
            <div className="flex-1 space-y-3.5 text-center md:text-left">
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Dispensary Verification Token
                </span>
                <div className="text-xl font-extrabold text-teal-900 tracking-wider font-mono mt-0.5">
                  {issuedRx.qr_verification_token}
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                This token is mathematically bound to the prescription hash. The pharmacist will use it to verify authenticity and dispense medicine without seeing unencrypted PHI on the ledger.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                {/* 1. Copy Token Button */}
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-teal-700" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Token to Clipboard'}</span>
                </button>

                {/* 2. Download QR Pass Button */}
                <button
                  type="button"
                  onClick={handleDownloadPass}
                  className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-teal-700/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Pass (.PNG)</span>
                </button>

                {/* 3. Send to Pharmacy Shortcut */}
                {onSendToPharmacy && (
                  <button
                    type="button"
                    onClick={() => onSendToPharmacy(issuedRx.qr_verification_token)}
                    className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    <span>Send to Pharmacy Counter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIssuedRx(null)}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            Issue Another Prescription
          </button>
        </div>
      ) : (
        /* Issuance Form */
        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Patient Identification</h3>
            <p className="text-xs text-slate-500">Patient details remain encrypted off-chain using AES-256-GCM.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Medical Record No. (MRN)</label>
              <input
                type="text"
                value={patientRef}
                onChange={(e) => setPatientRef(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Patient Full Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 outline-none"
              />
            </div>
          </div>

          {/* Medications Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authorized Medications</h3>
                <p className="text-xs text-slate-500">Specify NDC codes, exact quantities, and clinical administration instructions.</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-200"
              >
                + Add Medication
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Medication Order #{idx + 1}</span>
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">National Drug Code (NDC)</label>
                    <input
                      type="text"
                      value={item.medication_code}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].medication_code = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:border-teal-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Medication Name</label>
                    <input
                      type="text"
                      value={item.medication_name}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].medication_name = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:border-teal-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Total Quantity Authorized</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].quantity = parseInt(e.target.value) || 1;
                        setItems(copy);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Clinical Dosage & Frequency</label>
                  <input
                    type="text"
                    value={item.frequency}
                    onChange={(e) => {
                      const copy = [...items];
                      copy[idx].frequency = e.target.value;
                      setItems(copy);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:border-teal-600 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Cryptographic Key & Policy */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <KeyRound className="w-4 h-4 text-teal-700" />
              <span>Signing Key: <strong>ECDSA P-256 (KEY-DOC-SARAH-V1)</strong></span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={allowPartial}
                onChange={(e) => setAllowPartial(e.target.checked)}
                className="rounded accent-teal-700 w-4 h-4"
              />
              <span>Allow Partial Dispensing</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-teal-700/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Computing Cryptographic Signature & Anchoring...' : 'Digitally Sign & Register on Hospital Ledger'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
