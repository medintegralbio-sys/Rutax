import React, { useState, useEffect, useRef } from 'react';
import { rutaxStore } from '../services/store';
import { RutaxMap } from './RutaxMap';
import {
  Usuario,
  Vehiculo,
  Turno,
  SolicitudPasajeroRuta,
  Despacho,
  NotificacionBaseConductores,
  SubtipoAlertaAmarilla
} from '../types';
import {
  Car,
  Plus,
  Minus,
  AlertTriangle,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  Navigation,
  Send,
  DollarSign,
  MapPin,
  Clock,
  Phone,
  Bell,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Fingerprint,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Mic,
  Radio,
  Key,
  Shield,
  Flame,
  AlertOctagon,
  Pause,
  MessageSquare,
  CheckCheck
} from 'lucide-react';
import { speakNotificationText } from '../services/securityServices';

interface AppChoferProps {
  currentUser?: Usuario;
}

export const AppChofer: React.FC<AppChoferProps> = ({ currentUser }) => {
  // Selector de conductor/vehículo para pruebas en vista chofer
  const [activeChoferId, setActiveChoferId] = useState<string>(currentUser?.uid || 'usr-chofer-1');
  const [showEarnings, setShowEarnings] = useState(false); // Oculto por defecto por seguridad ante asaltos
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [mensajeConductorInput, setMensajeConductorInput] = useState('');
  const [showMensajesModal, setShowMensajesModal] = useState(false);
  
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);

  // Sincronizar activeChoferId con el usuario logueado en sesión
  useEffect(() => {
    if (currentUser?.uid) {
      setActiveChoferId(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Estados de Emergencia & Antirrobo
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const sosHoldTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [antirroboHoldProgress, setAntirroboHoldProgress] = useState(0);
  const antirroboHoldTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [alertaModalOpen, setAlertaModalOpen] = useState(false);
  const [subtipoAlerta, setSubtipoAlerta] = useState<SubtipoAlertaAmarilla>('trafico_bloqueo');
  const [alertaDetalle, setAlertaDetalle] = useState('');

  // Modo Antirrobo Activo (Bloqueo Sigiloso de Pantalla)
  const [modoAntirroboActivo, setModoAntirroboActivo] = useState(false);
  const [antirroboAlertaId, setAntirroboAlertaId] = useState<string | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);
  const [fakeUnlockSuccess, setFakeUnlockSuccess] = useState(false);

  // Suscripción al store reactivo
  const [, setTick] = useState(0);
  useEffect(() => {
    return rutaxStore.subscribe(() => setTick(t => t + 1));
  }, []);

  // Choferes de la cooperativa disponibles
  const choferesDisponibles = rutaxStore.usuarios.filter(u => u.rol === 'chofer' || u.rol === 'socio');
  const choferActual = rutaxStore.usuarios.find(u => u.uid === activeChoferId) || currentUser || choferesDisponibles[0];

  // Vehículo asignado al chofer activo con prioridad al vehículo registrado en sesión
  const vehiculo = (currentUser?.vehiculo_id ? rutaxStore.vehiculos.find(v => v.id === currentUser.vehiculo_id) : undefined) ||
    rutaxStore.vehiculos.find(
      v => v.chofer_titular_id === choferActual?.uid || v.socio_id === choferActual?.uid
    ) ||
    (choferActual?.placa_asignada ? rutaxStore.vehiculos.find(v => v.placa === choferActual.placa_asignada) : undefined) ||
    (choferActual?.vehiculo_id ? rutaxStore.vehiculos.find(v => v.id === choferActual.vehiculo_id) : undefined) ||
    rutaxStore.vehiculos.find(v => v.cooperativaId === choferActual?.cooperativaId && v.estado === 'activo') ||
    rutaxStore.vehiculos[0];

  // Estado de turno de servicio del chofer (desconectado vs en_servicio)
  const [estadoServicio, setEstadoServicio] = useState<'desconectado' | 'en_servicio'>('en_servicio');
  const [showIniciarShiftModal, setShowIniciarShiftModal] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [horaInicioServicio, setHoraInicioServicio] = useState<string>('06:15');

  const estaEnLinea = vehiculo ? !!rutaxStore.trackingLive[vehiculo.id]?.esta_en_linea : false;

  const handleToggleOnline = () => {
    if (!vehiculo) return;
    if (vehiculo.estado === 'bloqueado_por_socio' && !estaEnLinea) {
      setShiftError('Unidad bloqueada. No puedes ponerte en línea.');
      return;
    }
    const nuevoEstado = !estaEnLinea;
    rutaxStore.setDriverOnlineStatus(vehiculo.id, nuevoEstado);
    setEstadoServicio(nuevoEstado ? 'en_servicio' : 'desconectado');
    if (nuevoEstado) {
      setHoraInicioServicio(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    showNotice(nuevoEstado ? '🟢 Estás EN LÍNEA. El sistema te asignará turno al acercarte a una base.' : '🔴 Estás FUERA DE LÍNEA. No se te asignarán turnos.');
  };

  const handleVacieCarroBaseB = () => {
    if (!despachoEnRuta) return;
    despachoEnRuta.estado = 'cerrado';
    despachoEnRuta.hora_llegada = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (vehiculo) {
      rutaxStore.enrollInQueue('base-b', vehiculo.id, choferActual?.uid);
    }
    rutaxStore.notify();
    showNotice('✅ Viaje cerrado • $18.00 bruto • Ahora eres Turno 2 en Base B (Centro)');
  };

  // Turno actual del chofer (activo o en cola)
  const turnoActual = rutaxStore.turnos.find(
    t => t.vehiculo_id === vehiculo?.id && t.estado !== 'despachado'
  );

  // Despacho activo en ruta (si ya salió de base pero no ha llegado a destino)
  const despachoEnRuta = rutaxStore.despachos.find(
    d => d.vehiculo_id === vehiculo?.id && d.estado === 'en_ruta'
  );

  // Solicitudes de pasajeros asignadas a esta unidad en ruta
  const paradasAsignadas = rutaxStore.solicitudesPasajeros.filter(
    s => s.turno_asignado_id === turnoActual?.id || (despachoEnRuta && s.estado === 'asignada')
  );

  // Reservas asignadas a esta unidad / chofer
  const reservasAsignadas = rutaxStore.reservas.filter(
    r => (r.unidad_asignada_id === vehiculo?.id || r.chofer_asignado_id === choferActual?.uid) &&
         (r.estado === 'asignada' || r.estado === 'pendiente')
  );

  // Notificaciones recibidas de Base
  const coopId = choferActual?.cooperativaId || 'coop-daule';
  const todasNotificacionesBase = rutaxStore.getNotificacionesConductores(coopId);

  // Filtrar notificaciones para este chofer
  const notificacionesParaChofer = todasNotificacionesBase.filter(n => {
    if (n.para === 'todos') return true;
    if (n.para === 'en_ruta' && despachoEnRuta) return true;
    if (n.para === 'en_base_a' && turnoActual?.baseId === 'base-a') return true;
    if (n.para === 'en_base_b' && turnoActual?.baseId === 'base-b') return true;
    if (n.para === 'unidad_especifica' && n.unidad_destino_id === vehiculo?.id) return true;
    return false;
  });

  const notificacionesPendientesConfirmar = notificacionesParaChofer.filter(
    n => n.requiere_confirmacion && !n.confirmada_por.includes(choferActual?.uid || '')
  );

  // Despachos completados hoy por este vehículo
  const despachosCompletadosHoy = rutaxStore.despachos.filter(
    d => d.vehiculo_id === vehiculo?.id && d.estado === 'cerrado'
  );
  const gananciaTotalHoy = despachosCompletadosHoy.reduce((acc, d) => acc + d.recaudacion_bruta, 0);

  // Mensajes del conductor con la base
  const misMensajesABase = rutaxStore.mensajesConductorBase.filter(
    m => m.conductor_id === choferActual?.uid || m.vehiculo_id === vehiculo?.id
  );

  const handleEnviarMensajeABase = (texto: string) => {
    if (!texto.trim() || !choferActual || !vehiculo) return;
    const dest = turnoActual?.baseId || (despachoEnRuta ? despachoEnRuta.base_destino_id : 'base-a');
    rutaxStore.enviarMensajeABase({
      conductor_id: choferActual.uid,
      vehiculo_id: vehiculo.id,
      destinatario_base: dest,
      texto: texto.trim()
    });
    setMensajeConductorInput('');
    showNotice(`Mensaje enviado a la Base: "${texto.slice(0, 30)}..."`);
  };

  const handleLlegadaBaseGeocerca = (baseId: string) => {
    if (!vehiculo || !choferActual) return;
    const targetBase = rutaxStore.bases.find(b => b.id === baseId);
    if (!targetBase) return;
    
    // Simular actualización de GPS para disparar auto-enlistamiento
    rutaxStore.updateDriverLocation(vehiculo.id, targetBase.lat, targetBase.lng);
    
    const res = rutaxStore.verificarLlegadaGeocerca(
      vehiculo.id,
      choferActual.uid,
      targetBase.lat,
      targetBase.lng
    );
    showNotice(res.mensaje);
  };

  const baseOrigen = rutaxStore.bases.find(b => b.id === turnoActual?.baseId || b.id === despachoEnRuta?.base_origen_id);
  const baseDestino = rutaxStore.bases.find(b => b.id === despachoEnRuta?.base_destino_id) || (baseOrigen?.id === 'base-a' ? rutaxStore.bases.find(b => b.id === 'base-b') : rutaxStore.bases.find(b => b.id === 'base-a'));

  // ═══════════════════════════════════════════════════════
  // MANEJADORES DE ACCIONES DE SEGURIDAD
  // ═══════════════════════════════════════════════════════

  // SOS Rojo (Pulsación sostenida 2 segundos)
  const handleSosTouchStart = () => {
    setSosHoldProgress(0);
    const startTime = Date.now();
    const duration = 3000; // 3 segundos

    sosHoldTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setSosHoldProgress(progress);

      if (elapsed >= duration) {
        clearInterval(sosHoldTimerRef.current!);
        sosHoldTimerRef.current = null;
        triggerSOSActivation();
      }
    }, 50);
  };

  const handleSosTouchEnd = () => {
    if (sosHoldTimerRef.current) {
      clearInterval(sosHoldTimerRef.current);
      sosHoldTimerRef.current = null;
    }
    setSosHoldProgress(0);
  };

  const triggerSOSActivation = () => {
    if (!vehiculo || !choferActual) return;
    const alerta = rutaxStore.activarSOS(
      choferActual.uid,
      vehiculo.id,
      -2.1480,
      -79.8950,
      '🚨 ALERTA SOS EMERGENCIA activada por conductor desde App Chofer',
      'Av. Daule km 11.5 frente a Terminal'
    );

    showNotice('🚨 ¡SOS ACTIVADO! Señal de auxilio enviada a la Base y ECU 911.');
  };

  // Botón Antirrobo (Pulsación sostenida 3 segundos silenciosa)
  const handleAntirroboTouchStart = () => {
    setAntirroboHoldProgress(0);
    const startTime = Date.now();
    const duration = 3000; // 3 segundos

    antirroboHoldTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setAntirroboHoldProgress(progress);

      if (elapsed >= duration) {
        clearInterval(antirroboHoldTimerRef.current!);
        antirroboHoldTimerRef.current = null;
        triggerAntirroboActivation();
      }
    }, 50);
  };

  const handleAntirroboTouchEnd = () => {
    if (antirroboHoldTimerRef.current) {
      clearInterval(antirroboHoldTimerRef.current);
      antirroboHoldTimerRef.current = null;
    }
    setAntirroboHoldProgress(0);
  };

  const triggerAntirroboActivation = () => {
    if (!vehiculo || !choferActual) return;
    const alerta = rutaxStore.activarAntirrobo(
      choferActual.uid,
      vehiculo.id,
      -2.1480,
      -79.8950,
      'Vía a Daule frente a Parque California'
    );

    setAntirroboAlertaId(alerta.id);
    setModoAntirroboActivo(true);
    setBiometricFeedback(null);
    setFakeUnlockSuccess(false);
  };

  // Desactivación con Huella Digital (Simulador Biométrico WebAuthn / TouchID)
  const handleUnlockWithFingerprint = (tipoDedo: 'normal' | 'coaccion') => {
    if (!antirroboAlertaId || !choferActual) return;

    const res = rutaxStore.desactivarConHuella(antirroboAlertaId, tipoDedo);

    if (res.exito) {
      // Huella normal: Se apaga legítimamente
      setBiometricFeedback('✓ Huella dactilar reconocida. Modo antirrobo desactivado.');
      setTimeout(() => {
        setModoAntirroboActivo(false);
        setAntirroboAlertaId(null);
        setBiometricFeedback(null);
      }, 1500);
    } else {
      // Huella de coacción: Se engaña al ladrón fingiendo desbloqueo normal
      setFakeUnlockSuccess(true);
      setBiometricFeedback('✓ Dispositivo Desbloqueado. Sistema Normal.');
      setTimeout(() => {
        setModoAntirroboActivo(false);
        setAntirroboAlertaId(null);
        setFakeUnlockSuccess(false);
        setBiometricFeedback(null);
      }, 2000);
    }
  };

  // Desactivación con PIN de 4 dígitos
  const handleUnlockWithPIN = () => {
    if (!antirroboAlertaId || !choferActual || pinInput.length < 4) return;

    const res = rutaxStore.desactivarConPIN(antirroboAlertaId, pinInput.trim());

    if (res.exito) {
      setBiometricFeedback('✓ PIN correcto. Alarma desactivada.');
      setTimeout(() => {
        setModoAntirroboActivo(false);
        setAntirroboAlertaId(null);
        setPinInput('');
        setShowPinPad(false);
      }, 1200);
    } else if (res.esCoaccion) {
      // PIN de coacción: Engaña al ladrón
      setFakeUnlockSuccess(true);
      setBiometricFeedback('✓ Dispositivo Desbloqueado.');
      setTimeout(() => {
        setModoAntirroboActivo(false);
        setAntirroboAlertaId(null);
        setPinInput('');
        setShowPinPad(false);
        setFakeUnlockSuccess(false);
      }, 1800);
    } else {
      setBiometricFeedback('❌ PIN incorrecto.');
    }
  };

  // Alerta Amarilla
  const handleSendAlertaAmarilla = () => {
    if (!vehiculo || !choferActual) return;
    rutaxStore.activarAlertaAmarilla(
      choferActual.uid,
      vehiculo.id,
      subtipoAlerta,
      -2.1480,
      -79.8950,
      alertaDetalle.trim() || 'Alerta de precaución preventiva'
    );

    setAlertaModalOpen(false);
    setAlertaDetalle('');
    showNotice('⚠️ Alerta de precaución transmitida a la Base y compañeros.');
  };

  // Confirmar Notificación de Base
  const handleConfirmarNotificacion = (notif: NotificacionBaseConductores) => {
    if (!choferActual || !vehiculo) return;
    rutaxStore.confirmarRecibidoNotificacion(
      notif.id,
      choferActual.uid,
      vehiculo.id
    );
    showNotice('✓ Has confirmado la recepción del mensaje a la Base.');
  };

  const handlePlayTTS = (texto: string) => {
    speakNotificationText(texto);
  };

  // Manejadores de Turno & Pasajeros
  const handleUpdatePax = (delta: number) => {
    if (!turnoActual) return;
    rutaxStore.updatePassengers(turnoActual.id, delta);
  };

  const handleReportarLlegada = () => {
    if (!despachoEnRuta) return;
    
    const res = rutaxStore.finalizarDespacho(despachoEnRuta.id);
    
    if (res.ok) {
      showNotice(res.message);
    } else {
      showNotice(`⚠️ ${res.message}`);
    }
  };

  const handleConfirmarRecogidaPasajero = (solId: string) => {
    rutaxStore.cambiarEstadoSolicitud(solId, 'recogida');
    if (turnoActual) {
      rutaxStore.updatePassengers(turnoActual.id, 1);
    }
    showNotice('Pasajero recogido a bordo. Contador actualizado.');
  };

  const handleConfirmarAvanceBaseReal = () => {
    if (!turnoActual) return;
    turnoActual.ubicacion_fisica = 'base_real';
    rutaxStore.notify();
    showNotice('¡Confirmado! Has ingresado al andén de Base Real.');
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const isBlocked = vehiculo?.estado === 'bloqueado_por_socio';
  const enPrebase = turnoActual?.ubicacion_fisica === 'prebase';
  const enBaseReal = turnoActual?.ubicacion_fisica === 'base_real';

  const baseRealOcupados = rutaxStore.turnos.filter(
    t => t.baseId === turnoActual?.baseId && t.ubicacion_fisica === 'base_real'
  ).length;
  const capacidadBaseReal = baseOrigen?.capacidad_base || baseOrigen?.capacidad_max || 4;
  const hayEspacioEnBaseReal = enPrebase && baseRealOcupados < capacidadBaseReal;

  return (
    <div id="pantalla-chofer" className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ═══════════════════════════════════════════════════════ */}
      {/* CONTENEDOR PRINCIPAL CENTRADO Y ARMONIOSO               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="max-w-xl mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
        
        {/* Alerta flotante de confirmación */}
        {actionNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-between gap-2 shadow-2xl animate-in slide-in-from-top-2 border border-emerald-400/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button 
              onClick={() => setActionNotice(null)}
              className="text-slate-900 hover:text-black font-bold p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* COMUNICADOS CRÍTICOS Y NOTIFICACIONES DE BASE (ALTA PRIORIDAD) */}
        {notificacionesPendientesConfirmar.length > 0 && (
          <div className="space-y-2.5">
            {notificacionesPendientesConfirmar.map(notif => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border-2 shadow-xl space-y-3 animate-in slide-in-from-top-3 ${
                  notif.prioridad === 'critica'
                    ? 'bg-rose-950/90 border-rose-500 text-white'
                    : 'bg-amber-950/90 border-amber-500 text-amber-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                      <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-950/80 border border-white/10">
                        COMUNICADO DE BASE ({notif.prioridad})
                      </span>
                      <h3 className="text-sm font-black mt-0.5">{notif.titulo}</h3>
                    </div>
                  </div>

                  {notif.leer_en_voz_alta && (
                    <button
                      onClick={() => handlePlayTTS(`${notif.titulo}. ${notif.mensaje}`)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 border border-slate-700 transition-all"
                      title="Escuchar por voz"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  )}
                </div>

                <p className="text-xs leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  {notif.mensaje}
                </p>

                <button
                  onClick={() => handleConfirmarNotificacion(notif)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>CONFIRMAR RECIBIDO</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TARJETA CABECERA: CONDUCTOR Y UNIDAD                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Perfil del Conductor */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-13 h-13 rounded-2xl bg-slate-800 border-2 border-emerald-500/60 p-0.5 overflow-hidden shadow-md shrink-0">
                <img
                  src={choferActual?.foto_url || vehiculo?.foto_vehiculo_url || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80'}
                  alt={choferActual?.nombre_completo || 'Chofer'}
                  className="w-full h-full object-cover rounded-xl"
                />
                <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  estadoServicio === 'en_servicio' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-base text-slate-100 truncate">
                    {choferActual?.nombre_completo || 'Conductor Titular'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-semibold text-emerald-400">Unidad #{vehiculo?.numero_unidad || 'S/N'}</span>
                  <span>•</span>
                  <span>{vehiculo?.modelo || 'Minibus'}</span>
                </div>
              </div>
            </div>

            {/* Placa física estilizada Ecuador */}
            <div className="shrink-0 flex flex-col items-end">
              <div className="relative inline-flex flex-col items-center justify-center font-mono font-black text-xs px-2.5 py-1 rounded bg-amber-400 text-slate-950 border border-slate-900 shadow-sm tracking-wider uppercase">
                <span className="text-[6px] font-bold tracking-normal opacity-80 leading-none mb-0.5">ECUADOR</span>
                <span className="leading-none">{vehiculo?.placa || 'GXY-1234'}</span>
              </div>
            </div>
          </div>

          {/* Barra de Acciones Rápidas del Header */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            {/* Estado de Turno Toggle */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                estadoServicio === 'en_servicio'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${estadoServicio === 'en_servicio' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                {estadoServicio === 'en_servicio' ? 'En Servicio' : 'Desconectado'}
              </span>

              {estadoServicio === 'en_servicio' ? (
                <button
                  onClick={handleFinalizarTurnoClick}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-all"
                  title="Finalizar turno y pasar a desconectado"
                >
                  <Pause className="w-3 h-3 text-amber-400" />
                  <span>Pausar</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShiftError(null);
                    setShowIniciarShiftModal(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-sm transition-all"
                >
                  <span>Iniciar Turno</span>
                </button>
              )}
            </div>

            {/* Botones de Utilidades (Notificaciones, Mapa, Salir) */}
            <div className="flex items-center gap-1.5">
              {/* Notificaciones */}
              <button
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                className={`relative p-2 rounded-xl border transition-all ${
                  showNotifDrawer 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Notificaciones de Base"
              >
                <Bell className="w-4 h-4" />
                {notificacionesParaChofer.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                    {notificacionesParaChofer.length}
                  </span>
                )}
              </button>

              {/* Ver Mapa Completo */}
              <button
                onClick={() => setShowFullScreenMap(true)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sky-400 transition-all"
                title="Ver mapa de ruta en pantalla completa"
              >
                <Navigation className="w-4 h-4" />
              </button>

              {/* Salir / Logout */}
              <button
                onClick={() => {
                  rutaxStore.logout();
                  window.location.href = '/login';
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 transition-all"
                title="Cerrar sesión"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Desplegable de Notificaciones */}
          {showNotifDrawer && (
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  Historial de Comunicados de Base
                </span>
                <button
                  onClick={() => setShowNotifDrawer(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {notificacionesParaChofer.length === 0 ? (
                  <p className="text-[11px] text-slate-500 py-3 text-center">No hay comunicados recientes.</p>
                ) : (
                  notificacionesParaChofer.map(notif => {
                    const yaConfirmado = notif.confirmada_por.includes(choferActual?.uid || '');
                    return (
                      <div
                        key={notif.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-[11px]">{notif.titulo}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(notif.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{notif.mensaje}</p>
                        {notif.requiere_confirmacion && (
                          <div className="pt-1">
                            {yaConfirmado ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Recibido confirmado
                              </span>
                            ) : (
                              <button
                                onClick={() => handleConfirmarNotificacion(notif)}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                              >
                                Confirmar Recibido
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* BARRA DE BOTONES DE SEGURIDAD Y EMERGENCIA               */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Botón SOS (Sostener 3 seg) */}
          <button
            onPointerDown={handleSosTouchStart}
            onPointerUp={handleSosTouchEnd}
            onPointerLeave={handleSosTouchEnd}
            className="relative overflow-hidden py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 border border-rose-500/50 transition-all select-none"
          >
            {/* Barra de progreso de pulsación sostenida */}
            {sosHoldProgress > 0 && (
              <div
                className="absolute inset-0 bg-rose-950/80 transition-all pointer-events-none"
                style={{ width: `${sosHoldProgress}%` }}
              />
            )}
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="relative z-10">
              {sosHoldProgress > 0 ? `SOLTANDO SOS (${Math.round(sosHoldProgress)}%)` : 'BOTÓN SOS (3s)'}
            </span>
          </button>

          {/* Botón Alerta Ruta (Amarilla) */}
          <button
            onClick={() => setAlertaModalOpen(true)}
            className="py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 text-amber-300 border border-amber-500/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Alerta de Ruta</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ESTADO DESCONECTADO (PANTALLA DE REPOSO)                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        {estadoServicio === 'desconectado' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Car className="w-7 h-7 text-slate-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-200">
                Turno Desconectado
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No recibirás turnos ni asignaciones de pasajeros en cola mientras estés desconectado.
              </p>
            </div>

            <button
              onClick={() => {
                setShiftError(null);
                setShowIniciarShiftModal(true);
              }}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>INICIAR TURNO Y CONECTARSE</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ESTADO EN SERVICIO: TURNOS, RUTAS Y OPERACIÓN           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {estadoServicio === 'en_servicio' && (
          <div className="space-y-4">
            
            {/* Bloqueo por socio si aplica */}
            {isBlocked && (
              <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl p-5 text-center space-y-2 shadow-xl">
                <ShieldAlert className="w-9 h-9 text-rose-500 mx-auto animate-bounce" />
                <h3 className="font-extrabold text-sm text-rose-300">
                  UNIDAD BLOQUEADA POR EL PROPIETARIO
                </h3>
                <p className="text-xs text-rose-200/90">
                  "{vehiculo?.motivo_bloqueo || 'Pendiente de liquidación diaria'}"
                </p>
                <p className="text-[11px] text-slate-400">
                  Comunícate con el dueño para regularizar el turno en el sistema.
                </p>
              </div>
            )}

            {/* VIAJE EN RUTA ACTIVO */}
            {despachoEnRuta && (
              <div className="bg-slate-900/90 border border-sky-500/60 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-black uppercase flex items-center gap-1.5 border border-sky-500/40">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    EN RUTA ACTIVA
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Salida: {despachoEnRuta.hora_salida}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Origen:</span>
                    <span className="font-bold text-slate-200">{baseOrigen?.nombre || 'Base Origen'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Destino:</span>
                    <span className="font-bold text-sky-400">{baseDestino?.nombre || 'Base Destino'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Pasajeros a bordo:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {despachoEnRuta.pasajeros_totales ?? despachoEnRuta.pasajeros_base ?? 0} pax
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleReportarLlegada}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>REPORTAR LLEGADA A {baseDestino?.nombre ? baseDestino.nombre.toUpperCase() : 'BASE DESTINO'}</span>
                </button>
              </div>
            )}

            {/* RECOGIDA DE PASAJEROS ASIGNADA EN RUTA */}
            {paradasAsignadas.length > 0 && (
              <div className="bg-slate-900/90 border border-purple-500/60 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 uppercase flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    RECOGIDA ASIGNADA
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">Distancia: ~400m</span>
                </div>

                {paradasAsignadas.map(sol => (
                  <div key={sol.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">📍 {sol.referencia}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                        {sol.cantidad_pasajeros} pax
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Pasajero: {sol.pasajero_nombre}</span>
                      <a 
                        href={`tel:${sol.pasajero_telefono || '0991234567'}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{sol.pasajero_telefono || '0991234567'}</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmarRecogidaPasajero(sol.id)}
                        className="py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>YA RECOGÍ</span>
                      </button>
                      <button
                        onClick={() => rutaxStore.cambiarEstadoSolicitud(sol.id, 'rechazada')}
                        className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>NO ESTABA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECCIÓN TURNO ACTUAL O COLA FIFO (SI NO ESTÁ EN RUTA) */}
            {!isBlocked && !despachoEnRuta && (
              <div className="space-y-4">
                {turnoActual ? (
                  <div className={`rounded-2xl p-5 border-2 shadow-xl space-y-4 ${
                    enBaseReal
                      ? 'bg-slate-900/90 border-emerald-500/70 shadow-emerald-950/20'
                      : 'bg-slate-900/90 border-amber-500/70 shadow-amber-950/20'
                  }`}>
                    
                    {/* Header del Turno */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Base: {baseOrigen?.nombre || 'Base Central'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          Unidad #{vehiculo?.numero_unidad} ({vehiculo?.placa})
                        </span>
                      </div>
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                          enBaseReal
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {enBaseReal ? 'En Base Real' : 'En Pre-Base'}
                        </span>
                      </div>
                    </div>

                    {/* Número de Turno Central Destacado */}
                    <div className="text-center py-2 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Posición en Cola de Despacho
                      </span>
                      <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-2">
                        <span className="text-emerald-400">Turno #{turnoActual.numero_turno}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300">
                        {enBaseReal
                          ? 'Andén de Embarque Oficial'
                          : 'Bolsón de Espera Virtual (Pre-Base)'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tiempo est. de salida: <strong>~{Math.max(2, turnoActual.numero_turno * 4)} min</strong></span>
                      </p>
                    </div>

                    {/* ALERTA: SI ESTÁ EN PRE-BASE Y HAY ESPACIO EN BASE REAL */}
                    {hayEspacioEnBaseReal && (
                      <div className="p-4 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-xl space-y-2 animate-bounce">
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-5 h-5 shrink-0" />
                          <span>¡AVANZA A BASE REAL AHORA!</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-900 leading-snug">
                          Se liberó un andén de salida en {baseOrigen?.nombre}. Acércate de inmediato para embarque.
                        </p>
                        <button
                          onClick={handleConfirmarAvanceBaseReal}
                          className="w-full py-2.5 rounded-lg bg-slate-950 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5 shadow"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar Llegada a Andén</span>
                        </button>
                      </div>
                    )}

                    {/* Contador de Pasajeros en Base Real */}
                    {enBaseReal && (
                      <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-center space-y-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Conteo de Pasajeros a Bordo
                        </span>

                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => handleUpdatePax(-1)}
                            className="w-13 h-13 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center font-bold text-2xl border border-slate-700 transition-all"
                            title="Restar pasajero"
                          >
                            <Minus className="w-6 h-6" />
                          </button>

                          <div className="text-3xl sm:text-4xl font-black font-mono text-white min-w-[120px]">
                            <span className={turnoActual.pasajeros_actuales >= turnoActual.pasajeros_max ? 'text-emerald-400' : 'text-slate-100'}>
                              {turnoActual.pasajeros_actuales}
                            </span>
                            <span className="text-slate-500 text-xl"> / {turnoActual.pasajeros_max}</span>
                          </div>

                          <button
                            onClick={() => handleUpdatePax(+1)}
                            className="w-13 h-13 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-500/20 transition-all"
                            title="Sumar pasajero"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800/80 font-mono">
                          <span>Tarifa: ${turnoActual.tarifa_viaje?.toFixed(2) || '0.50'}</span>
                          <span className="font-bold text-emerald-400">
                            Total: ${(turnoActual.pasajeros_actuales * (turnoActual.tarifa_viaje || 0.5)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
                    <Car className="w-10 h-10 text-slate-500 mx-auto" />
                    <h3 className="font-extrabold text-slate-200 text-sm">
                      No estás en cola de turno
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {(rutaxStore.bases.filter(b => b.cooperativaId === vehiculo?.cooperativaId && b.estado !== 'inactiva').length > 0
                        ? rutaxStore.bases.filter(b => b.cooperativaId === vehiculo?.cooperativaId && b.estado !== 'inactiva')
                        : rutaxStore.bases.filter(b => b.estado !== 'inactiva')
                      ).map((b, idx) => (
                        <button
                          key={b.id}
                          onClick={() => handleLlegadaBaseGeocerca(b.id)}
                          className={`px-3.5 py-2 rounded-xl text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all ${
                            idx % 2 === 0
                              ? 'bg-emerald-500 hover:bg-emerald-400'
                              : 'bg-sky-500 hover:bg-sky-400'
                          }`}
                        >
                          📍 Llegar a {b.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMUNICACIÓN CON LA BASE */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-slate-200">Comunicación con la Base</h3>
                    </div>
                    {misMensajesABase.some(m => m.estado === 'respondido') && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {misMensajesABase.filter(m => m.estado === 'respondido').length} respondidos
                      </span>
                    )}
                  </div>

                  {/* Input personalizado */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={mensajeConductorInput}
                      onChange={e => setMensajeConductorInput(e.target.value)}
                      placeholder="Escribir novedad a la base..."
                      className="flex-1 h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEnviarMensajeABase(mensajeConductorInput);
                      }}
                    />
                    <button
                      onClick={() => handleEnviarMensajeABase(mensajeConductorInput)}
                      disabled={!mensajeConductorInput.trim()}
                      className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>

                  {/* Respuestas recientes de la base */}
                  {misMensajesABase.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pt-2 border-t border-slate-800/80">
                      {misMensajesABase.slice(0, 3).map(m => (
                        <div key={m.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Tú: "{m.texto}"</span>
                            <span className="font-mono text-[10px]">{m.hora}</span>
                          </div>
                          {m.respuesta ? (
                            <div className="text-emerald-400 font-bold flex items-center gap-1 pl-2 border-l-2 border-emerald-500">
                              <CheckCheck className="w-3 h-3" />
                              <span>{m.respondido_por || 'Base'}: "{m.respuesta}"</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-400/80 italic">Esperando respuesta de base...</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* RECAUDACIÓN DE LA JORNADA                                */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Recaudación de la Jornada
                  </span>
                </div>

                <button
                  onClick={() => setShowEarnings(!showEarnings)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Ocultar para evitar asaltos"
                >
                  {showEarnings ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{showEarnings ? 'Ocultar' : 'Ver total'}</span>
                </button>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Viajes cerrados hoy:</span>
                  <span className="text-sm font-bold text-slate-200">
                    {despachosCompletadosHoy.length} viajes
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total recaudado:</span>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {showEarnings ? `$${gananciaTotalHoy.toFixed(2)} USD` : '••••••••'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL VERIFICACIÓN PARA INICIAR TURNO                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showIniciarShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Autorización de Turno</span>
              </h3>
              <button onClick={() => setShowIniciarShiftModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {shiftError && (
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  {shiftError}
                </div>
              )}

              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Unidad:</span>
                  <span className="font-bold text-slate-200">Unidad #{vehiculo?.numero_unidad} ({vehiculo?.placa})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estado Socio:</span>
                  <span className="font-bold text-emerald-400">✓ Al día (Habilitado)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Documentación:</span>
                  <span className="font-bold text-emerald-400">✓ Vigente</span>
                </div>
              </div>

              <div className="text-center py-2 space-y-3">
                <p className="text-slate-300 font-medium text-[11px]">
                  Presiona para validar credenciales y comenzar la jornada:
                </p>
                <button
                  onClick={handleIniciarTurnoSubmit}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>AUTORIZAR Y ENTRAR EN SERVICIO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL ALERTA AMARILLA (INCIDENCIAS EN RUTA)             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {alertaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 text-slate-100 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Reportar Novedad en Ruta</span>
              </div>
              <button onClick={() => setAlertaModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-300 block font-semibold text-[11px]">Tipo de Incidencia:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'llanta', label: '🛞 Pinchazo Llanta' },
                  { id: 'mecanica', label: '⚙️ Falla Mecánica' },
                  { id: 'pasajero_conflictivo', label: '👤 Pasajero Conflictivo' },
                  { id: 'trafico_bloqueo', label: '🚧 Vía Bloqueada' },
                  { id: 'accidente_menor', label: '💥 Percance Menor' }
                ].map(opc => (
                  <button
                    key={opc.id}
                    type="button"
                    onClick={() => setSubtipoAlerta(opc.id as SubtipoAlertaAmarilla)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      subtipoAlerta === opc.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opc.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Detalle de Ubicación / Novedad:</label>
                <textarea
                  rows={2}
                  value={alertaDetalle}
                  onChange={e => setAlertaDetalle(e.target.value)}
                  placeholder="Ej: A 500m del redondel de Salitre..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleSendAlertaAmarilla}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg active:scale-98 transition-all"
              >
                Transmitir Alerta a Central y Compañeros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PANTALLA DE MODO ANTIRROBO (SIGILOSO)                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {modoAntirroboActivo && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 text-slate-100 animate-in fade-in duration-300">
          <div className="text-center space-y-2 pt-8">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold text-slate-400">
              Dispositivo Bloqueado
            </h2>
            <p className="text-[11px] text-slate-600 font-mono">
              GPS Activo • Audio Transmitiendo a Central
            </p>
          </div>

          {/* Feedback biométrico */}
          {biometricFeedback && (
            <div className={`p-3.5 rounded-2xl text-center text-xs font-bold ${
              fakeUnlockSuccess || biometricFeedback.includes('✓')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {biometricFeedback}
            </div>
          )}

          {/* Biometría con Simulador Dedo Normal vs Dedo Coacción */}
          <div className="space-y-4 max-w-xs mx-auto w-full">
            {!showPinPad ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 text-center">
                  Usa tu sensor de huella para desbloquear el terminal:
                </p>

                {/* Botón Dedo Normal */}
                <button
                  onClick={() => handleUnlockWithFingerprint('normal')}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-lg"
                >
                  <Fingerprint className="w-5 h-5 text-emerald-400" />
                  <span>Sensor Dactilar (Desactivar Normal)</span>
                </button>

                {/* Botón Huella de Coacción */}
                <button
                  onClick={() => handleUnlockWithFingerprint('coaccion')}
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-purple-800/60 text-purple-300 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-lg"
                >
                  <Fingerprint className="w-5 h-5 text-purple-400" />
                  <span>Huella de Coacción (Alerta Silenciosa)</span>
                </button>

                <button
                  onClick={() => setShowPinPad(true)}
                  className="w-full py-2 text-center text-slate-500 hover:text-slate-300 text-xs font-semibold"
                >
                  O ingresar con PIN de 4 dígitos
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs text-slate-400 font-bold">Ingresar PIN:</span>
                  <button onClick={() => setShowPinPad(false)} className="text-xs text-slate-500">
                    Volver a Huella
                  </button>
                </div>

                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-2xl font-mono tracking-widest text-white"
                  autoFocus
                />

                <button
                  onClick={handleUnlockWithPIN}
                  disabled={pinInput.length !== 4}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black text-xs"
                >
                  Confirmar PIN
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-700 pb-4">
            RUTAX-SMART Antirrobo V3.2 • Seguridad ECU 911
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODAL MAPA PANTALLA COMPLETA                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showFullScreenMap && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between z-10 shadow-md">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm text-slate-100">Mapa Operativo en Tiempo Real</span>
            </div>
            <button 
              onClick={() => setShowFullScreenMap(false)} 
              className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <RutaxMap 
              vehiculos={rutaxStore.vehiculos.filter(v => v.cooperativaId === coopId)}
              trackingLive={Object.values(rutaxStore.trackingLive).filter(t => t.cooperativaId === coopId)}
              height="calc(100vh - 56px)"
              onClose={() => setShowFullScreenMap(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
