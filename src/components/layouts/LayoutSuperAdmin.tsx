import React from 'react';
import { SuperAdminPanel } from '../SuperAdminPanel';
import { rutaxStore } from '../../services/store';
import { LogOut } from 'lucide-react';

export const LayoutSuperAdmin = () => {
  const handleLogout = () => {
    rutaxStore.logout();
    window.location.href = '/login';
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
            RUTAX
          </span>
          <span className="text-xs font-semibold text-slate-300">SuperAdmin Global • Plataforma Multi-Cooperativa</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          title="Cerrar sesión actual"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      <main className="w-full bg-slate-950 p-4 md:p-6 pb-24">
        <SuperAdminPanel />
      </main>
    </div>
  );
};
