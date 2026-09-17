import React, { useState, useEffect, useRef } from 'react';
import { rutaxStore } from '../services/store';
import { Usuario, Turno, Base, Vehiculo, SolicitudPasajeroRuta, Despacho, LogAuditoriaTurno } from '../types';
import { RutaxMap } from './RutaxMap';
import { 
  Tablet, 
  Users, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Send, 
  ArrowUpDown, 
  MapPin, 
  Car, 
  AlertCircle, 
  AlertTriangle,
  DollarSign, 
  ShieldCheck, 
  Layers,
  X,
  Trash2,
  Phone,
  History,
  Check,
  AlertOctagon,
  FileText,
  UserCheck,
  Eye,
  MessageSquare,
  CheckCheck,
  Maximize2,
  Minimize2,
  BellRing,
  Volume2,
  VolumeX,
  Siren
} from 'lucide-react';

interface TabletDespachoProps {
  currentUser?: Usuario;
}

export const TabletDespacho: React.FC<TabletDespachoProps> = ({ currentUser }) => {
  // Base seleccionada
  const [selectedBaseId, setSelectedBaseId] = useState<string>(
    currentUser?.base_asignada === 'base_b' ? 'base-b' : 'base-a'
  );

  // Pestañas en panel derecho
  const [rightPanelTab, setRightPanelTab] = useState<'mapa_pax' | 'historial_despachos' | 'auditoria' | 'mensajes_chofer'>('mapa_pax');
  const [quickReplyText, setQuickReplyText] = useState<{ [msgId: string]: string }>({});

  // Modal Ingreso a Cola
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedVehiculoForEnroll, setSelectedVehiculoForEnroll] = useState('');
  const [enrollFeedback, setEnrollFeedback] = useState<string | null>(null);

  // Modal Reasignar Turno (con motivo obligatorio)
  const [reassigningTurno, setReassigningTurno] = useState<Turno | null>(null);
  const [newTurnNumber, setNewTurnNumber] = useState(1);
  const [mandatoryReason, setMandatoryReason] = useState('');
  const [reassignError, setReassignError] = useState<string | null>(null);

  // Modal Salida Incompleta (cuando pasajeros < capacidad_max)
  const [incompleteDispatchTurno, setIncompleteDispatchTurno] = useState<Turno | null>(null);
  const [incompleteReason, setIncompleteReason] = useState('');
  const [incompleteError, setIncompleteError] = useState<string | null>(null);

  // Modal Crear Solicitud de Pasajero en Ruta
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [paxNombre, setPaxNombre] = useState('');
  const [paxTelefono, setPaxTelefono] = useState('');
  const [paxReferencia, setPaxReferencia] = useState('');
  const [paxCantidad, setPaxCantidad] = useState(1);

  // Modal Consultar Todos los Turnos (Pantalla Secundaria)
  const [showModalTodosLosTurnos, setShowModalTodosLosTurnos] = useState(false);
  const [busquedaTurnoModal, setBusquedaTurnoModal] = useState('');

  // Modal Mapa Pantalla Completa
  const [showMapaFullscreen, setShowMapaFullscreen] = useState(false);

  // Alertas SOS activas para UI superior izquierda
  const [activeSosAlerts, setActiveSosAlerts] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  // Notificación flotante de confirmación de acción
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Suscripción al store para reaccionar a cambios
  const [, setTick] = useState(0);
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );

  useEffect(() => {
    let lastPendingIds: string[] = rutaxStore.solicitudesPasajeros
      .filter(s => s.estado === 'pendiente' && s.cooperativaId === (currentUser?.cooperativaId || 'coop-daule'))
      .map(s => s.id);

    const unsub = rutaxStore.subscribe(() => {
      setTick(t => t + 1);

      // Play sound notification if a new pending ride request arrives
      const currentPending = rutaxStore.solicitudesPasajeros.filter(
        s => s.estado === 'pendiente' && s.cooperativaId === (currentUser?.cooperativaId || 'coop-daule')
      );
      const currentPendingIds = currentPending.map(s => s.id);
      
      const hasNewPending = currentPendingIds.some(id => !lastPendingIds.includes(id));
      if (hasNewPending) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.4);
        } catch (e) {
          console.warn('Base audio notification failed:', e);
        }
      }
      lastPendingIds = currentPendingIds;

      // Manejo de Alertas SOS Críticas
      const coopAlerts = rutaxStore.alertas.filter(
        a => a.cooperativaId === (currentUser?.cooperativaId || 'coop-daule') && a.tipo === 'SOS_ROJO' && !a.atendida
      );
      setActiveSosAlerts(coopAlerts.map(a => a.id));
    });

    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      unsub();
      window.removeEventListener('resize', handleResize);
    };
  }, [currentUser]);

  // Manejo de Alarma SOS Sonora
  useEffect(() => {
    if (activeSosAlerts.length > 0 && !isMuted) {
      if (!alarmRef.current) {
        alarmRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3');
        alarmRef.current.loop = true;
      }
      alarmRef.current.play().catch(e => console.warn('Audio play error:', e));
    } else {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      }
    }
    
    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
      }
    };
  }, [activeSosAlerts, isMuted]);

  const handleResolveSOS = (alertaId: string) => {
    rutaxStore.resolveAlert(alertaId);
    showFlashNotice('Emergencia SOS atendida y registrada.');
  };

  const bases = rutaxStore.bases.filter(b => b.cooperativaId === (currentUser?.cooperativaId || 'coop-daule'));
  const currentBase = bases.find(b => b.id === selectedBaseId) || bases[0];

  // Habilitar operabilidad completa en todas las bases de la cooperativa
  const canEditCurrentBase = true;

  const coopVehiculos = rutaxStore.vehiculos.filter(
    v => v.cooperativaId === (currentUser?.cooperativaId || 'coop-daule')
  );

  // Cola activa de la base ordenada por número de turno FIFO estricto
  const turnosBase = rutaxStore.turnos
    .filter(t => t.baseId === currentBase?.id && t.estado !== 'despachado')
    .sort((a, b) => a.numero_turno - b.numero_turno);

  const turnosBaseReal = turnosBase.filter(t => t.ubicacion_fisica === 'base_real');
  const turnosPrebase = turnosBase.filter(t => t.ubicacion_fisica === 'prebase');

  const capacidadBase = currentBase?.capacidad_base || currentBase?.capacidad_max || 4;
  const capacidadPrebase = currentBase?.capacidad_prebase || 20;
  const tiempoMaxEsperaPrebase = currentBase?.tiempo_max_espera_base || 15; // minutos

  // Unidades con tiempo excesivo en pre-base (> 15 min)
  const turnosConRetrasoPrebase = turnosPrebase.filter(t => (t.tiempo_espera_min || 0) >= tiempoMaxEsperaPrebase);

  // Solicitudes de pasajeros en ruta pendientes o en espera
  const solicitudesRuta = rutaxStore.solicitudesPasajeros
    .filter(s => s.cooperativaId === (currentUser?.cooperativaId || 'coop-daule') && s.estado !== 'recogida' && s.estado !== 'rechazada');

  // Despachos recientes
  const despachosRecientes = rutaxStore.despachos
    .filter(d => d.cooperativaId === (currentUser?.cooperativaId || 'coop-daule'))
    .slice(0, 15);

  // Logs de auditoría de turnos
  const logsAuditoriaTurnos = rutaxStore.logsTurnos
    .filter(l => l.cooperativaId === (currentUser?.cooperativaId || 'coop-daule'))
    .slice(0, 20);

  // Mensajes de conductores para esta base
  const mensajesChoferes = rutaxStore.mensajesConductorBase.filter(
    m => m.cooperativaId === (currentUser?.cooperativaId || 'coop-daule') &&
         (m.destinatario_base === selectedBaseId || m.destinatario_base === 'ambas')
  );
  const unreadMsgCount = mensajesChoferes.filter(m => !m.leido).length;

  const handleSetRightPanelTab = (tab: 'mapa_pax' | 'historial_despachos' | 'auditoria' | 'mensajes_chofer') => {
    setRightPanelTab(tab);
    if (tab === 'mensajes_chofer') {
      // Marcar mensajes como leídos al entrar a la pestaña
      mensajesChoferes.forEach(m => {
        if (!m.leido) {
          rutaxStore.marcarMensajeLeido(m.id);
        }
      });
    }
  };

  // Manejadores de acciones
  const handlePaxStep = (turnoId: string, delta: number) => {
    rutaxStore.updatePassengers(turnoId, delta);
  };

  const handleVaciarCarro = (turno: Turno) => {
    const veh = coopVehiculos.find(v => v.id === turno.vehiculo_id);
    if (window.confirm(`¿Confirmas vaciar los pasajeros de la Unidad #${veh?.numero_unidad}? El contador volverá a 0.`)) {
      rutaxStore.vaciarCarro(turno.id);
      showFlashNotice(`Unidad #${veh?.numero_unidad} vaciada (0 pasajeros).`);
    }
  };

  const handleSolicitarSalida = (turno: Turno) => {
    if (turno.ubicacion_fisica === 'prebase') {
      alert('Regla de Oro FIFO: Solo se puede dar SALIDA desde Base Real, nunca desde Pre-Base.');
      return;
    }

    if (turno.pasajeros_actuales >= turno.pasajeros_max) {
      // Salida con carro lleno
      const res = rutaxStore.darSalidaTurno(turno.id);
      if (res.ok) {
        showFlashNotice(res.message);
      } else {
        alert(res.message);
      }
    } else {
      // Salida incompleta -> requerir justificación obligatoria
      setIncompleteDispatchTurno(turno);
      setIncompleteReason('');
      setIncompleteError(null);
    }
  };

  const handleConfirmarSalidaIncompleta = () => {
    if (!incompleteDispatchTurno) return;
    if (!incompleteReason.trim() || incompleteReason.trim().length < 5) {
      setIncompleteError('Debe ingresar un motivo justificado de al menos 5 caracteres para la auditoría de salida incompleta.');
      return;
    }

    const res = rutaxStore.darSalidaTurno(incompleteDispatchTurno.id, incompleteReason.trim());
    if (res.ok) {
      showFlashNotice(res.message);
      setIncompleteDispatchTurno(null);
      setIncompleteReason('');
      setIncompleteError(null);
    } else {
      setIncompleteError(res.message);
    }
  };

  const handleConfirmReassign = () => {
    if (!reassigningTurno) return;
    setReassignError(null);

    const res = rutaxStore.reasignarTurno(
      reassigningTurno.id,
      newTurnNumber,
      mandatoryReason,
      currentUser?.uid
    );

    if (!res.ok) {
      setReassignError(res.message);
    } else {
      showFlashNotice(res.message);
      setReassigningTurno(null);
      setMandatoryReason('');
    }
  };

  const handleEnrollInQueue = () => {
    if (!selectedVehiculoForEnroll || !currentBase) return;
    const veh = coopVehiculos.find(v => v.id === selectedVehiculoForEnroll);
    if (!veh) return;

    const res = rutaxStore.enrollInQueue(currentBase.id, veh.id, veh.chofer_titular_id);
    if (res.ok) {
      setEnrollFeedback(res.message);
      setSelectedVehiculoForEnroll('');
      showFlashNotice(res.message);
      setTimeout(() => {
        setShowEnrollModal(false);
        setEnrollFeedback(null);
      }, 1200);
    } else {
      setEnrollFeedback(`Error: ${res.message}`);
    }
  };

  const handleCrearSolicitudPasajero = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paxNombre || !paxReferencia) return;

    rutaxStore.crearSolicitudPasajero({
      pasajero_nombre: paxNombre,
      pasajero_telefono: paxTelefono || '0900000000',
      referencia: paxReferencia,
      cantidad_pasajeros: paxCantidad,
      estado: 'pendiente',
      creada_por: 'despachador'
    });

    showFlashNotice(`Solicitud de ${paxNombre} (${paxCantidad} pax) creada.`);
    setShowPaxModal(false);
    setPaxNombre('');
    setPaxTelefono('');
    setPaxReferencia('');
    setPaxCantidad(1);
  };

  const handleAsignarPaxATurno = (solicitudId: string, turnoId: string) => {
    const res = rutaxStore.asignarSolicitudPasajero(solicitudId, turnoId);
    if (res.ok) {
      showFlashNotice(res.message);
    } else {
      alert(res.message);
    }
  };

  const showFlashNotice = (msg: string) => {
    setActionAlert(msg);
    setTimeout(() => setActionAlert(null), 4000);
  };

  return (
    <div id="pantalla-tablet-despacho" className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* HEADER PRINCIPAL INTEGRADO: Título, Switcher Compacto y Cerrar Sesión al mismo nivel */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-50 shrink-0 select-none">
        {/* Left Section: SOS Alerts and Base Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {activeSosAlerts.length > 0 && (
            <div className="flex items-center gap-1 animate-pulse">
              <button 
                onClick={() => handleSetRightPanelTab('mensajes_chofer')}
                className="h-9 px-3 rounded-xl bg-rose-600 text-white flex items-center gap-2 shadow-lg shadow-rose-600/40 border border-rose-400 group relative"
              >
                <Siren className="w-5 h-5 animate-bounce" />
                <span className="text-[11px] font-black uppercase tracking-tighter">
                  {activeSosAlerts.length} SOS ACTIVO
                </span>
                
                {/* Popover rápido para ver qué unidades están en SOS */}
                <div className="absolute top-11 left-0 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase flex justify-between">
                    <span>Unidades en Emergencia</span>
                    <BellRing className="w-3 h-3 text-rose-500" />
                  </div>
                  <div className="space-y-2">
                    {rutaxStore.alertas
                      .filter(a => activeSosAlerts.includes(a.id))
                      .map(a => (
                        <div key={a.id} className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-rose-200">Unidad #{a.numero_unidad}</span>
                            <span className="text-[9px] text-rose-300 font-medium truncate w-32">{a.mensaje}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveSOS(a.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white shadow-sm transition-colors"
                            title="Atender Alerta"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isMuted ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
                title={isMuted ? 'Activar Sonido' : 'Silenciar Alarma'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          )}

          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30 text-sm">
            {selectedBaseId === 'base-b' ? 'B' : 'A'}
          </div>
          <h1 className="font-extrabold text-white text-xs sm:text-sm tracking-tight uppercase whitespace-nowrap">
            BASE {selectedBaseId === 'base-b' ? 'CENTRO' : 'SAUCES'}
          </h1>
        </div>

        {/* Center Section: Modern Unified Base Switcher */}
        <div className="flex items-center gap-2 justify-center flex-1 max-w-xl mx-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-1 flex items-center gap-1.5 shadow-2xl">
            {bases.map(b => {
              const isActive = selectedBaseId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBaseId(b.id)}
                  className={`h-8 px-4 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-slate-950 animate-pulse' : 'bg-slate-700'}`}></div>
                  <span>{b.nombre}</span>
                </button>
              );
            })}

            <div className="w-px h-5 bg-slate-800 mx-1"></div>

            <button
              onClick={() => setShowEnrollModal(true)}
              className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Ingresar Unidad</span>
              <span className="sm:hidden">+ Unidad</span>
            </button>
          </div>
        </div>

        {/* Right Section: Cerrar Sesión */}
        <button
          onClick={() => {
            rutaxStore.logout();
            window.location.href = '/login';
          }}
          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-[10.5px] transition-colors whitespace-nowrap"
        >
          Cerrar Sesión
        </button>
      </header>

      <div className="p-4 sm:p-5 flex-1 space-y-4">
        {/* Notificación flotante de acción */}
        {actionAlert && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{actionAlert}</span>
          </div>
        )}

        {/* Alerta de bloqueo progresivo por suscripción SaaS */}
        {rutaxStore.isCooperativaBlockedForDispatch(currentUser?.cooperativaId || 'coop-daule') && (
          <div className="bg-rose-950/80 border-2 border-rose-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex items-center gap-4 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-200">
                DESPACHO BLOQUEADO POR PROTOCOLO SAAS (MORA EN SUSCRIPCIÓN)
              </h2>
              <p className="text-xs text-rose-300 mt-0.5">
                La cooperativa presenta cuotas vencidas de suscripción. El despacho de unidades se encuentra inhabilitado hasta que la administración registre el comprobante de pago. El GPS continúa activo.
              </p>
            </div>
          </div>
        )}

        {/* INFO SUB-HEADER: Indicadores en Tiempo Real */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Tablet className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-slate-100 tracking-tight uppercase">
                  MÓDULO DE TURNOS FIFO Y DESPACHO EN VIVO
                </h1>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/35 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Despachador: <strong className="text-slate-200">{currentUser?.nombre_completo || 'Operador de Turno'}</strong> • Base Seleccionada: <span className="text-emerald-400 font-bold">{currentBase?.nombre}</span>
              </p>
            </div>
          </div>
        </div>

      {/* SPLIT SCREEN TABLET LANDSCAPE: 60% IZQUIERDA (COLA) | 40% DERECHA (MAPA + PASAJEROS / REPORTES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================= */}
        {/* 60% IZQUIERDA (lg:col-span-7): COLA CON TARJETAS GRANDES */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Car className="w-5 h-5 text-emerald-400" />
                  Cola FIFO en Andenes y Espera ({currentBase?.nombre})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tarjetas táctiles para tablet: steppers de pasajeros, salida y reasignación auditada.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  Tarifa: $1.50 USD
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Capacidad buseta: 15 pax
                </span>
              </div>
            </div>

            {/* Listado de Tarjetas FIFO (Máximo 3 visibles sin necesidad de deslizar) */}
            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {turnosBase.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Car className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-bold">No hay vehículos en la cola de esta base</p>
                  <p className="text-[11px] text-slate-500">
                    Utilice el botón superior "+ Ingresar Unidad a Cola" para registrar llegadas por geocerca.
                  </p>
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs"
                  >
                    + Registrar Llegada de Vehículo
                  </button>
                </div>
              ) : (
                turnosBase.slice(0, 3).map((turno) => {
                  const veh = coopVehiculos.find(v => v.id === turno.vehiculo_id);
                  const chofer = rutaxStore.usuarios.find(u => u.uid === turno.chofer_id);
                  const esPrimerTurno = turno.numero_turno === 1;
                  const enPrebase = turno.ubicacion_fisica === 'prebase';
                  const enDesembarco = turno.ubicacion_fisica === 'desembarcando';
                  const esCompleto = turno.pasajeros_actuales >= turno.pasajeros_max;
                  const tiempoEspera = turno.tiempo_espera_min || 0;
                  const alertaDemora = enPrebase && tiempoEspera >= tiempoMaxEsperaPrebase;

                  return (
                    <div
                      key={turno.id}
                      className={`p-2.5 sm:p-3 rounded-2xl border transition-all shadow-md ${
                        esPrimerTurno
                          ? 'bg-slate-900 border-2 border-emerald-500/70 shadow-emerald-950/20'
                          : enPrebase
                          ? alertaDemora
                            ? 'bg-slate-950 border-2 border-rose-500/60'
                            : 'bg-slate-950 border border-amber-500/30'
                          : enDesembarco
                          ? 'bg-slate-950 border border-sky-500/30'
                          : 'bg-slate-950 border border-slate-800'
                      }`}
                    >
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          {/* Gran Número de Turno con .turno-numero */}
                          <div
                            className={`px-2.5 py-1 rounded-xl flex flex-col items-center justify-center font-black border shadow-sm ${
                              esPrimerTurno
                                ? 'bg-sky-500 text-slate-950 border-sky-300'
                                : enPrebase
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-200 border-slate-700'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-extrabold tracking-wider leading-none">TURNO</span>
                            <span className="turno-numero text-xl font-mono leading-none mt-0.5">#{turno.numero_turno}</span>
                          </div>

                          <div>
                            {/* Placa Destacada */}
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="placa-destacada text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-400">
                                {veh?.placa || 'GXY-1234'}
                              </span>
                              <span className="text-sm font-black text-slate-100 font-mono">
                                Unidad #{veh?.numero_unidad || '---'}
                              </span>
                              {/* Badge Conductor Titular vs Propietario */}
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {turno.tipo_conductor === 'propietario' ? 'Socio Propietario' : 'Chofer Titular'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                              Chofer: <strong className="text-white">{chofer?.nombre_completo || 'Chofer'}</strong>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{veh?.modelo || 'Buseta'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Badges de Estado y Ubicación */}
                        <div className="text-right space-y-0.5">
                          <div>
                            {turno.ubicacion_fisica === 'base_real' && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide">
                                BASE REAL
                              </span>
                            )}
                            {turno.ubicacion_fisica === 'prebase' && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                                PRE-BASE
                              </span>
                            )}
                            {turno.ubicacion_fisica === 'desembarcando' && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase tracking-wide">
                                DESEMBARCANDO
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Espera: {tiempoEspera} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Control de Pasajeros & Botones de Acción */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-800/80 items-center">
                        
                        {/* Stepper de Pasajeros (5 columnas en tablet) */}
                        <div className="sm:col-span-5 bg-slate-900/90 rounded-xl p-1.5 px-2 border border-slate-800 flex items-center justify-between">
                          <button
                            disabled={turno.pasajeros_actuales <= 0}
                            onClick={() => handlePaxStep(turno.id, -1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center font-bold text-base border border-slate-700 transition-all cursor-pointer"
                            title="Restar Pasajero"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <div className="text-center px-1">
                            <span className="text-[9px] text-slate-400 uppercase font-extrabold block leading-none mb-0.5">Ocupación</span>
                            <div className="text-base font-black font-mono leading-none">
                              <span className={esCompleto ? 'text-emerald-400' : 'text-slate-100'}>
                                {turno.pasajeros_actuales}
                              </span>
                              <span className="text-slate-500 text-xs"> / {turno.pasajeros_max}</span>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold block leading-none mt-0.5">
                              ${(turno.total_recaudado || (turno.pasajeros_actuales * 1.50)).toFixed(2)} USD
                            </span>
                          </div>

                          <button
                            disabled={turno.pasajeros_actuales >= turno.pasajeros_max}
                            onClick={() => handlePaxStep(turno.id, +1)}
                            className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-950 flex items-center justify-center font-bold text-base transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                            title="Sumar Pasajero"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Botonera de Acción: SALIDA | VACIAR | REASIGNAR (7 columnas) */}
                        <div className="sm:col-span-7 flex items-center gap-1.5">
                          {/* Botón SALIDA */}
                          <div className="flex-1 relative group">
                            <button
                              disabled={enPrebase}
                              onClick={() => handleSolicitarSalida(turno)}
                              className={`w-full h-9 px-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all shadow-md cursor-pointer ${
                                enPrebase
                                  ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                                  : esCompleto
                                  ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 shadow-emerald-500/20'
                                  : 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{esCompleto ? 'SALIDA' : 'INCOMPLETA'}</span>
                            </button>
                            {enPrebase && (
                              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-950 text-slate-200 text-[11px] rounded-xl border border-slate-700 whitespace-nowrap shadow-xl z-20">
                                Debe estar en Base Real para dar salida
                              </div>
                            )}
                          </div>

                          {/* Botón Vaciar Carro */}
                          <button
                            onClick={() => handleVaciarCarro(turno)}
                            className="h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                            title="Vaciar Carro (Resetear a 0)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
                            <span className="hidden xl:inline">Vaciar</span>
                          </button>

                          {/* Botón Reasignar */}
                          <button
                            onClick={() => {
                              setReassigningTurno(turno);
                              setNewTurnNumber(turno.numero_turno + 1);
                              setMandatoryReason('');
                              setReassignError(null);
                            }}
                            className="h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                            title="Reasignar Posición (Requiere Motivo Obligatorio)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Reasignar</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Banner de Acceso a Consultar Todos los Turnos */}
            {turnosBase.length > 3 && (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowModalTodosLosTurnos(true)}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-between shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Ver {turnosBase.length - 3} turno(s) adicionales que no se ven en la pantalla principal</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-[11px] font-mono shadow-md">
                    Consultar ({turnosBase.length}) →
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 40% DERECHA (lg:col-span-5): MAPA EN VIVO + PASAJEROS / DESPACHOS */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selector de Pestaña del Panel Derecho */}
          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => handleSetRightPanelTab('mapa_pax')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'mapa_pax'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mapa & Pasajeros</span>
            </button>

            <button
              onClick={() => handleSetRightPanelTab('historial_despachos')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'historial_despachos'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Despachos ({despachosRecientes.length})</span>
            </button>

            <button
              onClick={() => handleSetRightPanelTab('auditoria')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                rightPanelTab === 'auditoria'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoría</span>
            </button>

            <button
              onClick={() => {
                handleSetRightPanelTab('mensajes_chofer');
                rutaxStore.marcarMensajesConductorLeidos(selectedBaseId);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                rightPanelTab === 'mensajes_chofer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mensajes</span>
              {unreadMsgCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadMsgCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: MAPA EN VIVO Y PASAJEROS EN RUTA */}
          {rightPanelTab === 'mapa_pax' && (
            <div className="space-y-4">
              {/* Mapa con Geocerca de Base */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Geocerca y Mapa de Base ({currentBase?.nombre})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Radio: {currentBase?.radio_geocerca || 150}m
                    </span>
                    <button
                      onClick={() => setShowMapaFullscreen(true)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-102"
                      title="Ver mapa en pantalla completa"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pantalla Completa</span>
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-800">
                  <RutaxMap
                    bases={bases}
                    vehiculos={coopVehiculos}
                    geocercas={rutaxStore.geocercas.filter(g => g.cooperativaId === (currentUser?.cooperativaId || 'coop-daule'))}
                    trackingLive={rutaxStore.getTrackingLiveArray(currentUser?.cooperativaId || 'coop-daule')}
                    height="480px"
                    showFleetLive={true}
                    showGeocercas={true}
                    showCorridor={true}
                  />
                </div>
              </div>

              {/* Pasajeros Esperando en Ruta */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      Pasajeros Esperando en Ruta ({solicitudesRuta.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Asignación directa a unidades en turno o en despacho.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPaxModal(true)}
                    className="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Solicitud</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {solicitudesRuta.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      No hay pasajeros en espera de recogida en ruta.
                    </div>
                  ) : (
                    solicitudesRuta.map(sol => {
                      const turnoAsignado = turnosBase.find(t => t.id === sol.turno_asignado_id);
                      const vehAsignado = coopVehiculos.find(v => v.id === turnoAsignado?.vehiculo_id);

                      return (
                        <div
                          key={sol.id}
                          className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100">{sol.pasajero_nombre}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-emerald-400">
                                {sol.cantidad_pasajeros} pax
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sol.estado === 'asignada'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {sol.estado}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-sky-400" />
                            <span>{sol.referencia}</span>
                            <span className="text-slate-600">•</span>
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{sol.pasajero_telefono}</span>
                          </p>

                          {/* Acciones de Asignación */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                            {sol.estado === 'asignada' ? (
                              <span className="text-[11px] text-emerald-400 font-bold">
                                Asignado a Unidad #{vehAsignado?.numero_unidad || '---'} (Turno #{turnoAsignado?.numero_turno})
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 w-full">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAsignarPaxATurno(sol.id, e.target.value);
                                    }
                                  }}
                                  className="w-full h-8 px-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[11px]"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Asignar a unidad en turno...</option>
                                  {turnosBase.map(t => {
                                    const v = coopVehiculos.find(veh => veh.id === t.vehiculo_id);
                                    const libres = Math.max(0, t.pasajeros_max - (t.pasajeros_actuales || 0));
                                    const sinCupo = libres < sol.cantidad_pasajeros;
                                    return (
                                      <option key={t.id} value={t.id} disabled={sinCupo}>
                                        Turno #{t.numero_turno} - Unidad #{v?.numero_unidad} ({t.pasajeros_actuales}/{t.pasajeros_max} pax | {libres} libres) {sinCupo ? ' - [SIN CUPO]' : ''}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORIAL DE DESPACHOS RECIENTES */}
          {rightPanelTab === 'historial_despachos' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-400" />
                    Historial de Despachos de Hoy
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Registros oficiales de salida a ruta fija.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Total Hoy: ${despachosRecientes.reduce((acc, d) => acc + d.recaudacion_bruta, 0).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {despachosRecientes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 italic">
                    Aún no se han despachado unidades en esta jornada.
                  </div>
                ) : (
                  despachosRecientes.map(desp => {
                    const veh = coopVehiculos.find(v => v.id === desp.vehiculo_id);
                    const chofer = rutaxStore.usuarios.find(u => u.uid === desp.chofer_id);
                    const baseOrigen = bases.find(b => b.id === desp.base_origen_id);
                    const baseDestino = bases.find(b => b.id === desp.base_destino_id);

                    return (
                      <div
                        key={desp.id}
                        className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100">
                              Unidad #{veh?.numero_unidad || '---'}
                            </span>
                            <span className="text-slate-400 font-mono">({veh?.placa})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                            Salida: {desp.hora_salida}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span>{baseOrigen?.nombre} ➔ {baseDestino?.nombre}</span>
                          <span className="font-mono font-bold text-slate-200">
                            {desp.pasajeros_totales} / {desp.pasajeros_max} pax
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                          <span className="text-slate-400">Chofer: {chofer?.nombre_completo}</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            ${desp.recaudacion_bruta.toFixed(2)} USD
                          </span>
                        </div>

                        {desp.salida_incompleta && (
                          <div className="text-[10px] p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 font-medium">
                            ⚠️ Salida Incompleta: {desp.motivo_salida_incompleta}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUDITORÍA DE TURNOS Y REASIGNACIONES */}
          {rightPanelTab === 'auditoria' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Auditoría Obligatoria de Turnos
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Regla FIFO: Toda reasignación o salida forzada registra motivo y autor.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {logsAuditoriaTurnos.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 italic">
                    No hay registros de auditoría de turnos aún.
                  </div>
                ) : (
                  logsAuditoriaTurnos.map(log => (
                    <div
                      key={log.id}
                      className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.accion === 'reasignacion'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {log.accion}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {log.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-200 font-medium mt-1">
                        {log.detalle}
                      </p>

                      {log.motivo && (
                        <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <strong className="text-amber-400">Motivo:</strong> "{log.motivo}"
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 text-right">
                        Autor: {log.usuario_nombre} ({log.rol})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMUNICACIÓN CONDUCTOR ↔ BASE */}
          {rightPanelTab === 'mensajes_chofer' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Comunicación Directa Conductor ↔ Base
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Respuestas rápidas en 1 clic y chat operativo para despacho fluido.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {mensajesChoferes.length} mensajes
                </span>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {mensajesChoferes.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 italic space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                    <p>No hay mensajes de conductores registrados para esta base.</p>
                  </div>
                ) : (
                  mensajesChoferes.map((msg) => {
                    const veh = rutaxStore.vehiculos.find(v => v.id === msg.vehiculo_id || v.numero_unidad === msg.unidad_numero);
                    const respuestaActual = quickReplyText[msg.id] || '';

                    return (
                      <div
                        key={msg.id}
                        className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2.5 transition-all"
                      >
                        {/* Cabecera del Mensaje */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-400">
                              Unidad #{msg.unidad_numero}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              ({veh?.placa || 'Placa'})
                            </span>
                            <span className="text-slate-300 font-bold">
                              {msg.conductor_nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">
                              {msg.hora}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              msg.estado === 'respondido'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {msg.estado}
                            </span>
                          </div>
                        </div>

                        {/* Texto del Conductor */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                          <p className="text-[11px] leading-relaxed">"{msg.texto}"</p>
                        </div>

                        {/* Respuesta existente si ya fue respondido */}
                        {msg.respuesta && (
                          <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-1.5">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-400">Respondido por {msg.respondido_por || 'Base'}:</span>
                              <p className="mt-0.5">"{msg.respuesta}"</p>
                            </div>
                          </div>
                        )}

                        {/* Respuestas Rápidas (1-Clic) */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-900">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Respuestas Rápidas (1 Clic):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              '✅ Copiado, continúe',
                              '🅿️ Andén 1 asignado',
                              '⏳ Espere en Pre-Base',
                              '⚠️ Avance con precaución',
                              '⛽ Autorizado a tanquear'
                            ].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => {
                                  rutaxStore.responderMensajeBase(
                                    msg.id,
                                    preset,
                                    currentUser?.nombre_completo || 'Despachador Base'
                                  );
                                  showFlashNotice(`Respuesta enviada a Unidad #${msg.unidad_numero}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-300 text-[10px] font-medium border border-slate-700 transition-colors"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          {/* Campo para Respuesta Personalizada */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <input
                              type="text"
                              value={respuestaActual}
                              onChange={(e) => setQuickReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                              placeholder="Escribir mensaje personalizado..."
                              className="flex-1 h-8 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-emerald-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && respuestaActual.trim()) {
                                  rutaxStore.responderMensajeBase(
                                    msg.id,
                                    respuestaActual.trim(),
                                    currentUser?.nombre_completo || 'Despachador Base'
                                  );
                                  setQuickReplyText(prev => ({ ...prev, [msg.id]: '' }));
                                  showFlashNotice(`Respuesta personalizada enviada a Unidad #${msg.unidad_numero}`);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (!respuestaActual.trim()) return;
                                rutaxStore.responderMensajeBase(
                                  msg.id,
                                  respuestaActual.trim(),
                                  currentUser?.nombre_completo || 'Despachador Base'
                                );
                                setQuickReplyText(prev => ({ ...prev, [msg.id]: '' }));
                                showFlashNotice(`Respuesta personalizada enviada a Unidad #${msg.unidad_numero}`);
                              }}
                              className="h-8 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[11px] flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Enviar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL: INGRESAR UNIDAD A COLA (Llegada a Geocerca) */}
      {/* ========================================================= */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                Ingresar Unidad a Cola ({currentBase?.nombre})
              </h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                Selecciona la unidad que ingresó a la geocerca. El sistema calculará automáticamente si ingresa a <strong>Base Real</strong> o a <strong>Pre-Base Virtual</strong> según la capacidad disponible.
              </p>

              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">Unidades Activas Disponibles</label>
                <select
                  value={selectedVehiculoForEnroll}
                  onChange={e => setSelectedVehiculoForEnroll(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-medium text-xs"
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {coopVehiculos
                    .filter(v => v.estado === 'activo')
                    .map(v => {
                      const chofer = rutaxStore.usuarios.find(u => u.uid === v.chofer_titular_id);
                      return (
                        <option key={v.id} value={v.id}>
                          Unidad #{v.numero_unidad} ({v.placa}) - {chofer?.nombre_completo || 'Chofer'}
                        </option>
                      );
                    })}
                </select>
              </div>

              {enrollFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  enrollFeedback.startsWith('Error')
                    ? 'bg-rose-950/40 border border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                }`}>
                  {enrollFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEnrollInQueue}
                  disabled={!selectedVehiculoForEnroll}
                  className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Asignar Turno FIFO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REASIGNAR TURNO CON MOTIVO OBLIGATORIO (Regla 7) */}
      {/* ========================================================= */}
      {reassigningTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-400" />
                Reasignar Posición en Cola FIFO
              </h3>
              <button onClick={() => setReassigningTurno(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Regla de Auditoría Obligatoria
                </p>
                <p className="text-[11px] text-amber-300/80 mt-1">
                  Toda alteración de la cola correlativa queda registrada en la base de datos con fecha, usuario y motivo formal.
                </p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Nueva Posición para Unidad #{coopVehiculos.find(v => v.id === reassigningTurno.vehiculo_id)?.numero_unidad} (Actual: #{reassigningTurno.numero_turno})
                </label>
                <input
                  type="number"
                  min={1}
                  max={turnosBase.length}
                  value={newTurnNumber}
                  onChange={e => setNewTurnNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Motivo Formal de Reasignación <span className="text-rose-400">* (Obligatorio)</span>
                </label>
                <textarea
                  rows={3}
                  value={mandatoryReason}
                  onChange={e => setMandatoryReason(e.target.value)}
                  placeholder="Ej: Falla mecánica temporal, conductor indispuesto, sanción administrativa..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              {reassignError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 font-semibold text-xs">
                  {reassignError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReassigningTurno(null)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassign}
                  className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Reasignación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SALIDA INCOMPLETA CON MOTIVO OBLIGATORIO */}
      {/* ========================================================= */}
      {incompleteDispatchTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                Confirmar Salida Incompleta
              </h3>
              <button onClick={() => setIncompleteDispatchTurno(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/40 text-amber-200 space-y-1">
                <p className="font-bold">
                  La unidad solo tiene {incompleteDispatchTurno.pasajeros_actuales} de {incompleteDispatchTurno.pasajeros_max} pasajeros.
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Para autorizar la salida con cupos vacíos debe registrar obligatoriamente la justificación del despacho.
                </p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Motivo Obligatorio de Salida Incompleta:
                </label>
                <textarea
                  rows={3}
                  value={incompleteReason}
                  onChange={e => setIncompleteReason(e.target.value)}
                  placeholder="Ej: Horario pico de relevo, baja afluencia en terminal, disposición de gerencia..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              {incompleteError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 font-semibold text-xs">
                  {incompleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIncompleteDispatchTurno(null)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarSalidaIncompleta}
                  className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Autorizar Salida</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR SOLICITUD DE PASAJERO EN RUTA */}
      {/* ========================================================= */}
      {showPaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCrearSolicitudPasajero} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Registrar Pasajero en Ruta
              </h3>
              <button type="button" onClick={() => setShowPaxModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Nombre del Pasajero</label>
                <input
                  type="text"
                  required
                  value={paxNombre}
                  onChange={e => setPaxNombre(e.target.value)}
                  placeholder="Ej: Carmen Villacís"
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={paxTelefono}
                  onChange={e => setPaxTelefono(e.target.value)}
                  placeholder="Ej: 0991234567"
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Punto de Espera / Referencia</label>
                <input
                  type="text"
                  required
                  value={paxReferencia}
                  onChange={e => setPaxReferencia(e.target.value)}
                  placeholder="Ej: Frente al Supermaxi Km 7"
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Cantidad de Pasajeros</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={paxCantidad}
                  onChange={e => setPaxCantidad(parseInt(e.target.value) || 1)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaxModal(false)}
                  className="h-10 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Solicitud</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CONSULTAR LISTA COMPLETA DE TURNOS (PANTALLA SECUNDARIA DE CONSULTA) */}
      {showModalTodosLosTurnos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-emerald-400" />
                  Consulta de Todos los Turnos en Cola — Base {currentBase?.nombre} ({turnosBase.length} Unidades)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pantalla secundaria de consulta para revisar la totalidad de unidades registradas.
                </p>
              </div>
              <button 
                onClick={() => setShowModalTodosLosTurnos(false)} 
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Filter Bar */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Filtrar por # de Unidad, Placa o Nombre del Conductor..."
                value={busquedaTurnoModal}
                onChange={e => setBusquedaTurnoModal(e.target.value)}
                className="w-full sm:w-80 h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 font-bold">
                  {turnosBase.length} unidades en total
                </span>
                <span>(Mostrando 1 a {turnosBase.length})</span>
              </div>
            </div>

            {/* Turn List Body */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-950/30">
              {turnosBase
                .filter(t => {
                  if (!busquedaTurnoModal) return true;
                  const veh = coopVehiculos.find(v => v.id === t.vehiculo_id);
                  const chofer = rutaxStore.usuarios.find(u => u.uid === t.chofer_id);
                  const term = busquedaTurnoModal.toLowerCase();
                  return (
                    t.numero_turno.toString().includes(term) ||
                    (veh?.numero_unidad && veh.numero_unidad.toLowerCase().includes(term)) ||
                    (veh?.placa && veh.placa.toLowerCase().includes(term)) ||
                    (chofer?.nombre_completo && chofer.nombre_completo.toLowerCase().includes(term))
                  );
                })
                .map(turno => {
                  const veh = coopVehiculos.find(v => v.id === turno.vehiculo_id);
                  const chofer = rutaxStore.usuarios.find(u => u.uid === turno.chofer_id);
                  const esPrimerTurno = turno.numero_turno === 1;

                  return (
                    <div
                      key={turno.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        esPrimerTurno
                          ? 'bg-slate-900 border-2 border-emerald-500/80 shadow-md'
                          : 'bg-slate-900/80 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-extrabold">TURNO</span>
                          <span className="text-2xl font-black text-emerald-400">#{turno.numero_turno}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-black font-mono text-emerald-400 tracking-wider">
                              {veh?.placa || 'GXY-1234'}
                            </span>
                            <span className="text-sm font-bold text-white">
                              Unidad #{veh?.numero_unidad || '---'}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                              {turno.tipo_conductor === 'propietario' ? 'Socio' : 'Chofer'}
                            </span>
                            {esPrimerTurno && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                                ⭐ Prioridad Próxima Salida
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Conductor: <strong className="text-slate-200">{chofer?.nombre_completo || 'Sin asignación'}</strong> • Ocupación: <span className="font-mono text-emerald-400 font-bold">{turno.pasajeros_actuales}/{turno.pasajeros_max} pax</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setShowModalTodosLosTurnos(false);
                            handleSolicitarSalida(turno);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-102"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Despachar Salida</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModalTodosLosTurnos(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / OVERLAY MAPA EN PANTALLA COMPLETA */}
      {showMapaFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md p-3 sm:p-5 text-slate-100 h-screen w-screen overflow-hidden">
          {/* Map Fullscreen Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl mb-3 shadow-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  Mapa en Pantalla Completa — Base {currentBase?.nombre}
                </h3>
                <p className="text-xs text-slate-400">
                  Rastreo GPS en tiempo real de la flota, geocercas de base y monitoreo de ruta.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMapaFullscreen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-md transition-all cursor-pointer"
            >
              <Minimize2 className="w-4 h-4 text-emerald-400" />
              <span>Salir de Pantalla Completa</span>
            </button>
          </div>

          {/* Map Container Fullscreen */}
          <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-0">
            <RutaxMap
              bases={bases}
              vehiculos={coopVehiculos}
              geocercas={rutaxStore.geocercas.filter(g => g.cooperativaId === (currentUser?.cooperativaId || 'coop-daule'))}
              trackingLive={rutaxStore.getTrackingLiveArray(currentUser?.cooperativaId || 'coop-daule')}
              height="100%"
              showFleetLive={true}
              showGeocercas={true}
              showCorridor={true}
            />
          </div>
        </div>
      )}

      </div>

      {/* AVISO DE ORIENTACIÓN INCORRECTA (PORTRAIT EN TABLET) */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center">
          <div className="max-w-sm space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <Tablet className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-white">🔄 GIRA LA TABLET</h3>
            <p className="text-xs text-slate-300">
              Esta aplicación está optimizada para modo horizontal (landscape). Por favor rota tu tablet.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
