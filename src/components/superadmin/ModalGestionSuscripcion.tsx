import React, { useState } from 'react';
import { Cooperativa, SuscripcionCooperativa, PlanSuscripcion, ComprobantePago, TipoNotificacionInterna } from '../../types';
import { rutaxStore } from '../../services/store';
import { 
  Building2, 
  X, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Percent, 
  MessageSquare, 
  Car,
  Receipt,
  FileCheck,
  AlertTriangle,
  Edit3,
  Bell,
  Send,
  User,
  Phone,
  Mail,
  Upload,
  Info,
  Layers,
  Shield,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Props {
  cooperativa: Cooperativa;
  suscripcion: SuscripcionCooperativa;
  planes: PlanSuscripcion[];
  historialPagos: ComprobantePago[];
  onClose: () => void;
  onExtenderGracia: (dias: number) => void;
  onBloquear: (tipo: 'parcial' | 'total', motivo: string) => void;
  onDesbloquear: () => void;
  onCambiarPlan: (planId: string) => void;
  onOtorgarDescuento: (porcentaje: number, motivo: string) => void;
  onEnviarWhatsApp: (tipo: any) => void;
  onSubirPagoManual: (monto: number, referencia: string, banco: any) => void;
}

export const ModalGestionSuscripcion: React.FC<Props> = ({
  cooperativa,
  suscripcion,
  planes,
  historialPagos,
  onClose,
  onExtenderGracia,
  onBloquear,
  onDesbloquear,
  onCambiarPlan,
  onOtorgarDescuento,
  onEnviarWhatsApp,
  onSubirPagoManual
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'acciones' | 'datos' | 'plan' | 'notificar' | 'pago' | 'descuento' | 'historial'>('acciones');
  const [diasGraciaExt, setDiasGraciaExt] = useState<number>(3);
  const [motivoBloqueo, setMotivoBloqueo] = useState('Mora en pago de suscripción mensual');
  const [nuevoPlanId, setNuevoPlanId] = useState(suscripcion.plan_id);
  const [descPct, setDescPct] = useState<number>(suscripcion.descuento_porcentaje || 0);
  const [descMotivo, setDescMotivo] = useState(suscripcion.motivo_descuento || 'Convenio institucional');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  
  // Edición de Datos de Cooperativa
  const [editNombre, setEditNombre] = useState(cooperativa.nombre);
  const [editRuc, setEditRuc] = useState(cooperativa.ruc);
  const [editDireccion, setEditDireccion] = useState(cooperativa.direccion || '');
  const [editPresidente, setEditPresidente] = useState(cooperativa.presidente_nombre || '');
  const [editCedula, setEditCedula] = useState(cooperativa.presidente_cedula || '');
  const [editCelular, setEditCelular] = useState(cooperativa.presidente_celular || '');
  const [editEmail, setEditEmail] = useState(cooperativa.presidente_email || '');
  const [editLogoUrl, setEditLogoUrl] = useState(cooperativa.logo_url || '');

  // Notificación Interna
  const [notifTitulo, setNotifTitulo] = useState('');
  const [notifMensaje, setNotifMensaje] = useState('');
  const [notifTipo, setNotifTipo] = useState<TipoNotificacionInterna>('aviso_cobranza');
  const [notifPrioridad, setNotifPrioridad] = useState<'normal' | 'alta' | 'urgente'>('normal');

  // Pago manual
  const [pagoMonto, setPagoMonto] = useState<string>(suscripcion.monto_mensual.toString());
  const [pagoRef, setPagoRef] = useState(`TRANSF-${Date.now().toString().slice(-6)}`);
  const [pagoBanco, setPagoBanco] = useState<'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros'>('Pichincha');

  const currentPlan = planes.find(p => p.id === suscripcion.plan_id) || planes[1];
  const fechaVenc = new Date(suscripcion.fecha_vencimiento);
  const diasFaltantes = Math.ceil((fechaVenc.getTime() - Date.now()) / (1000 * 3600 * 24));
  const notificacionesCoop = rutaxStore.getNotificacionesPorCooperativa(cooperativa.id);

  const handleGuardarDatosCooperativa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre.trim() || !editRuc.trim()) return;

    rutaxStore.editarCooperativa(cooperativa.id, {
      nombre: editNombre.trim(),
      ruc: editRuc.trim(),
      direccion: editDireccion.trim(),
      presidente_nombre: editPresidente.trim(),
      presidente_cedula: editCedula.trim(),
      presidente_celular: editCelular.trim(),
      presidente_email: editEmail.trim(),
      logo_url: editLogoUrl.trim()
    });

    setFeedbackMsg('✓ Información de la cooperativa actualizada con éxito.');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleEnviarNotificacionInterna = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitulo.trim() || !notifMensaje.trim()) return;

    rutaxStore.crearNotificacionInterna(cooperativa.id, {
      titulo: notifTitulo.trim(),
      mensaje: notifMensaje.trim(),
      tipo: notifTipo,
      prioridad: notifPrioridad,
      enviado_por: 'SuperAdmin Creador Rutax'
    });

    setNotifTitulo('');
    setNotifMensaje('');
    setFeedbackMsg('✓ Notificación interna enviada exitosamente a la cooperativa.');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Definición de las pestañas del menú optimizado sin scroll
  const menuTabs = [
    {
      id: 'acciones',
      label: 'Control & Bloqueo',
      icon: ShieldAlert,
      badge: null,
      accent: 'amber'
    },
    {
      id: 'datos',
      label: 'Editar Datos',
      icon: Edit3,
      badge: null,
      accent: 'purple'
    },
    {
      id: 'notificar',
      label: 'Notificaciones',
      icon: Bell,
      badge: notificacionesCoop.length > 0 ? notificacionesCoop.length : null,
      accent: 'sky'
    },
    {
      id: 'plan',
      label: 'Cambiar Plan',
      icon: Layers,
      badge: null,
      accent: 'purple'
    },
    {
      id: 'pago',
      label: 'Registrar Pago',
      icon: CreditCard,
      badge: null,
      accent: 'emerald'
    },
    {
      id: 'descuento',
      label: 'Descuento',
      icon: Percent,
      badge: suscripcion.descuento_porcentaje ? `${suscripcion.descuento_porcentaje}%` : null,
      accent: 'purple'
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: Receipt,
      badge: historialPagos.length > 0 ? historialPagos.length : null,
      accent: 'emerald'
    }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 transition-all">
        
        {/* Header con Resumen Institucional */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-purple-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {cooperativa.logo_url ? (
                <img src={cooperativa.logo_url} alt={cooperativa.nombre} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-purple-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 truncate">
                  {cooperativa.nombre}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold shrink-0">
                  Plan {currentPlan.nombre}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                RUC: <span className="font-mono text-slate-300">{cooperativa.ruc}</span> • <span className="text-emerald-400 font-semibold">{suscripcion.unidades_activas}</span> unidades activas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEnviarWhatsApp(suscripcion.estado_suscripcion)}
              title="Contactar vía WhatsApp"
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary KPI Bar Sobresaliente */}
        <div className="bg-slate-950/90 px-5 py-2.5 border-b border-slate-800 grid grid-cols-3 gap-2 sm:gap-4 text-xs">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Fecha de Vencimiento</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className={`font-mono font-bold text-xs ${diasFaltantes < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {fechaVenc.toLocaleDateString('es-EC')}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
              {diasFaltantes < 0 ? `⚠️ ${Math.abs(diasFaltantes)} días mora` : `✓ ${diasFaltantes} días restantes`}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Cuota Mensual</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                ${suscripcion.monto_mensual.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              ${suscripcion.precio_por_unidad}/unidad • {suscripcion.unidades_activas} uds
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Estado del Servicio</span>
            <div className="mt-0.5">
              {suscripcion.estado_suscripcion === 'activa' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Activa
                </span>
              ) : suscripcion.estado_suscripcion === 'por_vencer' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                  <Clock className="w-3 h-3" /> Por Vencer
                </span>
              ) : suscripcion.estado_suscripcion === 'vencida' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px] font-bold">
                  <AlertTriangle className="w-3 h-3" /> Gracia (Mora)
                </span>
              ) : suscripcion.estado_suscripcion === 'bloqueo_parcial' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                  <Lock className="w-3 h-3" /> Bloqueo Parcial
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-600/30 text-[11px] font-bold">
                  <ShieldAlert className="w-3 h-3" /> Bloqueo Total
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {suscripcion.bloqueos_historial?.length ? `${suscripcion.bloqueos_historial.length} eventos` : 'Sin sanciones'}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mx-5 mt-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            MENÚ DE SUB-PESTAÑAS OPTIMIZADO: SIN SCROLL & SOBRESALIENTE
            ═══════════════════════════════════════════════════════════ */}
        <div className="p-2 sm:p-2.5 bg-slate-950/90 border-b border-slate-800">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 w-full">
            {menuTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer font-bold text-xs select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50 scale-[1.02] z-10'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 shadow-sm active:scale-95'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate text-[11px] sm:text-xs font-semibold leading-tight">
                    {tab.label}
                  </span>
                  
                  {/* Badge numérico si aplica */}
                  {tab.badge !== null && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-extrabold shrink-0 ${
                      isActive 
                        ? 'bg-white text-purple-700' 
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CUERPO DEL MODAL (PANELES CON BOTONES SOBRESALIENTES)
            ═══════════════════════════════════════════════════════════ */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-200">
          
          {/* Sub-Tab 1: Bloqueos & Gracia */}
          {activeSubTab === 'acciones' && (
            <div className="space-y-4">
              {/* Extensión de Gracia Manual */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>Extensión Manual de Días de Gracia</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Pospone el bloqueo sin registrar un comprobante</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    value={diasGraciaExt}
                    onChange={e => setDiasGraciaExt(Number(e.target.value))}
                    className="h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>+1 día adicional</option>
                    <option value={3}>+3 días de gracia</option>
                    <option value={5}>+5 días de prórroga</option>
                    <option value={7}>+7 días (1 semana)</option>
                    <option value={15}>+15 días de espera</option>
                  </select>
                  <button
                    onClick={() => onExtenderGracia(diasGraciaExt)}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aplicar Prórroga Inmediata</span>
                  </button>
                </div>
              </div>

              {/* Bloqueo y Desbloqueo */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span>Protocolo de Restricción Operativa (Bloqueo Progresivo)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  El protocolo gradual permite suspender inicialmente la asignación y despacho de viajes a conductores, y en segunda fase bloquear el acceso administrativo integral.
                </p>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold text-[11px]">Motivo del Bloqueo / Observación:</label>
                  <input
                    type="text"
                    value={motivoBloqueo}
                    onChange={e => setMotivoBloqueo(e.target.value)}
                    placeholder="Ej: Falta de pago recurrente ciclo Septiembre 2026"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => onBloquear('parcial', motivoBloqueo)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloqueo Parcial (Despacho Off)</span>
                  </button>
                  <button
                    onClick={() => onBloquear('total', motivoBloqueo)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Bloqueo Total del Sistema</span>
                  </button>
                  <button
                    onClick={onDesbloquear}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Desbloquear & Reactivar Servicio</span>
                  </button>
                </div>
              </div>

              {/* Contacto Directo WhatsApp */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div>
                  <span className="font-bold text-emerald-400 block text-xs">Directiva / Cobranzas:</span>
                  <span className="text-slate-200 text-xs font-semibold">{cooperativa.presidente_nombre}</span>
                  <span className="text-slate-400 text-[11px] block">{cooperativa.presidente_celular} {cooperativa.presidente_email ? `• ${cooperativa.presidente_email}` : ''}</span>
                </div>
                <button
                  onClick={() => onEnviarWhatsApp(suscripcion.estado_suscripcion)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Notificar por WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Editar Datos de la Cooperativa */}
          {activeSubTab === 'datos' && (
            <form onSubmit={handleGuardarDatosCooperativa} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span>1. Información Legal e Institucional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Nombre de la Cooperativa *</label>
                    <input
                      type="text"
                      required
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">RUC Institucional (13 dígitos) *</label>
                    <input
                      type="text"
                      required
                      value={editRuc}
                      onChange={e => setEditRuc(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Dirección Principal / Sede</label>
                    <input
                      type="text"
                      value={editDireccion}
                      onChange={e => setEditDireccion(e.target.value)}
                      placeholder="Av. Principal y Calle Secundaria, Guayaquil, Ecuador"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">URL del Logo Institucional</label>
                    <input
                      type="text"
                      value={editLogoUrl}
                      onChange={e => setEditLogoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <User className="w-4 h-4" />
                  </div>
                  <span>2. Directiva & Representante Legal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Nombre del Presidente / Administrador</label>
                    <input
                      type="text"
                      value={editPresidente}
                      onChange={e => setEditPresidente(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Cédula de Identidad</label>
                    <input
                      type="text"
                      value={editCedula}
                      onChange={e => setEditCedula(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Celular / WhatsApp Oficial *</label>
                    <input
                      type="text"
                      value={editCelular}
                      onChange={e => setEditCelular(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Correo Electrónico Oficial</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios de la Cooperativa</span>
                </button>
              </div>
            </form>
          )}

          {/* Sub-Tab 3: Enviar Notificación Interna */}
          {activeSubTab === 'notificar' && (
            <div className="space-y-4">
              <form onSubmit={handleEnviarNotificacionInterna} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Send className="w-4 h-4" />
                  </div>
                  <span>Emitir Comunicado / Notificación Interna Oficial</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Esta notificación aparecerá en el buzón y tablero administrativo de la cooperativa en tiempo real.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Tipo de Notificación:</label>
                    <select
                      value={notifTipo}
                      onChange={e => setNotifTipo(e.target.value as any)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="aviso_cobranza">Aviso de Cobranza / Factura Mensual</option>
                      <option value="comprobante_aprobado">Comprobante Aprobado</option>
                      <option value="comprobante_rechazado">Comprobante Observado / Rechazado</option>
                      <option value="actualizacion_plan">Actualización de Plan / Tarifas</option>
                      <option value="bloqueo_aviso">Aviso de Suspensión / Gracia</option>
                      <option value="comunicado_general">Comunicado General / Mantenimiento</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Nivel de Prioridad:</label>
                    <select
                      value={notifPrioridad}
                      onChange={e => setNotifPrioridad(e.target.value as any)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
                    >
                      <option value="normal">Normal (Informativa)</option>
                      <option value="alta">Alta (Importante)</option>
                      <option value="urgente">Urgente (Crítica / Cobranzas)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Título del Mensaje *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Emisión de cuota mensual y recordatorio de pago"
                      value={notifTitulo}
                      onChange={e => setNotifTitulo(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Cuerpo del Mensaje *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Estimados directivos, se les comunica formalmente que..."
                      value={notifMensaje}
                      onChange={e => setNotifMensaje(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 resize-none font-sans"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Emitir Notificación a la Cooperativa</span>
                  </button>
                </div>
              </form>

              {/* Historial de Notificaciones Emitidas */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  <span>Buzón de Notificaciones Emitidas ({notificacionesCoop.length})</span>
                </div>

                {notificacionesCoop.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No se han emitido notificaciones internas a esta cooperativa todavía.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notificacionesCoop.map(n => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.prioridad === 'urgente' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              n.prioridad === 'alta' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}>
                              {n.prioridad.toUpperCase()}
                            </span>
                            <span className="font-bold text-slate-100">{n.titulo}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.fecha_emision ? new Date(n.fecha_emision).toLocaleDateString('es-EC') : ''}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed mt-1">{n.mensaje}</p>
                        <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                          <span>Emisor: {n.enviado_por}</span>
                          <span>{n.leido ? '✓ Leída por la cooperativa' : '⏳ Pendiente de lectura'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Registrar Pago Directo */}
          {activeSubTab === 'pago' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>Registro Directo de Pago (+30 Días de Servicio)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Extiende automáticamente la vigencia 30 días adicionales, actualiza el registro contable y elimina cualquier restricción operativa.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Monto Recibido ($ USD):</label>
                    <input
                      type="number"
                      value={pagoMonto}
                      onChange={e => setPagoMonto(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Banco / Destino:</label>
                    <select
                      value={pagoBanco}
                      onChange={e => setPagoBanco(e.target.value as any)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="Pichincha">Banco Pichincha</option>
                      <option value="Guayaquil">Banco Guayaquil</option>
                      <option value="Produbanco">Produbanco</option>
                      <option value="Otros">Efectivo / Recaudación Directa</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]"># Comprobante / Ref.:</label>
                    <input
                      type="text"
                      value={pagoRef}
                      onChange={e => setPagoRef(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => onSubirPagoManual(Number(pagoMonto), pagoRef, pagoBanco)}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/30 mt-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Procesar Pago, Registrar Comprobante & Renovar 30 Días</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab 5: Cambiar Plan */}
          {activeSubTab === 'plan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Seleccionar Plan de Suscripción Integral</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {planes.map(p => {
                    const isSelected = nuevoPlanId === p.id;
                    const isCurrent = suscripcion.plan_id === p.id;
                    
                    return (
                      <div
                        key={p.id}
                        onClick={() => setNuevoPlanId(p.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-400 bg-purple-950/40 ring-2 ring-purple-500 shadow-lg shadow-purple-900/30'
                            : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 text-xs">{p.nombre}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                              Actual
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-emerald-400 font-extrabold text-base mt-2">
                          ${p.precio_por_unidad}/ud
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Total {suscripcion.unidades_activas} unidades: <strong className="text-slate-200">${(p.precio_por_unidad * suscripcion.unidades_activas).toFixed(2)}/mes</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => onCambiarPlan(nuevoPlanId)}
                  disabled={nuevoPlanId === suscripcion.plan_id}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-600/30 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Actualizar Plan y Recalcular Cuota Mensual</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab 6: Descuento Especial */}
          {activeSubTab === 'descuento' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5 shadow-inner">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Percent className="w-4 h-4" />
                  </div>
                  <span>Otorgar Descuento Institucional / Comercial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Porcentaje de Descuento (%):</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={descPct}
                      onChange={e => setDescPct(Number(e.target.value))}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Motivo / Convenio:</label>
                    <input
                      type="text"
                      placeholder="Ej: Convenio FENATAC, Lanzamiento 2026..."
                      value={descMotivo}
                      onChange={e => setDescMotivo(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Cuota Recalculada con Descuento:</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">
                    ${(currentPlan.precio_por_unidad * suscripcion.unidades_activas * (1 - (descPct / 100))).toFixed(2)} USD / mes
                  </span>
                </div>

                <button
                  onClick={() => onOtorgarDescuento(descPct, descMotivo)}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-600/30 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Aplicar Descuento Comercial</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tab 7: Historial de Comprobantes */}
          {activeSubTab === 'historial' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-slate-100 text-xs">Registro Histórico de Pagos y Comprobantes</span>
                <span className="text-[11px] text-slate-400 font-mono">{historialPagos.length} registros</span>
              </div>

              {historialPagos.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
                  No hay comprobantes de pago registrados para esta cooperativa.
                </div>
              ) : (
                historialPagos.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-all shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{p.banco} • #{p.numero_operacion}</span>
                        {p.estado === 'aprobado' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">Aprobado</span>
                        ) : p.estado === 'pendiente_revision' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">Pendiente</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">Rechazado</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        Fecha: <span className="text-slate-300">{p.fecha_operacion}</span> • Periodo: {p.periodo_desde} al {p.periodo_hasta}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-emerald-400 text-sm">
                        ${p.monto.toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">{p.metodo}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
