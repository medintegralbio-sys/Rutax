import React, { useState, useEffect } from 'react';
import { offlineManager } from '../services/offlineManager';
import { offlineDb } from '../services/offlineDb';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Send,
  X,
  Radio,
  Activity
} from 'lucide-react';

export const ConnectionIndicator: React.FC = () => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    syncing: false,
    pendingActions: 0,
    pendingGps: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [failedActions, setFailedActions] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(async (st) => {
      setStatus(st);
      if (modalOpen) {
        loadFailed();
      }
    });

    loadFailed();

    return () => {
      unsubscribe();
    };
  }, [modalOpen]);

  const loadFailed = async () => {
    const failed = await offlineDb.offline_queue.where('estado').equals('fallido').toArray();
    setFailedActions(failed);
  };

  const handleForceSync = async () => {
    setToast('Iniciando sincronización forzada...');
    const res = await offlineManager.forzarSincronizacion();
    setToast(`Sincronizado: ${res.syncedActions} acciones, ${res.syncedGps} GPS. Conflictos: ${res.conflicts}`);
    loadFailed();
    setTimeout(() => setToast(null), 4000);
  };

  const handleDiscardPending = async () => {
    if (window.confirm('¿Seguro que deseas descartar las acciones pendientes locales?')) {
      await offlineDb.offline_queue.where('estado').equals('pendiente').delete();
      setToast('Acciones pendientes descartadas.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-200 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Activity className="w-4 h-4 text-purple-400 animate-spin" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Button / Badge */}
      <button
        onClick={() => setModalOpen(true)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all border shadow-sm ${
          status.syncing
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            : status.isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
        }`}
        title="Clic para ver detalles de conexión offline y cola de sincronización"
      >
        {status.syncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span className="hidden sm:inline">Sincronizando...</span>
          </>
        ) : status.isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">En Línea</span>
            {(status.pendingActions > 0 || status.pendingGps > 0) && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                {status.pendingActions + status.pendingGps}
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sin Internet</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
              {status.pendingActions}
            </span>
          </>
        )}
      </button>

      {/* Modal Detalle Conexión */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Estado de Conexión & Sincronización</h3>
                  <p className="text-[11px] text-slate-400">Motor Offline-First (IndexedDB + Dexie)</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Estado de Red:</span>
                <span className={`font-bold flex items-center gap-1.5 ${status.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {status.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  {status.isOnline ? 'Conectado a la Nube' : 'Sin conexión (Modo Local)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Acciones Pendientes:</div>
                  <div className="text-lg font-mono font-bold text-purple-400 mt-1">{status.pendingActions}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Puntos GPS sin Enviar:</div>
                  <div className="text-lg font-mono font-bold text-sky-400 mt-1">{status.pendingGps}</div>
                </div>
              </div>

              {failedActions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Acciones Fallidas / Conflictos ({failedActions.length}):</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {failedActions.map(f => (
                      <div key={f.id} className="p-2 rounded-xl bg-slate-900 border border-rose-900/50 text-[11px]">
                        <div className="font-bold text-rose-200">{f.tipo}</div>
                        <div className="text-slate-400">{f.error_ultimo || 'Error de sincronización'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ Toda acción ejecutada sin internet se almacena de forma segura en el dispositivo y se sincroniza automáticamente con reintentos exponenciales al recuperar señal.
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleForceSync}
                disabled={status.syncing || !status.isOnline}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${status.syncing ? 'animate-spin' : ''}`} />
                <span>Forzar Sincronización Manual</span>
              </button>

              <button
                onClick={handleDiscardPending}
                className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Descartar Acciones Pendientes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
