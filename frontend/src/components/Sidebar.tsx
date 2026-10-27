import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  History, 
  Activity, 
  Building2,
  Stethoscope,
  Pill,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, currentUser }) => {
  const isDoctor = currentUser?.role === 'DOCTOR' || currentUser?.role === 'SYSTEM_ADMIN';
  const isPharmacist = currentUser?.role === 'PHARMACIST' || currentUser?.role === 'SYSTEM_ADMIN';

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Clinical Overview', 
      icon: LayoutDashboard,
      allowed: true 
    },
    { 
      id: 'doctor', 
      label: 'Physician Portal', 
      icon: Stethoscope, 
      allowed: isDoctor,
      badge: isDoctor ? 'ACTIVE' : 'LOCKED'
    },
    { 
      id: 'pharmacy', 
      label: 'Pharmacy Counter', 
      icon: Pill, 
      allowed: isPharmacist,
      badge: isPharmacist ? 'ACTIVE' : 'LOCKED'
    },
    { 
      id: 'audit', 
      label: 'Regulatory Audit Log', 
      icon: History,
      allowed: true 
    },
    { 
      id: 'health', 
      label: 'Network Infrastructure', 
      icon: Activity,
      allowed: true 
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen select-none shadow-sm z-20">
      <div>
        {/* Hospital Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 bg-gradient-to-r from-teal-50/50 to-white">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">RxGuard</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800 tracking-wider">HEALTH</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Prescription Security</div>
          </div>
        </div>

        {/* Clinical Organization & Role Badge */}
        {currentUser && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                <span>{currentUser.msp_id}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            </div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {currentUser.organization_name}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Active Role:</span>
              <span className="font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono text-[10px]">
                {currentUser.role}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items (Strictly Filtered by Role) */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Workstations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isAllowed = item.allowed;

            if (!isAllowed) {
              // Clicking a locked item takes the user to the informative Access Denied security screen!
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'text-slate-400 bg-slate-50/60 hover:bg-rose-50/50 hover:text-rose-700 border border-dashed border-slate-200'
                  }`}
                  title="Click to view RBAC authorization policy"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 text-slate-400">
                    <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                      LOCKED
                    </span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-sm border border-teal-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span className="truncate text-left">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex-shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Hospital System Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>RBAC ENFORCED</span>
          <span className="text-teal-700 font-bold">ACTIVE</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">Separate Hospital & Pharmacy MSPs</div>
      </div>
    </aside>
  );
};
