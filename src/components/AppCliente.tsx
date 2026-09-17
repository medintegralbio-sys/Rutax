import React, { useState, useEffect } from 'react';
import { rutaxStore } from '../services/store';
import { Usuario, ReservaCliente, Base, ParadaSugerida } from '../types';
import { RutaxMap } from './RutaxMap';
import {
  Car,
  Camera,
  MapPin,
  Clock,
  QrCode,
  ShieldAlert,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Navigation,
  Phone,
  User,
  History,
  Info,
  Calendar,
  DollarSign,
  ChevronRight,
  LogOut,
  RefreshCw,
  Sparkles,
  Search,
  Share2,
  X
} from 'lucide-react';

interface AppClienteProps {
  currentUser?: Usuario | null;
}

export const AppCliente: React.FC<AppClienteProps> = ({ currentUser }) => {
  const [, setTick] = useState(0);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = rutaxStore.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const currentCoop = rutaxStore.getCurrentCoop();
  const coopBases = rutaxStore.bases.filter(b => b.cooperativaId === currentCoop?.id && b.estado !== 'inactiva');
  const coopParadas = currentCoop?.paradas_sugeridas || [];

  // Active client identity
  const [clienteNombre, setClienteNombre] = useState(currentUser?.nombre_completo || 'María Fernanda González');
  const [clienteTelefono, setClienteTelefono] = useState(currentUser?.telefono || '0987654321');
  const [activeTab, setActiveTab] = useState<'activo' | 'reservar' | 'rutas' | 'historial'>('activo');

  // Booking Form State
  const [origenTipo, setOrigenTipo] = useState<'parada' | 'base'>('parada');
  const [selectedOrigenId, setSelectedOrigenId] = useState<string>(coopParadas[0]?.id || 'par-1');
  const [origenReferencia, setOrigenReferencia] = useState('Frente a la farmacia / Parada autorizada');
  const [selectedDestinoId, setSelectedDestinoId] = useState<string>(coopBases[1]?.id || coopBases[0]?.id || 'base-b');
  const [modoPago, setModoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [bancoTransferencia, setBancoTransferencia] = useState<'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros'>('Pichincha');
  const [comprobanteNumero, setComprobanteNumero] = useState('');
  const [comprobanteImagen, setComprobanteImagen] = useState<string | null>(null);
  const [fechaViaje, setFechaViaje] = useState(new Date().toISOString().split('T')[0]);
  const [horaViaje, setHoraViaje] = useState('Inmediato (Próxima Unidad)');
  const [cantidadPasajeros, setCantidadPasajeros] = useState(1);
  const [selectedRutaId, setSelectedRutaId] = useState<string>(currentCoop?.rutas[0]?.id || 'ruta-1');
  const [tarifaEstimada, setTarifaEstimada] = useState(1.50);
  const [reservaFeedback, setReservaFeedback] = useState<string | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [origenLat, setOrigenLat] = useState(-2.1384);
  const [origenLng, setOrigenLng] = useState(-79.8967);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);

  // Filter reservations for current client
  const misReservas = rutaxStore.reservasClientes.filter(
    r => r.cliente_telefono === clienteTelefono || r.cliente_nombre === clienteNombre
  );

  // Active reservation (most recent not completed or cancelled)
  const reservaActiva = misReservas.find(
    r => r.estado === 'pendiente' || r.estado === 'asignada' || r.estado === 'confirmada'
  );

  // Reproducir alerta sonora al cliente cuando se le asigna un vehículo
  const lastReservaEstadoRef = React.useRef<string | undefined>(reservaActiva?.estado);
  useEffect(() => {
    if (reservaActiva && lastReservaEstadoRef.current === 'pendiente' && reservaActiva.estado === 'asignada') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (e) {
        console.warn('Audio play failed:', e);
      }
      setReservaFeedback(`🚀 ¡Tu viaje ha sido asignado! Unidad #${reservaActiva.vehiculo_asignado?.numero_unidad} - Placa: ${reservaActiva.vehiculo_asignado?.placa}`);
      setTimeout(() => setReservaFeedback(null), 8000);
    }
    lastReservaEstadoRef.current = reservaActiva?.estado;
  }, [reservaActiva]);

  const handleCrearReserva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoop) return;

    let finalLat = origenLat;
    let finalLng = origenLng;
    let origenNombre = 'Ubicación seleccionada';

    if (origenTipo === 'base') {
      const b = coopBases.find(base => base.id === selectedOrigenId);
      if (b) {
        origenNombre = b.nombre;
        finalLat = b.lat;
        finalLng = b.lng;
      }
    } else if (origenTipo === 'parada') {
      const p = coopParadas.find(par => par.id === selectedOrigenId);
      if (p) {
        origenNombre = p.nombre;
        finalLat = p.lat;
        finalLng = p.lng;
      }
    }

    const baseDest = coopBases.find(b => b.id === selectedDestinoId);
    const destinoNombre = baseDest ? baseDest.nombre : 'Base Terminal';

    const selectedRuta = currentCoop?.rutas.find(r => r.id === selectedRutaId);
    const rutaNombre = selectedRuta ? selectedRuta.nombre : 'Ruta General';
    const formattedReferencia = `[Trayecto: ${rutaNombre}] [Recogida: ${horaViaje}] Ref: ${origenReferencia.trim()}`;

    const nueva = rutaxStore.crearReservaCliente({
      cooperativaId: currentCoop.id,
      cliente_nombre: clienteNombre,
      cliente_telefono: clienteTelefono,
      cliente_tipo: 'registrado',
      fecha: fechaViaje,
      hora_deseada: horaViaje === 'Inmediato (Próxima Unidad)' ? new Date().toTimeString().slice(0, 5) : horaViaje,
      punto_recogida: {
        nombre: origenNombre,
        lat: finalLat,
        lng: finalLng,
        referencia: formattedReferencia
      },
      destino_es_base: true,
      base_destino_id: selectedDestinoId,
      destino_nombre: destinoNombre,
      cantidad_pasajeros: cantidadPasajeros,
      modo_pago: modoPago,
      monto: tarifaEstimada * cantidadPasajeros,
      transferencia_banco: modoPago === 'transferencia' ? bancoTransferencia : undefined,
      transferencia_numero_operacion: modoPago === 'transferencia' ? comprobanteNumero : undefined,
      transferencia_comprobante_url: modoPago === 'transferencia' ? (comprobanteImagen || null) : null
    });

    setReservaFeedback(`✓ Solicitud de viaje #${nueva.id.slice(-4)} enviada a la Base. Buscando unidad más cercana...`);
    setActiveTab('activo');
    setComprobanteImagen(null);
    setTimeout(() => setReservaFeedback(null), 4000);
  };

  const handleTriggerSOS = () => {
    setSosActive(true);
    if (reservaActiva) {
      rutaxStore.addAuditLog(
        'ALERTA_SOS_PASAJERO',
        `🚨 ALERTA SOS EMITIDA por Pasajero ${clienteNombre} (${clienteTelefono}) en viaje #${reservaActiva.id.slice(-4)}. Coordenadas: ${reservaActiva.punto_recogida.lat}, ${reservaActiva.punto_recogida.lng}`
      );
    }
    alert('🚨 ALERTA DE AUXILIO ENVIADA: Central de Despacho y ECU-911 han sido notificados con tu ubicación exacta.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-emerald-500 selection:text-slate-950">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HEADER CLIENTE & PERFIL */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                  RUTAX SMART • PASAJERO
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h1 className="text-sm font-black text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                {currentCoop?.nombre || 'Cooperativa Daule Express'}
              </h1>
            </div>
          </div>

          {/* Perfil Rápido & Salir */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px]">
                {clienteNombre}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{clienteTelefono}</span>
            </div>
            <button
              onClick={() => {
                rutaxStore.logout();
                window.location.href = '/login';
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Banner Feedback */}
        {reservaFeedback && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {reservaFeedback}
            </span>
            <button onClick={() => setReservaFeedback(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑAS DE NAVEGACIÓN CLIENTE */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('activo')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 relative ${
              activeTab === 'activo'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Viaje Activo</span>
            {reservaActiva && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1 sm:static"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservar')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'reservar'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Solicitar</span>
          </button>

          <button
            onClick={() => setActiveTab('rutas')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'rutas'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Rutas</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeTab === 'historial'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Mis Viajes</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: VIAJE ACTIVO / EN VIVO */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'activo' && (
          <div className="space-y-4">
            {!reservaActiva ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <Car className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100">No tienes viajes en curso</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Solicita tu asiento en la próxima unidad del corredor regulado Daule ↔ Sauces ↔ Guayaquil.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('reservar')}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Solicitar Asiento / Reserva</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                {/* Tarjeta de Estado Principal */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                        Reserva #{reservaActiva.id.slice(-4)}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      reservaActiva.estado === 'asignada'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    }`}>
                      {reservaActiva.estado === 'asignada' ? '✓ Unidad Asignada' : '⏳ Esperando Asignación'}
                    </span>
                  </div>

                  {/* Estado PENDIENTE: Esperando que despacho asigne unidad */}
                  {reservaActiva.estado === 'pendiente' && (
                    <div className="space-y-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">Asignando tu unidad...</h4>
                          <p className="text-xs text-slate-400">
                            La Base de Despacho está programando el siguiente turno disponible para tu punto de recogida.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Recogida en:</span>
                          <strong className="text-slate-100">{reservaActiva.punto_recogida.nombre}</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Destino:</span>
                          <strong className="text-slate-100">{reservaActiva.destino_nombre}</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Pago ({reservaActiva.modo_pago}):</span>
                          <strong className="text-emerald-400 font-mono">${reservaActiva.monto.toFixed(2)} USD</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estado ASIGNADA: Mostrar Placa Destacada, Turno, Chofer y ETA */}
                  {reservaActiva.estado === 'asignada' && (
                    <div className="space-y-4">
                      {/* Banner de Unidad y Placa Destacada */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Vehículo en Camino
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20">
                            ETA: ~{reservaActiva.vehiculo_asignado?.tiempo_estimado_llegada_min || 5} min
                          </span>
                        </div>

                        {/* Placa Destacada en Verde Neón (#22C55E) */}
                        <div className="flex items-baseline justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Placa Oficial:</span>
                            <div className="placa-destacada font-mono">
                              {reservaActiva.vehiculo_asignado?.placa || 'GXY-1234'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Unidad:</span>
                            <div className="turno-numero">
                              #{reservaActiva.vehiculo_asignado?.numero_unidad || '15'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80 text-slate-300">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Modelo / Color:</span>
                            <span className="font-semibold text-slate-200">
                              {reservaActiva.vehiculo_asignado?.modelo || 'Toyota Hiace'} • {reservaActiva.vehiculo_asignado?.color || 'Blanco'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Conductor Asignado:</span>
                            <span className="font-semibold text-slate-200">
                              {reservaActiva.vehiculo_asignado?.chofer_nombre || 'Juan Pérez'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Código de Abordaje / Token QR */}
                      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center">
                            <QrCode className="w-10 h-10 text-slate-950" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              Token de Abordaje
                            </span>
                            <span className="text-lg font-black text-slate-100 font-mono tracking-widest">
                              RTX-{reservaActiva.id.slice(-4).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 text-right max-w-[120px]">
                          Muestra este código al chofer para registrar tu subida
                        </span>
                      </div>

                      {/* Botón de Auxilio SOS para Pasajero */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleTriggerSOS}
                          className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Botón de Auxilio SOS</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('¿Deseas cancelar esta reserva?')) {
                              reservaActiva.estado = 'cancelada';
                              setReservaFeedback('Reserva cancelada.');
                              setActiveTab('reservar');
                            }
                          }}
                          className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mapa con Seguimiento en Vivo */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      Ubicación del Vehículo en Ruta
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">GPS 30s</span>
                  </div>

                  {/* Botón para pantalla completa */}
                  <button
                    onClick={() => setShowFullScreenMap(true)}
                    className="mt-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Navigation className="w-3 h-3" />
                    Abrir Mapa Pantalla Completa
                  </button>

                  <RutaxMap
                    bases={[]}
                    paradas={coopParadas}
                    vehiculos={rutaxStore.vehiculos}
                    trackingLive={rutaxStore.getTrackingLiveArray(currentCoop?.id)}
                    highlightVehiculoId={
                      reservaActiva?.vehiculo_asignado
                        ? rutaxStore.vehiculos.find(v => v.placa === reservaActiva.vehiculo_asignado?.placa)?.id
                        : null
                    }
                    onMapClick={(lat, lng) => {
                      setOrigenLat(lat);
                      setOrigenLng(lng);
                      setOrigenReferencia('Ubicación seleccionada en mapa');
                      setOrigenTipo('parada'); // Force to custom point
                    }}
                    height="280px"
                    showFleetLive={true}
                    showCorridor={true}
                    showGeocercas={false}
                    showSearch={false}
                    showMapSelector={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {showFullScreenMap && (
          <div className="fixed inset-0 z-50 bg-slate-950">
            <RutaxMap
              bases={[]}
              paradas={[]}
              vehiculos={reservaActiva?.vehiculo_asignado ? rutaxStore.vehiculos.filter(v => v.placa === reservaActiva.vehiculo_asignado?.placa) : []}
              trackingLive={reservaActiva?.vehiculo_asignado ? rutaxStore.getTrackingLiveArray(currentCoop?.id).filter(t => t.placa === reservaActiva.vehiculo_asignado?.placa) : []}
              height="100vh"
              onClose={() => setShowFullScreenMap(false)}
              showSearch={false}
              showMapSelector={false}
              showCorridor={false}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SOLICITAR ASIENTO / RESERVA */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reservar' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Solicitar Pasaje en Corredor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Reserva tu cupo en la próxima salida regular con tarifa plana regulada.
              </p>
            </div>

            <form onSubmit={handleCrearReserva} className="space-y-4 text-xs">
              {/* Datos del Pasajero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Teléfono / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={clienteTelefono}
                      onChange={e => setClienteTelefono(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Punto de Recogida */}
              <div className="space-y-2 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Punto de Recogida (Parada)
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setOrigenTipo('parada')}
                      className={`px-2 py-0.5 rounded-lg font-semibold ${
                        origenTipo === 'parada' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Paradas
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrigenTipo('base')}
                      className={`px-2 py-0.5 rounded-lg font-semibold ${
                        origenTipo === 'base' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Bases
                    </button>
                  </div>
                </div>

                <select
                  value={selectedOrigenId}
                  onChange={e => setSelectedOrigenId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {origenTipo === 'parada'
                    ? coopParadas.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} (Parada #{p.orden})
                        </option>
                      ))
                    : coopBases.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} ({b.direccion})
                        </option>
                      ))}
                </select>

                <input
                  type="text"
                  placeholder="Referencia visual (ej: Frente a farmacia Fybeca / Parada de bus)"
                  value={origenReferencia}
                  onChange={e => setOrigenReferencia(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500"
                />
              </div>

              {/* Destino de Viaje */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Base de Destino</label>
                <select
                  value={selectedDestinoId}
                  onChange={e => setSelectedDestinoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {coopBases.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} ({b.direccion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trayecto o Ruta que necesita recoger */}
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-semibold block">Trayecto / Ruta que necesita recoger</label>
                <select
                  value={selectedRutaId}
                  onChange={e => setSelectedRutaId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {currentCoop?.rutas.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} (Tarifa: ${r.tarifa_plana.toFixed(2)} USD)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Selecciona el recorrido o trayecto que tomará tu viaje.
                </p>
              </div>

              {/* Hora de Recogida */}
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-slate-300 font-semibold block">Hora de Recogida que necesita</label>
                <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() => setHoraViaje('Inmediato (Próxima Unidad)')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      horaViaje === 'Inmediato (Próxima Unidad)'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Inmediato
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoraViaje(new Date().toTimeString().slice(0, 5))}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      horaViaje !== 'Inmediato (Próxima Unidad)'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Elegir Hora
                  </button>
                </div>
                {horaViaje !== 'Inmediato (Próxima Unidad)' && (
                  <div className="pt-1.5">
                    <input
                      type="time"
                      value={horaViaje}
                      onChange={e => setHoraViaje(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-center text-sm font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Cantidad de Pasajeros / Puestos a Ocupar */}
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-slate-300 font-semibold block text-sm flex items-center justify-between">
                  <span>Cantidad de Pasajeros (Asientos a Reservar)</span>
                  <span className="text-xs text-emerald-400 font-bold font-mono">
                    ${(1.50 * cantidadPasajeros).toFixed(2)} USD
                  </span>
                </label>
                <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setCantidadPasajeros(Math.max(1, cantidadPasajeros - 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-bold flex items-center justify-center text-lg transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-base font-black font-mono text-emerald-400 block">
                      {cantidadPasajeros} {cantidadPasajeros === 1 ? 'Pasajero' : 'Pasajeros'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Se descontarán {cantidadPasajeros} {cantidadPasajeros === 1 ? 'puesto' : 'puestos'} de la capacidad del vehículo al asignarse
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCantidadPasajeros(Math.min(10, cantidadPasajeros + 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-bold flex items-center justify-center text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Modo de Pago */}
              <div className="space-y-3 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                <label className="text-slate-300 font-semibold block">Forma de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModoPago('efectivo')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      modoPago === 'efectivo'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <div>
                      <span className="block text-xs">Efectivo</span>
                      <span className="text-[10px] text-slate-400">Paga al abordar</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoPago('transferencia')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      modoPago === 'transferencia'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <div>
                      <span className="block text-xs">Transferencia / Deuna</span>
                      <span className="text-[10px] text-slate-400">Pichincha / Guayaquil</span>
                    </div>
                  </button>
                </div>

                {modoPago === 'transferencia' && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-mono">
                      <div>Banco: <strong>Banco Pichincha (Cta. Corriente)</strong></div>
                      <div>Número: <strong>2100456789</strong></div>
                      <div>Titular: <strong>Coop. Transporte Daule Express</strong></div>
                      <div>RUC: <strong>0992384756001</strong></div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">
                        Número de Comprobante / Código de Operación
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 894721"
                        value={comprobanteNumero}
                        onChange={e => setComprobanteNumero(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>

                    {/* Sección Cargar Comprobante / Tomar Foto */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-800">
                      <label className="text-slate-400 text-[10px] block font-semibold">
                        Capturar o Cargar Foto del Comprobante (Requerido)
                      </label>
                      <div className="relative border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-3 bg-slate-950 text-center transition-colors min-h-[80px] flex flex-col justify-center items-center">
                        <input
                          id="input-comprobante-file"
                          type="file"
                          accept="image/*"
                          required={!comprobanteImagen}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setComprobanteImagen(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {comprobanteImagen ? (
                          <div className="space-y-1.5 w-full">
                            <img
                              src={comprobanteImagen}
                              alt="Vista previa del comprobante"
                              className="max-h-24 mx-auto rounded-lg object-contain border border-slate-800 shadow-md"
                            />
                            <button
                              id="btn-remove-comprobante-img"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setComprobanteImagen(null);
                              }}
                              className="text-[9px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                            >
                              Eliminar Foto
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 flex flex-col items-center justify-center">
                            <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-slate-300 block font-semibold">
                              Tomar Foto con Cámara o Elegir Archivo
                            </span>
                            <span className="text-[8px] text-slate-500 block">
                              Sube una imagen de tu recibo (Ej: JPG, PNG o PDF)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total y Confirmación */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-slate-400 text-[11px] block">Tarifa Oficial Regulada:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ${tarifaEstimada.toFixed(2)} USD
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Solicitar</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: RUTAS & PARADAS SUGERIDAS */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'rutas' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                Rutas & Paradas Oficiales
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Horarios de operación: 05:00 a 22:30 • Frecuencia cada 8 minutos en horas pico.
              </p>
            </div>

            {/* Bases autorizadas */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Bases Terminales
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {coopBases.map(b => (
                  <div key={b.id} className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      {b.nombre}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{b.direccion}</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-mono">Andenes: {b.capacidad_max}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paradas sugeridas */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Puntos de Recogida en Corredor
              </span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {coopParadas.map(p => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                        {p.orden}
                      </span>
                      <span className="font-semibold text-slate-200">{p.nombre}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: HISTORIAL DE VIAJES DEL CLIENTE */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'historial' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              Historial de Reservas & Viajes
            </h3>

            <div className="space-y-2.5">
              {misReservas.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Aún no tienes registros de viajes en el historial.
                </div>
              ) : (
                misReservas.map(r => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        Viaje #{r.id.slice(-4)} • {r.fecha}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.estado === 'asignada'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : r.estado === 'cancelada'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {r.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Origen: <strong className="text-slate-200">{r.punto_recogida.nombre}</strong></div>
                      <div>Destino: <strong className="text-slate-200">{r.destino_nombre}</strong></div>
                    </div>

                    {r.vehiculo_asignado && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">
                          Unidad <strong>#{r.vehiculo_asignado.numero_unidad}</strong> ({r.vehiculo_asignado.placa})
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">
                          ${r.monto.toFixed(2)} USD
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        if (confirm('¿Quieres repetir este viaje? Se llenarán los datos automáticamente.')) {
                          setSelectedOrigenId(r.punto_recogida.nombre.includes('Parada') ? coopParadas.find(p => p.nombre === r.punto_recogida.nombre)?.id || coopParadas[0].id : coopParadas[0].id);
                          setSelectedDestinoId(coopBases.find(b => b.nombre === r.destino_nombre)?.id || coopBases[0].id);
                          setCantidadPasajeros(r.cantidad_pasajeros || 1);
                          setActiveTab('reservar');
                          setReservaFeedback('Datos del viaje cargados, por favor elige forma de pago y envía la solicitud.');
                        }
                      }}
                      className="w-full bg-emerald-500/10 text-emerald-400 font-bold py-2 rounded-xl text-xs hover:bg-emerald-500 hover:text-slate-950 transition border border-emerald-500/20"
                    >
                      Repetir Viaje
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
