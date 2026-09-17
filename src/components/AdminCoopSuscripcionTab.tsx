import React, { useState } from 'react';
import { rutaxStore } from '../services/store';
import { 
  CreditCard, 
  Receipt, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  DollarSign, 
  Upload, 
  Building2, 
  FileText, 
  ExternalLink, 
  Phone, 
  MessageSquare,
  Bell,
  Check,
  Tag,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { ModalSubirComprobante } from './superadmin/ModalSubirComprobante';

export const AdminCoopSuscripcionTab: React.FC = () => {
  const currentCoop = rutaxStore.getCurrentCoop();
  const [modalSubir, setModalSubir] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [notifFiltro, setNotifFiltro] = useState<'todas' | 'no_leidas'>('todas');

  if (!currentCoop) return null;

  const suscripcion = rutaxStore.suscripciones.find(s => s.cooperativaId === currentCoop.id);
  const plan = rutaxStore.planes.find(p => p.id === suscripcion?.plan_id) || rutaxStore.planes[1];
  const historialPagos = rutaxStore.obtenerHistorialPagos(currentCoop.id);
  const config = rutaxStore.configSuperAdmin;
  const notificaciones = rutaxStore.getNotificacionesPorCooperativa(currentCoop.id);
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leido);

  const fechaVenc = suscripcion ? new Date(suscripcion.fecha_vencimiento) : new Date(currentCoop.fecha_vencimiento_suscripcion);
  const diasFaltantes = Math.ceil((fechaVenc.getTime() - Date.now()) / (1000 * 3600 * 24));
  const isVencida = diasFaltantes < 0;

  const notificacionesFiltradas = notifFiltro === 'no_leidas' 
    ? notificacionesNoLeidas 
    : notificaciones;

  const handleSubirComprobante = (datos: any) => {
    rutaxStore.subirComprobante(currentCoop.id, datos);
    setModalSubir(false);
    setToast('Comprobante enviado exitosamente a la administración central para validación.');
    setTimeout(() => setToast(null), 4000);
  };

  const handleMarcarLeida = (notifId: string) => {
    rutaxStore.marcarNotificacionLeida(notifId);
  };

  const handleMarcarTodasLeidas = () => {
    notificacionesNoLeidas.forEach(n => rutaxStore.marcarNotificacionLeida(n.id));
    setToast('Todas las notificaciones fueron marcadas como leídas.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Subscription Alert Banner if expired or near expiration */}
      {suscripcion?.estado_suscripcion === 'bloqueada' ? (
        <div className="bg-rose-950/60 border-2 border-rose-500 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-200">
                SERVICIO SUSPENDIDO POR MORA (BLOQUEO TOTAL)
              </h3>
              <p className="text-xs text-rose-300 mt-1">
                La suscripción venció hace {Math.abs(diasFaltantes)} días. Para reactivar el despacho de turnos y las aplicaciones de los choferes, suba el comprobante de depósito.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalSubir(true)}
            className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Voucher de Pago</span>
          </button>
        </div>
      ) : suscripcion?.estado_suscripcion === 'bloqueo_parcial' ? (
        <div className="bg-orange-950/60 border-2 border-orange-500 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-orange-200">
                DESPACHO SUSPENDIDO TEMPORALMENTE (BLOQUEO PARCIAL DÍA +3)
              </h3>
              <p className="text-xs text-orange-300 mt-1">
                El despacho en tabletas de base está pausado. El GPS y tracking en vivo siguen activos. Reporte su pago para restablecer el despacho.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalSubir(true)}
            className="h-10 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Voucher de Pago</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Estado de Suscripción RUTAX-SMART</div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Plan {plan.nombre} (${plan.precio_por_unidad}/unidad/mes)
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  Al Día
                </span>
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">
                {suscripcion?.unidades_activas || 10} unidades activas conectadas • Vencimiento: <strong className="text-slate-200">{fechaVenc.toLocaleDateString('es-EC')}</strong> ({diasFaltantes} días restantes)
              </div>
            </div>
          </div>

          <button
            onClick={() => setModalSubir(true)}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Reportar Pago Mensual</span>
          </button>
        </div>
      )}

      {/* Grid of Bank Info and Subscription details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box 1: Datos para depósito */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Cuentas Bancarias Oficiales para Pagos</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-slate-400 font-semibold">Cuenta Principal:</div>
              <div className="font-mono text-emerald-400 font-bold text-sm">
                {config.cuenta_banco_principal}
              </div>
              <div className="text-[11px] text-slate-400">RUTAX SMART S.A.S • RUC: 0993821094001</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-slate-400 font-semibold">Cuenta Secundaria:</div>
              <div className="font-mono text-sky-400 font-bold text-sm">
                {config.cuenta_banco_secundaria}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
              <div>
                <span className="text-slate-300 font-bold block">Soporte y Validación WhatsApp:</span>
                <span className="text-purple-300 font-mono text-[11px]">{config.telefono_contacto_cobranza}</span>
              </div>
              <a
                href={`https://wa.me/593${config.telefono_contacto_cobranza.replace(/^0/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Box 2: Cuota Mensual y Desglose */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Desglose de Facturación de la Cooperativa</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50">
              <span className="text-slate-400">Plan Contratado:</span>
              <span className="font-bold text-slate-200">Plan {plan.nombre}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50">
              <span className="text-slate-400">Tarifa por Vehículo Activo:</span>
              <span className="font-mono font-bold text-emerald-400">${plan.precio_por_unidad}.00 USD/mes</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50">
              <span className="text-slate-400">Unidades de Flota Conectadas:</span>
              <span className="font-mono font-bold text-sky-400">{suscripcion?.unidades_activas || 10} unidades</span>
            </div>
            {suscripcion?.descuento_porcentaje ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 text-emerald-300 border border-emerald-500/20">
                <span>Descuento Aplicado ({suscripcion.motivo_descuento}):</span>
                <span className="font-mono font-bold">-{suscripcion.descuento_porcentaje}%</span>
              </div>
            ) : null}

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300">Total Cuota Mensual:</span>
              <span className="font-mono font-extrabold text-emerald-400 text-lg">
                ${suscripcion?.monto_mensual.toFixed(2) || '150.00'} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buzón de Notificaciones Internas Oficiales */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-purple-400" />
              {notificacionesNoLeidas.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Buzón de Comunicados y Notificaciones Internas
                {notificacionesNoLeidas.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    {notificacionesNoLeidas.length} nueva(s)
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Canal directo oficial con el Creador / SuperAdmin de Rutax</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setNotifFiltro('todas')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  notifFiltro === 'todas' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({notificaciones.length})
              </button>
              <button
                onClick={() => setNotifFiltro('no_leidas')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  notifFiltro === 'no_leidas' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                No leídas ({notificacionesNoLeidas.length})
              </button>
            </div>

            {notificacionesNoLeidas.length > 0 && (
              <button
                onClick={handleMarcarTodasLeidas}
                className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Marcar todas leídas</span>
              </button>
            )}
          </div>
        </div>

        {notificacionesFiltradas.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
            <Inbox className="w-8 h-8 text-slate-600 mb-1" />
            <span>No hay notificaciones {notifFiltro === 'no_leidas' ? 'pendientes de lectura' : 'en el buzón'}.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {notificacionesFiltradas.map(n => (
              <div
                key={n.id}
                onClick={() => !n.leido && handleMarcarLeida(n.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  !n.leido 
                    ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-500/60 shadow-lg' 
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!n.leido && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.prioridad === 'urgente' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      n.prioridad === 'alta' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {n.prioridad.toUpperCase()}
                    </span>
                    <span className="font-bold text-slate-100 text-xs">{n.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{n.fecha_emision ? new Date(n.fecha_emision).toLocaleDateString('es-EC') : ''}</span>
                    <span>• {n.enviado_por}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-xs mt-2 whitespace-pre-wrap leading-relaxed">
                  {n.mensaje}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50 text-[10px] text-slate-400">
                  <span className="capitalize">Tipo: {n.tipo.replace('_', ' ')}</span>
                  {!n.leido ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarcarLeida(n.id);
                      }}
                      className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      Marcar como leída
                    </button>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Leída
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Proformas Automáticas por Nuevos Vehículos */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Proformas Automáticas de Registro y Renovación ($15/unidad)</h3>
          </div>
          <span className="text-xs text-slate-400">Plan Único Rutax-Smart Pro</span>
        </div>

        {rutaxStore.getProformas(currentCoop.id).length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No hay proformas generadas.
          </div>
        ) : (
          <div className="space-y-3">
            {rutaxStore.getProformas(currentCoop.id).map(prof => (
              <div key={prof.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400 text-sm">{prof.numero_proforma}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      prof.estado === 'pagada' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      prof.estado === 'pendiente_revision' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {prof.estado.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Emitida: {prof.fecha_emision} • Vence: {prof.fecha_vencimiento} • {prof.items.length} ítem(s) ($15 c/u)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {prof.items.map(i => i.descripcion).join(' | ')}
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-emerald-400 text-base">${prof.total.toFixed(2)} USD</div>
                    <div className="text-[10px] text-slate-400">Pendiente: ${prof.monto_pendiente.toFixed(2)}</div>
                  </div>
                  {prof.estado !== 'pagada' && (
                    <button
                      onClick={() => setModalSubir(true)}
                      className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pagar Proforma</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Comprobantes Enviados */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Historial de Comprobantes de Pago Reportados</h3>
          </div>
          <span className="text-xs text-slate-400">{historialPagos.length} comprobantes</span>
        </div>

        {historialPagos.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No se han reportado comprobantes todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {historialPagos.map(p => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">
                      {p.banco} • Op: {p.numero_operacion}
                    </span>
                    {p.estado === 'aprobado' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aprobado (+30d)
                      </span>
                    ) : p.estado === 'pendiente_revision' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En Revisión Central
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Rechazado
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Fecha de operación: {p.fecha_operacion} • Periodo cubierto: {p.periodo_desde} al {p.periodo_hasta}
                  </div>
                  {p.motivo_rechazo && (
                    <div className="text-[11px] text-rose-400 mt-1">
                      <strong>Observación:</strong> {p.motivo_rechazo}
                    </div>
                  )}
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <div className="font-mono font-extrabold text-emerald-400 text-base">
                    ${p.monto.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-slate-400">{p.metodo}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Subir Comprobante */}
      {modalSubir && (
        <ModalSubirComprobante
          cooperativaId={currentCoop.id}
          cooperativaNombre={currentCoop.nombre}
          montoSugerido={suscripcion?.monto_mensual || 150}
          cuentaDestino={config.cuenta_banco_principal}
          onClose={() => setModalSubir(false)}
          onSubmit={handleSubirComprobante}
        />
      )}
    </div>
  );
};
