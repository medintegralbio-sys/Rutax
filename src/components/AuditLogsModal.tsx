import React, { useState } from 'react';
import { rutaxStore } from '../services/store';
import { X, ShieldCheck, Search, Filter, Clock, FileText } from 'lucide-react';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('TODAS');

  if (!isOpen) return null;

  const logs = rutaxStore.logs.filter(log => {
    const matchesSearch =
      log.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'TODAS' || log.accion === filterAction;
    return matchesSearch && matchesAction;
  });

  const actions = Array.from(new Set(rutaxStore.logs.map(l => l.accion)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Bitácora de Auditoría Inmutable (Regla 7)
              </h2>
              <p className="text-xs text-slate-400">
                Registro inalterable y auditable de ingresos, reasignaciones de turnos, bloqueos de socios y salidas de flota.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, unidad, placa o motivo..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-white"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
          >
            <option value="TODAS">Todas las acciones ({rutaxStore.logs.length})</option>
            {actions.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        {/* Logs Table / List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 pr-1 text-xs font-sans">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No se encontraron registros con los filtros indicados.
            </div>
          ) : (
            logs.map(log => {
              const isTurnReassign = log.accion.includes('REASIGNACION');
              const isBlock = log.accion.includes('BLOQUEO');
              const isSOS = log.accion.includes('EMERGENCIA') || log.accion.includes('SOS');

              return (
                <div key={log.id} className="py-3.5 space-y-1.5 hover:bg-slate-800/20 px-2 rounded-xl transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isTurnReassign
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isBlock
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isSOS
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {log.accion}
                      </span>
                      <span className="font-bold text-slate-200">
                        {log.usuario_nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{log.timestamp}</span>
                      <span>• IP: {log.ip}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans bg-slate-950/50 p-2 rounded-lg border border-slate-800/70">
                    {log.detalle}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Dispositivo: {log.dispositivo || 'Navegador Web'}</span>
                    <span className="font-mono text-slate-400">ID: {log.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
