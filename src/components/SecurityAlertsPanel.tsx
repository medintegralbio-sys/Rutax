import React, { useState, useEffect } from 'react';
import { rutaxStore } from '../services/store';
import {
  AlertaSeguridad,
  NotificacionBaseConductores,
  ZonaRiesgo,
  HuellasRegistradas,
  LogSeguridad,
  ConfiguracionSeguridadCoop,
  ResolucionAlerta,
  DestinatarioNotificacion,
  PrioridadNotificacion,
  Usuario,
  Vehiculo
} from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Fingerprint,
  Send,
  Volume2,
  VolumeX,
  PhoneCall,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Car,
  User,
  Shield,
  Plus,
  Trash2,
  Key,
  Mic,
  AlertOctagon,
  Download,
  Share2,
  Bell,
  Flame,
  Settings
} from 'lucide-react';
import {
  buildECU911Script,
  buildWhatsAppEmergencyMessage,
  generatePoliceDenunciaPDF,
  playSecurityAlarm,
  stopSecurityAlarm
} from '../services/securityServices';

interface SecurityAlertsPanelProps {
  currentUser?: Usuario;
  onSelectLocationOnMap?: (lat: number, lng: number) => void;
}

export const SecurityAlertsPanel: React.FC<SecurityAlertsPanelProps> = ({
  currentUser,
  onSelectLocationOnMap
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'alertas' | 'notificaciones' | 'zonas_riesgo' | 'biometria' | 'logs' | 'configuracion'>('alertas');
  const [, setTick] = useState(0);

  useEffect(() => {
    return rutaxStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const coopId = currentUser?.cooperativaId || rutaxStore.currentCoopId;
  const currentCoop = rutaxStore.getCurrentCoop();
  const config = rutaxStore.getConfigSeguridad(coopId);

  // Colecciones
  const alertas = rutaxStore.getAlertasSeguridad(coopId);
  const alertasActivas = rutaxStore.getAlertasSeguridadActivas(coopId);
  const notificaciones = rutaxStore.getNotificacionesConductores(coopId);
  const zonasRiesgo = rutaxStore.getZonasRiesgo(coopId);
  const huellas = rutaxStore.huellasRegistradas;
  const logs = rutaxStore.getLogsSeguridad(coopId);
  const usuariosChoferes = rutaxStore.usuarios.filter(u => (u.rol === 'chofer' || u.rol === 'socio') && u.cooperativaId === coopId);
  const vehiculos = rutaxStore.vehiculos.filter(v => v.cooperativaId === coopId);

  // Estados de Modales y Formularios
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaSeguridad | null>(null);
  const [showECUModal, setShowECUModal] = useState(false);
  const [ecuScriptAlerta, setEcuScriptAlerta] = useState<AlertaSeguridad | null>(null);
  const [copiedECU, setCopiedECU] = useState(false);
  const [showMasterKeyModal, setShowMasterKeyModal] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [masterKeyError, setMasterKeyError] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [resolucionSeleccionada, setResolucionSeleccionada] = useState<ResolucionAlerta>('chofer_a_salvo');
  const [resolucionObservaciones, setResolucionObservaciones] = useState('');

  // Formulario Notificación Base -> Choferes
  const [notifTitulo, setNotifTitulo] = useState('');
  const [notifMensaje, setNotifMensaje] = useState('');
  const [notifDestinatario, setNotifDestinatario] = useState<DestinatarioNotificacion>('todos');
  const [notifChoferId, setNotifChoferId] = useState('');
  const [notifUnidadId, setNotifUnidadId] = useState('');
  const [notifPrioridad, setNotifPrioridad] = useState<PrioridadNotificacion>('normal');
  const [notifRequiereConfirmacion, setNotifRequiereConfirmacion] = useState(true);
  const [notifVozTTS, setNotifVozTTS] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  // Formulario Zona de Riesgo
  const [showZonaModal, setShowZonaModal] = useState(false);
  const [zonaNombre, setZonaNombre] = useState('');
  const [zonaDescripcion, setZonaDescripcion] = useState('');
  const [zonaLat, setZonaLat] = useState(-2.1480);
  const [zonaLng, setZonaLng] = useState(-79.8950);
  const [zonaRadio, setZonaRadio] = useState(300);
  const [zonaNivel, setZonaNivel] = useState<'amarillo' | 'rojo'>('rojo');
  const [zonaHoraInicio, setZonaHoraInicio] = useState('19:00');
  const [zonaHoraFin, setZonaHoraFin] = useState('05:00');

  // Formulario Registro Biométrico
  const [showBiometriaModal, setShowBiometriaModal] = useState(false);
  const [bioChoferId, setBioChoferId] = useState('');
  const [bioPinNormal, setBioPinNormal] = useState('123456');
  const [bioScanningNormal, setBioScanningNormal] = useState(false);
  const [bioScanningCoaccion, setBioScanningCoaccion] = useState(false);
  const [bioNormalDone, setBioNormalDone] = useState(false);
  const [bioCoaccionDone, setBioCoaccionDone] = useState(false);

  // Formulario Configuración
  const [configForm, setConfigForm] = useState<ConfiguracionSeguridadCoop>({ ...config });
  const [configSaved, setConfigSaved] = useState(false);

  // Silenciar / Probar alarma
  const [isAlarmTesting, setIsAlarmTesting] = useState(false);

  const handleTestAlarm = () => {
    if (isAlarmTesting) {
      stopSecurityAlarm();
      setIsAlarmTesting(false);
    } else {
      playSecurityAlarm('sos');
      setIsAlarmTesting(true);
    }
  };

  const handleCopyECU = (alerta: AlertaSeguridad) => {
    const script = buildECU911Script(alerta, currentCoop?.nombre || 'Cooperativa de Transporte');
    navigator.clipboard.writeText(script);
    setCopiedECU(true);
    setTimeout(() => setCopiedECU(false), 3000);
  };

  const handleSendWhatsAppEmergency = (alerta: AlertaSeguridad) => {
    const msg = buildWhatsAppEmergencyMessage(alerta, currentCoop?.nombre || 'Cooperativa de Transporte');
    const phone = config.numero_emergencia_coop || '593998765432';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = (alerta: AlertaSeguridad) => {
    if (currentCoop) {
      generatePoliceDenunciaPDF(alerta, currentCoop);
    }
  };

  const handleUnlockWithMasterKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlerta) return;
    setMasterKeyError(null);

    const ok = rutaxStore.desactivarConClaveMaestra(selectedAlerta.id, masterKeyInput.trim(), currentUser?.uid || 'usr-admin');
    if (ok) {
      setShowMasterKeyModal(false);
      setMasterKeyInput('');
      setSelectedAlerta(null);
    } else {
      setMasterKeyError('Clave Maestra incorrecta. Ingrese la clave configurada para la cooperativa.');
    }
  };

  const handleConfirmCloseAlerta = () => {
    if (!selectedAlerta) return;
    rutaxStore.cerrarAlerta(
      selectedAlerta.id,
      resolucionSeleccionada,
      resolucionObservaciones.trim() || 'Cierre registrado por operador de base',
      currentUser?.uid || 'usr-admin'
    );
    setShowCloseModal(false);
    setSelectedAlerta(null);
    setResolucionObservaciones('');
  };

  const handleSendNotificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitulo.trim() || !notifMensaje.trim()) return;

    rutaxStore.enviarNotificacionConductores({
      cooperativaId: coopId,
      de: {
        usuario_id: currentUser?.uid || 'usr-admin',
        rol: currentUser?.rol || 'admin_coop',
        nombre: currentUser?.nombre_completo || 'Base Central',
        base_id: currentUser?.base_asignada || null
      },
      para: notifDestinatario,
      unidad_destino_id: notifDestinatario === 'unidad_especifica' ? notifUnidadId : null,
      titulo: notifTitulo.trim(),
      mensaje: notifMensaje.trim(),
      prioridad: notifPrioridad,
      requiere_confirmacion: notifRequiereConfirmacion,
      leer_en_voz_alta: notifVozTTS,
      expira_en_min: 120
    });

    setNotifFeedback('Notificación transmitida a los conductores exitosamente.');
    setNotifTitulo('');
    setNotifMensaje('');
    setTimeout(() => setNotifFeedback(null), 4000);
  };

  const handleSaveZonaRiesgo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zonaNombre.trim()) return;

    rutaxStore.crearZonaRiesgo({
      cooperativaId: coopId,
      nombre: zonaNombre.trim(),
      descripcion: zonaDescripcion.trim() || 'Zona de riesgo nocturno monitoreada',
      tipo: 'circulo',
      lat: Number(zonaLat),
      lng: Number(zonaLng),
      radio: Number(zonaRadio),
      horario_activo: {
        activo_todos_dias: true,
        dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
        hora_inicio: zonaHoraInicio,
        hora_fin: zonaHoraFin
      },
      nivel_alerta: zonaNivel,
      gps_frecuencia_forzada: 10,
      grabar_audio_al_entrar: true,
      notificar_socio_al_entrar: true,
      activa: true,
      creada_por: currentUser?.uid || 'usr-admin',
      ultima_entrada: null
    });

    setShowZonaModal(false);
    setZonaNombre('');
    setZonaDescripcion('');
  };

  const handleStartScanFingerprint = (tipo: 'normal' | 'coaccion') => {
    if (tipo === 'normal') {
      setBioScanningNormal(true);
      setTimeout(() => {
        setBioScanningNormal(false);
        setBioNormalDone(true);
      }, 1500);
    } else {
      setBioScanningCoaccion(true);
      setTimeout(() => {
        setBioScanningCoaccion(false);
        setBioCoaccionDone(true);
      }, 1500);
    }
  };

  const handleSaveBiometria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioChoferId) return;

    rutaxStore.registrarHuellaChofer({
      cooperativaId: coopId,
      chofer_id: bioChoferId,
      huella_normal_hash: `fp_idx_${bioChoferId}_${Date.now()}`,
      huella_coaccion_hash: `fp_med_${bioChoferId}_${Date.now()}`,
      pin_emergencia_6_digitos: bioPinNormal || '123456',
      face_id_registrado: false,
      fecha_registro: new Date().toISOString(),
      ultima_verificacion: new Date().toISOString(),
      modo_biometrico_activo: 'huella'
    });

    setShowBiometriaModal(false);
    setBioChoferId('');
    setBioNormalDone(false);
    setBioCoaccionDone(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    rutaxStore.guardarConfigSeguridad(configForm);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* BANNER DE ALERTA DE EMERGENCIA ACTIVA (OMNIPRESENTE)     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {alertasActivas.length > 0 && (
        <div className="bg-rose-950 border-2 border-rose-500 rounded-3xl p-5 shadow-2xl animate-pulse space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-600 text-white animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                    🚨 {alertasActivas.length} EMERGENCIA{alertasActivas.length > 1 ? 'S' : ''} EN CURSO
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    Sirena Base: {config.notificar_contactos.admin ? 'HABILITADA' : 'SILENCIADA'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  Atención Inmediata de Seguridad Requerida
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleTestAlarm}
                className="h-10 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5"
              >
                {isAlarmTesting ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
                <span>{isAlarmTesting ? 'Detener Sirena' : 'Probar Sirena'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {alertasActivas.map(alerta => (
              <div
                key={alerta.id}
                className={`p-4 rounded-2xl border ${
                  alerta.tipo === 'sos_accidente'
                    ? 'bg-rose-900/60 border-rose-500'
                    : alerta.tipo === 'antirrobo'
                    ? 'bg-slate-900 border-purple-500'
                    : 'bg-amber-950/60 border-amber-500'
                } flex flex-col justify-between gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">
                        Unidad #{alerta.unidadNumero || alerta.unidadId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {alerta.placa || 'S/P'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        alerta.tipo === 'sos_accidente'
                          ? 'bg-rose-500 text-slate-950'
                          : alerta.tipo === 'antirrobo'
                          ? 'bg-purple-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {alerta.tipo.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">
                      Conductor: <strong className="text-white">{alerta.choferNombre || 'Chofer'}</strong>
                    </p>
                    <p className="text-xs text-rose-200 mt-1 font-medium">
                      📍 {alerta.direccion_referencia} ({alerta.lat.toFixed(4)}, {alerta.lng.toFixed(4)})
                    </p>
                    {alerta.mensaje_coaccion && (
                      <div className="mt-2 p-2 rounded-xl bg-purple-950/80 border border-purple-400 text-purple-200 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                        <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{alerta.mensaje_coaccion}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas para la Alerta */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-rose-800/40">
                  <button
                    onClick={() => {
                      setEcuScriptAlerta(alerta);
                      setShowECUModal(true);
                    }}
                    className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                    <span>Guion ECU 911</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsAppEmergency(alerta)}
                    className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp Alerta</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPDF(alerta)}
                    className="h-9 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Informe PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlerta(alerta);
                      setShowMasterKeyModal(true);
                    }}
                    className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 ml-auto"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Desactivar (Clave Base)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlerta(alerta);
                      setShowCloseModal(true);
                    }}
                    className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cerrar Alerta</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-100 tracking-tight">
                CENTRO DE SEGURIDAD SOS, ANTIRROBO Y NOTIFICACIONES
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                24/7 EN LÍNEA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Protocolo de Emergencia, Rastreo de Asaltos, Huella de Coacción y Comunicados Base ↔ Conductores
            </p>
          </div>
        </div>
      </div>

      {/* MÉTRICAS RÁPIDAS DE SEGURIDAD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold">Alertas Activas</span>
          <div className="text-xl font-black text-rose-400 mt-1 flex items-center gap-1.5 font-mono">
            <ShieldAlert className="w-4 h-4" />
            <span>{alertasActivas.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold">Zonas de Riesgo</span>
          <div className="text-xl font-black text-amber-400 mt-1 flex items-center gap-1.5 font-mono">
            <AlertOctagon className="w-4 h-4" />
            <span>{zonasRiesgo.filter(z => z.activa).length}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold">Huellas Enroladas</span>
          <div className="text-xl font-black text-sky-400 mt-1 flex items-center gap-1.5 font-mono">
            <Fingerprint className="w-4 h-4" />
            <span>{huellas.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold">Comunicados</span>
          <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5 font-mono">
            <Bell className="w-4 h-4" />
            <span>{notificaciones.length}</span>
          </div>
        </div>
      </div>

      {/* SUBTABS NAVIGATION */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('alertas')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'alertas'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Alertas SOS & Antirrobo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-[10px] font-mono font-bold">
            {alertas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('notificaciones')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'notificaciones'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Notificaciones Base ↔ Conductores</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] font-mono font-bold">
            {notificaciones.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('zonas_riesgo')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'zonas_riesgo'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span>Zonas de Riesgo ({zonasRiesgo.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('biometria')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'biometria'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-sky-400" />
          <span>Huellas & PIN ({huellas.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'logs'
              ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Logs de Seguridad</span>
        </button>

        <button
          onClick={() => setActiveSubTab('configuracion')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeSubTab === 'configuracion'
              ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBTAB 1: ALERTAS SOS & ANTIRROBO                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'alertas' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Historial y Registro de Alertas de Seguridad</span>
            </h3>

            {alertas.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No hay alertas de seguridad registradas. El sistema está operando con normalidad.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Estado / Tipo</th>
                      <th className="p-3">Unidad / Chofer</th>
                      <th className="p-3">Ubicación y Hora</th>
                      <th className="p-3">Detalle</th>
                      <th className="p-3">Evidencia</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {alertas.map(alerta => (
                      <tr key={alerta.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              alerta.estado === 'activa'
                                ? 'bg-rose-500 text-slate-950 animate-pulse'
                                : alerta.estado === 'atendiendo'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {alerta.estado}
                            </span>
                            <span className="text-[11px] font-bold text-slate-300 uppercase">
                              {alerta.tipo.replace('_', ' ')}
                            </span>
                          </div>
                          {alerta.resolucion && (
                            <span className="text-[10px] text-emerald-400 block mt-0.5">
                              Resuelto: {alerta.resolucion}
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-100">
                            Unidad #{alerta.unidadNumero || alerta.unidadId} <span className="text-slate-400 font-normal">({alerta.placa || 'S/P'})</span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {alerta.choferNombre || 'Chofer Asignado'}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="text-slate-300 font-medium">
                            {alerta.direccion_referencia}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(alerta.timestamp_activacion).toLocaleString('es-EC')}
                          </div>
                        </td>

                        <td className="p-3">
                          <p className="text-slate-300 text-[11px] line-clamp-2">
                            {alerta.motivo_detalle || 'Sin detalle adicional'}
                          </p>
                          {alerta.mensaje_coaccion && (
                            <span className="text-[10px] font-bold text-purple-400 block mt-0.5">
                              ⚠️ Coacción detectada
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {alerta.audio_urls?.length > 0 && (
                              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold flex items-center gap-1">
                                <Mic className="w-3 h-3" />
                                {alerta.audio_urls.length} audio(s)
                              </span>
                            )}
                            {alerta.puntos_gps_robos?.length > 0 && (
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                                <Radio className="w-3 h-3" />
                                {alerta.puntos_gps_robos.length} pts GPS
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEcuScriptAlerta(alerta);
                                setShowECUModal(true);
                              }}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400"
                              title="Generar Guion ECU 911"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppEmergency(alerta)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400"
                              title="Enviar por WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadPDF(alerta)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400"
                              title="Descargar Informe PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {alerta.estado === 'activa' && (
                              <button
                                onClick={() => {
                                  setSelectedAlerta(alerta);
                                  setShowCloseModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                              >
                                Cerrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBTAB 2: NOTIFICACIONES BASE ↔ CONDUCTORES              */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'notificaciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel Izquierdo: Redactar Notificación */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Enviar Comunicado a Conductores</span>
            </h3>

            {notifFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notifFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSendNotificacion} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Destinatarios</label>
                <select
                  value={notifDestinatario}
                  onChange={e => setNotifDestinatario(e.target.value as DestinatarioNotificacion)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-emerald-500"
                >
                  <option value="todos">Todos los Choferes de la Cooperativa</option>
                  <option value="en_ruta">Solo Conductores En Ruta / Circulación</option>
                  <option value="en_base_a">Solo Conductores en Base A</option>
                  <option value="en_base_b">Solo Conductores en Base B</option>
                  <option value="unidad_especifica">Unidad Específica</option>
                </select>
              </div>

              {notifDestinatario === 'unidad_especifica' && (
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Seleccionar Unidad</label>
                  <select
                    value={notifUnidadId}
                    onChange={e => setNotifUnidadId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>Unidad #{v.numero_unidad} - {v.placa}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Prioridad del Mensaje</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'urgente', 'critica'] as PrioridadNotificacion[]).map(pri => (
                    <button
                      type="button"
                      key={pri}
                      onClick={() => setNotifPrioridad(pri)}
                      className={`py-2 rounded-xl font-bold uppercase text-[11px] border transition-all ${
                        notifPrioridad === pri
                          ? pri === 'critica'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : pri === 'urgente'
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Título / Asunto</label>
                <input
                  type="text"
                  placeholder="Ej: Desvío por trabajos en Av. Principal"
                  value={notifTitulo}
                  onChange={e => setNotifTitulo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Mensaje para el Conductor</label>
                <textarea
                  rows={3}
                  placeholder="Instrucciones precisas para la flota..."
                  value={notifMensaje}
                  onChange={e => setNotifMensaje(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifRequiereConfirmacion}
                    onChange={e => setNotifRequiereConfirmacion(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                  />
                  <span>Exigir confirmación obligatoria ("RECIBIDO")</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifVozTTS}
                    onChange={e => setNotifVozTTS(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                  />
                  <span>Reproducir con Voz TTS al chofer en app</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Transmitir Comunicado a Choferes</span>
              </button>
            </form>
          </div>

          {/* Panel Derecho: Historial y Confirmaciones en Tiempo Real */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-400" />
                <span>Historial y Estado de Recepción de Comunicados</span>
              </span>
              <span className="text-xs text-slate-400">
                {notificaciones.length} emitidas
              </span>
            </h3>

            {notificaciones.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No se han emitido comunicados a conductores todavía.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {notificaciones.map(notif => (
                  <div
                    key={notif.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            notif.prioridad === 'critica'
                              ? 'bg-rose-500 text-slate-950'
                              : notif.prioridad === 'urgente'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {notif.prioridad}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100">
                            {notif.titulo}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          {notif.mensaje}
                        </p>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>Remitente: {notif.de.nombre}</span>
                          <span>•</span>
                          <span>{new Date(notif.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>Destino: {notif.para}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Confirmación */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmado ("RECIBIDO"): {notif.confirmada_por.length}
                        </span>
                        <span className="text-slate-400">
                          Pendiente: {notif.no_leida_por?.length || 0}
                        </span>
                      </div>

                      {notif.confirmada_por.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {notif.confirmada_por.map((choferId, idx) => {
                            const ch = usuariosChoferes.find(u => u.uid === choferId);
                            return (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-mono border border-emerald-500/20 flex items-center gap-1"
                              >
                                <span>✓ {ch?.nombre_completo || choferId}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBTAB 3: ZONAS DE RIESGO                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'zonas_riesgo' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  <span>Geocercas de Zonas Peligrosas y Monitoreo Nocturno</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cuando un bus entra a estas coordenadas durante el horario crítico, el sistema emite alerta automática a base y chofer.
                </p>
              </div>
              <button
                onClick={() => setShowZonaModal(true)}
                className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Zona</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {zonasRiesgo.map(zona => (
                <div
                  key={zona.id}
                  className={`p-4 rounded-2xl border ${
                    zona.activa
                      ? zona.nivel_alerta === 'rojo'
                        ? 'bg-rose-950/40 border-rose-500/50'
                        : 'bg-amber-950/40 border-amber-500/50'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                  } space-y-2`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          zona.nivel_alerta === 'rojo' ? 'bg-rose-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                        }`}>
                          NIVEL {zona.nivel_alerta}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">
                          {zona.nombre}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {zona.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                    <div>📍 Radio: <strong>{zona.radio}m</strong> • ({zona.lat.toFixed(4)}, {zona.lng.toFixed(4)})</div>
                    <div>⏰ Horario Crítico: <strong>{zona.horario_activo.hora_inicio} a {zona.horario_activo.hora_fin}</strong></div>
                    <div>📊 Entradas registradas: <strong className="text-slate-200">{zona.total_entradas_historico}</strong></div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => rutaxStore.toggleZonaRiesgo(zona.id, !zona.activa)}
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                        zona.activa
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {zona.activa ? '✓ Activa' : 'Pausada'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar zona de riesgo "${zona.nombre}"?`)) {
                          rutaxStore.eliminarZonaRiesgo(zona.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBTAB 4: BIOMETRÍA (HUELLAS & PIN)                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'biometria' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-sky-400" />
                  <span>Enrolamiento de Huellas Digitales y PIN Antirrobo por Conductor</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configuración de Dedo Índice (Normal) vs. Dedo Medio (Coacción / Amenaza bajo asalto) y PINs de seguridad.
                </p>
              </div>
              <button
                onClick={() => setShowBiometriaModal(true)}
                className="h-9 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Enrolar Conductor</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Conductor</th>
                    <th className="p-3">Huella Normal (Índice)</th>
                    <th className="p-3">Huella Coacción (Medio)</th>
                    <th className="p-3">PIN Emergencia</th>
                    <th className="p-3">Fecha Enrolamiento</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usuariosChoferes.map((chofer, index) => {
                    const bio = huellas.find(h => h.chofer_id === chofer.uid);
                    return (
                      <tr key={`${chofer.uid}-${index}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-100">
                          {chofer.nombre_completo}
                          <span className="block text-[11px] text-slate-400 font-normal">
                            Tel: {chofer.telefono} • Cédula: {chofer.cedula || 'N/A'}
                          </span>
                        </td>

                        <td className="p-3">
                          {bio?.huella_normal_hash ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              ✓ Enrolada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          {bio?.huella_coaccion_hash ? (
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                              ✓ Enrolada (Dedo Medio)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono font-bold text-slate-300">
                          {bio?.pin_emergencia_6_digitos ? '••••••' : 'N/A'}
                        </td>

                        <td className="p-3 text-slate-400 text-[11px]">
                          {bio?.fecha_registro ? new Date(bio.fecha_registro).toLocaleDateString('es-EC') : 'No configurado'}
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setBioChoferId(chofer.uid);
                              setBioPinNormal(bio?.pin_emergencia_6_digitos || '123456');
                              setBioNormalDone(!!bio?.huella_normal_hash);
                              setBioCoaccionDone(!!bio?.huella_coaccion_hash);
                              setShowBiometriaModal(true);
                            }}
                            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[11px]"
                          >
                            {bio ? 'Editar' : 'Enrolar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBTAB 5: LOGS DE SEGURIDAD                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Auditoría Forense y Trazabilidad de Eventos de Seguridad</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Detalle</th>
                  <th className="p-3">Chofer / Unidad</th>
                  <th className="p-3">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.evento.includes('sos') || log.evento.includes('antirrobo')
                          ? 'bg-rose-500/20 text-rose-300'
                          : log.evento.includes('coaccion')
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.evento}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200 font-sans text-xs">
                      {log.detalle}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {log.chofer_id || 'N/A'} • {log.unidad_id || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('es-EC')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBTAB 6: CONFIGURACIÓN DE SEGURIDAD                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeSubTab === 'configuracion' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 max-w-3xl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Parámetros de Seguridad de la Cooperativa</span>
          </h3>

          {configSaved && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuración guardada correctamente.</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Pulsación Antirrobo (Segundos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={configForm.antirrobo_long_press_seg}
                  onChange={e => setConfigForm({ ...configForm, antirrobo_long_press_seg: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Frecuencia Rastreo GPS en Modo Robo (Segundos)
                </label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={configForm.frecuencia_gps_emergencia_seg}
                  onChange={e => setConfigForm({ ...configForm, frecuencia_gps_emergencia_seg: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Número de Emergencia / Central Base
                </label>
                <input
                  type="text"
                  value={configForm.numero_emergencia_coop}
                  onChange={e => setConfigForm({ ...configForm, numero_emergencia_coop: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Grupo WhatsApp Seguridad
                </label>
                <input
                  type="text"
                  value={configForm.grupo_whatsapp_seguridad}
                  onChange={e => setConfigForm({ ...configForm, grupo_whatsapp_seguridad: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={configForm.notificar_contactos.admin}
                  onChange={e => setConfigForm({
                    ...configForm,
                    notificar_contactos: { ...configForm.notificar_contactos, admin: e.target.checked }
                  })}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span>Habilitar alarma sonora de emergencia en Base</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={configForm.huella_coaccion_habilitada}
                  onChange={e => setConfigForm({ ...configForm, huella_coaccion_habilitada: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-purple-500"
                />
                <span>Habilitar detección de Huella de Coacción (Dedo Medio)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={configForm.zonas_riesgo_habilitadas}
                  onChange={e => setConfigForm({ ...configForm, zonas_riesgo_habilitadas: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <span>Habilitar alertas de geocercas en Zonas de Riesgo</span>
              </label>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all"
            >
              Guardar Parámetros de Seguridad
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL GUION ECU 911                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showECUModal && ecuScriptAlerta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100">
                    Guion Oficial de Notificación al ECU 911
                  </h3>
                  <p className="text-xs text-slate-400">
                    Léale este texto al operador telefónico del 911 o Policía Nacional
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowECUModal(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
              {buildECU911Script(ecuScriptAlerta, currentCoop?.nombre || 'Cooperativa de Transporte')}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleCopyECU(ecuScriptAlerta)}
                className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2"
              >
                {copiedECU ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedECU ? '¡Copiado al Portapapeles!' : 'Copiar Guion Completo'}</span>
              </button>

              <button
                onClick={() => handleDownloadPDF(ecuScriptAlerta)}
                className="h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF para Denuncia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL CLAVE MAESTRA DESACTIVACIÓN                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showMasterKeyModal && selectedAlerta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100">
                  Desactivar Alerta con Clave de Base
                </h3>
                <p className="text-xs text-slate-400">
                  Unidad #{selectedAlerta.unidadNumero || selectedAlerta.unidadId} ({selectedAlerta.placa || 'S/P'})
                </p>
              </div>
            </div>

            {masterKeyError && (
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{masterKeyError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockWithMasterKey} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Ingrese Clave Maestra de Seguridad
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={masterKeyInput}
                  onChange={e => setMasterKeyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-center text-lg tracking-widest focus:border-amber-500"
                  required
                  autoFocus
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Clave predeterminada del sistema: <code className="text-amber-400">RUTAX-BASE-2026</code>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMasterKeyModal(false)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                >
                  Confirmar Desactivación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL CERRAR ALERTA                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showCloseModal && selectedAlerta && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-100">
              Cierre y Resolución de Alerta
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Resolución</label>
                <select
                  value={resolucionSeleccionada}
                  onChange={e => setResolucionSeleccionada(e.target.value as ResolucionAlerta)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="chofer_a_salvo">Chofer a salvo / Situación controlada</option>
                  <option value="unidad_recuperada">Unidad recuperada con Policía</option>
                  <option value="falsa_alarma">Falsa Alarma / Error de pulsación</option>
                  <option value="denuncia_policia">Caso derivado a Fiscalía / Policía</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Observaciones Finales</label>
                <textarea
                  rows={3}
                  placeholder="Detalles de la resolución del incidente..."
                  value={resolucionObservaciones}
                  onChange={e => setResolucionObservaciones(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCloseAlerta}
                  className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black"
                >
                  Finalizar y Archivar Alerta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL CREAR ZONA DE RIESGO                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showZonaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                <span>Agregar Geocerca de Zona Peligrosa</span>
              </h3>
              <button onClick={() => setShowZonaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveZonaRiesgo} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  placeholder="Ej: Sector Bastión / Entrada de la 8"
                  value={zonaNombre}
                  onChange={e => setZonaNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Descripción / Motivo</label>
                <input
                  type="text"
                  placeholder="Ej: Reportes de asaltos a transporte colectivo nocturno"
                  value={zonaDescripcion}
                  onChange={e => setZonaDescripcion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Latitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zonaLat}
                    onChange={e => setZonaLat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Longitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zonaLng}
                    onChange={e => setZonaLng(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Radio (Metros)</label>
                  <input
                    type="number"
                    value={zonaRadio}
                    onChange={e => setZonaRadio(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Nivel de Peligro</label>
                  <select
                    value={zonaNivel}
                    onChange={e => setZonaNivel(e.target.value as 'amarillo' | 'rojo')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  >
                    <option value="amarillo">Amarillo (Precaución)</option>
                    <option value="rojo">Rojo (Extremo Peligro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Horario Inicio</label>
                  <input
                    type="time"
                    value={zonaHoraInicio}
                    onChange={e => setZonaHoraInicio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Horario Fin</label>
                  <input
                    type="time"
                    value={zonaHoraFin}
                    onChange={e => setZonaHoraFin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowZonaModal(false)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black"
                >
                  Guardar Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL ENROLAMIENTO BIOMÉTRICO (HUELLAS & PIN)           */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showBiometriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-sky-400" />
                <span>Enrolamiento Biométrico y Claves de Seguridad</span>
              </h3>
              <button onClick={() => setShowBiometriaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveBiometria} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Conductor</label>
                <select
                  value={bioChoferId}
                  onChange={e => setBioChoferId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                  required
                >
                  <option value="">-- Seleccione Conductor --</option>
                  {usuariosChoferes.map((u, index) => (
                    <option key={`${u.uid}-${index}`} value={u.uid}>{u.nombre_completo} ({u.telefono})</option>
                  ))}
                </select>
              </div>

              {/* Huella Normal (Dedo Índice) */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">1) Huella Normal (Dedo Índice)</span>
                    <span className="text-[11px] text-slate-400">Para desactivar legítimamente la alarma</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartScanFingerprint('normal')}
                    disabled={bioScanningNormal}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                      bioNormalDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{bioScanningNormal ? 'Escaneando...' : bioNormalDone ? '✓ Capturada' : 'Capturar Huella'}</span>
                  </button>
                </div>
              </div>

              {/* Huella de Coacción (Dedo Medio) */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-300 block">2) Huella de Coacción (Dedo Medio)</span>
                    <span className="text-[11px] text-slate-400">Si el chofer está encañonado / forzado a apagar</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartScanFingerprint('coaccion')}
                    disabled={bioScanningCoaccion}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                      bioCoaccionDone
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{bioScanningCoaccion ? 'Escaneando...' : bioCoaccionDone ? '✓ Capturada' : 'Capturar Huella'}</span>
                  </button>
                </div>
              </div>

              {/* PIN de Respaldo */}
              <div>
                <label className="text-slate-400 font-semibold block mb-1">PIN Emergencia (6 dígitos)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={bioPinNormal}
                  onChange={e => setBioPinNormal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-center"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBiometriaModal(false)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black"
                >
                  Guardar Registro Biométrico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
