import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { DoctorWorkspace } from './components/DoctorWorkspace';
import { PharmacyWorkspace } from './components/PharmacyWorkspace';
import { AuditExplorer } from './components/AuditExplorer';
import { SystemHealth } from './components/SystemHealth';
import { authApi } from './services/api';
import { UserProfile } from './types';
import { ShieldAlert, Stethoscope, Pill, ArrowRight, Lock } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('doctor');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedPharmacyToken, setSelectedPharmacyToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Initial login as Dr. Sarah Smith (Physician)
    authApi.login('dr.smith@metrohealth.org', 'DoctorPass123!').then(({ user }) => {
      setCurrentUser(user);
    });
  }, []);

  const handleSwitchUser = async (role: 'DOCTOR' | 'PHARMACIST') => {
    if (role === 'DOCTOR') {
      const { user } = await authApi.login('dr.smith@metrohealth.org', 'DoctorPass123!');
      setCurrentUser(user);
      setCurrentTab('doctor');
    } else {
      const { user } = await authApi.login('pharm.jones@carefirst.org', 'PharmPass123!');
      setCurrentUser(user);
      setCurrentTab('pharmacy');
    }
  };

  const handleTransferToPharmacy = async (token: string) => {
    // Auto-switch to Pharmacist Marcus and open Pharmacy workspace with the token preloaded
    const { user } = await authApi.login('pharm.jones@carefirst.org', 'PharmPass123!');
    setCurrentUser(user);
    setSelectedPharmacyToken(token);
    setCurrentTab('pharmacy');
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const isDoctor = currentUser?.role === 'DOCTOR' || currentUser?.role === 'SYSTEM_ADMIN';
  const isPharmacist = currentUser?.role === 'PHARMACIST' || currentUser?.role === 'SYSTEM_ADMIN';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans">
      {/* 1. Master Clinical Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
      />

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Clinical Navbar */}
        <Navbar
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Clinical Workspace View */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          {currentTab === 'dashboard' && <Dashboard />}

          {/* Doctor Prescribing Portal (Physicians Only) */}
          {currentTab === 'doctor' && (
            isDoctor ? (
              <DoctorWorkspace currentUser={currentUser} onSendToPharmacy={handleTransferToPharmacy} />
            ) : (
              <div className="max-w-3xl mx-auto mt-10 p-8 rounded-2xl bg-white border border-rose-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 font-mono">
                        RBAC ACCESS RESTRICTED
                      </span>
                      <span className="text-xs text-slate-400">HIPAA & Healthcare Separation of Duties</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">
                      Pharmacists Cannot Author Prescriptions
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      You are currently logged in as <strong>{currentUser?.name || 'Marcus Vance'}</strong> ({currentUser?.msp_id || 'PharmacyMSP'}). 
                      Under medical law, retail pharmacists <strong>cannot</strong> enter patient records or issue prescriptions. Only certified physicians with private key credentials from <strong>HospitalMSP</strong> can issue prescriptions.
                    </p>

                    <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-700">Your Authorized Clinical Workflow:</div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Pill className="w-4 h-4 text-teal-700" />
                        <span>Operate the <strong>Pharmacy Dispensary</strong> to verify QR tokens and dispense medication.</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={() => setCurrentTab('pharmacy')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Go to Marcus's Pharmacy Dispensary</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Pharmacy Dispensary (Pharmacists Only) */}
          {currentTab === 'pharmacy' && (
            isPharmacist ? (
              <PharmacyWorkspace 
                key={selectedPharmacyToken} 
                initialToken={selectedPharmacyToken} 
                currentUser={currentUser}
              />
            ) : (
              <div className="max-w-3xl mx-auto mt-10 p-8 rounded-2xl bg-white border border-amber-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
                        RBAC ACCESS RESTRICTED
                      </span>
                      <span className="text-xs text-slate-400">Clinical Protocol Separation</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">
                      Physicians Do Not Dispense Pharmaceuticals
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      You are currently logged in as <strong>{currentUser?.name || 'Dr. Sarah Smith'}</strong> ({currentUser?.msp_id || 'HospitalMSP'}). 
                      In order to prevent healthcare fraud, physicians author prescriptions but <strong>cannot dispense</strong> medicine from pharmacy inventory. Only licensed pharmacists from <strong>PharmacyMSP</strong> have dispensing keys.
                    </p>

                    <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-700">Your Authorized Clinical Workflow:</div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Stethoscope className="w-4 h-4 text-teal-700" />
                        <span>Use the <strong>Physician Portal</strong> to diagnose patients, sign prescriptions, and generate QR verification passes.</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={() => setCurrentTab('doctor')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>Go to Dr. Sarah's Prescribing Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {currentTab === 'audit' && <AuditExplorer />}
          {currentTab === 'health' && <SystemHealth />}
        </main>
      </div>
    </div>
  );
};

export default App;
