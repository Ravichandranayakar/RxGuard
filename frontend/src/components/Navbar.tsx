import React from 'react';
import { UserProfile } from '../types';
import { LogOut, CheckCircle2, Stethoscope, Pill, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onSwitchUser: (role: 'DOCTOR' | 'PHARMACIST') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onSwitchUser, onLogout }) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-10 gap-4 select-none">
      {/* 1. Left: Active Organization Node & Consortium Badge */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
          currentUser?.role === 'DOCTOR'
            ? 'bg-teal-50/70 border-teal-200 text-teal-900'
            : 'bg-sky-50/70 border-sky-200 text-sky-900'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="font-bold text-slate-800">{currentUser?.organization_name || 'Metro General Hospital'}</span>
          <span className="text-slate-300">·</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600 font-bold">
            {currentUser?.msp_id || 'HospitalMSP'}
          </span>
        </div>
      </div>

      {/* 2. Center/Right: Role Switcher & Profile Badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Fast Role Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <span className="px-2 text-slate-500 text-[11px] font-semibold hidden sm:inline whitespace-nowrap">Role:</span>
          <button
            onClick={() => onSwitchUser('DOCTOR')}
            title="Dr. Sarah Smith (HospitalMSP): Prescribe Only"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all text-xs ${
              currentUser?.role === 'DOCTOR'
                ? 'bg-white text-teal-800 shadow-sm border border-slate-200 ring-1 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
            <span>Dr. Sarah (Doctor)</span>
          </button>
          <button
            onClick={() => onSwitchUser('PHARMACIST')}
            title="Marcus Vance (PharmacyMSP): Dispense Only"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all text-xs ${
              currentUser?.role === 'PHARMACIST'
                ? 'bg-white text-teal-800 shadow-sm border border-slate-200 ring-1 ring-teal-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
            <span>Marcus (Pharmacist)</span>
          </button>
        </div>

        {/* Current User Badge */}
        {currentUser && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200 flex-shrink-0">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden md:block whitespace-nowrap">
              <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-teal-700 font-medium font-mono leading-tight">{currentUser.role}</div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
