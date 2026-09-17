import React, { useState } from 'react';
import { rutaxStore } from '../services/store';
import {
  PasajeroFrecuente,
  Reserva,
  PuntoRecogidaFrecuente,
  TipoPasajero,
  ConfiguracionPasajeros,
  NotificacionWhatsAppLog,
  PagoCreditoEmpresa
} from '../types';
import {
  Users,
  CalendarCheck,
  Flame,
  Building,
  MessageSquare,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield,
  CreditCard,
  Send,
  Sparkles,
  ArrowUpDown,
  Filter,
  UserCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { RutaxMap } from './RutaxMap';
import {
  exportarPasajerosCSV,
  exportarReservasCSV,
  buildWhatsAppLink,
  interpolateWhatsAppTemplate
} from '../services/passengerServices';

interface PasajerosAdminDashboardProps {
  initialTab?: 'pasajeros' | 'reservas' | 'calor' | 'empresas' | 'whatsapp';
}

export const PasajerosAdminDashboard: React.FC<PasajerosAdminDashboardProps> = ({
  initialTab = 'pasajeros'
}) => {
  const currentCoop = rutaxStore.getCurrentCoop();
  const currentCoopId = currentCoop?.id || 'coop-daule';
  const currentUser = rutaxStore.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'pasajeros' | 'reservas' | 'calor' | 'empresas' | 'whatsapp'>(initialTab);

  // Filtros de pasajeros
  const [searchPax, setSearchPax] = useState('');
  const [tipoPaxFilter, setTipoPaxFilter] = useState<string>('todos');

  // Modales
  const [showNewPaxModal, setShowNewPaxModal] = useState(false);
  const [showPaxDetailModal, setShowPaxDetailModal] = useState<PasajeroFrecuente | null>(null);
  const [editingPax, setEditingPax] = useState<PasajeroFrecuente | null>(null);

  const [showNewReservaModal, setShowNewReservaModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<Reserva | null>(null);
  const [selectedAssignTurnoId, setSelectedAssignTurnoId] = useState('');

  const [showPagoEmpresaModal, setShowPagoEmpresaModal] = useState<PasajeroFrecuente | null>(null);
  const [pagoMonto, setPagoMonto] = useState<string>('');
  const [pagoComprobante, setPagoComprobante] = useState<string>('');
  const [pagoNotas, setPagoNotas] = useState<string>('');

  // Filtros de Reservas
  const [fechaReservaFilter, setFechaReservaFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [estadoReservaFilter, setEstadoReservaFilter] = useState<string>('todas');

  // Configuración WhatsApp
  const configPasajeros = rutaxStore.getConfigPasajeros(currentCoopId);
  const [tempConfig, setTempConfig] = useState<ConfiguracionPasajeros>(JSON.parse(JSON.stringify(configPasajeros)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Formulario Nuevo Pasajero
  const [paxNombre, setPaxNombre] = useState('');
  const [paxTelefono, setPaxTelefono] = useState('');
  const [paxCedula, setPaxCedula] = useState('');
  const [paxEmail, setPaxEmail] = useState('');
  const [paxTipo, setPaxTipo] = useState<TipoPasajero>('frecuente');
  const [paxAsiento, setPaxAsiento] = useState<'indistinto' | 'adelante' | 'ventana' | 'atras_solo'>('indistinto');
  const [paxHorario, setPaxHorario] = useState('06:30am');
  const [paxNotas, setPaxNotas] = useState('');
  const [paxPuntoNombre, setPaxPuntoNombre] = useState('Casa');
  const [paxPuntoRef, setPaxPuntoRef] = useState('');
  const [paxPuntoLat, setPaxPuntoLat] = useState<number>(-2.1245);
  const [paxPuntoLng, setPaxPuntoLng] = useState<number>(-79.9160);
  const [paxTieneCredito, setPaxTieneCredito] = useState(false);
  const [paxCupoMensual, setPaxCupoMensual] = useState('200');
  const [paxPrecioPactado, setPaxPrecioPactado] = useState('1.25');
  const [paxContactoEmpresa, setPaxContactoEmpresa] = useState('');
  const [paxFormError, setPaxFormError] = useState('');

  // Formulario Nueva Reserva
  const [resPasajeroId, setResPasajeroId] = useState('');
  const [resPasajeroNombre, setResPasajeroNombre] = useState('');
  const [resPasajeroTel, setResPasajeroTel] = useState('');
  const [resFecha, setResFecha] = useState(new Date().toISOString().split('T')[0]);
  const [resHora, setResHora] = useState('06:30');
  const [resHoraLimite, setResHoraLimite] = useState('06:45');
  const [resPuntoNombre, setResPuntoNombre] = useState('Gasolinera Primax Km 12');
  const [resPuntoRef, setResPuntoRef] = useState('Frente a TIA');
  const [resPuntoLat, setResPuntoLat] = useState<number>(-2.1245);
  const [resPuntoLng, setResPuntoLng] = useState<number>(-79.9160);
  const [resPaxCount, setResPaxCount] = useState<number>(1);
  const [resObs, setResObs] = useState('');
  const [resEsCredito, setResEsCredito] = useState(false);
  const [resTarifa, setResTarifa] = useState('0.50');

  // Datos del store
  const pasajeros = rutaxStore.getPasajerosFrecuentes(currentCoopId);
  const reservas = rutaxStore.getReservas(currentCoopId);
  const puntosCalor = rutaxStore.getPuntosRecogidaFrecuentes(currentCoopId);
  const whatsappLogs = rutaxStore.getWhatsAppLogs(currentCoopId);
  const turnosActivos = rutaxStore.turnos.filter(t => t.cooperativaId === currentCoopId && t.estado !== 'desembarcando');

  // Métricas
  const totalPasajeros = pasajeros.length;
  const totalFrecuentes = pasajeros.filter(p => p.tipo === 'frecuente').length;
  const totalEmpresas = pasajeros.filter(p => p.tipo === 'empresa').length;
  const reservasHoy = reservas.filter(r => r.fecha === new Date().toISOString().split('T')[0]);
  const reservasPendientesHoy = reservasHoy.filter(r => r.estado === 'pendiente').length;

  // Filtrado de Pasajeros
  const filteredPasajeros = pasajeros.filter(p => {
    const matchesSearch =
      p.nombre_completo.toLowerCase().includes(searchPax.toLowerCase()) ||
      p.telefono.includes(searchPax) ||
      (p.cedula && p.cedula.includes(searchPax));
    const matchesTipo = tipoPaxFilter === 'todos' || p.tipo === tipoPaxFilter;
    return matchesSearch && matchesTipo;
  });

  // Filtrado de Reservas
  const filteredReservas = reservas.filter(r => {
    const matchesFecha = !fechaReservaFilter || r.fecha === fechaReservaFilter;
    const matchesEstado = estadoReservaFilter === 'todas' || r.estado === estadoReservaFilter;
    return matchesFecha && matchesEstado;
  });

  // Empresas
  const empresasList = pasajeros.filter(p => p.tipo === 'empresa' || p.tiene_credito);

  const getTipoBadgeColor = (tipo: TipoPasajero) => {
    switch (tipo) {
      case 'frecuente':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ocasional':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'empresa':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'estudiante':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'tercera_edad':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-600';
    }
  };

  const getEstadoReservaBadge = (estado: Reserva['estado']) => {
    switch (estado) {
      case 'pendiente':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Pendiente ⏳</span>;
      case 'asignada':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Asignada 🚗</span>;
      case 'confirmada':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Confirmada ✅</span>;
      case 'recogida':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">Recogida 🎯</span>;
      case 'no_show':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">No-Show ❌</span>;
      case 'cancelada':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-600/30 text-slate-400 border border-slate-600">Cancelada 🚫</span>;
      default:
        return null;
    }
  };

  const handleGuardarPasajero = (e: React.FormEvent) => {
    e.preventDefault();
    setPaxFormError('');

    if (!paxNombre.trim() || !paxTelefono.trim()) {
      setPaxFormError('Nombre y teléfono celular son campos obligatorios.');
      return;
    }

    try {
      if (editingPax) {
        rutaxStore.actualizarPasajeroFrecuente(editingPax.id, {
          nombre_completo: paxNombre,
          telefono: paxTelefono,
          cedula: paxCedula || null,
          email: paxEmail || null,
          tipo: paxTipo,
          preferencia_asiento: paxAsiento,
          preferencia_horario: paxHorario,
          notas: paxNotas,
          tiene_credito: paxTieneCredito,
          cupo_mensual: parseFloat(paxCupoMensual) || 0,
          precio_pactado: paxPrecioPactado ? parseFloat(paxPrecioPactado) : null,
          contacto_empresa_nombre: paxContactoEmpresa
        });
      } else {
        rutaxStore.crearPasajeroFrecuente({
          cooperativaId: currentCoopId,
          nombre_completo: paxNombre,
          telefono: paxTelefono,
          cedula: paxCedula || null,
          email: paxEmail || null,
          tipo: paxTipo,
          preferencia_asiento: paxAsiento,
          preferencia_horario: paxHorario,
          notas: paxNotas,
          puntos_recogida: [
            {
              id: `pt-${Date.now()}`,
              nombre: paxPuntoNombre || 'Casa',
              referencia: paxPuntoRef || 'Punto registrado',
              lat: paxPuntoLat,
              lng: paxPuntoLng,
              es_preferido: true,
              veces_usado: 1
            }
          ],
          tiene_credito: paxTieneCredito,
          cupo_mensual: parseFloat(paxCupoMensual) || 0,
          precio_pactado: paxPrecioPactado ? parseFloat(paxPrecioPactado) : null,
          contacto_empresa_nombre: paxContactoEmpresa,
          saldo_pendiente: 0,
          total_viajes: 1
        });
      }

      setShowNewPaxModal(false);
      setEditingPax(null);
      resetPaxForm();
    } catch (err: any) {
      setPaxFormError(err.message || 'Error al guardar pasajero.');
    }
  };

  const resetPaxForm = () => {
    setPaxNombre('');
    setPaxTelefono('');
    setPaxCedula('');
    setPaxEmail('');
    setPaxTipo('frecuente');
    setPaxAsiento('indistinto');
    setPaxHorario('06:30am');
    setPaxNotas('');
    setPaxPuntoNombre('Casa');
    setPaxPuntoRef('');
    setPaxTieneCredito(false);
    setPaxCupoMensual('200');
    setPaxPrecioPactado('1.25');
    setPaxContactoEmpresa('');
    setPaxFormError('');
  };

  const handleCrearReserva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resPasajeroNombre || !resPuntoNombre) return;

    rutaxStore.crearReserva({
      cooperativaId: currentCoopId,
      pasajero_id: resPasajeroId || undefined,
      pasajero_nombre: resPasajeroNombre,
      pasajero_telefono: resPasajeroTel,
      fecha: resFecha,
      hora_deseada: resHora,
      hora_limite: resHoraLimite,
      punto_recogida: {
        nombre: resPuntoNombre,
        referencia: resPuntoRef,
        lat: resPuntoLat,
        lng: resPuntoLng
      },
      cantidad_pasajeros: resPaxCount,
      observaciones: resObs,
      es_credito_empresa: resEsCredito,
      monto_tarifa: parseFloat(resTarifa) || 0.50,
      creada_por: 'despachador'
    });

    setShowNewReservaModal(false);
    setResPasajeroId('');
    setResPasajeroNombre('');
    setResPasajeroTel('');
    setResObs('');
  };

  const handleAsignarTurno = () => {
    if (!showAssignModal || !selectedAssignTurnoId) return;
    const turno = turnosActivos.find(t => t.id === selectedAssignTurnoId);
    if (turno) {
      rutaxStore.asignarReservaATurno(
        showAssignModal.id,
        turno.id,
        turno.vehiculo_id,
        turno.chofer_id
      );
    }
    setShowAssignModal(null);
    setSelectedAssignTurnoId('');
  };

  const handleGuardarPagoEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPagoEmpresaModal || !pagoMonto) return;
    const monto = parseFloat(pagoMonto);
    if (isNaN(monto) || monto <= 0) return;

    rutaxStore.registrarPagoEmpresa({
      empresa_id: showPagoEmpresaModal.id,
      empresa_nombre: showPagoEmpresaModal.nombre_completo,
      monto: monto,
      fecha: new Date().toISOString().split('T')[0],
      comprobante: pagoComprobante || `DEP-${Date.now().toString().slice(-6)}`,
      registrado_por: currentUser?.nombre_completo || 'Admin',
      notas: pagoNotas
    });

    setShowPagoEmpresaModal(null);
    setPagoMonto('');
    setPagoComprobante('');
    setPagoNotas('');
  };

  const handleGuardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    rutaxStore.guardarConfigPasajeros(tempConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Pasajeros Frecuentes, Reservas & WhatsApp</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  RUTAX SMART 2.0
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Control y fidelización de clientes habituales, pickups programados, convenios corporativos y mensajería en vivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetPaxForm();
                setEditingPax(null);
                setShowNewPaxModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo Pasajero
            </button>
            <button
              onClick={() => setShowNewReservaModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
            >
              <CalendarCheck className="w-4 h-4" />
              Nueva Reserva
            </button>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Pasajeros</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{totalPasajeros}</p>
            <p className="text-xs text-blue-400 mt-0.5">{totalFrecuentes} Frecuentes Activos</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Reservas Hoy</span>
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{reservasHoy.length}</p>
            <p className="text-xs text-amber-400 mt-0.5">{reservasPendientesHoy} pendientes de asignar</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Convenios Empresas</span>
              <Building className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{totalEmpresas}</p>
            <p className="text-xs text-purple-400 mt-0.5">Crédito quincenal / mensual</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>WhatsApp Bot</span>
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{configPasajeros.whatsapp_habilitado ? 'ACTIVO' : 'PAUSADO'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{whatsappLogs.length} notificaciones emitidas</p>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex overflow-x-auto gap-2 mt-6 pt-4 border-t border-slate-800/80 no-scrollbar">
          <button
            onClick={() => setActiveTab('pasajeros')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'pasajeros'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Pasajeros Frecuentes ({totalPasajeros})
          </button>

          <button
            onClick={() => setActiveTab('reservas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'reservas'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Reservas & Programación ({reservas.length})
          </button>

          <button
            onClick={() => setActiveTab('calor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'calor'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4" />
            Mapa de Calor Puntos ({puntosCalor.length})
          </button>

          <button
            onClick={() => setActiveTab('empresas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'empresas'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building className="w-4 h-4" />
            Empresas con Crédito ({empresasList.length})
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Bot & Plantillas
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 1: PASAJEROS FRECUENTES
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'pasajeros' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o cédula..."
                  value={searchPax}
                  onChange={e => setSearchPax(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={tipoPaxFilter}
                onChange={e => setTipoPaxFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="todos">Todos los tipos ({pasajeros.length})</option>
                <option value="frecuente">Frecuentes</option>
                <option value="ocasional">Ocasionales</option>
                <option value="empresa">Empresas</option>
                <option value="estudiante">Estudiantes</option>
                <option value="tercera_edad">Tercera Edad</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportarPasajerosCSV(filteredPasajeros)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Pasajero / Cliente</th>
                    <th className="py-3.5 px-4">Teléfono & Cédula</th>
                    <th className="py-3.5 px-4">Tipo & Beneficio</th>
                    <th className="py-3.5 px-4">Punto Habitual</th>
                    <th className="py-3.5 px-4">Horario</th>
                    <th className="py-3.5 px-4 text-center">Viajes</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {filteredPasajeros.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No se encontraron pasajeros frecuentes con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredPasajeros.map(pax => {
                      const ptPref = pax.puntos_recogida.find(pt => pt.es_preferido) || pax.puntos_recogida[0];
                      return (
                        <tr key={pax.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-2">
                              {pax.nombre_completo}
                              {pax.tiene_credito && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  CRÉDITO
                                </span>
                              )}
                            </div>
                            {pax.notas && (
                              <p className="text-xs text-slate-400 truncate max-w-xs">{pax.notas}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-200">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{pax.telefono}</span>
                            </div>
                            {pax.cedula && (
                              <span className="text-xs text-slate-500">C.I: {pax.cedula}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getTipoBadgeColor(pax.tipo)}`}>
                              {pax.tipo.toUpperCase().replace('_', ' ')}
                            </span>
                            {pax.precio_pactado && (
                              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                                Tarifa pactada: ${pax.precio_pactado.toFixed(2)}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {ptPref ? (
                              <div>
                                <div className="flex items-center gap-1 text-slate-200 font-medium text-xs">
                                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{ptPref.nombre}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{ptPref.referencia}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Sin punto registrado</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-xs text-slate-300 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              {pax.preferencia_horario || 'Flexible'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-white">
                            {pax.total_viajes}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct WhatsApp link */}
                              <a
                                href={buildWhatsAppLink(pax.telefono, `Hola ${pax.nombre_completo}, te saludamos de Cooperativa Daule Express...`)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"
                                title="Abrir WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>

                              {/* View detail */}
                              <button
                                onClick={() => setShowPaxDetailModal(pax)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Ver Ficha y Estadísticas"
                              >
                                <UserCheck className="w-4 h-4 text-blue-400" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setEditingPax(pax);
                                  setPaxNombre(pax.nombre_completo);
                                  setPaxTelefono(pax.telefono);
                                  setPaxCedula(pax.cedula || '');
                                  setPaxEmail(pax.email || '');
                                  setPaxTipo(pax.tipo);
                                  setPaxAsiento(pax.preferencia_asiento);
                                  setPaxHorario(pax.preferencia_horario || '06:30am');
                                  setPaxNotas(pax.notas);
                                  setPaxTieneCredito(pax.tiene_credito);
                                  setPaxCupoMensual(String(pax.cupo_mensual));
                                  setPaxPrecioPactado(pax.precio_pactado ? String(pax.precio_pactado) : '');
                                  setPaxContactoEmpresa(pax.contacto_empresa_nombre || '');
                                  setShowNewPaxModal(true);
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                title="Editar Pasajero"
                              >
                                <Edit2 className="w-4 h-4" />
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: RESERVAS & PROGRAMACIÓN
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'reservas' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Fecha:</span>
                <input
                  type="date"
                  value={fechaReservaFilter}
                  onChange={e => setFechaReservaFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={estadoReservaFilter}
                onChange={e => setEstadoReservaFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="todas">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="asignada">Asignadas</option>
                <option value="recogida">Recogidas</option>
                <option value="no_show">No-Show</option>
                <option value="cancelada">Canceladas</option>
              </select>

              <button
                onClick={() => setFechaReservaFilter(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300"
              >
                Ver Hoy
              </button>
            </div>

            <button
              onClick={() => exportarReservasCSV(filteredReservas)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportar Reservas
            </button>
          </div>

          {/* Cards Grid of Reservations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReservas.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                No hay reservas para los filtros seleccionados.
              </div>
            ) : (
              filteredReservas.map(res => (
                <div
                  key={res.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="text-lg font-bold text-white font-mono">{res.hora_deseada}</span>
                        <span className="text-xs text-slate-400">({res.fecha})</span>
                      </div>
                      {getEstadoReservaBadge(res.estado)}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{res.pasajero_nombre}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{res.pasajero_telefono || 'Sin celular'}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{res.cantidad_pasajeros} pasajero(s)</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{res.punto_recogida.nombre}</span>
                      </div>
                      <p className="text-slate-400 pl-5">{res.punto_recogida.referencia}</p>
                    </div>

                    {res.observaciones && (
                      <p className="text-xs text-slate-400 italic bg-slate-800/40 p-2 rounded-lg">
                        "{res.observaciones}"
                      </p>
                    )}

                    {res.numero_unidad && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="font-bold text-white">Unidad #{res.numero_unidad}</span>
                            <span className="text-slate-400 ml-1">({res.placa_unidad})</span>
                          </div>
                        </div>
                        <span className="text-blue-300 font-medium">{res.chofer_nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {res.estado === 'pendiente' && (
                      <button
                        onClick={() => setShowAssignModal(res)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Car className="w-3.5 h-3.5" />
                        Asignar Unidad
                      </button>
                    )}

                    {res.estado === 'asignada' && (
                      <button
                        onClick={() => rutaxStore.marcarRecogidaReserva(res.id)}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marcar Recogida
                      </button>
                    )}

                    {res.pasajero_telefono && (
                      <a
                        href={buildWhatsAppLink(
                          res.pasajero_telefono,
                          `Hola ${res.pasajero_nombre}, te confirmamos tu reserva Rutax Smart para las ${res.hora_deseada} en ${res.punto_recogida.nombre}.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}

                    {res.estado !== 'cancelada' && res.estado !== 'recogida' && (
                      <button
                        onClick={() => {
                          const motivo = prompt('Motivo de cancelación:');
                          if (motivo) rutaxStore.cancelarReserva(res.id, motivo);
                        }}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition"
                        title="Cancelar Reserva"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 3: MAPA DE CALOR (HEATMAP PUNTOS DE RECOGIDA)
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'calor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white text-base">Densidad de Recogidas en Ruta</h3>
              </div>
              <span className="text-xs text-slate-400">
                8 Zonas Frecuentes Detectadas
              </span>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative">
              <RutaxMap
                center={[-2.1500, -79.9100]}
                zoom={12}
                height="100%"
                puntosCalor={puntosCalor}
              />
            </div>
          </div>

          {/* Ranking & Stats Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm">Top Paradas con Mayor Demanda</h4>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[440px] pr-1">
                {puntosCalor
                  .sort((a, b) => b.total_recogidas - a.total_recogidas)
                  .map((pt, idx) => (
                    <div
                      key={pt.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {pt.total_recogidas} recogidas
                        </span>
                      </div>

                      <h5 className="font-bold text-white text-sm mt-1">{pt.nombre}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Radio: {pt.radio}m • {pt.pasajeros_que_usan.length} pasajeros habituales
                      </p>

                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Última recogida: {new Date(pt.ultima_recogida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-emerald-400 font-medium">Zona Activa</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const nombre = prompt('Nombre del nuevo punto de recogida frecuente:');
                  if (nombre) {
                    rutaxStore.crearPuntoRecogidaFrecuente({
                      nombre,
                      lat: -2.1400,
                      lng: -79.9100,
                      radio: 50,
                      total_recogidas: 1
                    });
                  }
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
              >
                + Registrar Nueva Zona de Recogida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 4: EMPRESAS & CRÉDITO CORPORATIVO
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'empresas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {empresasList.map(emp => (
              <div
                key={emp.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
                      <Building className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Día de corte: {emp.dia_corte_pago || 15}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{emp.nombre_completo}</h3>
                    <p className="text-xs text-slate-400">RUC: {emp.cedula || 'N/A'}</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Contacto:</span>
                      <span className="text-white font-medium">{emp.contacto_empresa_nombre || 'Administración'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="text-white font-medium">{emp.telefono}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Tarifa pactada:</span>
                      <span className="text-emerald-400 font-bold">${(emp.precio_pactado || 1.25).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Saldo Pendiente:</span>
                      <span className="text-rose-400 font-bold text-sm">${emp.saldo_pendiente.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={() => setShowPagoEmpresaModal(emp)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Registrar Pago
                  </button>

                  <a
                    href={buildWhatsAppLink(
                      emp.telefono,
                      `Estimado cliente ${emp.nombre_completo}, adjuntamos su estado de cuenta mensual por un valor de $${emp.saldo_pendiente.toFixed(2)}. Favor confirmar comprobante. Gracias - Cooperativa Daule Express`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition"
                    title="Cobro por WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 5: WHATSAPP BOT & PLANTILLAS
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Editor */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Configuración de Plantillas y Notificaciones Automáticas
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Personaliza los mensajes directos enviados a los pasajeros en cada fase del viaje.
                </p>
              </div>

              {saveSuccess && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg animate-pulse">
                  ¡Guardado con éxito!
                </span>
              )}
            </div>

            <form onSubmit={handleGuardarConfiguracion} className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-semibold text-white text-sm">Habilitar Bot de WhatsApp</h4>
                  <p className="text-xs text-slate-400">Envío automático de confirmaciones y alertas de proximidad</p>
                </div>
                <input
                  type="checkbox"
                  checked={tempConfig.whatsapp_habilitado}
                  onChange={e => setTempConfig({ ...tempConfig, whatsapp_habilitado: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Template 1: Confirmación */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Plantilla: Reserva Confirmada</label>
                <textarea
                  rows={2}
                  value={tempConfig.plantilla_mensajes.reserva_confirmada}
                  onChange={e =>
                    setTempConfig({
                      ...tempConfig,
                      plantilla_mensajes: {
                        ...tempConfig.plantilla_mensajes,
                        reserva_confirmada: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500">Variables disponibles: &#123;nombre&#125;, &#123;fecha&#125;, &#123;hora&#125;, &#123;punto&#125;</span>
              </div>

              {/* Template 2: Asignada */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Plantilla: Unidad Asignada</label>
                <textarea
                  rows={2}
                  value={tempConfig.plantilla_mensajes.unidad_asignada}
                  onChange={e =>
                    setTempConfig({
                      ...tempConfig,
                      plantilla_mensajes: {
                        ...tempConfig.plantilla_mensajes,
                        unidad_asignada: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500">Variables: &#123;nombre&#125;, &#123;numero&#125;, &#123;placa&#125;, &#123;hora&#125;, &#123;punto&#125;, &#123;chofer&#125;</span>
              </div>

              {/* Template 3: En Camino */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Plantilla: Unidad en Camino (ETA)</label>
                <textarea
                  rows={2}
                  value={tempConfig.plantilla_mensajes.unidad_en_camino}
                  onChange={e =>
                    setTempConfig({
                      ...tempConfig,
                      plantilla_mensajes: {
                        ...tempConfig.plantilla_mensajes,
                        unidad_en_camino: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500">Variables: &#123;nombre&#125;, &#123;eta&#125;, &#123;placa&#125;</span>
              </div>

              {/* Template 4: Llegada */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Plantilla: Llegada Inminente (200 metros)</label>
                <textarea
                  rows={2}
                  value={tempConfig.plantilla_mensajes.llegada_inminente}
                  onChange={e =>
                    setTempConfig({
                      ...tempConfig,
                      plantilla_mensajes: {
                        ...tempConfig.plantilla_mensajes,
                        llegada_inminente: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                Guardar Cambios de Mensajería
              </button>
            </form>
          </div>

          {/* WhatsApp Logs Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-white text-sm">Historial de Notificaciones (Logs)</h4>
                <span className="text-xs text-slate-400 font-mono">{whatsappLogs.length}</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
                {whatsappLogs.map(log => (
                  <div key={log.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">{log.destinatario_nombre}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 line-clamp-2">{log.mensaje}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span>Tel: {log.destinatario_telefono}</span>
                      <span className="text-emerald-400 font-semibold">✓✓ Entregado</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: NUEVO / EDITAR PASAJERO
          ═══════════════════════════════════════════════════════ */}
      {showNewPaxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingPax ? 'Editar Pasajero' : 'Registrar Nuevo Pasajero Frecuente'}
              </h3>
              <button
                onClick={() => setShowNewPaxModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {paxFormError && (
              <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paxFormError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPasajero} className="space-y-4 mt-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez Quinde"
                  value={paxNombre}
                  onChange={e => setPaxNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Teléfono Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="0991234567"
                    value={paxTelefono}
                    onChange={e => setPaxTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Cédula / RUC</label>
                  <input
                    type="text"
                    placeholder="0928374651"
                    value={paxCedula}
                    onChange={e => setPaxCedula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Tipo de Pasajero</label>
                  <select
                    value={paxTipo}
                    onChange={e => setPaxTipo(e.target.value as TipoPasajero)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="frecuente">Frecuente</option>
                    <option value="ocasional">Ocasional</option>
                    <option value="empresa">Empresa / Convenio</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="tercera_edad">Tercera Edad</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Preferencia Asiento</label>
                  <select
                    value={paxAsiento}
                    onChange={e => setPaxAsiento(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="indistinto">Indistinto</option>
                    <option value="adelante">Adelante</option>
                    <option value="ventana">Ventana</option>
                    <option value="atras_solo">Atrás solo</option>
                  </select>
                </div>
              </div>

              {!editingPax && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300">Punto de Recogida Inicial</span>
                  <input
                    type="text"
                    placeholder="Nombre del punto (ej: Casa / Gasolinera Primax)"
                    value={paxPuntoNombre}
                    onChange={e => setPaxPuntoNombre(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Referencia exacta (ej: Frente a TIA, puerta negra)"
                    value={paxPuntoRef}
                    onChange={e => setPaxPuntoRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Notas Médicas / Preferencias</label>
                <input
                  type="text"
                  placeholder="Ej: Se marea atrás / Lleva maleta grande / Tercera edad"
                  value={paxNotas}
                  onChange={e => setPaxNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {paxTipo === 'empresa' && (
                <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl space-y-2">
                  <span className="font-semibold text-purple-300">Configuración de Convenio Corporativo</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Cupo mensual ($)"
                      value={paxCupoMensual}
                      onChange={e => setPaxCupoMensual(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Tarifa pactada ($)"
                      value={paxPrecioPactado}
                      onChange={e => setPaxPrecioPactado(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPaxModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20"
                >
                  Guardar Pasajero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: FICHA DETALLADA PASAJERO
          ═══════════════════════════════════════════════════════ */}
      {showPaxDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{showPaxDetailModal.nombre_completo}</h3>
                  <p className="text-slate-400">ID: {showPaxDetailModal.id} • Creado: {showPaxDetailModal.primera_fecha}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaxDetailModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-slate-400 text-[10px]">Total Viajes</span>
                <p className="text-base font-bold text-white">{showPaxDetailModal.total_viajes}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Asiento</span>
                <p className="text-base font-bold text-blue-400 capitalize">{showPaxDetailModal.preferencia_asiento}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Saldo</span>
                <p className="text-base font-bold text-emerald-400">${showPaxDetailModal.saldo_pendiente.toFixed(2)}</p>
              </div>
            </div>

            {/* Puntos Guardados */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300">Puntos de Recogida Registrados</h4>
              <div className="space-y-1.5">
                {showPaxDetailModal.puntos_recogida.map(pt => (
                  <div key={pt.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{pt.nombre}</span>
                      <p className="text-slate-400 text-[11px]">{pt.referencia}</p>
                    </div>
                    {pt.es_preferido && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded">
                        ★ Preferido ({pt.veces_usado}x)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showPaxDetailModal.notas && (
              <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <span className="font-semibold text-slate-300">Observaciones especiales:</span>
                <p className="text-slate-400 mt-0.5">{showPaxDetailModal.notas}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <a
                href={buildWhatsAppLink(showPaxDetailModal.telefono, `Hola ${showPaxDetailModal.nombre_completo}, te contactamos de Cooperativa Daule Express.`)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Directo
              </a>
              <button
                onClick={() => {
                  rutaxStore.eliminarPasajeroFrecuente(showPaxDetailModal.id);
                  setShowPaxDetailModal(null);
                }}
                className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-semibold rounded-xl"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: CREAR NUEVA RESERVA
          ═══════════════════════════════════════════════════════ */}
      {showNewReservaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Programar Nueva Reserva</h3>
              <button
                onClick={() => setShowNewReservaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearReserva} className="space-y-4">
              {/* Autocomplete Pasajero */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Seleccionar Pasajero Registrado</label>
                <select
                  value={resPasajeroId}
                  onChange={e => {
                    const pid = e.target.value;
                    setResPasajeroId(pid);
                    const pax = pasajeros.find(p => p.id === pid);
                    if (pax) {
                      setResPasajeroNombre(pax.nombre_completo);
                      setResPasajeroTel(pax.telefono);
                      const pt = pax.puntos_recogida.find(x => x.es_preferido) || pax.puntos_recogida[0];
                      if (pt) {
                        setResPuntoNombre(pt.nombre);
                        setResPuntoRef(pt.referencia);
                        setResPuntoLat(pt.lat);
                        setResPuntoLng(pt.lng);
                      }
                      setResEsCredito(pax.tiene_credito);
                      if (pax.precio_pactado) setResTarifa(String(pax.precio_pactado));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Seleccionar o escribir manualmente abajo --</option>
                  {pasajeros.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_completo} ({p.telefono}) - {p.tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Nombre del Pasajero *</label>
                  <input
                    type="text"
                    required
                    value={resPasajeroNombre}
                    onChange={e => setResPasajeroNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Celular WhatsApp</label>
                  <input
                    type="text"
                    value={resPasajeroTel}
                    onChange={e => setResPasajeroTel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Fecha</label>
                  <input
                    type="date"
                    required
                    value={resFecha}
                    onChange={e => setResFecha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Hora Deseada</label>
                  <input
                    type="time"
                    required
                    value={resHora}
                    onChange={e => setResHora(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Pasajeros (Pax)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={resPaxCount}
                    onChange={e => setResPaxCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300">Punto de Recogida</span>
                <input
                  type="text"
                  placeholder="Nombre del punto (ej: Primax Km 12)"
                  value={resPuntoNombre}
                  onChange={e => setResPuntoNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Referencia (ej: Frente a farmacia)"
                  value={resPuntoRef}
                  onChange={e => setResPuntoRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Observaciones / Asiento</label>
                <input
                  type="text"
                  placeholder="Ej: Asiento delantero preferido"
                  value={resObs}
                  onChange={e => setResObs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewReservaModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: ASIGNAR TURNO/UNIDAD A RESERVA
          ═══════════════════════════════════════════════════════ */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Asignar Unidad a Reserva</h3>
              <button onClick={() => setShowAssignModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-white text-sm">{showAssignModal.pasajero_nombre}</span>
              <p className="text-slate-400 mt-0.5">
                Hora: {showAssignModal.hora_deseada} • Punto: {showAssignModal.punto_recogida.nombre}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-semibold">Seleccionar Unidad en Turno Activo:</label>
              {turnosActivos.length === 0 ? (
                <p className="text-slate-500 italic">No hay unidades en turno activo en este momento.</p>
              ) : (
                turnosActivos.map(t => {
                  const veh = rutaxStore.vehiculos.find(v => v.id === t.vehiculo_id);
                  const chof = rutaxStore.usuarios.find(u => u.uid === t.chofer_id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedAssignTurnoId(t.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedAssignTurnoId === t.id
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-400" />
                        <div>
                          <span className="font-bold">Unidad #{veh?.numero_unidad || 'S/N'}</span>
                          <p className="text-[11px] text-slate-400">{chof?.nombre_completo}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono bg-slate-900 px-2 py-0.5 rounded">
                        Turno #{t.numero_turno}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAssignModal(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedAssignTurnoId}
                onClick={handleAsignarTurno}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20"
              >
                Asignar y Notificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: REGISTRAR PAGO EMPRESA
          ═══════════════════════════════════════════════════════ */}
      {showPagoEmpresaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Registrar Abono / Pago Empresa</h3>
              <button onClick={() => setShowPagoEmpresaModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl">
              <span className="font-bold text-white">{showPagoEmpresaModal.nombre_completo}</span>
              <p className="text-rose-400 font-semibold mt-0.5">Saldo pendiente: ${showPagoEmpresaModal.saldo_pendiente.toFixed(2)}</p>
            </div>

            <form onSubmit={handleGuardarPagoEmpresa} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Monto Pagado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="130.00"
                  value={pagoMonto}
                  onChange={e => setPagoMonto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Comprobante / N° Depósito</label>
                <input
                  type="text"
                  placeholder="DEP-BCO-PICHINCHA-1928"
                  value={pagoComprobante}
                  onChange={e => setPagoComprobante(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Notas / Factura</label>
                <input
                  type="text"
                  placeholder="Cancelación quincena septiembre"
                  value={pagoNotas}
                  onChange={e => setPagoNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPagoEmpresaModal(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
