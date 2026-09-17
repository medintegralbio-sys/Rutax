import React, { useState } from 'react';
import { Usuario } from '../types';
import { AppChofer } from './AppChofer';
import { DashboardSocio } from './DashboardSocio';
import { Gauge, Car, UserCheck, ShieldCheck } from 'lucide-react';

interface DuenoChoferViewProps {
  currentUser?: Usuario;
}

export const DuenoChoferView: React.FC<DuenoChoferViewProps> = ({ currentUser }) => {
  const [activeMode, setActiveMode] = useState<'conduccion' | 'flota'>('conduccion');

  return (
    <div className="space-y-4">
      {/* Tab Switcher: Modo Conducción vs Mi Flota */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex gap-2 max-w-md mx-auto shadow-xl">
        <button
          onClick={() => setActiveMode('conduccion')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMode === 'conduccion'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Modo Conducción (Chofer)</span>
        </button>

        <button
          onClick={() => setActiveMode('flota')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMode === 'flota'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Mi Flota (Socio Dueño)</span>
        </button>
      </div>

      {/* Render selected view */}
      {activeMode === 'conduccion' ? (
        <AppChofer currentUser={currentUser} />
      ) : (
        <DashboardSocio currentUser={currentUser} />
      )}
    </div>
  );
};
