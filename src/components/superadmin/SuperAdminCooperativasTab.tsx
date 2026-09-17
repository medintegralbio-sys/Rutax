import React, { useState } from 'react';
import { Cooperativa, SuscripcionCooperativa, PlanSuscripcion } from '../../types';
import { rutaxStore } from '../../services/store';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Calendar, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Clock, 
  DollarSign,
  Car,
  MoreVertical,
  ShieldAlert,
  Percent,
  RefreshCw,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

interface Props {
  cooperativas: Cooperativa[];
  suscripciones: SuscripcionCooperativa[];
  planes: PlanSuscripcion[];
  onSelectCoop: (coopId: string) => void;
  onOpenNuevaCoop: () => void;
  onOpenGestion: (coopId: string) => void;
  onEnviarWhatsApp: (coopId: string, tipo: any) => void;
}

export const SuperAdminCooperativasTab: React.FC<Props> = ({
  cooperativas,
  suscripciones,
  planes,
  onSelectCoop,
  onOpenNuevaCoop,
  onOpenGestion,
  onEnviarWhatsApp
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterPlan, setFilterPlan] = useState<string>('todos');
  const [coopParaEliminar, setCoopParaEliminar] = useState<Cooperativa | null>(null);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [eliminando, setEliminando] = useState(false);

  const handleEjecutarEliminacion = () => {
    if (!coopParaEliminar) return;
    try {
      setEliminando(true);
      rutaxStore.eliminarCooperativaCompleta(coopParaEliminar.id);
      setCoopParaEliminar(null);
      setConfirmacionTexto('');
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setEliminando(false);
    }
  };

  // Filtrado
  const coopsFiltradas = cooperativas.filter(coop => {
    const susc = suscripciones.find(s => s.cooperativaId === coop.id);
    const matchSearch = 
      coop.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coop.ruc.includes(searchTerm) ||
      coop.presidente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coop.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filterEstado === 'todos' ? true :
      filterEstado === 'activa' ? (susc?.estado_suscripcion === 'activa') :
      filterEstado === 'por_vencer' ? (susc?.estado_suscripcion === 'por_vencer') :
      filterEstado === 'vencida' ? (susc?.estado_suscripcion === 'vencida') :
      filterEstado === 'bloqueo_parcial' ? (susc?.estado_suscripcion === 'bloqueo_parcial') :
      filterEstado === 'bloqueada' ? (susc?.estado_suscripcion === 'bloqueada') :
      filterEstado === 'cancelada' ? (susc?.estado_suscripcion === 'cancelada') : true;

    const matchPlan = filterPlan === 'todos' ? true :
      susc?.plan_id === filterPlan;

    return matchSearch && matchEstado && matchPlan;
  });

  return (
    <div className="space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Catálogo & Estado de Cooperativas Afiliadas ({cooperativas.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervisión de planes SaaS, liquidación mensual por flota, vencimientos y bloqueos progresivos.
          </p>
        </div>

        <button
          onClick={onOpenNuevaCoop}
          className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cooperativa</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC, presidente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activa">🟢 Activas (Al Día)</option>
            <option value="por_vencer">🟡 Por Vencer (≤3 días)</option>
            <option value="vencida">🟠 Vencidas (Gracia 0-3d)</option>
            <option value="bloqueo_parcial">⛔ Bloqueo Parcial (3-5d)</option>
            <option value="bloqueada">🔴 Bloqueo Total (+5d)</option>
            <option value="cancelada">⚫ Canceladas (+30d)</option>
          </select>
        </div>

        <div>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="todos">Todos los Planes</option>
            {planes.map(p => (
              <option key={p.id} value={p.id}>Plan {p.nombre} (${p.precio_por_unidad}/ud)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cooperativas List Table - Responsive Single Screen, No Horizontal Scroll */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="w-full">
          <table className="w-full table-fixed text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="w-[30%] px-4 py-3">Cooperativa & Directiva</th>
                <th className="w-[14%] px-3 py-3">Plan & Tarifa</th>
                <th className="w-[10%] px-2 py-3 text-center">Unidades</th>
                <th className="w-[13%] px-3 py-3">Monto Mes</th>
                <th className="w-[13%] px-3 py-3">Vencimiento</th>
                <th className="w-[10%] px-2 py-3">Estado</th>
                <th className="w-[10%] px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {coopsFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No se encontraron cooperativas con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                coopsFiltradas.map(coop => {
                  const susc = suscripciones.find(s => s.cooperativaId === coop.id);
                  const plan = planes.find(p => p.id === (susc?.plan_id || 'plan_pro_unico')) || planes[0];
                  const fechaVenc = susc ? new Date(susc.fecha_vencimiento) : new Date(coop.fecha_vencimiento_suscripcion);
                  const diasFaltantes = Math.ceil((fechaVenc.getTime() - Date.now()) / (1000 * 3600 * 24));
                  const isVencida = diasFaltantes < 0;

                  return (
                    <tr key={coop.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
                            {coop.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-100 text-xs truncate" title={coop.nombre}>{coop.nombre}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <span className="font-mono text-slate-400">{coop.ruc}</span>
                              <span>•</span>
                              <span className="truncate">{coop.presidente_nombre}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200">
                          <span className="truncate max-w-[80px]">{plan?.nombre || 'Pro'}</span>
                          <span className="text-[10px] text-emerald-400 font-mono shrink-0">(${plan?.precio_por_unidad || 15})</span>
                        </div>
                        {susc?.descuento_porcentaje ? (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            -{susc.descuento_porcentaje}% Desc.
                          </div>
                        ) : null}
                      </td>

                      <td className="px-2 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-100 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
                          <Car className="w-3 h-3 text-sky-400 shrink-0" />
                          {susc?.unidades_activas || 10}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-mono font-bold text-emerald-400 text-xs">
                          ${susc?.monto_mensual?.toFixed(2) || '150.00'}
                        </div>
                        <div className="text-[9px] text-slate-400">mensual</div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className={isVencida ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                            {fechaVenc.toLocaleDateString('es-EC')}
                          </span>
                        </div>
                        <span className={`text-[9px] font-medium block ${
                          diasFaltantes < 0 ? 'text-rose-400' :
                          diasFaltantes <= 3 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {diasFaltantes < 0 ? `${Math.abs(diasFaltantes)}d mora` :
                           diasFaltantes === 0 ? 'Vence HOY' :
                           `${diasFaltantes}d restantes`}
                        </span>
                      </td>

                      <td className="px-2 py-3">
                        {susc?.estado_suscripcion === 'activa' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Activa
                          </span>
                        ) : susc?.estado_suscripcion === 'por_vencer' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5" />
                            Por Vencer
                          </span>
                        ) : susc?.estado_suscripcion === 'vencida' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Vencida
                          </span>
                        ) : susc?.estado_suscripcion === 'bloqueo_parcial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 whitespace-nowrap">
                            <Lock className="w-2.5 h-2.5" />
                            Blq. Desp.
                          </span>
                        ) : susc?.estado_suscripcion === 'bloqueada' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Bloqueada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                            Cancelada
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenGestion(coop.id)}
                            title="Abrir interfaz de información y gestión de cooperativa"
                            className="h-7 px-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 hover:text-white text-[11px] font-bold transition-all border border-purple-500/40 flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                          >
                            <span>Gestionar</span>
                          </button>
                          <button
                            onClick={() => {
                              setCoopParaEliminar(coop);
                              setConfirmacionTexto('');
                            }}
                            title="Eliminar cooperativa"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Borrado Definitivo de Cooperativa y Base de Datos */}
      {coopParaEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Borrado Completo de Cooperativa</h3>
                  <p className="text-xs text-rose-400 font-semibold">{coopParaEliminar.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setCoopParaEliminar(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 text-xs space-y-2 text-rose-200">
              <p className="font-bold text-rose-300">
                ⚠️ ¡ATENCIÓN SUPERADMIN / CREADOR! Esta acción es IRREVERSIBLE.
              </p>
              <p>
                Al confirmar, se eliminará permanentemente de la base de datos local y Firestore:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>Perfil completo de la cooperativa y suscripción.</li>
                <li>Todas las unidades, vehículos y registros GPS.</li>
                <li>Todos los usuarios, choferes, socios y cuentas asociadas.</li>
                <li>Todas las bases, geocercas, corredores y rutas.</li>
                <li>Historial completo de turnos, despachos y reservaciones.</li>
                <li>Saldos, comprobantes de pago y liquidaciones.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Escribe <strong className="text-white font-mono">{coopParaEliminar.nombre}</strong> o <strong className="text-rose-400 font-mono">BORRAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={confirmacionTexto}
                onChange={e => setConfirmacionTexto(e.target.value)}
                placeholder="Escribe la palabra de confirmación aquí..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCoopParaEliminar(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  (confirmacionTexto.trim() !== coopParaEliminar.nombre &&
                   confirmacionTexto.trim().toUpperCase() !== 'BORRAR') ||
                  eliminando
                }
                onClick={handleEjecutarEliminacion}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{eliminando ? 'Eliminando...' : 'Confirmar Borrado Completo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
