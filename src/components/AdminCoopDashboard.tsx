import React, { useState, useEffect } from 'react';
import { rutaxStore } from '../services/store';
import {
  Cooperativa,
  Base,
  ParadaSugerida,
  RutaFija,
  Geocerca,
  TrackingLive,
  AlertaTracking,
  TrackingHistorial
} from '../types';
import { RutaxMap } from './RutaxMap';
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Car,
  ShieldCheck,
  Plus,
  Edit3,
  AlertTriangle,
  ChevronRight,
  Radio,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  ArrowRight,
  Info,
  Navigation,
  Locate,
  Zap,
  RefreshCw,
  Compass,
  Play,
  Pause,
  Trash2,
  Shield,
  Activity,
  Battery,
  Sliders,
  Users,
  AlertCircle,
  ShieldAlert,
  Receipt,
  CreditCard,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FinanzasAdminCoop } from './FinanzasAdminCoop';
import { PasajerosAdminDashboard } from './PasajerosAdminDashboard';
import { SecurityAlertsPanel } from './SecurityAlertsPanel';
import { AdminCoopSuscripcionTab } from './AdminCoopSuscripcionTab';
import { ModalRegistroBase } from './admin/ModalRegistroBase';

interface AdminCoopDashboardProps {
  onOpenUnitEnrollment: () => void;
}

export const AdminCoopDashboard: React.FC<AdminCoopDashboardProps> = ({
  onOpenUnitEnrollment
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return rutaxStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const currentCoop = rutaxStore.getCurrentCoop();
  const [activeTab, setActiveTab] = useState<'tracking' | 'geocercas' | 'pasajeros' | 'bases' | 'rutas' | 'pendientes' | 'finanzas' | 'suscripcion' | 'emergencias' | 'perfil'>('tracking');
  const [showMapaFullscreen, setShowMapaFullscreen] = useState(false);

  // Estado para gestión de rutas
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteFare, setNewRouteFare] = useState('0.50');

  // Estado para paradas sugeridas
  const [newStopName, setNewStopName] = useState('');
  const [newStopLat, setNewStopLat] = useState(-2.1600);
  const [newStopLng, setNewStopLng] = useState(-79.8920);

  // Estado para mapa y selección de coordenadas
  const [selectionMode, setSelectionMode] = useState<'base' | 'prebase' | 'bahia' | 'parada' | 'geocerca' | null>(null);
  const [highlightBaseId, setHighlightBaseId] = useState<string | null>(null);
  const [highlightVehiculoId, setHighlightVehiculoId] = useState<string | null>(null);
  const [selectedHistorial, setSelectedHistorial] = useState<TrackingHistorial | null>(null);

  // Filtros de tracking
  const [trackingFilter, setTrackingFilter] = useState<'todas' | 'en_ruta' | 'en_base' | 'desembarcando' | 'alertas'>('todas');

  // Estado para Modal y Formulario de Geocercas
  const [showGeocercaModal, setShowGeocercaModal] = useState(false);
  const [editingGeoId, setEditingGeoId] = useState<string | null>(null);
  const [geoNombre, setGeoNombre] = useState('');
  const [geoTipo, setGeoTipo] = useState<Geocerca['tipo']>('zona_riesgo');
  const [geoLat, setGeoLat] = useState<number>(-2.1220);
  const [geoLng, setGeoLng] = useState<number>(-79.9150);
  const [geoRadio, setGeoRadio] = useState<number>(300);
  const [geoHorarioInicio, setGeoHorarioInicio] = useState('20:00');
  const [geoHorarioFin, setGeoHorarioFin] = useState('04:00');
  const [geoNivelAlerta, setGeoNivelAlerta] = useState<'amarillo' | 'rojo'>('rojo');
  const [geoDescripcion, setGeoDescripcion] = useState('');

  // Estado para Modal de Base CRUD con Geoposicionamiento Satelital y GPS
  const [showBaseModal, setShowBaseModal] = useState(false);
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  const [baseFeedback, setBaseFeedback] = useState<string | null>(null);

  // Bases y vehículos de la cooperativa actual
  const coopBases = rutaxStore.bases.filter(b => b.cooperativaId === currentCoop?.id);
  const coopVehiculos = rutaxStore.vehiculos.filter(v => v.cooperativaId === currentCoop?.id);
  const coopTurnos = rutaxStore.turnos.filter(t => t.cooperativaId === currentCoop?.id);
  const coopSolicitudes = rutaxStore.vehiculosPendientes.filter(s => s.cooperativaId === currentCoop?.id);
  const coopAlertas = rutaxStore.alertas.filter(a => a.cooperativaId === currentCoop?.id);

  // Tracking y Geocercas de la cooperativa
  const coopGeocercas = rutaxStore.geocercas.filter(g => g.cooperativaId === currentCoop?.id);
  const coopTrackingLive = rutaxStore.getTrackingLiveArray(currentCoop?.id);
  const coopAlertasTracking = rutaxStore.alertasTracking.filter(a => a.cooperativaId === currentCoop?.id);
  const coopHistoriales = rutaxStore.trackingHistorial.filter(h => h.cooperativaId === currentCoop?.id);

  const turnosHoy = coopTurnos.filter(t => t.estado === 'despachado');
  const totalPasajerosHoy = turnosHoy.reduce((acc, curr) => acc + (curr.pasajeros_actuales || 0), 0);
  const totalRecaudadoHoy = turnosHoy.reduce((acc, curr) => acc + (curr.total_recaudado || 0), 0);

  // Filtrar lista de tracking en vivo
  const filteredTracking = coopTrackingLive.filter(t => {
    if (trackingFilter === 'en_ruta') return t.estado === 'en_ruta';
    if (trackingFilter === 'en_base') return t.estado === 'en_base';
    if (trackingFilter === 'desembarcando') return t.estado === 'desembarcando';
    if (trackingFilter === 'alertas') {
      return t.estado === 'emergencia' || t.velocidad > 70 || t.desviado_de_ruta || t.en_zona_riesgo;
    }
    return true;
  });

  // Handlers
  const handleAddRoute = () => {
    if (!newRouteName.trim() || !currentCoop) return;
    const tarifa = parseFloat(newRouteFare) || 0.50;
    const nuevaRuta: RutaFija = {
      id: `ruta-${Date.now()}`,
      nombre: newRouteName.trim(),
      tarifa_plana: tarifa,
      activa: true,
      fecha_vigencia: new Date().toISOString().substring(0, 10),
      historial_tarifas: [
        { tarifa, fecha: new Date().toISOString().substring(0, 10), motivo: 'Creación de ruta regulada' }
      ]
    };
    if (!currentCoop.rutas) currentCoop.rutas = [];
    currentCoop.rutas.push(nuevaRuta);
    rutaxStore.addAuditLog('CREAR_RUTA_FIJA', `Nueva ruta fija "${nuevaRuta.nombre}" creada con tarifa plana de $${tarifa.toFixed(2)}.`);
    setNewRouteName('');
    rutaxStore.notify();
  };

  const handleAddStop = () => {
    if (!newStopName.trim() || !currentCoop) return;
    if (!currentCoop.paradas_sugeridas) currentCoop.paradas_sugeridas = [];
    const nuevaParada: ParadaSugerida = {
      id: `par-${Date.now()}`,
      nombre: newStopName.trim(),
      lat: Number(newStopLat.toFixed(6)),
      lng: Number(newStopLng.toFixed(6)),
      orden: currentCoop.paradas_sugeridas.length + 1
    };
    currentCoop.paradas_sugeridas.push(nuevaParada);
    rutaxStore.addAuditLog('AGREGAR_PARADA_SUGERIDA', `Parada sugerida "${nuevaParada.nombre}" agregada a la cooperativa.`);
    setNewStopName('');
    setSelectionMode(null);
    rutaxStore.notify();
  };

  const handleMapClickForCoord = (lat: number, lng: number) => {
    if (selectionMode === 'parada') {
      setNewStopLat(lat);
      setNewStopLng(lng);
    } else if (selectionMode === 'geocerca') {
      setGeoLat(lat);
      setGeoLng(lng);
      setSelectionMode(null);
    }
  };

  // Guardar Geocerca (Nueva o Edición)
  const handleSaveGeocerca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoNombre.trim() || !currentCoop) return;

    const payload = {
      cooperativaId: currentCoop.id,
      tipo: geoTipo,
      nombre: geoNombre.trim(),
      lat: geoLat,
      lng: geoLng,
      radio_metros: Number(geoRadio),
      activa: true,
      config: geoTipo === 'zona_riesgo' ? {
        horario_inicio: geoHorarioInicio,
        horario_fin: geoHorarioFin,
        nivel_alerta: geoNivelAlerta,
        descripcion: geoDescripcion.trim() || 'Zona con protocolos especiales de monitoreo nocturno'
      } : undefined
    };

    if (editingGeoId) {
      rutaxStore.updateGeocerca(editingGeoId, payload);
    } else {
      rutaxStore.addGeocerca(payload);
    }

    // Reset
    setShowGeocercaModal(false);
    setEditingGeoId(null);
    setGeoNombre('');
    setGeoDescripcion('');
  };

  const handleEditGeocerca = (geo: Geocerca) => {
    setEditingGeoId(geo.id);
    setGeoNombre(geo.nombre);
    setGeoTipo(geo.tipo);
    setGeoLat(geo.lat);
    setGeoLng(geo.lng);
    setGeoRadio(geo.radio_metros);
    if (geo.config) {
      setGeoHorarioInicio(geo.config.horario_inicio || '20:00');
      setGeoHorarioFin(geo.config.horario_fin || '04:00');
      setGeoNivelAlerta(geo.config.nivel_alerta || 'rojo');
      setGeoDescripcion(geo.config.descripcion || '');
    }
    setShowGeocercaModal(true);
  };

  // Handlers para Gestión Dinámica de Bases con ModalRegistroBase
  const handleOpenCreateBase = () => {
    setEditingBase(null);
    setShowBaseModal(true);
  };

  const handleEditBase = (base: Base) => {
    setEditingBase(base);
    setShowBaseModal(true);
  };

  const handleSaveBaseData = (baseData: {
    numero_base?: string;
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
    capacidad_max: number;
    radio_geocerca: number;
    tiene_prebase: boolean;
    prebase?: any;
  }) => {
    if (!currentCoop) return;

    if (editingBase) {
      rutaxStore.updateBase(editingBase.id, {
        numero_base: baseData.numero_base,
        nombre: baseData.nombre,
        direccion: baseData.direccion,
        lat: baseData.lat,
        lng: baseData.lng,
        capacidad_max: baseData.capacidad_max,
        capacidad_base: baseData.capacidad_max,
        radio_geocerca: baseData.radio_geocerca,
        tiene_prebase: baseData.tiene_prebase,
        prebase: baseData.prebase
      });
      setBaseFeedback(`✓ Base "${baseData.nombre}" actualizada correctamente.`);
    } else {
      rutaxStore.addBase({
        numero_base: baseData.numero_base,
        cooperativaId: currentCoop.id,
        nombre: baseData.nombre,
        direccion: baseData.direccion,
        lat: baseData.lat,
        lng: baseData.lng,
        capacidad_max: baseData.capacidad_max,
        capacidad_base: baseData.capacidad_max,
        capacidad_prebase: baseData.prebase?.capacidad_max || 15,
        radio_geocerca: baseData.radio_geocerca,
        color_pin: '#22C55E',
        tiene_prebase: baseData.tiene_prebase,
        prebase: baseData.prebase
      });
      setBaseFeedback(`✓ Nueva Base "${baseData.nombre}" registrada y agregada al corredor.`);
    }

    setShowBaseModal(false);
    setEditingBase(null);
    setTimeout(() => setBaseFeedback(null), 3500);
  };

  const handleToggleEstadoBase = (baseId: string) => {
    const res = rutaxStore.toggleEstadoBase(baseId);
    if (!res.ok) {
      alert(res.message);
    } else {
      setBaseFeedback(res.message);
      setTimeout(() => setBaseFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Shortcuts */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              CENTRAL DE OPERACIONES & GPS
            </span>
            <span className="text-xs text-slate-400">RUC: {currentCoop?.ruc}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-1">
            {currentCoop?.nombre || 'Cooperativa de Transporte'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Presidente: {currentCoop?.presidente_nombre} ({currentCoop?.presidente_celular}) • Corredor Sauces ↔ Centro
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenUnitEnrollment}
            className="h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Inscribir Unidad / Carga Masiva</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">Flota con GPS Activo</span>
          <div className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{coopTrackingLive.length} unidades</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">En Circulación / Ruta</span>
          <div className="text-xl font-bold text-sky-400 mt-1 flex items-center gap-1.5">
            <Navigation className="w-4 h-4" />
            <span>{coopTrackingLive.filter(t => t.estado === 'en_ruta').length} en ruta</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">Geocercas & Zonas Riesgo</span>
          <div className="text-xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>{coopGeocercas.length} activas</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400">Alertas Tracking Activas</span>
          <div className="text-xl font-bold text-rose-400 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{coopAlertasTracking.filter(a => !a.atendida).length} alertas</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tracking'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Tracking GPS Flota en Vivo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] font-mono font-bold">
            {coopTrackingLive.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('geocercas')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'geocercas'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Geocercas & Zonas de Riesgo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono">
            {coopGeocercas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pasajeros')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'pasajeros'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Pasajeros & Reservas</span>
          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
            {rutaxStore.getPasajerosFrecuentes(currentCoop?.id).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bases')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'bases'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Gestión de Bases & Pase Directo</span>
        </button>

        <button
          onClick={() => setActiveTab('rutas')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'rutas'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Rutas, Tarifas & Paradas</span>
        </button>

        <button
          onClick={() => setActiveTab('pendientes')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'pendientes'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4 text-emerald-400" />
          <span>Control de Flota y Unidades ({coopVehiculos.length})</span>
          {coopSolicitudes.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold animate-pulse">
              {coopSolicitudes.length} pnd
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('finanzas')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'finanzas'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>Liquidaciones & Finanzas</span>
        </button>

        <button
          onClick={() => setActiveTab('suscripcion')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'suscripcion'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-purple-400" />
          <span>Suscripción & Facturación SaaS</span>
        </button>

        <button
          onClick={() => setActiveTab('emergencias')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'emergencias'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alertas SOS & Telemáticas ({coopAlertasTracking.filter(a => !a.atendida).length + coopAlertas.filter(a => !a.atendida).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('perfil')}
          className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'perfil'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos Cooperativa</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB TRACKING: MONITOREO GPS EN VIVO & FLOTA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Controls Bar & Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Filtrar Flota:</span>
              <button
                onClick={() => setTrackingFilter('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  trackingFilter === 'todas'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todas ({coopTrackingLive.length})
              </button>
              <button
                onClick={() => setTrackingFilter('en_ruta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  trackingFilter === 'en_ruta'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                En Ruta ({coopTrackingLive.filter(t => t.estado === 'en_ruta').length})
              </button>
              <button
                onClick={() => setTrackingFilter('en_base')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  trackingFilter === 'en_base'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                En Base ({coopTrackingLive.filter(t => t.estado === 'en_base').length})
              </button>
              <button
                onClick={() => setTrackingFilter('desembarcando')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  trackingFilter === 'desembarcando'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Desembarcando ({coopTrackingLive.filter(t => t.estado === 'desembarcando').length})
              </button>
              <button
                onClick={() => setTrackingFilter('alertas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  trackingFilter === 'alertas'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
                }`}
              >
                Con Alertas ({coopTrackingLive.filter(t => t.velocidad > 70 || t.desviado_de_ruta || t.en_zona_riesgo).length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Frecuencia adaptativa:</span>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono font-bold border border-sky-500/20">
                30s en ruta / 3s SOS
              </span>
            </div>
          </div>

          {/* Main Split: Interactive Map & Telemetry List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Mapa Leaflet • OpenStreetMap • Geocercas & Flota
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedHistorial && (
                      <button
                        onClick={() => setSelectedHistorial(null)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold mr-1"
                      >
                        Cerrar reproducción
                      </button>
                    )}
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

                <RutaxMap
                  bases={coopBases}
                  paradas={currentCoop?.paradas_sugeridas || []}
                  vehiculos={coopVehiculos}
                  geocercas={coopGeocercas}
                  trackingLive={coopTrackingLive}
                  alertasTracking={coopAlertasTracking}
                  selectedHistorial={selectedHistorial}
                  highlightVehiculoId={highlightVehiculoId}
                  onSelectVehicle={id => setHighlightVehiculoId(id)}
                  height="520px"
                  showFleetLive={true}
                  showGeocercas={true}
                  showCorridor={true}
                  showGeocercaLabels={true}
                  showHeatLabels={true}
                />
              </div>

              {/* Historial de Recorridos Disponibles */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Historial de Recorridos & Auditoría de Ruta
                  </h4>
                  <span className="text-[11px] text-slate-400">Selecciona para reproducir en mapa</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coopHistoriales.map(hist => {
                    const isSelected = selectedHistorial?.id === hist.id;
                    return (
                      <div
                        key={hist.id}
                        onClick={() => setSelectedHistorial(isSelected ? null : hist)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-950/30 border-purple-500/60 ring-2 ring-purple-500/20'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-purple-400" />
                            Unidad #{hist.numero_unidad}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{hist.fecha}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <div>Conductor: <span className="text-slate-100 font-semibold">{hist.chofer_nombre}</span></div>
                          <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded-lg">
                            <div>Dist: <strong className="text-slate-200">{hist.distancia_total_km}km</strong></div>
                            <div>Tiempo: <strong className="text-slate-200">{hist.duracion_min}m</strong></div>
                            <div>Máx: <strong className="text-slate-200">{hist.velocidad_max}k/h</strong></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Telemetry List Column (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Telemetría en Vivo ({filteredTracking.length} unidades)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Pings cada 30s</span>
              </div>

              <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
                {filteredTracking.length === 0 ? (
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                    No se encontraron unidades que coincidan con el filtro seleccionado.
                  </div>
                ) : (
                  filteredTracking.map(trk => {
                    const isSelected = highlightVehiculoId === trk.unidadId;
                    const isSpeeding = trk.velocidad > 70;
                    const isDeviated = trk.desviado_de_ruta;
                    const isEmergency = trk.estado === 'emergencia';
                    const isLowBattery = trk.bateria_chofer < 20;

                    let statusBadgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                    let statusLabel = 'En Ruta';
                    if (trk.estado === 'en_base') {
                      statusBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                      statusLabel = 'En Base';
                    } else if (trk.estado === 'desembarcando') {
                      statusBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                      statusLabel = 'Desembarcando';
                    } else if (isEmergency) {
                      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
                      statusLabel = 'SOS Emergencia';
                    }

                    return (
                      <div
                        key={trk.unidadId}
                        className={`bg-slate-900/90 border rounded-2xl p-4 transition-all ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-100 font-mono">
                                Unidad #{trk.numero_unidad || trk.unidadId}
                              </span>
                              <span className="text-sm md:text-base font-mono font-black bg-amber-400 text-slate-950 border-2 border-slate-900 px-2.5 py-0.5 rounded-lg shadow-md tracking-widest uppercase">
                                {trk.placa || 'PLACA'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{trk.chofer_nombre || 'Conductor no asignado'}</p>
                          </div>

                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusBadgeColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Telemetry Metrics Pill Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] mb-3">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Velocidad</span>
                            <span className={`font-mono font-bold ${isSpeeding ? 'text-rose-400' : 'text-slate-200'}`}>
                              {Math.round(trk.velocidad)} km/h
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Pasajeros</span>
                            <span className="font-mono font-bold text-sky-400">
                              {trk.pasajeros || 0} pax
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Batería Móvil</span>
                            <span className={`font-mono font-bold ${isLowBattery ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {trk.bateria_chofer}%
                            </span>
                          </div>
                        </div>

                        {/* Telemetry Alerts (if any) */}
                        {(isSpeeding || isDeviated || trk.en_zona_riesgo) && (
                          <div className="space-y-1 mb-3">
                            {isSpeeding && (
                              <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Exceso de velocidad: {Math.round(trk.velocidad)} km/h (límite 50 km/h)</span>
                              </div>
                            )}
                            {isDeviated && (
                              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Desviado &gt;500m del corredor planificado</span>
                              </div>
                            )}
                            {trk.en_zona_riesgo && (
                              <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[10px] font-semibold flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>Circulando en {trk.zona_riesgo_nombre || 'Zona de Riesgo'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Location Details & Centering button */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                          <span className="text-[10px] font-mono text-slate-500">
                            Lat: {trk.lat.toFixed(4)}, Lng: {trk.lng.toFixed(4)}
                          </span>

                          <button
                            onClick={() => setHighlightVehiculoId(trk.unidadId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <Locate className="w-3 h-3" />
                            <span>Centrar Mapa</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB GEOCERCAS: GESTIÓN DE GEOCERCAS & ZONAS DE RIESGO */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'geocercas' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4" />
                Control Perimetral Satelital
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                Geocercas de Bases, Pre-Bases y Zonas de Riesgo Nocturnas
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reglas automáticas de arribo FIFO, detección de desvíos y disparadores de alerta para seguridad de pasajeros y choferes.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingGeoId(null);
                setGeoNombre('');
                setGeoDescripcion('');
                setShowGeocercaModal(true);
              }}
              className="h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Geocerca</span>
            </button>
          </div>

          {/* Interactive Map for Geocercas Inspection */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Visualizador de Polígonos y Radios Geográficos
              </span>
              <span className="text-[11px] text-slate-400">Haz clic en una geocerca para ver detalles</span>
            </div>

            <RutaxMap
              bases={coopBases}
              paradas={currentCoop?.paradas_sugeridas || []}
              vehiculos={coopVehiculos}
              geocercas={coopGeocercas}
              trackingLive={coopTrackingLive}
              onMapClick={handleMapClickForCoord}
              selectionMode={selectionMode}
              height="360px"
              showFleetLive={true}
              showGeocercas={true}
              showCorridor={true}
              showGeocercaLabels={true}
            />
          </div>

          {/* List of Configured Geocercas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coopGeocercas.map(geo => {
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              let typeIcon = '🏁';
              if (geo.tipo === 'prebase') {
                badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                typeIcon = '🅿️';
              } else if (geo.tipo === 'bahia_desembarque') {
                badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                typeIcon = '🏁';
              } else if (geo.tipo === 'zona_riesgo') {
                badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                typeIcon = '⚠️';
              }

              return (
                <div
                  key={geo.id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${
                    geo.activa ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{typeIcon}</span>
                          <h4 className="font-bold text-sm text-slate-100">{geo.nombre}</h4>
                        </div>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border uppercase ${badgeColor}`}>
                          {geo.tipo.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Active toggle */}
                      <button
                        onClick={() => rutaxStore.updateGeocerca(geo.id, { activa: !geo.activa })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          geo.activa ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {geo.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Radio de Cobertura:</span>
                        <span className="font-mono font-bold text-slate-200">{geo.radio_metros} metros</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Coordenadas:</span>
                        <span className="font-mono text-slate-300 text-[11px]">
                          ({geo.lat.toFixed(4)}, {geo.lng.toFixed(4)})
                        </span>
                      </div>
                      {geo.config?.horario_inicio && (
                        <div className="flex justify-between pt-1 border-t border-slate-800 text-rose-300">
                          <span>Horario Crítico:</span>
                          <span className="font-mono font-bold">{geo.config.horario_inicio} a {geo.config.horario_fin}</span>
                        </div>
                      )}
                    </div>

                    {geo.config?.descripcion && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        "{geo.config.descripcion}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleEditGeocerca(geo)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Editar parámetros"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar la geocerca "${geo.nombre}"?`)) {
                          rutaxStore.deleteGeocerca(geo.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-all"
                      title="Eliminar geocerca"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL CREAR / EDITAR GEOCERCA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {showGeocercaModal && (
        <div className="fixed inset-0 z-500 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                {editingGeoId ? 'Modificar Geocerca' : 'Nueva Geocerca Perimetral'}
              </h3>
              <button
                onClick={() => setShowGeocercaModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGeocerca} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Base A Sauces 9 / Zona Crítica Vía Daule"
                  value={geoNombre}
                  onChange={e => setGeoNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tipo de Geocerca</label>
                  <select
                    value={geoTipo}
                    onChange={e => setGeoTipo(e.target.value as Geocerca['tipo'])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="base_real">Base Real (Andenes)</option>
                    <option value="prebase">Pre-Base Virtual (Espera)</option>
                    <option value="bahia_desembarque">Bahía de Desembarque</option>
                    <option value="zona_riesgo">Zona de Riesgo Nocturna</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Radio de Cobertura (Metros)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      step={10}
                      value={geoRadio}
                      onChange={e => setGeoRadio(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-slate-400 font-mono">m</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={geoLat}
                    onChange={e => setGeoLat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={geoLng}
                    onChange={e => setGeoLng(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectionMode('geocerca');
                  setShowGeocercaModal(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Locate className="w-3.5 h-3.5" />
                <span>Marcar posición haciendo clic en el mapa</span>
              </button>

              {/* Si es zona de riesgo, opciones horarias */}
              {geoTipo === 'zona_riesgo' && (
                <div className="p-3 bg-slate-950/70 rounded-2xl border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Configuración de Zona Crítica Nocturna</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px] block">Horario Inicio</label>
                      <input
                        type="time"
                        value={geoHorarioInicio}
                        onChange={e => setGeoHorarioInicio(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block">Horario Fin</label>
                      <input
                        type="time"
                        value={geoHorarioFin}
                        onChange={e => setGeoHorarioFin(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Severidad Alerta</label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-amber-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="nivel_alerta"
                          value="amarillo"
                          checked={geoNivelAlerta === 'amarillo'}
                          onChange={() => setGeoNivelAlerta('amarillo')}
                        />
                        Amarilla (Precaución)
                      </label>
                      <label className="flex items-center gap-1 text-rose-400 font-semibold cursor-pointer ml-4">
                        <input
                          type="radio"
                          name="nivel_alerta"
                          value="rojo"
                          checked={geoNivelAlerta === 'rojo'}
                          onChange={() => setGeoNivelAlerta('rojo')}
                        />
                        Roja (Crítica - Pings GPS cada 3s)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Instrucciones de Seguridad</label>
                    <textarea
                      rows={2}
                      value={geoDescripcion}
                      onChange={e => setGeoDescripcion(e.target.value)}
                      placeholder="Ej: Prohibido detener la marcha. Reportar en central de despacho al ingresar."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGeocercaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                >
                  {editingGeoId ? 'Actualizar Geocerca' : 'Guardar Geocerca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: GESTIÓN DE BASES & PRE-BASES (OPTIMIZACIONES 5 Y 6) */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bases' && (
        <div className="space-y-6">
          {/* Feedback banner */}
          {baseFeedback && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {baseFeedback}
              </span>
              <button onClick={() => setBaseFeedback(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* Regla Estricta Base A -> Base B (Optimización 6) */}
          <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Navigation className="w-4 h-4" />
                Optimización 6: Regla Estricta de Corredor "Base A → Base B"
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                coopBases.filter(b => b.estado !== 'inactiva').length >= 2
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {coopBases.filter(b => b.estado !== 'inactiva').length >= 2
                  ? `✓ Corredor Habilitado (${coopBases.filter(b => b.estado !== 'inactiva').length} Bases Activas)`
                  : '⚠ Requiere mínimo 2 bases activas'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Flujo Operativo Obligatorio ANT:</span>
              </div>
              <p className="text-slate-300">
                Todo viaje despachado en una base terminal debe registrar como destino obligatorio otra base autorizada de la cooperativa. Al arribar dentro del perímetro georreferenciado (50m), el despacho se cierra automáticamente y la unidad ingresa a la cola FIFO de andén o pre-base de destino.
              </p>
            </div>
          </div>

          {/* Lógica de Pase Directo Visual Banner */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4" />
                Lógica Automática de Pase Directo (Capacidad Máxima)
              </div>
              <button
                onClick={handleOpenCreateBase}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Base</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed">
              <span className="text-sky-400">SI</span> ocupados_base &lt; (capacidad_base - 1){' '}
              <span className="text-emerald-400 font-bold">→ Pase directo a Base Real</span>
              <br />
              <span className="text-sky-400">SI NO</span>{' '}
              <span className="text-amber-400 font-bold">→ Enviar a Pre-Base Virtual</span> (Avanza solo cuando se libere un andén)
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Evita congestionamiento en vía pública en Ecuador: los vehículos esperan ordenadamente en el bolsón de la Pre-Base y avanzan correlativamente por FIFO.
            </p>
          </div>

          {/* Interactive Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Mapa Corredor y Geocercas de Bases Registradas
              </h3>
              <span className="text-[11px] text-slate-400">Actualización en vivo cada 30s</span>
            </div>
            <RutaxMap
              bases={coopBases}
              paradas={currentCoop?.paradas_sugeridas || []}
              vehiculos={coopVehiculos}
              geocercas={coopGeocercas}
              trackingLive={coopTrackingLive}
              onMapClick={handleMapClickForCoord}
              selectionMode={selectionMode}
              height="380px"
              showFleetLive={true}
              showGeocercas={true}
              showCorridor={true}
            />
          </div>

          {/* Bases List & Details with CRUD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coopBases.map(base => {
              const turnosEnBase = rutaxStore.turnos.filter(
                t => t.baseId === base.id && t.ubicacion_fisica === 'base_real' && t.estado !== 'despachado'
              );
              const turnosEnPrebase = rutaxStore.turnos.filter(
                t => t.baseId === base.id && t.ubicacion_fisica === 'prebase' && t.estado !== 'despachado'
              );
              const umbralPase = Math.max(1, (base.capacidad_max || 4) - 1);
              const hayPaseDirecto = turnosEnBase.length < umbralPase;
              const isActiva = base.estado !== 'inactiva';

              return (
                <div
                  key={base.id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg space-y-4 transition-all ${
                    isActiva ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/40 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${isActiva ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                        <h4 className="font-bold text-sm text-slate-100">{base.numero_base ? `Base ${base.numero_base}: ` : ""}{base.nombre}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{base.direccion || 'Sin dirección registrada'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        isActiva ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {isActiva ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold">
                        Cap: {base.capacidad_max || 4}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Vehículos en Base</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-emerald-400">{turnosEnBase.length}</span>
                        <span className="text-slate-400">unidades activas</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">
                        ✓ Operativa
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Capacidad Máxima</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-slate-100">{base.capacidad_max || 20}</span>
                        <span className="text-slate-400">andenes / slots</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block truncate">
                        Asignación por Cola FIFO
                      </span>
                    </div>
                  </div>

                  {/* Detalle Geocerca y Coordenadas */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                    <span>GPS: <code className="text-slate-200 font-mono">{base.lat.toFixed(4)}, {base.lng.toFixed(4)}</code></span>
                    <span>Radio: <strong className="text-slate-200 font-mono">{base.radio_geocerca || 150}m</strong></span>
                    <span>Andén Llegada: <strong className="text-emerald-400 font-mono">50m</strong></span>
                  </div>

                  {/* Botones de Acción CRUD */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleToggleEstadoBase(base.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActiva
                          ? 'bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isActiva ? 'Desactivar Base' : 'Activar Base'}
                    </button>
                    <button
                      onClick={() => handleEditBase(base)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL CREAR / EDITAR BASE CON GPS EN TIEMPO REAL Y BUSCADOR DE MAPA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <ModalRegistroBase
        isOpen={showBaseModal}
        onClose={() => {
          setShowBaseModal(false);
          setEditingBase(null);
        }}
        onSave={handleSaveBaseData}
        editingBase={editingBase}
      />

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: GESTIÓN DE RUTAS & PARADAS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rutas' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Rutas Fijas & Configuración de Tarifa Plana
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Nombre de la ruta (Ej: Troncal Sauces ↔ Centro Parque Centenario)"
                value={newRouteName}
                onChange={e => setNewRouteName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="0.05"
                  placeholder="0.50"
                  value={newRouteFare}
                  onChange={e => setNewRouteFare(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleAddRoute}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Ruta</span>
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {currentCoop?.rutas && currentCoop.rutas.length > 0 ? (
                currentCoop.rutas.map(ruta => (
                  <div
                    key={ruta.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{ruta.nombre}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Vigente desde: {ruta.fecha_vigencia}</span>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
                      ${ruta.tarifa_plana.toFixed(2)} USD
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No hay rutas registradas.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CONTROL DE FLOTA Y UNIDADES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pendientes' && (
        <div className="space-y-6">
          {/* SECCIÓN A: SOLICITUDES PENDIENTES */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  Solicitudes de Inscripción y Pre-registro de Unidades
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Valida y aprueba las solicitudes enviadas por los socios antes de integrarlas a la flota activa.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                {coopSolicitudes.length} Pendientes
              </span>
            </div>

            <div className="space-y-3">
              {coopSolicitudes.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No hay solicitudes de pre-registro pendientes de revisión en este momento.
                </div>
              ) : (
                coopSolicitudes.map(sol => (
                  <div
                    key={sol.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        {/* Tarjeta de Placa Física Ecuador */}
                        <div className="relative inline-flex flex-col items-center justify-center font-mono font-black text-xs md:text-sm px-3 py-1 rounded bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-inner tracking-widest uppercase">
                          <span className="text-[7px] font-bold tracking-normal opacity-70 leading-none mb-0.5">ECUADOR</span>
                          <span className="leading-none">{sol.placa}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-100 font-bold">{sol.modelo}</span>
                            <span className="text-xs text-slate-400">({sol.color})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Socio Propietario: <strong className="text-slate-200">{sol.propietario_nombre}</strong> (CI: {sol.propietario_cedula}, Tel: {sol.propietario_telefono})
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          rutaxStore.reviewPendingVehicle(sol.id, 'aprobar', 'Aprobado por administración central');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold text-xs border border-emerald-500/40 transition-all cursor-pointer"
                      >
                        Aprobar Pre-registro
                      </button>
                      <button
                        onClick={() => {
                          rutaxStore.reviewPendingVehicle(sol.id, 'rechazado' as any, 'Rechazado por inconsistencia documental');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-semibold text-xs border border-rose-500/40 transition-all cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECCIÓN B: FLOTA COMPLETA REGISTRADA */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  Inventario y Control de Estado de Unidades de la Cooperativa
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualiza el estado operativo en tiempo real de todas las unidades afiliadas. Las placas de unidades <strong className="text-rose-400 font-semibold">no activas</strong> se visualizan en color <span className="text-rose-500 font-extrabold uppercase bg-rose-500/10 px-1 rounded">rojo</span>.
                </p>
              </div>
              <button
                onClick={onOpenUnitEnrollment}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Inscribir Nueva Unidad
              </button>
            </div>

            {/* Listado de Flota en Cuadrícula */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {coopVehiculos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                  No hay unidades registradas para esta cooperativa en el sistema. Utiliza el botón de inscripción para registrar vehículos de forma manual o masiva mediante Excel.
                </div>
              ) : (
                coopVehiculos.map(veh => {
                  const isActive = veh.estado === 'activo';
                  const socio = rutaxStore.usuarios.find(u => u.uid === veh.socio_id);
                  const chofer = rutaxStore.usuarios.find(u => u.uid === veh.chofer_titular_id);

                  return (
                    <div
                      key={veh.id}
                      className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col justify-between gap-4 transition-all hover:border-slate-700"
                    >
                      {/* Cabecera de Tarjeta: Placa, Foto y Número de Unidad */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {/* Miniatura de la Foto del Vehículo */}
                          {veh.foto_vehiculo_url ? (
                            <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-sm">
                              <img 
                                src={veh.foto_vehiculo_url} 
                                alt={`Unidad ${veh.numero_unidad}`} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ) : null}

                          {/* PLACA FÍSICA ECUADOR: Activa = Amarillo; Inactiva = Rojo Sólido sin tapar caracteres */}
                          <div className={`relative inline-flex flex-col items-center justify-center font-mono font-black text-xs md:text-sm px-3 py-1 rounded border-2 shadow-inner tracking-widest uppercase transition-all ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-amber-400/15'
                              : 'bg-rose-600 text-slate-100 border-rose-800 shadow-rose-600/15'
                          }`}>
                            <span className="text-[7px] font-bold tracking-normal opacity-70 leading-none mb-0.5">ECUADOR</span>
                            <span className="leading-none">{veh.placa}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200 text-sm">Unidad #{veh.numero_unidad}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded uppercase">
                                {veh.tipo_vehiculo}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {veh.modelo} ({veh.color}, {veh.anio}) • Capacidad: {veh.capacidad} pax
                            </span>
                          </div>
                        </div>

                        {/* Estado actual de la Unidad */}
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            veh.estado === 'activo'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : veh.estado === 'mantenimiento'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : veh.estado === 'bloqueado_por_socio'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : veh.estado === 'en_registro'
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              veh.estado === 'activo'
                                ? 'bg-emerald-500'
                                : veh.estado === 'mantenimiento'
                                ? 'bg-sky-500'
                                : veh.estado === 'bloqueado_por_socio'
                                ? 'bg-amber-500'
                                : veh.estado === 'en_registro'
                                ? 'bg-yellow-500'
                                : 'bg-rose-500'
                            }`} />
                            {veh.estado.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Socios y Conductores */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Socio Propietario</span>
                          <span className="font-bold text-slate-300 truncate block">
                            {socio ? socio.nombre_completo : 'No asignado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {chofer?.foto_url && (
                            <img 
                              src={chofer.foto_url} 
                              alt="Chofer" 
                              className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 shrink-0" 
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-slate-500 block">Conductor Asignado</span>
                            <span className="font-bold text-slate-300 truncate block">
                              {chofer ? chofer.nombre_completo : 'No asignado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones de Actualización de Estado y Eliminación en Contenedor */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-900 pt-3 text-[11px] bg-slate-900/50 p-3 rounded-xl border">
                        <span className="text-slate-500 font-mono">ID: {veh.id}</span>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`select-estado-${veh.id}`} className="text-slate-400 font-medium">Estado:</label>
                            <select
                              id={`select-estado-${veh.id}`}
                              value={veh.estado}
                              onChange={(e) => {
                                rutaxStore.updateVehicleState(veh.id, e.target.value as any);
                              }}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="activo">Activo (Habilitado)</option>
                              <option value="inactivo">Inactivo (Deshabilitado)</option>
                              <option value="mantenimiento">Mantenimiento</option>
                              <option value="bloqueado_por_socio">Bloqueado</option>
                              <option value="en_registro">En Registro / Pendiente</option>
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              const nueva = prompt(`Restablecer contraseña para la placa ${veh.placa}:`, '1234');
                              if (nueva !== null) {
                                rutaxStore.resetDriverPassword(veh.id, nueva);
                                alert(`Contraseña actualizada correctamente a: ${nueva || '1234'}`);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            title="Restablecer clave o credencial"
                          >
                            <span>Clave</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar la Unidad #${veh.numero_unidad} (${veh.placa}) de la base de datos? Se liberará la placa.`)) {
                                rutaxStore.deleteVehicle(veh.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            title="Eliminar vehículo de la base de datos"
                          >
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB SEGURIDAD SOS, ANTIRROBO, NOTIFICACIONES Y ECU 911           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'emergencias' && (
        <SecurityAlertsPanel
          currentUser={{
            uid: 'usr-admin-1',
            nombre_completo: 'Administrador de Cooperativa',
            rol: 'admin_coop',
            cooperativaId: currentCoop?.id || 'coop-daule',
            celular: '0990000000',
            activo: true,
            base_asignada: 'base-a'
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB PASAJEROS FRECUENTES, RESERVAS & WHATSAPP */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pasajeros' && (
        <PasajerosAdminDashboard />
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB FINANZAS: LIQUIDACIONES, CAJA COOPERATIVA Y ARQUEO */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'finanzas' && (
        <FinanzasAdminCoop />
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB SUSCRIPCION & FACTURACION SAAS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'suscripcion' && (
        <AdminCoopSuscripcionTab />
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: PERFIL EMPRESA */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'perfil' && currentCoop && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Ficha Institucional de la Cooperativa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Razón Social:</span>
              <span className="font-bold text-slate-200 text-sm">{currentCoop.nombre}</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">RUC:</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{currentCoop.ruc}</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Dirección de Sede:</span>
              <span className="text-slate-200">{currentCoop.direccion}</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Teléfono de Central / Emergencia:</span>
              <span className="text-slate-200">{currentCoop.telefono} • Emergencia: {currentCoop.telefono_emergencia}</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Presidente del Consejo de Administración:</span>
              <span className="text-slate-200 font-semibold">{currentCoop.presidente_nombre} ({currentCoop.presidente_celular})</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Plan SaaS Rutax:</span>
              <span className="capitalize font-semibold text-emerald-400">{currentCoop.plan} (Vence: {currentCoop.fecha_vencimiento_suscripcion})</span>
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
                  Monitoreo Satelital de Flota en Pantalla Completa — {currentCoop?.nombre}
                </h3>
                <p className="text-xs text-slate-400">
                  Rastreo GPS en vivo, geocercas, alertas críticas y reproducción de recorridos de toda la flota registrada.
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
              bases={coopBases}
              paradas={currentCoop?.paradas_sugeridas || []}
              vehiculos={coopVehiculos}
              geocercas={coopGeocercas}
              trackingLive={coopTrackingLive}
              alertasTracking={coopAlertasTracking}
              selectedHistorial={selectedHistorial}
              highlightVehiculoId={highlightVehiculoId}
              onSelectVehicle={id => setHighlightVehiculoId(id)}
              height="100%"
              showFleetLive={true}
              showGeocercas={true}
              showCorridor={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
