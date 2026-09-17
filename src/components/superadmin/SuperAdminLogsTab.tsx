import React, { useState } from 'react';
import { LogSuperAdmin, Cooperativa } from '../../types';
import { 
  FileText, 
  Search, 
  Clock, 
  UserCheck, 
  Building2, 
  Shield, 
  Filter, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Edit3, 
  Plus, 
  Percent, 
  Download
} from 'lucide-react';

interface Props {
  logs: LogSuperAdmin[];
  cooperativas: Cooperativa[];
}

export const SuperAdminLogsTab: React.FC<Props> = ({ logs, cooperativas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccion, setFilterAccion] = useState<string>('todos');

  const getCoopName = (id: string | null) => {
    if (!id) return 'Sistema / Global';
    return cooperativas.find(c => c.id === id)?.nombre || id;
  };

  const filtrados = logs.filter(l => {
    const coopName = getCoopName(l.cooperativa_id_afectada);
    const matchSearch = 
      l.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.superadmin_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAccion = filterAccion === 'todos' ? true : l.accion === filterAccion;
    return matchSearch && matchAccion;
  });

  const getAccionBadge = (accion: LogSuperAdmin['accion']) => {
    switch (accion) {
      case 'crear_cooperativa':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">Alta Cooperativa</span>;
      case 'aprobar_comprobante':
        return <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold">Aprobación Pago</span>;
      case 'rechazar_comprobante':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">Rechazo Pago</span>;
      case 'bloquear_cooperativa':
        return <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">Bloqueo</span>;
      case 'desbloquear_cooperativa':
        return <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">Desbloqueo</span>;
      case 'otorgar_descuento':
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">Descuento</span>;
      case 'cambiar_estado_manual':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">Extensión Gracia</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">{accion}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Registro de Auditoría Inmutable SuperAdmin ({logs.length} eventos)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trazabilidad de cada cambio de estado, aprobación financiera, bloqueo o modificación de plan realizada por la administración central.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por detalle, cooperativa o superadmin..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <select
            value={filterAccion}
            onChange={e => setFilterAccion(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="todos">Todas las Acciones</option>
            <option value="crear_cooperativa">Alta Cooperativa</option>
            <option value="aprobar_comprobante">Aprobación Pago</option>
            <option value="rechazar_comprobante">Rechazo Pago</option>
            <option value="bloquear_cooperativa">Bloqueo Aplicado</option>
            <option value="desbloquear_cooperativa">Desbloqueo / Reactivación</option>
            <option value="otorgar_descuento">Descuentos Especiales</option>
            <option value="cambiar_estado_manual">Extensión Días Gracia</option>
            <option value="editar_plan">Cambios de Plan</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Acción</th>
                <th className="px-5 py-3.5">Cooperativa Afectada</th>
                <th className="px-5 py-3.5">Detalle Operativo</th>
                <th className="px-5 py-3.5">Operador & Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                filtrados.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-EC')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getAccionBadge(log.accion)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-200">
                        {getCoopName(log.cooperativa_id_afectada)}
                      </div>
                      {log.cooperativa_id_afectada && (
                        <div className="font-mono text-[10px] text-slate-500">
                          {log.cooperativa_id_afectada}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200">{log.detalle}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[11px]">
                      <div className="font-semibold text-purple-300">{log.superadmin_id}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{log.ip} • {log.dispositivo}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
