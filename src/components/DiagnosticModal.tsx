import React, { useState, useEffect } from 'react';
import { offlineManager } from '../services/offlineManager';
import { 
  Wrench, 
  Smartphone, 
  Wifi, 
  Database, 
  Battery, 
  MapPin, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInfo();
    }
  }, [isOpen]);

  const loadInfo = async () => {
    const data = await offlineManager.obtenerInfoDiagnostico();
    setInfo(data);
  };

  if (!isOpen || !info) return null;

  const handleCopy = () => {
    const text = JSON.stringify(info, null, 2);
    navigator.clipboard.writeText(text);
    setToast('Información de diagnóstico copiada al portapapeles.');
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearCache = async () => {
    if (window.confirm('¿Seguro? Se borrará la caché local pero se mantendrán las acciones pendientes.')) {
      await offlineManager.limpiarCache();
      setToast('Caché limpiada exitosamente.');
      loadInfo();
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleExportLogs = () => {
    const logs = offlineManager.getLogs();
    const blob = new Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutax-smart-logs-${Date.now()}.txt`;
    a.click();
    setToast('Archivo de logs exportado (.txt).');
    setTimeout(() => setToast(null), 3000);
  };

  const handleForceSync = async () => {
    setToast('Sincronizando...');
    const res = await offlineManager.forzarSincronizacion();
    setToast(`Sincronización finalizada: ${res.syncedActions} acciones, ${res.syncedGps} GPS.`);
    loadInfo();
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      {toast && (
        <div className="absolute top-6 z-50 p-3 rounded-xl bg-purple-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Diagnóstico Técnico RUTAX-SMART</h3>
              <p className="text-[11px] text-slate-400">Herramientas avanzadas de soporte y depuración</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* App Info */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Aplicación & Sesión</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>Versión: <strong className="text-slate-100">{info.version}</strong></div>
              <div>Build: <strong className="text-slate-100">{info.build}</strong></div>
              <div className="col-span-2">Cooperativa: <strong className="text-slate-100">{info.cooperativa}</strong></div>
              <div className="col-span-2">Usuario: <strong className="text-slate-100">{info.usuario}</strong></div>
            </div>
          </div>

          {/* Connection */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-sky-300 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-sky-400" />
              <span>Conexión & Red</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>Internet: <strong className={info.isOnline ? 'text-emerald-400' : 'text-amber-400'}>{info.isOnline ? '🟢 Online' : '🟡 Offline'}</strong></div>
              <div>Sync en curso: <strong className="text-slate-100">{info.syncInProgress ? 'Sí' : 'No'}</strong></div>
            </div>
          </div>

          {/* Local Data */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Almacenamiento Local (IndexedDB)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>Acciones en cola: <strong className="text-purple-400">{info.totalQueue}</strong></div>
              <div>Acciones pendientes: <strong className="text-amber-400">{info.pendingActions}</strong></div>
              <div>Puntos GPS pendientes: <strong className="text-sky-400">{info.pendingGps}</strong></div>
              <div>Elementos en caché: <strong className="text-slate-100">{info.cacheCount}</strong></div>
            </div>
          </div>

          {/* Device & GPS */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-orange-300 flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-orange-400" />
              <span>Dispositivo & Hardware</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>Modelo: <strong className="text-slate-100">{info.deviceModel}</strong></div>
              <div>OS: <strong className="text-slate-100">{info.os}</strong></div>
              <div>Batería: <strong className="text-emerald-400">{info.bateria}</strong></div>
              <div>Permiso GPS: <strong className="text-emerald-400">✅ Concedido</strong></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleCopy}
            className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Copy className="w-4 h-4 text-purple-400" />
            <span>Copiar Info</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Exportar Logs</span>
          </button>

          <button
            onClick={handleClearCache}
            className="h-10 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-rose-500/30"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpiar Caché</span>
          </button>

          <button
            onClick={handleForceSync}
            className="h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Forzar Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
};
