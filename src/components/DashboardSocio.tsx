import React, { useState } from 'react';
import { rutaxStore } from '../services/store';
import { Usuario, Vehiculo } from '../types';
import { RutaxMap } from './RutaxMap';
import { FinanzasSocio } from './FinanzasSocio';
import { 
  UserCheck, 
  Car, 
  Lock, 
  Unlock, 
  DollarSign, 
  ShieldAlert, 
  Calendar, 
  Gauge, 
  MapPin, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  Receipt,
  Radio,
  LogOut
} from 'lucide-react';

interface DashboardSocioProps {
  currentUser?: Usuario;
}

export const DashboardSocio: React.FC<DashboardSocioProps> = ({ currentUser }) => {
  const [viewTab, setViewTab] = useState<'telemetria' | 'finanzas'>('telemetria');
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [blockModalVehiculo, setBlockModalVehiculo] = useState<Vehiculo | null>(null);
  const [blockReason, setBlockReason] = useState('Pendiente de entrega de liquidación diaria');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Regla 6: El socio solo ve sus propios vehículos
  const misVehiculos = rutaxStore.vehiculos.filter(
    v => v.socio_id === currentUser?.uid || currentUser?.rol === 'admin_coop'
  );

  const bloqueosSemana = currentUser?.bloqueos_ultimos_7_dias || 0;
  const estaSuspendidoPorBloqueos = currentUser?.suspendido_por_bloqueos || false;

  // Ganancias del día calculadas a partir de los turnos de sus vehículos
  const misTurnosHoy = rutaxStore.turnos.filter(
    t => misVehiculos.some(v => v.id === t.vehiculo_id) && t.estado === 'despachado'
  );
  const recaudacionTotalHoy = misTurnosHoy.reduce((acc, t) => acc + (t.total_recaudado || 0), 0);

  const handleToggleLock = (veh: Vehiculo) => {
    if (!currentUser) return;
    setFeedback(null);

    const res = rutaxStore.toggleVehicleLock(veh.id, currentUser.uid, blockReason);
    setFeedback({ ok: res.ok, msg: res.message });
    setBlockModalVehiculo(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Socio */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
              PORTAL DEL SOCIO PROPIETARIO
            </span>
            <span className="text-xs text-slate-400">Cooperativa Daule Express</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-1">
            {currentUser?.nombre_completo || 'Socio'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cédula: {currentUser?.cedula} • {misVehiculos.length} unidades registradas a tu nombre
          </p>
        </div>

        {/* Warning rule 9: 5 bloqueos en 7 días */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bloqueosSemana >= 4 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Seguridad Anti-Abuso</div>
              <div className="text-[11px] text-slate-400">
                Bloqueos aplicados (últimos 7 días): <strong className={bloqueosSemana >= 4 ? 'text-rose-400' : 'text-slate-200'}>{bloqueosSemana} / 5 máx</strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => { rutaxStore.logout(); window.location.href = '/login'; }}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md border border-rose-400/30 shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Telemetría vs Finanzas */}
      <div className="flex border-b border-slate-800 gap-2 text-xs">
        <button
          onClick={() => setViewTab('telemetria')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            viewTab === 'telemetria'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Telemetría GPS & Control de Unidades</span>
        </button>

        <button
          onClick={() => setViewTab('finanzas')}
          className={`px-4 py-2.5 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            viewTab === 'finanzas'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Liquidaciones & Rendición de Cuentas</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
          feedback.ok ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {feedback.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {viewTab === 'telemetria' ? (
        <>
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">Mis Unidades</span>
          <div className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-400" />
            <span>{misVehiculos.length} vehículos</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {misVehiculos.filter(v => v.estado === 'activo').length} activos en ruta
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">Vueltas Despachadas Hoy</span>
          <div className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>{misTurnosHoy.length} despachos</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Total flota propia</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">Recaudación Bruta Flota Hoy</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5 font-mono">
            <DollarSign className="w-5 h-5" />
            <span>${recaudacionTotalHoy.toFixed(2)} USD</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Generado en turnos</span>
        </div>
      </div>

      {/* Live Map of Owner's Fleet */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Localización Satelital de Mis Vehículos (Pings GPS cada 30 segundos)
          </h3>
          <span className="text-[11px] text-slate-400">Guayaquil Corredor Sauces ↔ Centro</span>
        </div>
        <RutaxMap
          bases={rutaxStore.bases}
          vehiculos={misVehiculos}
          geocercas={rutaxStore.geocercas}
          trackingLive={rutaxStore.getTrackingLiveArray().filter(t => misVehiculos.some(v => v.id === t.unidadId))}
          highlightVehiculoId={selectedVehiculo?.id}
          height="320px"
          showFleetLive={true}
          showGeocercas={true}
          showCorridor={true}
        />
      </div>

      {/* Fleet Vehicles List with Locking Mechanism & Document Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-400" />
          Mis Unidades Asignadas & Control de Seguridad
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {misVehiculos.map(veh => {
            const isBlocked = veh.estado === 'bloqueado_por_socio';
            const turnosVehHoy = misTurnosHoy.filter(t => t.vehiculo_id === veh.id);
            const totalVehHoy = turnosVehHoy.reduce((acc, t) => acc + (t.total_recaudado || 0), 0);
            const chofer = rutaxStore.usuarios.find(u => u.uid === veh.chofer_titular_id);

            return (
              <div
                key={veh.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isBlocked
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-rose-950/30'
                    : 'bg-slate-900/90 border-slate-800 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-100">
                        Unidad #{veh.numero_unidad}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-slate-800 font-mono font-bold text-xs text-emerald-400 border border-slate-700">
                        {veh.placa}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {veh.modelo} ({veh.color}) • Capacidad: {veh.capacidad} pax
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                    isBlocked
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isBlocked ? 'Bloqueada por Socio' : 'Activa en Ruta'}
                  </span>
                </div>

                {/* Driver & Telemetry */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Conductor Asignado:</span>
                    <span className="font-bold text-slate-200">{chofer?.nombre_completo || 'Chofer'}</span>
                    <span className="text-[10px] text-slate-400 block">Tel: {chofer?.telefono}</span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Velocidad / GPS:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {veh.ubicacion_actual?.velocidad_kmh || 0} km/h
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {veh.ubicacion_actual?.ultima_actualizacion || 'En línea'}
                    </span>
                  </div>
                </div>

                {/* Document Vigilance (SOAT, Matricula, Revision) */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Vigencia de Documentación
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Matrícula:</span>
                      <span className="font-mono text-slate-200">{veh.documentos.matricula_vigencia}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">SOAT:</span>
                      <span className="font-mono text-slate-200">{veh.documentos.soat_vigencia}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Revisión:</span>
                      <span className="font-mono text-slate-200 truncate block">{veh.documentos.revision_tecnica_vigencia}</span>
                    </div>
                  </div>
                </div>

                {/* Earnings Today for this unit */}
                <div className="flex items-center justify-between bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Vueltas despachadas:</span>
                    <span className="font-bold text-slate-200">{turnosVehHoy.length} despachos</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Producido hoy:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      ${totalVehHoy.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Blocking Switch / Action Button (REGLA 8 & 9) */}
                <div className="pt-1">
                  {isBlocked ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        <strong>Motivo del bloqueo:</strong> {veh.motivo_bloqueo}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Bloqueado el: {veh.fecha_bloqueo}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleLock(veh)}
                        className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Desbloquear Unidad (Liquidación Entregada)</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setBlockModalVehiculo(veh)}
                      className="w-full h-11 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Bloquear Vehículo por Falta de Liquidación</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      ) : (
        <FinanzasSocio currentUser={currentUser} misVehiculos={misVehiculos} />
      )}

      {/* Confirmation Modal for Vehicle Locking */}
      {blockModalVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Bloqueo Administrativo de Unidad #{blockModalVehiculo.numero_unidad}</span>
              </div>
              <button onClick={() => setBlockModalVehiculo(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                Al bloquear la unidad, ésta saldrá automáticamente de la cola de despacho de turnos en las bases hasta que tú mismo decidas reactivarla.
              </p>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Motivo de bloqueo (Auditoría):
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] space-y-1">
                <strong>Regla de Seguridad:</strong> Solo tú (socio que aplica el bloqueo) podrás desbloquearla. Los bloqueos reiterados (&gt;5 por semana) se notifican al consejo administrativo.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setBlockModalVehiculo(null)}
                  className="flex-1 h-11 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleToggleLock(blockModalVehiculo)}
                  className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg"
                >
                  Confirmar Bloqueo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
