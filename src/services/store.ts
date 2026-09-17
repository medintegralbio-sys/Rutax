/**
 * RUTAX-SMART — Motor de Almacenamiento Reactivo y Reglas de Negocio
 * Soporta persistencia local multi-tenant y sincronización lista para Firestore
 */

import {
  Cooperativa,
  Usuario,
  Vehiculo,
  EstadoVehiculo,
  VehiculoPendiente,
  Base,
  Turno,
  LogAuditoria,
  AlertaEmergencia,
  UbicacionFisica,
  Despacho,
  SolicitudPasajeroRuta,
  LogAuditoriaTurno,
  NotificacionChofer,
  TrackingLive,
  TrackingHistorial,
  TrackingPuntoHistorial,
  Geocerca,
  AlertaTracking,
  LiquidacionViaje,
  ArqueoTurnoChofer,
  GastoTurno,
  ConfiguracionFinancieraCoop,
  PasajeroFrecuente,
  Reserva,
  PuntoRecogidaFrecuente,
  NotificacionWhatsAppLog,
  ConfiguracionPasajeros,
  PagoCreditoEmpresa,
  HistorialViajePasajero,
  AlertaSeguridad,
  NotificacionBaseConductores,
  ZonaRiesgo,
  HuellasRegistradas,
  LogSeguridad,
  ConfiguracionSeguridadCoop,
  TipoAlertaSeguridad,
  SubtipoAlertaAmarilla,
  ResolucionAlerta,
  TipoEventoSeguridad,
  DestinatarioNotificacion,
  PrioridadNotificacion,
  PendienteLecturaNotificacion,
  LecturaNotificacion,
  PlanSuscripcion,
  SuscripcionCooperativa,
  ComprobantePago,
  MetricasGlobales,
  LogSuperAdmin,
  ConfiguracionSuperAdmin,
  EstadoSuscripcion,
  ProformaPago,
  ProformaItem,
  ProformaComprobante,
  ChatBases,
  MensajeChatBase,
  CoordinacionBases,
  MensajeConductorBase,
  Cliente,
  ReservaCliente,
  NotificacionInternaCooperativa,
  HistoricoPagoArchivado
} from '../types';
import {
  INITIAL_PLANES,
  INITIAL_SUSCRIPCIONES,
  INITIAL_COMPROBANTES,
  INITIAL_METRICAS_GLOBALES,
  INITIAL_LOGS_SUPERADMIN,
  INITIAL_CONFIG_SUPERADMIN,
  INITIAL_NOTIFICACIONES_INTERNAS,
  exportFinancialReportPDF,
  exportExcelCSV
} from './superAdminService';
import {
  INITIAL_PASAJEROS_FRECUENTES,
  INITIAL_RESERVAS,
  INITIAL_PUNTOS_RECOGIDA_FRECUENTES,
  INITIAL_WHATSAPP_LOGS,
  CONFIG_PASAJEROS_DEFAULT,
  interpolateWhatsAppTemplate,
  buildWhatsAppLink
} from './passengerServices';
import {
  CONFIG_SEGURIDAD_DEFAULT,
  INITIAL_ALERTAS_SEGURIDAD,
  INITIAL_NOTIFICACIONES_BASE_CONDUCTORES,
  INITIAL_ZONAS_RIESGO,
  INITIAL_HUELLAS,
  INITIAL_LOGS_SEGURIDAD,
  playSecurityAlarm,
  stopSecurityAlarm,
  speakNotificationText,
  buildECU911Script,
  buildWhatsAppEmergencyMessage,
  generatePoliceDenunciaPDF
} from './securityServices';
import {
  syncCooperativaToFirestore,
  syncUsuarioToFirestore,
  syncVehiculoToFirestore,
  syncVehiculoPendienteToFirestore,
  syncBaseToFirestore,
  syncTurnoToFirestore,
  deleteTurnoFromFirestore,
  addAuditLogInFirestore,
  syncDespachoToFirestore,
  syncSolicitudPasajeroToFirestore,
  syncLogAuditoriaTurnoToFirestore,
  syncTrackingHistorialToFirestore,
  syncGeocercaToFirestore,
  deleteGeocercaFromFirestore,
  syncAlertaTrackingToFirestore,
  attendAlertaTrackingInFirestore,
  deleteCooperativaFromFirestore
} from './firebase';
import {
  calculateDistanceMeters,
  calculateBearing,
  isPointInsideGeocerca,
  isRiskZoneInCriticalHours,
  RUTA_CORREDOR_DEFAULT,
  getDistanceToPolylineMeters,
  savePointToOfflineBuffer,
  flushOfflineBuffer
} from './mapServices';

// SEMILLAS INICIALES REALISTAS (Ecuador: Guayaquil, Daule, Sauces, Centro)
const INITIAL_COOPERATIVAS: Cooperativa[] = [
  {
    id: 'coop-daule',
    nombre: 'Cooperativa Daule Express',
    ruc: '0992348571001',
    logo_url: '/logo.jpeg',
    telefono: '042790123',
    direccion: 'Av. León Febres Cordero km 14.5, Daule',
    presidente_nombre: 'Carlos Andrade',
    presidente_celular: '0998765432',
    estado: 'activa',
    fecha_creacion: '2023-01-15',
    fecha_vencimiento_suscripcion: '2026-10-15',
    plan: 'pro',
    telefono_emergencia: '0991122334',
    monto_deuda: 0,
    bloqueo_tipo: 'ninguno',
    historial_pagos: [
      { id: 'pay-1', fecha: '2026-09-15', monto: 120, referencia: 'DEP-BCO-PICHINCHA-9821', dias_agregados: 30 }
    ],
    rutas: [
      {
        id: 'ruta-1',
        nombre: 'Sauces 9 ↔ Parque Centenario Centro',
        tarifa_plana: 0.50,
        activa: true,
        fecha_vigencia: '2026-01-01',
        historial_tarifas: [
          { tarifa: 0.40, fecha: '2024-01-01', motivo: 'Tarifa inicial regulada' },
          { tarifa: 0.50, fecha: '2026-01-01', motivo: 'Ajuste resolución de tránsito' }
        ]
      },
      {
        id: 'ruta-2',
        nombre: 'Guasmo Sur ↔ Alborada / Sauces Directo',
        tarifa_plana: 1.00,
        activa: true,
        fecha_vigencia: '2026-03-01',
        historial_tarifas: [
          { tarifa: 1.00, fecha: '2026-03-01', motivo: 'Lanzamiento servicio expreso' }
        ]
      }
    ],
    paradas_sugeridas: [
      { id: 'par-1', nombre: 'Sauces 9 Terminal', lat: -2.1384, lng: -79.8967, orden: 1 },
      { id: 'par-2', nombre: 'Av. Isidro Ayora (Mall del Sol)', lat: -2.1550, lng: -79.8935, orden: 2 },
      { id: 'par-3', nombre: 'Av. Plaza Dañín / San Marino', lat: -2.1700, lng: -79.8910, orden: 3 },
      { id: 'par-4', nombre: 'Parque Centenario Centro', lat: -2.1895, lng: -79.8890, orden: 4 }
    ]
  },
  {
    id: 'coop-cisne',
    nombre: 'Cooperativa Cisne Azul',
    ruc: '0991827364001',
    logo_url: '/logo.jpeg',
    telefono: '042456789',
    direccion: 'Calle 40 y Venezuela, Suburbio Oeste',
    presidente_nombre: 'Gonzalo Morales',
    presidente_celular: '0987654321',
    estado: 'suspendida',
    fecha_creacion: '2023-04-10',
    fecha_vencimiento_suscripcion: '2026-09-10', // Vencida hace 5 días
    plan: 'basico',
    telefono_emergencia: '0994455667',
    monto_deuda: 180,
    bloqueo_tipo: 'parcial', // Día 3-5: Despacho bloqueado, GPS sigue
    rutas: [
      { id: 'ruta-cisne-1', nombre: 'Suburbio ↔ Mercado Central', tarifa_plana: 0.40, activa: false }
    ],
    paradas_sugeridas: [
      { id: 'par-c1', nombre: 'Base Suburbio Calle 40', lat: -2.2050, lng: -79.9200, orden: 1 },
      { id: 'par-c2', nombre: 'Mercado Central', lat: -2.1930, lng: -79.8850, orden: 2 }
    ]
  },
  {
    id: 'coop-costera',
    nombre: 'Trans Guasmo Sur Express',
    ruc: '0993049582001',
    logo_url: '/logo.jpeg',
    telefono: '042889900',
    direccion: 'Av. 25 de Julio y Perimetral',
    presidente_nombre: 'Mariana Reyes',
    presidente_celular: '0978901234',
    estado: 'activa',
    fecha_creacion: '2022-11-20',
    fecha_vencimiento_suscripcion: '2026-12-31',
    plan: 'enterprise',
    monto_deuda: 0,
    bloqueo_tipo: 'ninguno',
    rutas: [
      { id: 'ruta-g1', nombre: 'Guasmo Central ↔ Mapasingue', tarifa_plana: 0.60, activa: true }
    ],
    paradas_sugeridas: [
      { id: 'par-g1', nombre: 'Guasmo Central', lat: -2.2500, lng: -79.8900, orden: 1 },
      { id: 'par-g2', nombre: 'Mall del Sur', lat: -2.2280, lng: -79.8980, orden: 2 }
    ]
  }
];

const INITIAL_BASES: Base[] = [
  {
    id: 'base-a',
    cooperativaId: 'coop-daule',
    nombre: 'Base A',
    direccion: 'Av. Gabriel Roldós y Av. Antonio Parra Velasco (Sauces 9)',
    lat: -2.1384,
    lng: -79.8967,
    radio_geocerca: 150, // 150 metros
    capacidad_max: 20,
    capacidad_base: 20,
    capacidad_prebase: 0,
    color_pin: '#22C55E',
    tiene_prebase: false,
    tiempo_max_espera_prebase: 90,
    tiempo_para_avanzar: 5,
    tiempo_max_espera_base: 15,
    tiempo_max_desembarque: 10,
    salida_incompleta_permitida: true,
    tiempo_min_forzar_salida: 15,
    bahia_desembarque: {
      lat: -2.1375,
      lng: -79.8960,
      radio: 100
    }
  },
  {
    id: 'base-b',
    cooperativaId: 'coop-daule',
    nombre: 'Base B',
    direccion: 'Calle Lorenzo de Garaicoa y 9 de Octubre (Centro)',
    lat: -2.1895,
    lng: -79.8890,
    radio_geocerca: 150,
    capacidad_max: 20,
    capacidad_base: 20,
    capacidad_prebase: 0,
    color_pin: '#3B82F6',
    tiene_prebase: false,
    tiempo_max_espera_prebase: 90,
    tiempo_para_avanzar: 5,
    tiempo_max_espera_base: 15,
    tiempo_max_desembarque: 10,
    salida_incompleta_permitida: true,
    tiempo_min_forzar_salida: 15,
    bahia_desembarque: {
      lat: -2.1880,
      lng: -79.8880,
      radio: 100
    }
  }
];

const INITIAL_USUARIOS: Usuario[] = [
  {
    uid: 'usr-super',
    cooperativaId: '',
    cedula: '0928374651',
    nombre_completo: 'Ing. Roberto Salazar',
    telefono: '0991234567',
    email: 'superadmin@rutax.com',
    rol: 'superadmin',
    rol_secundario: null,
    base_asignada: null,
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    licencia_tipo: 'B',
    activo: true,
    fecha_registro: '2023-01-01',
    ultimo_login: '2026-09-15 16:30',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0991112233', t2: '0994445566' }
  },
  {
    uid: 'usr-admin',
    cooperativaId: 'coop-daule',
    cedula: '0912345678',
    nombre_completo: 'Carlos Andrade (Presidente)',
    telefono: '0998765432',
    email: 'admin@rutax.com',
    rol: 'admin_coop',
    rol_secundario: null,
    base_asignada: null,
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    licencia_tipo: 'C',
    activo: true,
    fecha_registro: '2023-01-15',
    ultimo_login: '2026-09-15 17:00',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0998887766', t2: '0992223344' }
  },
  {
    uid: 'usr-desp-a',
    cooperativaId: 'coop-daule',
    cedula: '0923456789',
    nombre_completo: 'Wilson Mera (Despacho Sauces)',
    telefono: '0993456789',
    email: 'baseA@rutax.com',
    rol: 'despachador',
    rol_secundario: null,
    base_asignada: 'base_a',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    activo: true,
    fecha_registro: '2023-02-01',
    ultimo_login: '2026-09-15 17:15',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0991231234', t2: '0994564567' }
  },
  {
    uid: 'usr-desp-b',
    cooperativaId: 'coop-daule',
    cedula: '0934567890',
    nombre_completo: 'Edison Zambrano (Despacho Centro)',
    telefono: '0994567890',
    email: 'baseB@rutax.com',
    rol: 'despachador',
    rol_secundario: null,
    base_asignada: 'base_b',
    foto_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    activo: true,
    fecha_registro: '2023-02-01',
    ultimo_login: '2026-09-15 16:45',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0992342345', t2: '0995675678' }
  },
  {
    uid: 'usr-socio',
    cooperativaId: 'coop-daule',
    cedula: '0945678901',
    nombre_completo: 'Don Manuel Holguín',
    telefono: '0995678901',
    email: 'socio@rutax.com',
    rol: 'socio',
    rol_secundario: null,
    base_asignada: null,
    foto_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    activo: true,
    fecha_registro: '2023-02-15',
    ultimo_login: '2026-09-15 15:10',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0996786789', t2: '0997897890' },
    bloqueos_ultimos_7_dias: 1
  },
  {
    uid: 'usr-chofer',
    cooperativaId: 'coop-daule',
    cedula: '0956789012',
    nombre_completo: 'Juan Pérez Quinde',
    telefono: '0996789012',
    email: 'chofer@rutax.com',
    rol: 'chofer',
    rol_secundario: null,
    base_asignada: 'base_a',
    foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    licencia_tipo: 'E',
    activo: true,
    fecha_registro: '2023-03-01',
    ultimo_login: '2026-09-15 17:20',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0998908901', t2: '0999019012' }
  },
  {
    uid: 'usr-dueno-chofer',
    cooperativaId: 'coop-daule',
    cedula: '0967890123',
    nombre_completo: 'Carlos Andrade Jr. (Dueño-Chofer)',
    telefono: '0997890123',
    email: 'andrade.jr@rutax.ec',
    rol: 'chofer',
    rol_secundario: 'socio',
    base_asignada: 'base_a',
    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    licencia_tipo: 'E',
    activo: true,
    fecha_registro: '2023-03-10',
    ultimo_login: '2026-09-15 17:22',
    huella_registrada: true,
    telefonos_emergencia: { t1: '0990120123', t2: '0991231235' }
  },
  {
    uid: 'usr-cliente',
    cooperativaId: 'coop-daule',
    cedula: '0987654321',
    nombre_completo: 'María Fernanda González',
    telefono: '0987654321',
    email: 'cliente@rutax.com',
    rol: 'cliente',
    rol_secundario: null,
    base_asignada: null,
    foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    activo: true,
    fecha_registro: '2023-05-10',
    ultimo_login: '2026-09-16 08:30',
    huella_registrada: false,
    telefonos_emergencia: { t1: '0991234567' }
  }
];

const INITIAL_VEHICULOS: Vehiculo[] = [
  {
    id: 'veh-1023',
    cooperativaId: 'coop-daule',
    numero_unidad: '1023',
    placa: 'GNZ-0982',
    modelo: 'Toyota Hiace',
    anio: 2026,
    color: 'Blanco',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'en_registro',
    documentos: { matricula_vigencia: '2027-01-01', soat_vigencia: '2027-01-01', revision_tecnica_vigencia: '2027-01-01' },
    km_actual: 100,
    fecha_registro: '2026-09-16',
    ubicacion_actual: null
  },
  {
    id: 'veh-1024',
    cooperativaId: 'coop-daule',
    numero_unidad: '1024',
    placa: 'ABC-5678',
    modelo: 'Toyota Hiace',
    anio: 2026,
    color: 'Blanco',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'en_registro',
    documentos: { matricula_vigencia: '2027-01-01', soat_vigencia: '2027-01-01', revision_tecnica_vigencia: '2027-01-01' },
    km_actual: 100,
    fecha_registro: '2026-09-16',
    ubicacion_actual: null
  },
  {
    id: 'veh-1025',
    cooperativaId: 'coop-daule',
    numero_unidad: '1025',
    placa: 'DEF-9012',
    modelo: 'Toyota Hiace',
    anio: 2026,
    color: 'Blanco',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'en_registro',
    documentos: { matricula_vigencia: '2027-01-01', soat_vigencia: '2027-01-01', revision_tecnica_vigencia: '2027-01-01' },
    km_actual: 100,
    fecha_registro: '2026-09-16',
    ubicacion_actual: null
  },
  {
    id: 'veh-1026',
    cooperativaId: 'coop-daule',
    numero_unidad: '1026',
    placa: 'GHI-3456',
    modelo: 'Toyota Hiace',
    anio: 2026,
    color: 'Blanco',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'en_registro',
    documentos: { matricula_vigencia: '2027-01-01', soat_vigencia: '2027-01-01', revision_tecnica_vigencia: '2027-01-01' },
    km_actual: 100,
    fecha_registro: '2026-09-16',
    ubicacion_actual: null
  },
  {
    id: 'veh-1027',
    cooperativaId: 'coop-daule',
    numero_unidad: '1027',
    placa: 'JKL-7890',
    modelo: 'Toyota Hiace',
    anio: 2026,
    color: 'Blanco',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'en_registro',
    documentos: { matricula_vigencia: '2027-01-01', soat_vigencia: '2027-01-01', revision_tecnica_vigencia: '2027-01-01' },
    km_actual: 100,
    fecha_registro: '2026-09-16',
    ubicacion_actual: null
  }
,
  {
    id: 'veh-15',
    cooperativaId: 'coop-daule',
    numero_unidad: '15',
    placa: 'GXY-1234',
    modelo: 'Hyundai County',
    anio: 2023,
    color: 'Blanco/Verde',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-04-30', soat_vigencia: '2027-02-15', revision_tecnica_vigencia: '2027-03-20' },
    km_actual: 42560,
    fecha_registro: '2023-03-01',
    ubicacion_actual: { lat: -2.1384, lng: -79.8967, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real A' }
  },
  {
    id: 'veh-20',
    cooperativaId: 'coop-daule',
    numero_unidad: '20',
    placa: 'GBA-2020',
    modelo: 'Hyundai H1 Minibus',
    anio: 2023,
    color: 'Blanco con verde',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-dueno-chofer',
    conductor_actual_tipo: 'propietario',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-11-30', soat_vigencia: '2026-12-15', revision_tecnica_vigencia: '2026-10-10' },
    km_actual: 54100,
    fecha_registro: '2023-03-15',
    ubicacion_actual: { lat: -2.1384, lng: -79.8967, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real A' }
  },
  {
    id: 'veh-1023',
    cooperativaId: 'coop-daule',
    numero_unidad: '1023',
    placa: 'GCA-1023',
    modelo: 'Toyota Hiace Combi',
    anio: 2024,
    color: 'Blanco con franja verde',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-admin',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-08-31', soat_vigencia: '2027-06-12', revision_tecnica_vigencia: '2027-07-15' },
    km_actual: 31200,
    fecha_registro: '2023-03-01',
    ubicacion_actual: { lat: -2.1384, lng: -79.8967, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real A' }
  },
  {
    id: 'veh-1012',
    cooperativaId: 'coop-daule',
    numero_unidad: '1012',
    placa: 'GSB-9988',
    modelo: 'Chevrolet N400 Max',
    anio: 2024,
    color: 'Plata metálico',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-admin',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-08-31', soat_vigencia: '2027-06-12', revision_tecnica_vigencia: '2027-07-15' },
    km_actual: 19800,
    fecha_registro: '2024-02-10',
    ubicacion_actual: { lat: -2.1384, lng: -79.8967, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real A' }
  },
  {
    id: 'veh-10',
    cooperativaId: 'coop-daule',
    numero_unidad: '10',
    placa: 'GCA-1010',
    modelo: 'Ford Transit Minibus',
    anio: 2023,
    color: 'Blanco perla',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-12-31', soat_vigencia: '2026-11-15', revision_tecnica_vigencia: '2026-10-20' },
    km_actual: 48900,
    fecha_registro: '2023-04-12',
    ubicacion_actual: { lat: -2.1435, lng: -79.8990, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Sauces' }
  },
  {
    id: 'veh-22',
    cooperativaId: 'coop-daule',
    numero_unidad: '22',
    placa: 'GYE-2222',
    modelo: 'Toyota Coaster Microbus',
    anio: 2022,
    color: 'Blanco con verde',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-10-31', soat_vigencia: '2026-09-30', revision_tecnica_vigencia: '2026-10-05' },
    km_actual: 62400,
    fecha_registro: '2023-02-18',
    ubicacion_actual: { lat: -2.1435, lng: -79.8990, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Sauces' }
  },
  {
    id: 'veh-1045',
    cooperativaId: 'coop-daule',
    numero_unidad: '1045',
    placa: 'GBA-5678',
    modelo: 'Hyundai Staria Minibus',
    anio: 2023,
    color: 'Amarillo taxi ruta',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-11-30', soat_vigencia: '2026-12-15', revision_tecnica_vigencia: '2026-10-10' },
    km_actual: 78920,
    fecha_registro: '2023-03-15',
    ubicacion_actual: { lat: -2.1435, lng: -79.8990, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Sauces' }
  },
  {
    id: 'veh-1050',
    cooperativaId: 'coop-daule',
    numero_unidad: '1050',
    placa: 'GKT-3321',
    modelo: 'Nissan NV350 Urvan',
    anio: 2023,
    color: 'Gris Grafito',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-dueno-chofer',
    chofer_titular_id: 'usr-dueno-chofer',
    conductor_actual_tipo: 'propietario',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-05-15', soat_vigencia: '2027-03-22', revision_tecnica_vigencia: '2027-04-10' },
    km_actual: 36400,
    fecha_registro: '2023-05-18',
    ubicacion_actual: { lat: -2.1435, lng: -79.8990, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Sauces' }
  },
  {
    id: 'veh-884',
    cooperativaId: 'coop-daule',
    numero_unidad: '884',
    placa: 'GTR-8844',
    modelo: 'JAC Sunray Minibus',
    anio: 2023,
    color: 'Blanco con franja verde',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-admin',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-01-20', soat_vigencia: '2027-01-10', revision_tecnica_vigencia: '2026-12-15' },
    km_actual: 51200,
    fecha_registro: '2023-06-10',
    ubicacion_actual: { lat: -2.1435, lng: -79.8990, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Sauces' }
  },
  {
    id: 'veh-1019',
    cooperativaId: 'coop-daule',
    numero_unidad: '1019',
    placa: 'GTH-4455',
    modelo: 'Renault Master Minibus',
    anio: 2022,
    color: 'Blanco perla',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-10-31', soat_vigencia: '2026-09-30', revision_tecnica_vigencia: '2026-10-05' },
    km_actual: 95400,
    fecha_registro: '2023-01-20',
    ubicacion_actual: { lat: -2.1435, lng: -79.8990, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Sauces' }
  },
  {
    id: 'veh-1030',
    cooperativaId: 'coop-daule',
    numero_unidad: '1030',
    placa: 'GHY-1030',
    modelo: 'Toyota Hiace Grandia',
    anio: 2024,
    color: 'Blanco con franja azul',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-admin',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-09-15', soat_vigencia: '2027-08-01', revision_tecnica_vigencia: '2027-07-20' },
    km_actual: 22100,
    fecha_registro: '2024-01-10',
    ubicacion_actual: { lat: -2.1895, lng: -79.8890, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real B Centro' }
  },
  {
    id: 'veh-1032',
    cooperativaId: 'coop-daule',
    numero_unidad: '1032',
    placa: 'GHY-1032',
    modelo: 'Mercedes Sprinter Microbus',
    anio: 2023,
    color: 'Blanco con franja azul',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-02-15', soat_vigencia: '2027-01-20', revision_tecnica_vigencia: '2026-12-10' },
    km_actual: 44800,
    fecha_registro: '2023-04-18',
    ubicacion_actual: { lat: -2.1895, lng: -79.8890, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real B Centro' }
  },
  {
    id: 'veh-1035',
    cooperativaId: 'coop-daule',
    numero_unidad: '1035',
    placa: 'GHY-1035',
    modelo: 'Hyundai H1 Minibus',
    anio: 2023,
    color: 'Blanco con franja azul',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-admin',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-05-10', soat_vigencia: '2027-04-15', revision_tecnica_vigencia: '2027-03-30' },
    km_actual: 39700,
    fecha_registro: '2023-05-20',
    ubicacion_actual: { lat: -2.1895, lng: -79.8890, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Base Real B Centro' }
  },
  {
    id: 'veh-1040',
    cooperativaId: 'coop-daule',
    numero_unidad: '1040',
    placa: 'GHY-1040',
    modelo: 'Chevrolet N400 Max',
    anio: 2023,
    color: 'Plata metálico',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-11-25', soat_vigencia: '2026-10-30', revision_tecnica_vigencia: '2026-10-15' },
    km_actual: 58200,
    fecha_registro: '2023-03-25',
    ubicacion_actual: { lat: -2.1885, lng: -79.8880, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'Bahía Desembarque B Centro' }
  },
  {
    id: 'veh-1048',
    cooperativaId: 'coop-daule',
    numero_unidad: '1048',
    placa: 'GHY-1048',
    modelo: 'Nissan NV350 Minibus',
    anio: 2023,
    color: 'Blanco perla',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-admin',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2027-03-12', soat_vigencia: '2027-02-18', revision_tecnica_vigencia: '2027-01-25' },
    km_actual: 33500,
    fecha_registro: '2023-06-15',
    ubicacion_actual: { lat: -2.1930, lng: -79.8910, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Centro' }
  },
  {
    id: 'veh-1052',
    cooperativaId: 'coop-daule',
    numero_unidad: '1052',
    placa: 'GHY-1052',
    modelo: 'JAC Sunray Minibus',
    anio: 2022,
    color: 'Blanco con franja azul',
    capacidad: 15,
    tipo_vehiculo: 'minibus',
    foto_vehiculo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
    socio_id: 'usr-socio',
    chofer_titular_id: 'usr-chofer',
    conductor_actual_tipo: 'chofer_titular',
    estado: 'activo',
    documentos: { matricula_vigencia: '2026-09-30', soat_vigencia: '2026-09-15', revision_tecnica_vigencia: '2026-08-20' },
    km_actual: 67800,
    fecha_registro: '2022-11-20',
    ubicacion_actual: { lat: -2.1930, lng: -79.8910, velocidad_kmh: 0, rumbo: 0, ultima_actualizacion: 'En Pre-Base Centro' }
  }
];

const INITIAL_TURNOS: Turno[] = [
  // --- BASE A SAUCES (4 en Base Real, 6 en Pre-Base) ---
  {
    id: 'tur-001',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-15',
    chofer_id: 'usr-chofer',
    numero_turno: 1,
    ubicacion_fisica: 'base_real',
    hora_llegada: '16:45',
    hora_salida: null,
    pasajeros_actuales: 15,
    pasajeros_max: 15,
    estado: 'listo', // LLENO
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 22.50
  },
  {
    id: 'tur-002',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-20',
    chofer_id: 'usr-dueno-chofer',
    numero_turno: 2,
    ubicacion_fisica: 'base_real',
    hora_llegada: '16:55',
    hora_salida: null,
    pasajeros_actuales: 8,
    pasajeros_max: 15,
    estado: 'llenando',
    tipo_conductor: 'propietario',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 12.00
  },
  {
    id: 'tur-003',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-15',
    chofer_id: 'usr-chofer',
    numero_turno: 3,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:05',
    hora_salida: null,
    pasajeros_actuales: 8,
    pasajeros_max: 15,
    estado: 'llenando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 12.00
  },
  {
    id: 'tur-004',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-1012',
    chofer_id: 'usr-chofer',
    numero_turno: 4,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:15',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-005',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-10',
    chofer_id: 'usr-chofer',
    numero_turno: 5,
    ubicacion_fisica: 'base_real',
    hora_llegada: '16:40',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-006',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-22',
    chofer_id: 'usr-chofer',
    numero_turno: 6,
    ubicacion_fisica: 'base_real',
    hora_llegada: '16:50',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-007',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-1045',
    chofer_id: 'usr-chofer',
    numero_turno: 7,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:00',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-008',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-1050',
    chofer_id: 'usr-dueno-chofer',
    numero_turno: 8,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:10',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'propietario',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-009',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-884',
    chofer_id: 'usr-chofer',
    numero_turno: 9,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:18',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-010',
    cooperativaId: 'coop-daule',
    baseId: 'base-a',
    vehiculo_id: 'veh-1019',
    chofer_id: 'usr-chofer',
    numero_turno: 10,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:22',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },

  // --- BASE B CENTRO (4 en Base Real, 2 en Pre-Base) ---
  {
    id: 'tur-011',
    cooperativaId: 'coop-daule',
    baseId: 'base-b',
    vehiculo_id: 'veh-1030',
    chofer_id: 'usr-chofer',
    numero_turno: 1,
    ubicacion_fisica: 'base_real',
    hora_llegada: '16:48',
    hora_salida: null,
    pasajeros_actuales: 15,
    pasajeros_max: 15,
    estado: 'listo',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 22.50
  },
  {
    id: 'tur-012',
    cooperativaId: 'coop-daule',
    baseId: 'base-b',
    vehiculo_id: 'veh-1032',
    chofer_id: 'usr-chofer',
    numero_turno: 2,
    ubicacion_fisica: 'base_real',
    hora_llegada: '16:58',
    hora_salida: null,
    pasajeros_actuales: 15,
    pasajeros_max: 15,
    estado: 'listo',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 22.50
  },
  {
    id: 'tur-013',
    cooperativaId: 'coop-daule',
    baseId: 'base-b',
    vehiculo_id: 'veh-1035',
    chofer_id: 'usr-chofer',
    numero_turno: 3,
    ubicacion_fisica: 'base_real',
    hora_llegada: '17:08',
    hora_salida: null,
    pasajeros_actuales: 15,
    pasajeros_max: 15,
    estado: 'listo',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 22.50
  },
  {
    id: 'tur-014',
    cooperativaId: 'coop-daule',
    baseId: 'base-b',
    vehiculo_id: 'veh-1040',
    chofer_id: 'usr-chofer',
    numero_turno: 4,
    ubicacion_fisica: 'desembarcando',
    hora_llegada: '17:12',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'desembarcando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-015',
    cooperativaId: 'coop-daule',
    baseId: 'base-b',
    vehiculo_id: 'veh-1048',
    chofer_id: 'usr-chofer',
    numero_turno: 5,
    ubicacion_fisica: 'prebase',
    hora_llegada: '17:02',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  },
  {
    id: 'tur-016',
    cooperativaId: 'coop-daule',
    baseId: 'base-b',
    vehiculo_id: 'veh-1052',
    chofer_id: 'usr-chofer',
    numero_turno: 6,
    ubicacion_fisica: 'prebase',
    hora_llegada: '17:14',
    hora_salida: null,
    pasajeros_actuales: 0,
    pasajeros_max: 15,
    estado: 'esperando',
    tipo_conductor: 'chofer_titular',
    motivo_reasignacion: null,
    tarifa_viaje: 1.50,
    total_recaudado: 0.00
  }
];

// 5 Despachos cerrados de ejemplo (Historial de viajes completados)
const INITIAL_DESPACHOS: Despacho[] = [
  {
    id: 'desp-001',
    cooperativaId: 'coop-daule',
    turno_id: 'tur-old-01',
    vehiculo_id: 'veh-15',
    chofer_id: 'usr-chofer',
    base_origen_id: 'base-b',
    base_destino_id: 'base-a',
    hora_salida: '15:40',
    hora_llegada: '16:12',
    pasajeros_base: 15,
    pasajeros_ruta: 0,
    pasajeros_totales: 15,
    pasajeros_max: 15,
    tarifa_plana: 1.50,
    recaudacion_bruta: 22.50,
    km_inicio: 45100,
    km_fin: 45118,
    estado: 'cerrado',
    duracion_min: 32,
    salida_incompleta: false
  },
  {
    id: 'desp-002',
    cooperativaId: 'coop-daule',
    turno_id: 'tur-old-02',
    vehiculo_id: 'veh-20',
    chofer_id: 'usr-dueno-chofer',
    base_origen_id: 'base-a',
    base_destino_id: 'base-b',
    hora_salida: '16:00',
    hora_llegada: '16:35',
    pasajeros_base: 13,
    pasajeros_ruta: 2,
    pasajeros_totales: 15,
    pasajeros_max: 15,
    tarifa_plana: 1.50,
    recaudacion_bruta: 22.50,
    km_inicio: 36200,
    km_fin: 36219,
    estado: 'cerrado',
    duracion_min: 35,
    salida_incompleta: false
  },
  {
    id: 'desp-003',
    cooperativaId: 'coop-daule',
    turno_id: 'tur-old-03',
    vehiculo_id: 'veh-1023',
    chofer_id: 'usr-chofer',
    base_origen_id: 'base-b',
    base_destino_id: 'base-a',
    hora_salida: '16:15',
    hora_llegada: '16:44',
    pasajeros_base: 14,
    pasajeros_ruta: 1,
    pasajeros_totales: 15,
    pasajeros_max: 15,
    tarifa_plana: 1.50,
    recaudacion_bruta: 22.50,
    km_inicio: 42540,
    km_fin: 42558,
    estado: 'cerrado',
    duracion_min: 29,
    salida_incompleta: false
  },
  {
    id: 'desp-004',
    cooperativaId: 'coop-daule',
    turno_id: 'tur-old-04',
    vehiculo_id: 'veh-1012',
    chofer_id: 'usr-chofer',
    base_origen_id: 'base-a',
    base_destino_id: 'base-b',
    hora_salida: '16:30',
    hora_llegada: '17:01',
    pasajeros_base: 15,
    pasajeros_ruta: 0,
    pasajeros_totales: 15,
    pasajeros_max: 15,
    tarifa_plana: 1.50,
    recaudacion_bruta: 22.50,
    km_inicio: 19780,
    km_fin: 19799,
    estado: 'cerrado',
    duracion_min: 31,
    salida_incompleta: false
  },
  {
    id: 'desp-005',
    cooperativaId: 'coop-daule',
    turno_id: 'tur-old-05',
    vehiculo_id: 'veh-884',
    chofer_id: 'usr-chofer',
    base_origen_id: 'base-b',
    base_destino_id: 'base-a',
    hora_salida: '16:45',
    hora_llegada: '17:19',
    pasajeros_base: 12,
    pasajeros_ruta: 3,
    pasajeros_totales: 15,
    pasajeros_max: 15,
    tarifa_plana: 1.50,
    recaudacion_bruta: 22.50,
    km_inicio: 51200,
    km_fin: 51219,
    estado: 'cerrado',
    duracion_min: 34,
    salida_incompleta: false
  }
];

// 3 Solicitudes de pasajeros en ruta (1 pendiente, 1 en espera, 1 asignada)
const INITIAL_SOLICITUDES_PASAJEROS: SolicitudPasajeroRuta[] = [
  {
    id: 'sol-pax-1',
    cooperativaId: 'coop-daule',
    pasajero_nombre: 'Carmen Villamar',
    pasajero_telefono: '0987112233',
    lat: -2.1490,
    lng: -79.8945,
    referencia: 'Alborada 3ra Etapa, frente a Farmacia SanaSana',
    cantidad_pasajeros: 1,
    estado: 'pendiente',
    turno_asignado_id: null,
    creada_por: 'pasajero_web',
    fecha_solicitud: '17:22',
    posicion_espera: null
  },
  {
    id: 'sol-pax-2',
    cooperativaId: 'coop-daule',
    pasajero_nombre: 'Jorge Mieles',
    pasajero_telefono: '0993445566',
    lat: -2.1420,
    lng: -79.8970,
    referencia: 'Sauces 5, peatonal 14 manzana 202',
    cantidad_pasajeros: 2,
    estado: 'en_espera',
    posicion_espera: 2,
    turno_asignado_id: null,
    creada_por: 'pasajero_web',
    fecha_solicitud: '17:25'
  },
  {
    id: 'sol-pax-3',
    cooperativaId: 'coop-daule',
    pasajero_nombre: 'Dra. Martha Reyes',
    pasajero_telefono: '0978990011',
    lat: -2.1810,
    lng: -79.8895,
    referencia: 'Parada Mercado Central, puerta 2',
    cantidad_pasajeros: 3,
    estado: 'asignada',
    turno_asignado_id: 'tur-001',
    creada_por: 'despachador',
    fecha_solicitud: '17:15',
    fecha_asignacion: '17:20'
  }
];

// 3 Logs de auditoría de turnos de ejemplo
const INITIAL_LOGS_TURNOS: LogAuditoriaTurno[] = [
  {
    id: 'log-tur-1',
    cooperativaId: 'coop-daule',
    usuario_id: 'usr-desp-a',
    usuario_nombre: 'Wilson Mera',
    rol: 'despachador',
    accion: 'reasignacion',
    turno_id: 'tur-005',
    detalle: 'Reasignación de Unidad #10 del Turno #5 al Turno #2 por Wilson Mera. Motivo: Logística hora pico - 12 pasajeros en sala.',
    antes: { numero_turno: 5, ubicacion: 'prebase' },
    despues: { numero_turno: 2, ubicacion: 'base_real' },
    timestamp: '2026-09-15 16:42:10'
  },
  {
    id: 'log-tur-2',
    cooperativaId: 'coop-daule',
    usuario_id: 'usr-desp-a',
    usuario_nombre: 'Wilson Mera',
    rol: 'despachador',
    accion: 'salida_forzada',
    turno_id: 'tur-old-06',
    detalle: 'Salida incompleta forzada para Unidad #1045 con 4/15 pasajeros. Motivo: Hora valle con lluvia fuerte y baja afluencia en terminal Sauces.',
    antes: { pasajeros: 4, estado: 'llenando' },
    despues: { estado: 'despachado', salida_incompleta: true },
    timestamp: '2026-09-15 15:30:45'
  },
  {
    id: 'log-tur-3',
    cooperativaId: 'coop-daule',
    usuario_id: 'usr-admin',
    usuario_nombre: 'Carlos Andrade (Presidente)',
    rol: 'admin_coop',
    accion: 'reasignacion',
    turno_id: 'tur-004',
    detalle: 'Reasignación de Unidad #1012 del Turno #4 al Turno #1 por Carlos Andrade. Motivo: Vehículo solicitado para delegación deportiva de Daule.',
    antes: { numero_turno: 4 },
    despues: { numero_turno: 1 },
    timestamp: '2026-09-15 14:15:20'
  }
];

// Notificaciones iniciales de chofer
const INITIAL_NOTIFICACIONES_CHOFER: NotificacionChofer[] = [
  {
    id: 'notif-1',
    chofer_id: 'usr-chofer',
    vehiculo_id: 'veh-15',
    mensaje: '¡Tu unidad está LISTA! Tienes salida autorizada en Turno 1.',
    tipo: 'avance_base',
    timestamp: '17:20',
    leido: false
  },
  {
    id: 'notif-2',
    chofer_id: 'usr-dueno-chofer',
    vehiculo_id: 'veh-20',
    mensaje: 'Base A te asignó recogida en Alborada 3 - 1 pax',
    tipo: 'recogida_ruta',
    timestamp: '17:22',
    leido: false
  },
  {
    id: 'notif-3',
    chofer_id: 'usr-chofer',
    vehiculo_id: 'veh-10',
    mensaje: 'Eres #1 en Pre-Base, el siguiente en avanzar a Base Real.',
    tipo: 'avance_base',
    timestamp: '17:15',
    leido: false
  }
];

const INITIAL_VEHICULOS_PENDIENTES: VehiculoPendiente[] = [
  {
    id: 'sol-01',
    cooperativaId: 'coop-daule',
    placa: 'GMD-7711',
    modelo: 'Toyota Corolla Sedan 2023',
    color: 'Blanco Ártico',
    propietario_nombre: 'Ing. Luis Briones Delgado',
    propietario_cedula: '0911223344',
    propietario_telefono: '0981122334',
    documentos_cargados: true,
    estado_revision: 'pendiente',
    observaciones: 'Vehículo nuevo con matrícula vigente. Pendiente verificar certificado de revisión técnica.',
    fecha_solicitud: '2026-09-14'
  },
  {
    id: 'sol-02',
    cooperativaId: 'coop-daule',
    placa: 'GPR-9012',
    modelo: 'Nissan Versa Sense 2022',
    color: 'Azul Noche',
    propietario_nombre: 'Dra. Elena Mora Vélez',
    propietario_cedula: '0922334455',
    propietario_telefono: '0993344556',
    documentos_cargados: true,
    estado_revision: 'aprobado',
    observaciones: 'Revisión aprobada por directiva. Se transfirió a estado en_registro para inspección física.',
    fecha_solicitud: '2026-09-13'
  }
];

const INITIAL_LOGS: LogAuditoria[] = [
  {
    id: 'log-1',
    cooperativaId: 'coop-daule',
    usuario_id: 'usr-desp-a',
    usuario_nombre: 'Wilson Mera',
    accion: 'CREAR_TURNO',
    detalle: 'Ingreso a cola FIFO Unidad 1012 en Base A Sauces. Pase directo concedido (ocupación 0/4).',
    timestamp: '2026-09-15 17:10:04',
    ip: '190.152.14.88',
    dispositivo: 'Tablet Samsung Galaxy Tab A9 (Chrome 128)'
  },
  {
    id: 'log-2',
    cooperativaId: 'coop-daule',
    usuario_id: 'usr-socio',
    usuario_nombre: 'Don Manuel Holguín',
    accion: 'BLOQUEAR_VEHICULO',
    detalle: 'Bloqueo preventivo de Unidad 1019. Motivo: Pendiente entrega de liquidación.',
    timestamp: '2026-09-15 08:30:12',
    ip: '181.198.22.45',
    dispositivo: 'Xiaomi Redmi Note 13 (App PWA Rutax)'
  }
];

const INITIAL_ALERTAS: AlertaEmergencia[] = [
  {
    id: 'alt-01',
    cooperativaId: 'coop-daule',
    vehiculo_id: 'veh-1023',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    numero_unidad: '1023',
    tipo: 'ALERTA_AMARILLA',
    mensaje: 'Congestión vehicular severa en Av. Plaza Dañín por manifestación.',
    lat: -2.1700,
    lng: -79.8910,
    timestamp: '17:28',
    atendida: false
  }
];

const INITIAL_GEOCERCAS: Geocerca[] = [
  {
    id: 'geo-base-a',
    cooperativaId: 'coop-daule',
    tipo: 'base_real',
    nombre: 'Base A Sauces 9 (Terminal)',
    lat: -2.1384,
    lng: -79.8967,
    radio_metros: 150,
    activa: true
  },
  {
    id: 'geo-prebase-a',
    cooperativaId: 'coop-daule',
    tipo: 'prebase',
    nombre: 'Pre-Base A (Gasolinera Primax Sauces)',
    lat: -2.1435,
    lng: -79.8990,
    radio_metros: 180,
    activa: true
  },
  {
    id: 'geo-base-b',
    cooperativaId: 'coop-daule',
    tipo: 'base_real',
    nombre: 'Base B Parque Centenario (Centro)',
    lat: -2.1895,
    lng: -79.8890,
    radio_metros: 150,
    activa: true
  },
  {
    id: 'geo-prebase-b',
    cooperativaId: 'coop-daule',
    tipo: 'prebase',
    nombre: 'Pre-Base B Centro (Av. Boyacá y 9 de Octubre)',
    lat: -2.1930,
    lng: -79.8910,
    radio_metros: 160,
    activa: true
  },
  {
    id: 'geo-bahia-b',
    cooperativaId: 'coop-daule',
    tipo: 'bahia_desembarque',
    nombre: 'Bahía de Desembarque Centro',
    lat: -2.1885,
    lng: -79.8880,
    radio_metros: 120,
    activa: true
  },
  {
    id: 'geo-riesgo-1',
    cooperativaId: 'coop-daule',
    tipo: 'zona_riesgo',
    nombre: 'Zona Crítica Entrada de la 8 / Perimetral',
    lat: -2.1220,
    lng: -79.9150,
    radio_metros: 400,
    activa: true,
    config: {
      horario_inicio: '20:00',
      horario_fin: '04:00',
      nivel_alerta: 'rojo',
      descripcion: 'Alta incidencia delictiva nocturna. Forzar GPS cada 3 segundos.'
    }
  },
  {
    id: 'geo-riesgo-2',
    cooperativaId: 'coop-daule',
    tipo: 'zona_riesgo',
    nombre: 'Paso Desnivel Av. Juan Tanca Marengo',
    lat: -2.1620,
    lng: -79.8980,
    radio_metros: 250,
    activa: true,
    config: {
      horario_inicio: '21:00',
      horario_fin: '05:00',
      nivel_alerta: 'amarillo',
      descripcion: 'Zona propensa a asaltos en congestión.'
    }
  }
];

const INITIAL_ALERTAS_TRACKING: AlertaTracking[] = [
  {
    id: 'alt-trk-01',
    cooperativaId: 'coop-daule',
    unidadId: 'veh-15',
    numero_unidad: '15',
    choferId: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    tipo: 'desvio_ruta',
    severidad: 'amarillo',
    mensaje: 'Unidad 15 se desvió 620m de la ruta estimada en Av. Juan Tanca Marengo',
    lat: -2.1625,
    lng: -79.8990,
    atendida: false,
    atendida_por: null,
    timestamp: 'Hace 4 min'
  },
  {
    id: 'alt-trk-02',
    cooperativaId: 'coop-daule',
    unidadId: 'veh-1012',
    numero_unidad: '1012',
    choferId: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    tipo: 'velocidad_excesiva',
    severidad: 'rojo',
    mensaje: 'Exceso de velocidad: 84 km/h en zona urbana de Sauces (Límite: 50 km/h)',
    lat: -2.1480,
    lng: -79.8965,
    atendida: false,
    atendida_por: null,
    timestamp: 'Hace 8 min'
  },
  {
    id: 'alt-trk-03',
    cooperativaId: 'coop-daule',
    unidadId: 'veh-1023',
    numero_unidad: '1023',
    choferId: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    tipo: 'entrada_zona_riesgo',
    severidad: 'rojo',
    mensaje: 'Unidad 1023 ingresó a Zona de Riesgo (Entrada de la 8) en horario nocturno crítico',
    lat: -2.1225,
    lng: -79.9145,
    atendida: true,
    atendida_por: 'Wilson Mera (Despachador)',
    timestamp: 'Hace 22 min'
  }
];

const INITIAL_TRACKING_HISTORIAL: TrackingHistorial[] = [
  {
    id: 'hist-desp-01',
    cooperativaId: 'coop-daule',
    despacho_id: 'desp-01',
    unidadId: 'veh-15',
    numero_unidad: '15',
    chofer_nombre: 'Juan Pérez Quinde',
    fecha: '2026-09-15',
    distancia_total_km: 18.4,
    duracion_min: 35,
    velocidad_max: 68,
    velocidad_promedio: 34,
    puntos: [
      { lat: -2.1384, lng: -79.8967, timestamp: Date.now() - 35 * 60000, velocidad: 0, pasajeros: 15 },
      { lat: -2.1435, lng: -79.8990, timestamp: Date.now() - 30 * 60000, velocidad: 35, pasajeros: 15 },
      { lat: -2.1550, lng: -79.8935, timestamp: Date.now() - 25 * 60000, velocidad: 48, pasajeros: 15 },
      { lat: -2.1620, lng: -79.8920, timestamp: Date.now() - 18 * 60000, velocidad: 52, pasajeros: 14 },
      { lat: -2.1700, lng: -79.8910, timestamp: Date.now() - 12 * 60000, velocidad: 38, pasajeros: 12 },
      { lat: -2.1840, lng: -79.8890, timestamp: Date.now() - 6 * 60000, velocidad: 42, pasajeros: 8 },
      { lat: -2.1895, lng: -79.8890, timestamp: Date.now() - 1 * 60000, velocidad: 0, pasajeros: 0 }
    ]
  }
];

const INITIAL_TRACKING_LIVE: Record<string, TrackingLive> = {
  'veh-15': {
    unidadId: 'veh-15',
    cooperativaId: 'coop-daule',
    numero_unidad: '15',
    placa: 'GSB-1515',
    chofer_nombre: 'Juan Pérez Quinde',
    lat: -2.1600,
    lng: -79.8925,
    velocidad: 45,
    rumbo: 185,
    timestamp: Date.now(),
    estado: 'en_ruta',
    pasajeros: 14,
    bateria_chofer: 78,
    precision_gps: 8,
    turno_id: 'tur-001',
    despacho_id: 'desp-01',
    desviado_de_ruta: false
  },
  'veh-20': {
    unidadId: 'veh-20',
    cooperativaId: 'coop-daule',
    numero_unidad: '20',
    placa: 'GSB-2020',
    chofer_nombre: 'Carlos Andrade Jr.',
    lat: -2.1450,
    lng: -79.8980,
    velocidad: 38,
    rumbo: 190,
    timestamp: Date.now() - 15000,
    estado: 'en_ruta',
    pasajeros: 15,
    bateria_chofer: 92,
    precision_gps: 6,
    turno_id: 'tur-002',
    despacho_id: 'desp-02',
    desviado_de_ruta: false
  },
  'veh-1012': {
    unidadId: 'veh-1012',
    cooperativaId: 'coop-daule',
    numero_unidad: '1012',
    placa: 'GBA-1012',
    chofer_nombre: 'Roberto Yagual',
    lat: -2.1384,
    lng: -79.8967,
    velocidad: 0,
    rumbo: 90,
    timestamp: Date.now(),
    estado: 'en_base',
    pasajeros: 6,
    bateria_chofer: 85,
    precision_gps: 40,
    turno_id: 'tur-003',
    desviado_de_ruta: false
  },
  'veh-1023': {
    unidadId: 'veh-1023',
    cooperativaId: 'coop-daule',
    numero_unidad: '1023',
    placa: 'GBA-1023',
    chofer_nombre: 'Segundo Caicedo',
    lat: -2.1750,
    lng: -79.8900,
    velocidad: 55,
    rumbo: 180,
    timestamp: Date.now() - 5000,
    estado: 'en_ruta',
    pasajeros: 15,
    bateria_chofer: 64,
    precision_gps: 10,
    turno_id: 'tur-004',
    desviado_de_ruta: false
  },
  'veh-1040': {
    unidadId: 'veh-1040',
    cooperativaId: 'coop-daule',
    numero_unidad: '1040',
    placa: 'GHY-1040',
    chofer_nombre: 'Fausto Vera',
    lat: -2.1885,
    lng: -79.8880,
    velocidad: 0,
    rumbo: 270,
    timestamp: Date.now(),
    estado: 'desembarcando',
    pasajeros: 2,
    bateria_chofer: 55,
    precision_gps: 12,
    turno_id: 'tur-014',
    desviado_de_ruta: false
  }
};

const INITIAL_CONFIG_FINANCIERA: Record<string, ConfiguracionFinancieraCoop> = {
  'coop-daule': {
    cooperativaId: 'coop-daule',
    cuota_admin_por_carrera: 0.15,
    cuota_admin_diaria_unidad: 2.50,
    fondo_auxilio_por_carrera: 0.05,
    fondo_multa_retraso_salida: 1.00,
    porcentaje_comision_chofer_defecto: 30,
    permite_gastos_sin_foto: true,
    banco_cooperativa: 'Banco Pichincha - Cta Cte',
    numero_cuenta_coop: '2100458912'
  }
};

const INITIAL_LIQUIDACIONES: LiquidacionViaje[] = [
  {
    id: 'liq-101',
    cooperativaId: 'coop-daule',
    despacho_id: 'desp-001',
    turno_id: 'tur-001',
    vehiculo_id: 'veh-15',
    numero_unidad: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    socio_id: 'usr-socio',
    fecha: new Date().toISOString().split('T')[0],
    hora_cierre: '15:40',
    ruta_nombre: 'Sauces ↔ Centro',
    pasajeros_base: 15,
    pasajeros_ruta: 0,
    pasajeros_totales: 15,
    tarifa_unitaria: 0.50,
    recaudacion_bruta: 7.50,
    monto_efectivo: 6.50,
    monto_digital: 1.00,
    cuota_administracion_coop: 0.15,
    fondo_auxilio_social: 0.05,
    gastos_carrera: 0,
    recaudacion_neta: 7.30,
    pago_chofer_estimado: 2.19,
    rendimiento_socio_estimado: 5.11,
    estado: 'liquidado'
  },
  {
    id: 'liq-102',
    cooperativaId: 'coop-daule',
    despacho_id: 'desp-002',
    turno_id: 'tur-002',
    vehiculo_id: 'veh-1012',
    numero_unidad: '1012',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Roberto Yagual',
    socio_id: 'usr-socio',
    fecha: new Date().toISOString().split('T')[0],
    hora_cierre: '16:20',
    ruta_nombre: 'Sauces ↔ Centro',
    pasajeros_base: 14,
    pasajeros_ruta: 1,
    pasajeros_totales: 15,
    tarifa_unitaria: 0.50,
    recaudacion_bruta: 7.50,
    monto_efectivo: 7.50,
    monto_digital: 0,
    cuota_administracion_coop: 0.15,
    fondo_auxilio_social: 0.05,
    gastos_carrera: 0.50,
    recaudacion_neta: 6.80,
    pago_chofer_estimado: 2.04,
    rendimiento_socio_estimado: 4.76,
    estado: 'liquidado'
  }
];

const INITIAL_ARQUEOS: ArqueoTurnoChofer[] = [];
const INITIAL_GASTOS: GastoTurno[] = [];

const INITIAL_PROFORMAS: ProformaPago[] = [
  {
    id: 'prof-000',
    cooperativaId: 'coop-daule',
    numero_proforma: 'PRO-2026-000',
    fecha_emision: '2026-08-15',
    fecha_vencimiento: '2026-08-22',
    items: [
      { tipo: 'renovacion', numero_unidad: 'GENERAL', placa: 'FLOTA-32', descripcion: 'Renovación mensual 32 unidades - Plan Pro', precio_unitario: 15, cantidad: 32, subtotal: 480 }
    ],
    subtotal: 480,
    impuestos: 0,
    total: 480,
    estado: 'pagada',
    monto_pagado: 480,
    monto_pendiente: 0,
    periodo_desde: '2026-08-15',
    periodo_hasta: '2026-09-15',
    comprobantes: [
      {
        id: 'comp-000',
        monto: 480,
        metodo: 'transferencia',
        banco: 'Pichincha',
        numero_operacion: '001234567890',
        comprobante_url: 'https://example.com/comprobante1.pdf',
        subido_por: 'José Zambrano',
        fecha_subida: '2026-08-15T10:00:00Z',
        estado: 'aprobado',
        revisado_por: 'SuperAdmin',
        motivo_rechazo: null
      }
    ],
    recordatorios_enviados: [],
    creada_por: 'usr-admin',
    fecha_creacion: '2026-08-15T08:00:00Z'
  },
  {
    id: 'prof-001',
    cooperativaId: 'coop-daule',
    numero_proforma: 'PRO-2026-001',
    fecha_emision: '2026-09-16',
    fecha_vencimiento: '2026-09-23',
    items: [
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-1023', numero_unidad: '1023', placa: 'GXY-1234', descripcion: 'Registro Unidad 1023 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-1024', numero_unidad: '1024', placa: 'ABC-5678', descripcion: 'Registro Unidad 1024 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-1025', numero_unidad: '1025', placa: 'DEF-9012', descripcion: 'Registro Unidad 1025 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-1026', numero_unidad: '1026', placa: 'GHI-3456', descripcion: 'Registro Unidad 1026 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-1027', numero_unidad: '1027', placa: 'JKL-7890', descripcion: 'Registro Unidad 1027 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 }
    ],
    subtotal: 75,
    impuestos: 0,
    total: 75,
    estado: 'pendiente_revision',
    monto_pagado: 0,
    monto_pendiente: 75,
    periodo_desde: '2026-09-16',
    periodo_hasta: '2026-10-15',
    comprobantes: [
      {
        id: 'comp-001',
        monto: 75,
        metodo: 'transferencia',
        banco: 'Pichincha',
        numero_operacion: '001234567890',
        comprobante_url: 'https://example.com/comprobante2.pdf',
        subido_por: 'José Zambrano',
        fecha_subida: '2026-09-16T14:32:00Z',
        estado: 'pendiente_revision',
        revisado_por: null,
        motivo_rechazo: null
      }
    ],
    recordatorios_enviados: [{ tipo: 'creada', fecha: '2026-09-16' }],
    creada_por: 'usr-admin',
    fecha_creacion: '2026-09-16T08:00:00Z'
  },
  {
    id: 'prof-002',
    cooperativaId: 'coop-daule',
    numero_proforma: 'PRO-2026-002',
    fecha_emision: '2026-08-01',
    fecha_vencimiento: '2026-08-08',
    items: [
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-990', numero_unidad: '990', placa: 'XYZ-111', descripcion: 'Registro Unidad 990 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-991', numero_unidad: '991', placa: 'XYZ-222', descripcion: 'Registro Unidad 991 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-992', numero_unidad: '992', placa: 'XYZ-333', descripcion: 'Registro Unidad 992 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 },
      { tipo: 'registro_vehiculo', vehiculo_id: 'veh-993', numero_unidad: '993', placa: 'XYZ-444', descripcion: 'Registro Unidad 993 - Plan Pro', precio_unitario: 15, cantidad: 1, subtotal: 15 }
    ],
    subtotal: 60,
    impuestos: 0,
    total: 60,
    estado: 'vencida',
    monto_pagado: 0,
    monto_pendiente: 60,
    periodo_desde: '2026-08-01',
    periodo_hasta: '2026-08-30',
    comprobantes: [],
    recordatorios_enviados: [{ tipo: 'vencida', fecha: '2026-08-09' }],
    creada_por: 'usr-admin',
    fecha_creacion: '2026-08-01T08:00:00Z'
  }
];

const INITIAL_CHAT_BASES: ChatBases = {
  id: 'chat-coop-daule',
  cooperativaId: 'coop-daule',
  tipo: 'general',
  participantes: ['usr-desp-a', 'usr-desp-b', 'usr-admin'],
  mensajes: [
    { id: 'm1', de: { usuario_id: 'usr-desp-b', rol: 'despachador', nombre: 'María (Base B)', base: 'B' }, texto: 'Unidad 15 sale con 12 pax, llega aprox 10:45', tipo: 'unidad_en_camino', timestamp: new Date(Date.now() - 30*60000).toISOString(), leido_por: [] },
    { id: 'm2', de: { usuario_id: 'usr-desp-a', rol: 'despachador', nombre: 'Wilson (Base A)', base: 'A' }, texto: 'Recibido, tengo espacio en cola', tipo: 'texto', timestamp: new Date(Date.now() - 25*60000).toISOString(), leido_por: [] },
    { id: 'm3', de: { usuario_id: 'usr-desp-b', rol: 'despachador', nombre: 'María (Base B)', base: 'B' }, texto: '¿Puedes recibir Unidad 22 también? Viene con 8 pax', tipo: 'texto', timestamp: new Date(Date.now() - 15*60000).toISOString(), leido_por: [] },
    { id: 'm4', de: { usuario_id: 'usr-desp-a', rol: 'despachador', nombre: 'Wilson (Base A)', base: 'A' }, texto: 'Sí, hay espacio en pre-base', tipo: 'texto', timestamp: new Date(Date.now() - 10*60000).toISOString(), leido_por: [] }
  ]
};

const INITIAL_COORDINACION: CoordinacionBases = {
  id: 'coord-coop-daule',
  cooperativaId: 'coop-daule',
  base_a_para_base_b: {
    unidades_en_camino_hacia_b: [
      { unidadId: 'v15', placa: 'GXY-1234', chofer_nombre: 'Pedro Pérez', pasajeros: 15, hora_salida: '10:15', eta_min: 8 }
    ],
    cola_base_a_resumen: { ocupados: 3, capacidad: 4, proximo_despacho_estimado: '10:45' },
    alertas_activas_base_a: []
  },
  base_b_para_base_a: {
    unidades_en_camino_hacia_a: [
      { unidadId: 'v20', placa: 'ABC-5678', chofer_nombre: 'Carlos Gómez', pasajeros: 12, hora_salida: '10:20', eta_min: 12 }
    ],
    cola_base_b_resumen: { ocupados: 2, capacidad: 4, proximo_despacho_estimado: '10:50' },
    alertas_activas_base_b: [
      { tipo: 'retraso', mensaje: 'Llanta pinchada Unidad 10, retraso 5min', timestamp: new Date().toISOString() }
    ]
  },
  ultima_actualizacion: new Date().toISOString()
};

// Claves de LocalStorage
const STORAGE_KEYS = {
  COOPERATIVAS: 'rutax_cooperativas_v1',
  BASES: 'rutax_bases_v1',
  USUARIOS: 'rutax_usuarios_v1',
  VEHICULOS: 'rutax_vehiculos_v1',
  TURNOS: 'rutax_turnos_v1',
  VEHICULOS_PENDIENTES: 'rutax_veh_pendientes_v1',
  LOGS: 'rutax_logs_v1',
  ALERTAS: 'rutax_alertas_v1',
  CURRENT_USER: 'rutax_current_user_v1',
  CURRENT_COOP: 'rutax_current_coop_v1',
  DESPACHOS: 'rutax_despachos_v1',
  SOLICITUDES_PASAJEROS: 'rutax_solicitudes_pasajeros_v1',
  LOGS_TURNOS: 'rutax_logs_turnos_v1',
  NOTIFICACIONES_CHOFER: 'rutax_notif_chofer_v1',
  TRACKING_LIVE: 'rutax_tracking_live_v1',
  GEOCERCAS: 'rutax_geocercas_v1',
  TRACKING_HISTORIAL: 'rutax_tracking_hist_v1',
  ALERTAS_TRACKING: 'rutax_alertas_tracking_v1',
  LIQUIDACIONES: 'rutax_liquidaciones_v1',
  ARQUEOS: 'rutax_arqueos_v1',
  GASTOS: 'rutax_gastos_v1',
  CONFIG_FINANCIERA: 'rutax_config_financiera_v1',
  PASAJEROS_FRECUENTES: 'rutax_pasajeros_frecuentes_v1',
  RESERVAS: 'rutax_reservas_v1',
  PUNTOS_RECOGIDA_FRECUENTES: 'rutax_puntos_recogida_frecuentes_v1',
  WHATSAPP_LOGS: 'rutax_whatsapp_logs_v1',
  CONFIG_PASAJEROS: 'rutax_config_pasajeros_v1',
  PAGOS_EMPRESAS: 'rutax_pagos_empresas_v1',
  ALERTAS_SEGURIDAD: 'rutax_alertas_seguridad_v1',
  NOTIFICACIONES_CONDUCTORES: 'rutax_notif_conductores_v1',
  ZONAS_RIESGO: 'rutax_zonas_riesgo_v1',
  HUELLAS_REGISTRADAS: 'rutax_huellas_v1',
  LOGS_SEGURIDAD: 'rutax_logs_seguridad_v1',
  CONFIG_SEGURIDAD: 'rutax_config_seguridad_v1',
  PLANES: 'rutax_planes_v1',
  SUSCRIPCIONES: 'rutax_suscripciones_v1',
  COMPROBANTES: 'rutax_comprobantes_v1',
  METRICAS_GLOBALES: 'rutax_metricas_globales_v1',
  LOGS_SUPERADMIN: 'rutax_logs_superadmin_v1',
  CONFIG_SUPERADMIN: 'rutax_config_superadmin_v1',
  PROFORMAS_PAGO: 'rutax_proformas_pago_v1',
  CHAT_BASES: 'rutax_chat_bases_v1',
  COORDINACION_BASES: 'rutax_coordinacion_bases_v1',
  MENSAJES_CONDUCTOR_BASE: 'rutax_mensajes_cond_base_v1',
  CLIENTES: 'rutax_clientes_v1',
  RESERVAS_CLIENTES: 'rutax_reservas_clientes_v1',
  NOTIFICACIONES_INTERNAS_COOP: 'rutax_notif_internas_coop_v1',
  HISTORICO_PAGOS_ARCHIVADOS: 'rutax_hist_pagos_archivados_v1'
};

const INITIAL_MENSAJES_CONDUCTOR_BASE: MensajeConductorBase[] = [
  {
    id: 'msg-cond-1',
    cooperativaId: 'coop-daule',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Pérez',
    unidad_numero: '15',
    placa: 'GXY-1234',
    destinatario_base: 'base-a',
    destinatario_nombre: 'Base A Sauces',
    texto: 'Llego en 5 min, tráfico moderado en Av. Las Aguas.',
    tipo: 'rapido',
    respuesta_base: 'Copiado Unidad 15. Andén 2 libre para tu ingreso.',
    respondido_por: 'Carlos Despachador',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    timestamp_respuesta: new Date(Date.now() - 10 * 60000).toISOString(),
    leido: true
  },
  {
    id: 'msg-cond-2',
    cooperativaId: 'coop-daule',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Pérez',
    unidad_numero: '15',
    placa: 'GXY-1234',
    destinatario_base: 'base-a',
    destinatario_nombre: 'Base A Sauces',
    texto: 'Vía despejada, con 8 pasajeros a bordo.',
    tipo: 'libre',
    respuesta_base: null,
    respondido_por: null,
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    timestamp_respuesta: null,
    leido: false
  }
];

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-001',
    cooperativaId: 'coop-daule',
    nombre: 'María Torres Alarcón',
    telefono: '0998765432',
    email: 'maria.torres@gmail.com',
    tipo: 'registrado',
    modo_pago_preferido: 'transferencia',
    puntos_recogida: [
      {
        id: 'pt-1',
        nombre: 'Casa Sauces 9',
        lat: -2.1390,
        lng: -79.8970,
        referencia: 'Mz 120 Villa 4, frente al parque',
        es_preferido: true,
        veces_usado: 14
      },
      {
        id: 'pt-2',
        nombre: 'Trabajo 9 de Octubre',
        lat: -2.1905,
        lng: -79.8850,
        referencia: 'Edificio San Francisco 300',
        es_preferido: false,
        veces_usado: 8
      }
    ],
    total_viajes: 22,
    fecha_registro: '2024-01-15'
  },
  {
    id: 'cli-002',
    cooperativaId: 'coop-daule',
    nombre: 'Carlos Gómez Intriago',
    telefono: '0981234567',
    email: 'carlos.gomez@gmail.com',
    tipo: 'registrado',
    modo_pago_preferido: 'efectivo',
    puntos_recogida: [
      {
        id: 'pt-3',
        nombre: 'Universidad Católica',
        lat: -2.1812,
        lng: -79.8995,
        referencia: 'Puerta 2 peatonal Av. Carlos Julio',
        es_preferido: true,
        veces_usado: 9
      }
    ],
    total_viajes: 9,
    fecha_registro: '2024-02-10'
  },
  {
    id: 'cli-003',
    cooperativaId: 'coop-daule',
    nombre: 'Pasajero Ocasional Sauces',
    telefono: '0979988776',
    tipo: 'invitado',
    modo_pago_preferido: 'efectivo',
    puntos_recogida: [],
    total_viajes: 1,
    fecha_registro: '2024-05-01'
  }
];

const INITIAL_RESERVAS_CLIENTES: ReservaCliente[] = [
  {
    id: 'res-cli-001',
    cooperativaId: 'coop-daule',
    cliente_id: 'cli-001',
    cliente_nombre: 'María Torres Alarcón',
    cliente_telefono: '0998765432',
    cliente_tipo: 'registrado',
    fecha: new Date().toISOString().split('T')[0],
    hora_deseada: '18:30',
    hora_limite: '18:45',
    punto_recogida: {
      nombre: 'Casa Sauces 9',
      lat: -2.1390,
      lng: -79.8970,
      referencia: 'Mz 120 Villa 4, frente al parque'
    },
    destino_es_base: true,
    base_destino_id: 'base-b',
    destino_nombre: 'Base B Centro (Parque Centenario)',
    modo_pago: 'transferencia',
    monto: 1.50,
    transferencia_banco: 'Pichincha',
    transferencia_numero_operacion: 'TRF-9821734',
    transferencia_comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    transferencia_estado: 'aprobado',
    estado: 'asignada',
    turno_asignado_id: 'tur-003',
    unidad_asignada_id: 'veh-15',
    vehiculo_asignado: {
      numero_unidad: '15',
      placa: 'GXY-1234',
      modelo: 'Hyundai County',
      color: 'Blanco/Verde',
      chofer_nombre: 'Pedro Pérez',
      tiempo_estimado_llegada_min: 7,
      ubicacion_en_vivo: { lat: -2.1410, lng: -79.8955 }
    },
    ubicacion_compartida_activa: true,
    timestamp_creacion: new Date(Date.now() - 25 * 60000).toISOString(),
    timestamp_asignacion: new Date(Date.now() - 20 * 60000).toISOString()
  },
  {
    id: 'res-cli-002',
    cooperativaId: 'coop-daule',
    cliente_id: 'cli-003',
    cliente_nombre: 'Pasajero Ocasional Sauces',
    cliente_telefono: '0979988776',
    cliente_tipo: 'invitado',
    fecha: new Date().toISOString().split('T')[0],
    hora_deseada: '19:00',
    hora_limite: '19:15',
    punto_recogida: {
      nombre: 'Parada Alborada 7ma Etapa',
      lat: -2.1480,
      lng: -79.8980,
      referencia: 'Frente a Farmacias SanaSana'
    },
    destino_es_base: true,
    base_destino_id: 'base-a',
    destino_nombre: 'Base A Sauces (Sauces 9)',
    modo_pago: 'efectivo',
    monto: 1.50,
    transferencia_estado: 'pendiente',
    estado: 'pendiente',
    vehiculo_asignado: null,
    timestamp_creacion: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: 'res-cli-003',
    cooperativaId: 'coop-daule',
    cliente_id: 'usr-cliente',
    cliente_nombre: 'María Fernanda González',
    cliente_telefono: '0987654321',
    cliente_tipo: 'registrado',
    fecha: new Date().toISOString().split('T')[0],
    hora_deseada: '17:45',
    hora_limite: '18:00',
    punto_recogida: {
      nombre: 'Parada Sauces 9 (Av. Gabriel Roldós)',
      lat: -2.1384,
      lng: -79.8967,
      referencia: 'Frente a Farmacia Fybeca'
    },
    destino_es_base: true,
    base_destino_id: 'base-b',
    destino_nombre: 'Base B Centro (Parque Centenario)',
    modo_pago: 'transferencia',
    monto: 1.50,
    transferencia_banco: 'Pichincha',
    transferencia_numero_operacion: 'TRF-554433',
    transferencia_estado: 'aprobado',
    estado: 'asignada',
    turno_asignado_id: 'tur-001',
    unidad_asignada_id: 'veh-1023',
    vehiculo_asignado: {
      numero_unidad: '1023',
      placa: 'GXY-1234',
      modelo: 'Toyota Hiace',
      color: 'Blanco',
      chofer_nombre: 'Juan Pérez Quinde',
      tiempo_estimado_llegada_min: 5,
      ubicacion_en_vivo: { lat: -2.1360, lng: -79.8975 }
    },
    ubicacion_compartida_activa: true,
    timestamp_creacion: new Date(Date.now() - 12 * 60000).toISOString(),
    timestamp_asignacion: new Date(Date.now() - 8 * 60000).toISOString()
  }
];

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error saving ${key} to storage:`, err);
  }
}

// Clase Singleton de Estado Reactivo
class RutaxStore {
  private listeners: Set<() => void> = new Set();

  public cooperativas: Cooperativa[] = loadStorage(STORAGE_KEYS.COOPERATIVAS, INITIAL_COOPERATIVAS);
  public bases: Base[] = loadStorage(STORAGE_KEYS.BASES, INITIAL_BASES);
  public usuarios: Usuario[] = loadStorage(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  public vehiculos: Vehiculo[] = loadStorage(STORAGE_KEYS.VEHICULOS, INITIAL_VEHICULOS);
  public turnos: Turno[] = loadStorage(STORAGE_KEYS.TURNOS, INITIAL_TURNOS);
  public vehiculosPendientes: VehiculoPendiente[] = loadStorage(STORAGE_KEYS.VEHICULOS_PENDIENTES, INITIAL_VEHICULOS_PENDIENTES);
  public logs: LogAuditoria[] = loadStorage(STORAGE_KEYS.LOGS, INITIAL_LOGS);
  public alertas: AlertaEmergencia[] = loadStorage(STORAGE_KEYS.ALERTAS, INITIAL_ALERTAS);
  public despachos: Despacho[] = loadStorage(STORAGE_KEYS.DESPACHOS, INITIAL_DESPACHOS);
  public solicitudesPasajeros: SolicitudPasajeroRuta[] = loadStorage(STORAGE_KEYS.SOLICITUDES_PASAJEROS, INITIAL_SOLICITUDES_PASAJEROS);
  public logsTurnos: LogAuditoriaTurno[] = loadStorage(STORAGE_KEYS.LOGS_TURNOS, INITIAL_LOGS_TURNOS);
  public notificacionesChofer: NotificacionChofer[] = loadStorage(STORAGE_KEYS.NOTIFICACIONES_CHOFER, INITIAL_NOTIFICACIONES_CHOFER);
  public trackingLive: Record<string, TrackingLive> = loadStorage(STORAGE_KEYS.TRACKING_LIVE, INITIAL_TRACKING_LIVE);
  public geocercas: Geocerca[] = loadStorage(STORAGE_KEYS.GEOCERCAS, INITIAL_GEOCERCAS);
  public trackingHistorial: TrackingHistorial[] = loadStorage(STORAGE_KEYS.TRACKING_HISTORIAL, INITIAL_TRACKING_HISTORIAL);
  public alertasTracking: AlertaTracking[] = loadStorage(STORAGE_KEYS.ALERTAS_TRACKING, INITIAL_ALERTAS_TRACKING);
  public liquidaciones: LiquidacionViaje[] = loadStorage(STORAGE_KEYS.LIQUIDACIONES, INITIAL_LIQUIDACIONES);
  public arqueos: ArqueoTurnoChofer[] = loadStorage(STORAGE_KEYS.ARQUEOS, INITIAL_ARQUEOS);
  public gastos: GastoTurno[] = loadStorage(STORAGE_KEYS.GASTOS, INITIAL_GASTOS);
  public configFinanciera: Record<string, ConfiguracionFinancieraCoop> = loadStorage(STORAGE_KEYS.CONFIG_FINANCIERA, INITIAL_CONFIG_FINANCIERA);

  // Módulo de Pasajeros Frecuentes, Reservas y Notificaciones
  public pasajerosFrecuentes: PasajeroFrecuente[] = loadStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, INITIAL_PASAJEROS_FRECUENTES);
  public reservas: Reserva[] = loadStorage(STORAGE_KEYS.RESERVAS, INITIAL_RESERVAS);
  public puntosRecogidaFrecuentes: PuntoRecogidaFrecuente[] = loadStorage(STORAGE_KEYS.PUNTOS_RECOGIDA_FRECUENTES, INITIAL_PUNTOS_RECOGIDA_FRECUENTES);
  public whatsappLogs: NotificacionWhatsAppLog[] = loadStorage(STORAGE_KEYS.WHATSAPP_LOGS, INITIAL_WHATSAPP_LOGS);
  public configPasajeros: Record<string, ConfiguracionPasajeros> = loadStorage(STORAGE_KEYS.CONFIG_PASAJEROS, { 'coop-daule': CONFIG_PASAJEROS_DEFAULT });
  public pagosEmpresas: PagoCreditoEmpresa[] = loadStorage(STORAGE_KEYS.PAGOS_EMPRESAS, []);

  // Módulo de Seguridad SOS, Antirrobo Biométrico, Zonas de Riesgo y Notificaciones Base-Conductores
  public alertasSeguridad: AlertaSeguridad[] = loadStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, INITIAL_ALERTAS_SEGURIDAD);
  public notificacionesConductores: NotificacionBaseConductores[] = loadStorage(STORAGE_KEYS.NOTIFICACIONES_CONDUCTORES, INITIAL_NOTIFICACIONES_BASE_CONDUCTORES);
  public zonasRiesgo: ZonaRiesgo[] = loadStorage(STORAGE_KEYS.ZONAS_RIESGO, INITIAL_ZONAS_RIESGO);
  public huellasRegistradas: HuellasRegistradas[] = loadStorage(STORAGE_KEYS.HUELLAS_REGISTRADAS, INITIAL_HUELLAS);
  public logsSeguridad: LogSeguridad[] = loadStorage(STORAGE_KEYS.LOGS_SEGURIDAD, INITIAL_LOGS_SEGURIDAD);
  public configSeguridad: Record<string, ConfiguracionSeguridadCoop> = loadStorage(STORAGE_KEYS.CONFIG_SEGURIDAD, { 'coop-daule': CONFIG_SEGURIDAD_DEFAULT });

  // Módulo SuperAdmin de Cobros y Gestión Multi-Cooperativa
  public planes: PlanSuscripcion[] = loadStorage(STORAGE_KEYS.PLANES, INITIAL_PLANES);
  public suscripciones: SuscripcionCooperativa[] = loadStorage(STORAGE_KEYS.SUSCRIPCIONES, INITIAL_SUSCRIPCIONES);
  public comprobantesPago: ComprobantePago[] = loadStorage(STORAGE_KEYS.COMPROBANTES, INITIAL_COMPROBANTES);
  public historicoPagosArchivados: HistoricoPagoArchivado[] = loadStorage(STORAGE_KEYS.HISTORICO_PAGOS_ARCHIVADOS, []);
  public notificacionesInternasCoop: NotificacionInternaCooperativa[] = loadStorage(STORAGE_KEYS.NOTIFICACIONES_INTERNAS_COOP, INITIAL_NOTIFICACIONES_INTERNAS);
  public metricasGlobales: MetricasGlobales = loadStorage(STORAGE_KEYS.METRICAS_GLOBALES, INITIAL_METRICAS_GLOBALES);
  public logsSuperAdmin: LogSuperAdmin[] = loadStorage(STORAGE_KEYS.LOGS_SUPERADMIN, INITIAL_LOGS_SUPERADMIN);
  public configSuperAdmin: ConfiguracionSuperAdmin = loadStorage(STORAGE_KEYS.CONFIG_SUPERADMIN, INITIAL_CONFIG_SUPERADMIN);
  public proformasPago: ProformaPago[] = loadStorage(STORAGE_KEYS.PROFORMAS_PAGO, INITIAL_PROFORMAS);
  public chatBases: Record<string, ChatBases> = loadStorage(STORAGE_KEYS.CHAT_BASES, { 'coop-daule': INITIAL_CHAT_BASES });
  public coordinacionBases: Record<string, CoordinacionBases> = loadStorage(STORAGE_KEYS.COORDINACION_BASES, { 'coop-daule': INITIAL_COORDINACION });

  // Módulo de Comunicación Conductor <-> Base, Clientes y Reservas
  public mensajesConductorBase: MensajeConductorBase[] = loadStorage(STORAGE_KEYS.MENSAJES_CONDUCTOR_BASE, INITIAL_MENSAJES_CONDUCTOR_BASE);
  public clientes: Cliente[] = loadStorage(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
  public reservasClientes: ReservaCliente[] = loadStorage(STORAGE_KEYS.RESERVAS_CLIENTES, INITIAL_RESERVAS_CLIENTES);

  public currentCoopId: string = loadStorage(STORAGE_KEYS.CURRENT_COOP, 'coop-daule');
  public currentUserId: string = loadStorage(STORAGE_KEYS.CURRENT_USER, 'usr-admin');

  constructor() {
    // Deduplicate vehicles and pending vehicles on startup
    if (this.vehiculos && this.vehiculos.length > 0) {
      const uniqueVehiculos: Vehiculo[] = [];
      const seenVehiculos = new Set<string>();
      for (const v of this.vehiculos) {
        if (v && v.id && !seenVehiculos.has(v.id)) {
          seenVehiculos.add(v.id);
          uniqueVehiculos.push(v);
        }
      }
      this.vehiculos = uniqueVehiculos;
    }

    if (this.vehiculosPendientes && this.vehiculosPendientes.length > 0) {
      const uniquePendientes: VehiculoPendiente[] = [];
      const seenPendientes = new Set<string>();
      for (const p of this.vehiculosPendientes) {
        if (p && p.id && !seenPendientes.has(p.id)) {
          seenPendientes.add(p.id);
          uniquePendientes.push(p);
        }
      }
      this.vehiculosPendientes = uniquePendientes;
    }

    // Garantizar que la cola cuente con los turnos completos y colecciones FIFO
    if (this.turnos.length < 10) {
      this.turnos = [...INITIAL_TURNOS];
    }
    if (this.vehiculos.length < 10) {
      this.vehiculos = [...INITIAL_VEHICULOS];
    }
    const tieneGNZ = this.vehiculos.some(v => v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === 'GNZ0982');
    if (!tieneGNZ && this.vehiculos.length > 0) {
      this.vehiculos[0].placa = 'GNZ-0982';
      saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
    }
    if (!this.mensajesConductorBase || this.mensajesConductorBase.length === 0) {
      this.mensajesConductorBase = [...INITIAL_MENSAJES_CONDUCTOR_BASE];
    }
    if (!this.clientes || this.clientes.length === 0) {
      this.clientes = [...INITIAL_CLIENTES];
    }
    if (!this.reservasClientes || this.reservasClientes.length === 0) {
      this.reservasClientes = [...INITIAL_RESERVAS_CLIENTES];
    }
    if (!this.despachos || this.despachos.length === 0) {
      this.despachos = [...INITIAL_DESPACHOS];
    }
    if (!this.solicitudesPasajeros || this.solicitudesPasajeros.length === 0) {
      this.solicitudesPasajeros = [...INITIAL_SOLICITUDES_PASAJEROS];
    }
    if (!this.logsTurnos || this.logsTurnos.length === 0) {
      this.logsTurnos = [...INITIAL_LOGS_TURNOS];
    }
    if (!this.notificacionesChofer || this.notificacionesChofer.length === 0) {
      this.notificacionesChofer = [...INITIAL_NOTIFICACIONES_CHOFER];
    }
    if (!this.geocercas || this.geocercas.length === 0) {
      this.geocercas = [...INITIAL_GEOCERCAS];
    }
    if (!this.alertasTracking || this.alertasTracking.length === 0) {
      this.alertasTracking = [...INITIAL_ALERTAS_TRACKING];
    }
    if (!this.trackingHistorial || this.trackingHistorial.length === 0) {
      this.trackingHistorial = [...INITIAL_TRACKING_HISTORIAL];
    }
    if (!this.trackingLive || Object.keys(this.trackingLive).length === 0) {
      this.trackingLive = { ...INITIAL_TRACKING_LIVE };
    }
    if (!this.pasajerosFrecuentes || this.pasajerosFrecuentes.length === 0) {
      this.pasajerosFrecuentes = [...INITIAL_PASAJEROS_FRECUENTES];
    }
    if (!this.reservas || this.reservas.length === 0) {
      this.reservas = [...INITIAL_RESERVAS];
    }
    if (!this.puntosRecogidaFrecuentes || this.puntosRecogidaFrecuentes.length === 0) {
      this.puntosRecogidaFrecuentes = [...INITIAL_PUNTOS_RECOGIDA_FRECUENTES];
    }
    if (!this.whatsappLogs || this.whatsappLogs.length === 0) {
      this.whatsappLogs = [...INITIAL_WHATSAPP_LOGS];
    }
    if (!this.configPasajeros['coop-daule']) {
      this.configPasajeros['coop-daule'] = { ...CONFIG_PASAJEROS_DEFAULT };
    }
    if (!this.alertasSeguridad || this.alertasSeguridad.length === 0) {
      this.alertasSeguridad = [...INITIAL_ALERTAS_SEGURIDAD];
    }
    if (!this.notificacionesConductores || this.notificacionesConductores.length === 0) {
      this.notificacionesConductores = [...INITIAL_NOTIFICACIONES_BASE_CONDUCTORES];
    }
    if (!this.zonasRiesgo || this.zonasRiesgo.length === 0) {
      this.zonasRiesgo = [...INITIAL_ZONAS_RIESGO];
    }
    if (!this.huellasRegistradas || this.huellasRegistradas.length === 0) {
      this.huellasRegistradas = [...INITIAL_HUELLAS];
    }
    if (!this.logsSeguridad || this.logsSeguridad.length === 0) {
      this.logsSeguridad = [...INITIAL_LOGS_SEGURIDAD];
    }
    if (!this.configSeguridad['coop-daule']) {
      this.configSeguridad['coop-daule'] = { ...CONFIG_SEGURIDAD_DEFAULT };
    }

    // Inicializar colecciones de SuperAdmin si están vacías
    if (!this.planes || this.planes.length === 0) {
      this.planes = [...INITIAL_PLANES];
    }
    if (!this.suscripciones || this.suscripciones.length === 0) {
      this.suscripciones = [...INITIAL_SUSCRIPCIONES];
    }
    if (!this.comprobantesPago || this.comprobantesPago.length === 0) {
      this.comprobantesPago = [...INITIAL_COMPROBANTES];
    }
    if (!this.logsSuperAdmin || this.logsSuperAdmin.length === 0) {
      this.logsSuperAdmin = [...INITIAL_LOGS_SUPERADMIN];
    }
    if (!this.configSuperAdmin || !this.configSuperAdmin.id) {
      this.configSuperAdmin = { ...INITIAL_CONFIG_SUPERADMIN };
    }

    // Actualizar métricas globales iniciales
    this.calcularMetricasGlobales();

    // Ejecutar chequeo de bloqueo progresivo
    this.ejecutarBloqueoProgresivo(false);

    // Iniciar simulación de GPS cada 30 segundos
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        this.simulateLiveGpsPings();
      }, 30000);
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public notify(): void {
    saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
    saveStorage(STORAGE_KEYS.BASES, this.bases);
    saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
    saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
    saveStorage(STORAGE_KEYS.TURNOS, this.turnos);
    saveStorage(STORAGE_KEYS.VEHICULOS_PENDIENTES, this.vehiculosPendientes);
    saveStorage(STORAGE_KEYS.LOGS, this.logs);
    saveStorage(STORAGE_KEYS.ALERTAS, this.alertas);
    saveStorage(STORAGE_KEYS.CURRENT_COOP, this.currentCoopId);
    saveStorage(STORAGE_KEYS.CURRENT_USER, this.currentUserId);
    saveStorage(STORAGE_KEYS.DESPACHOS, this.despachos);
    saveStorage(STORAGE_KEYS.SOLICITUDES_PASAJEROS, this.solicitudesPasajeros);
    saveStorage(STORAGE_KEYS.LOGS_TURNOS, this.logsTurnos);
    saveStorage(STORAGE_KEYS.NOTIFICACIONES_CHOFER, this.notificacionesChofer);
    saveStorage(STORAGE_KEYS.TRACKING_LIVE, this.trackingLive);
    saveStorage(STORAGE_KEYS.GEOCERCAS, this.geocercas);
    saveStorage(STORAGE_KEYS.TRACKING_HISTORIAL, this.trackingHistorial);
    saveStorage(STORAGE_KEYS.ALERTAS_TRACKING, this.alertasTracking);
    saveStorage(STORAGE_KEYS.LIQUIDACIONES, this.liquidaciones);
    saveStorage(STORAGE_KEYS.ARQUEOS, this.arqueos);
    saveStorage(STORAGE_KEYS.GASTOS, this.gastos);
    saveStorage(STORAGE_KEYS.CONFIG_FINANCIERA, this.configFinanciera);
    saveStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, this.pasajerosFrecuentes);
    saveStorage(STORAGE_KEYS.RESERVAS, this.reservas);
    saveStorage(STORAGE_KEYS.PUNTOS_RECOGIDA_FRECUENTES, this.puntosRecogidaFrecuentes);
    saveStorage(STORAGE_KEYS.WHATSAPP_LOGS, this.whatsappLogs);
    saveStorage(STORAGE_KEYS.CONFIG_PASAJEROS, this.configPasajeros);
    saveStorage(STORAGE_KEYS.PAGOS_EMPRESAS, this.pagosEmpresas);
    saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);
    saveStorage(STORAGE_KEYS.NOTIFICACIONES_CONDUCTORES, this.notificacionesConductores);
    saveStorage(STORAGE_KEYS.ZONAS_RIESGO, this.zonasRiesgo);
    saveStorage(STORAGE_KEYS.HUELLAS_REGISTRADAS, this.huellasRegistradas);
    saveStorage(STORAGE_KEYS.LOGS_SEGURIDAD, this.logsSeguridad);
    saveStorage(STORAGE_KEYS.CONFIG_SEGURIDAD, this.configSeguridad);

    this.listeners.forEach(l => l());
  }

  // Current session helpers
  public getCurrentUser(): Usuario | undefined {
    return this.usuarios.find(u => u.uid === this.currentUserId);
  }

  public getCurrentCoop(): Cooperativa | undefined {
    return this.cooperativas.find(c => c.id === this.currentCoopId);
  }

  public switchUser(uid: string): void {
    const usr = this.usuarios.find(u => u.uid === uid);
    if (usr) {
      this.currentUserId = uid;
      saveStorage(STORAGE_KEYS.CURRENT_USER, uid);
      if (usr.cooperativaId) {
        this.currentCoopId = usr.cooperativaId;
        saveStorage(STORAGE_KEYS.CURRENT_COOP, usr.cooperativaId);
      }
      this.notify();
    }
  }

  public logout(): void {
    const chofer = this.getCurrentUser();
    if (chofer) {
      const vehiculo = this.vehiculos.find(v => v.chofer_titular_id === chofer.uid);
      if (vehiculo && vehiculo.sos_activo) {
        vehiculo.sos_activo = false;
        saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
      }
    }

    this.currentUserId = '';
    saveStorage(STORAGE_KEYS.CURRENT_USER, '');
    this.notify();
  }

  public switchCooperative(coopId: string): void {
    this.currentCoopId = coopId;
    this.notify();
  }

  // --- REGLAS DE NEGOCIO & OPERACIONES ---

  /**
   * Log de Auditoría obligatorio para toda acción crítica
   */
  public addAuditLog(accion: string, detalle: string, userId?: string, coopId?: string): void {
    const user = userId ? this.usuarios.find(u => u.uid === userId) : this.getCurrentUser();
    const newLog: LogAuditoria = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      cooperativaId: coopId || user?.cooperativaId || this.currentCoopId,
      usuario_id: user?.uid || 'sistema',
      usuario_nombre: user?.nombre_completo || 'Sistema Autónomo',
      accion,
      detalle,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ip: '190.152.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250),
      dispositivo: navigator.userAgent.includes('Mobile') ? 'Móvil / PWA Chofer' : 'Navegador Web / Tablet Despacho'
    };
    this.logs.unshift(newLog);
    this.notify();

    // Sincronización asíncrona no bloqueante con Firestore
    try {
      addAuditLogInFirestore(newLog).catch(() => {
        // Modo offline / permisos en espera
      });
    } catch {
      // Modo offline
    }
  }

  /**
   * REGLA: Lógica automática de pase directo
   * SI ocupados_base < (capacidad_base - 1)
   *   → Pase directo a Base Real
   * SI NO
   *   → Enviar a Pre-Base
   */
  public calculateBaseArrivalLocation(baseId: string): UbicacionFisica {
    const base = this.bases.find(b => b.id === baseId);
    if (!base) return 'base_real';

    const turnosEnBaseReal = this.turnos.filter(
      t => t.baseId === baseId && 
           t.ubicacion_fisica === 'base_real' && 
           (t.estado === 'esperando' || t.estado === 'llenando')
    );

    const ocupadosBase = turnosEnBaseReal.length;
    const umbralPaseDirecto = Math.max(1, base.capacidad_max - 1);

    if (ocupadosBase < umbralPaseDirecto) {
      return 'base_real';
    } else {
      return base.tiene_prebase ? 'prebase' : 'base_real';
    }
  }

  /**
   * REGLA 1 & 2 & 3: Validación de registro e ingreso a turnos
   */
  public canVehicleEnterTurn(vehiculoId: string): { ok: boolean; reason?: string } {
    const v = this.vehiculos.find(veh => veh.id === vehiculoId);
    if (!v) return { ok: false, reason: 'Vehículo no encontrado' };

    if (v.estado === 'en_registro') {
      return { ok: false, reason: 'Vehículo en proceso de registro documental. No puede recibir turnos.' };
    }
    if (v.estado === 'bloqueado_por_socio') {
      return { ok: false, reason: `Vehículo bloqueado por su propietario: ${v.motivo_bloqueo || 'Revisión pendiente'}` };
    }
    if (v.estado === 'mantenimiento' || v.estado === 'inactivo') {
      return { ok: false, reason: 'Vehículo en mantenimiento o inactivo' };
    }

    // Comprobar si ya tiene turno activo no despachado
    const turnoActivo = this.turnos.find(
      t => t.vehiculo_id === vehiculoId && t.estado !== 'despachado'
    );
    if (turnoActivo) {
      return { ok: false, reason: `El vehículo ya tiene el Turno #${turnoActivo.numero_turno} en curso` };
    }

    return { ok: true };
  }

  /**
   * Ingresar vehículo a la cola FIFO
   */
  public enrollInQueue(baseId: string, vehiculoId: string, choferId: string): { ok: boolean; message: string } {
    const check = this.canVehicleEnterTurn(vehiculoId);
    if (!check.ok) return { ok: false, message: check.reason || 'No permitido' };

    const base = this.bases.find(b => b.id === baseId);
    if (!base) return { ok: false, message: 'Base no encontrada' };

    const veh = this.vehiculos.find(v => v.id === vehiculoId)!;
    const ubicacion = this.calculateBaseArrivalLocation(baseId);

    // Calcular siguiente número correlativo FIFO
    const turnosBase = this.turnos.filter(t => t.baseId === baseId);
    const maxTurnoNum = turnosBase.reduce((acc, curr) => Math.max(acc, curr.numero_turno), 0);
    const nuevoTurnoNum = maxTurnoNum + 1;

    // Obtener tarifa activa de la cooperativa
    const coop = this.cooperativas.find(c => c.id === veh.cooperativaId);
    const tarifaPlana = coop?.rutas[0]?.tarifa_plana || 0.50;

    const nuevoTurno: Turno = {
      id: `tur-${Date.now()}`,
      cooperativaId: veh.cooperativaId,
      baseId,
      vehiculo_id: vehiculoId,
      chofer_id: choferId,
      numero_turno: nuevoTurnoNum,
      ubicacion_fisica: ubicacion,
      hora_llegada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hora_salida: null,
      pasajeros_actuales: 0,
      pasajeros_max: veh.capacidad,
      estado: ubicacion === 'base_real' ? 'esperando' : 'esperando',
      motivo_reasignacion: null,
      tarifa_viaje: tarifaPlana,
      total_recaudado: 0
    };

    this.turnos.push(nuevoTurno);

    const descUbicacion = ubicacion === 'base_real' 
      ? 'Pase Directo a Base Real' 
      : 'Asignado a Pre-Base Virtual por capacidad máxima';

    this.addAuditLog(
      'INGRESO_COLA_FIFO',
      `Unidad #${veh.numero_unidad} (${veh.placa}) asignada al Turno #${nuevoTurnoNum} en ${base.nombre}. ${descUbicacion}.`
    );

    return { ok: true, message: `Turno #${nuevoTurnoNum} creado con éxito (${descUbicacion})` };
  }

  /**
   * REGLA FIFO: Renumerar TODA la cola automáticamente para que siempre sea 1..N sin saltos
   */
  public renumerarCola(baseId: string): void {
    const cola = this.turnos
      .filter(t => t.baseId === baseId && t.estado !== 'despachado')
      .sort((a, b) => a.numero_turno - b.numero_turno);

    cola.forEach((turno, index) => {
      turno.numero_turno = index + 1;
      syncTurnoToFirestore(turno);
    });
  }

  /**
   * Modificar pasajeros en turno (+1 / -1)
   */
  public updatePassengers(turnoId: string, delta: number): void {
    const t = this.turnos.find(x => x.id === turnoId);
    if (!t) return;

    const nuevoTotal = Math.max(0, Math.min(t.pasajeros_max, t.pasajeros_actuales + delta));
    t.pasajeros_actuales = nuevoTotal;
    t.total_recaudado = Number((nuevoTotal * (t.tarifa_viaje || 1.50)).toFixed(2));

    if (t.pasajeros_actuales > 0 && t.pasajeros_actuales < t.pasajeros_max) {
      t.estado = 'llenando';
    } else if (t.pasajeros_actuales === t.pasajeros_max) {
      t.estado = 'listo';
    } else {
      t.estado = 'esperando';
    }

    syncTurnoToFirestore(t);
    this.notify();
  }

  /**
   * Vaciar carro: resetea conteo de pasajeros a 0
   */
  public vaciarCarro(turnoId: string): void {
    const t = this.turnos.find(x => x.id === turnoId);
    if (!t) return;

    t.pasajeros_actuales = 0;
    t.total_recaudado = 0;
    t.estado = 'esperando';

    syncTurnoToFirestore(t);
    this.notify();
  }

  /**
   * DAR SALIDA a unidad en turno (FIFO Despacho)
   * - Solo desde Base Real (nunca desde Pre-Base)
   * - Genera registro en `despachos`
   * - Sale de la cola activa
   * - Auto-avanza la siguiente unidad de Pre-Base a Base Real si hay espacio
   * - Renumera toda la cola automáticamente
   */
  public darSalidaTurno(turnoId: string, motivoForzado?: string): { ok: boolean; message: string } {
    const t = this.turnos.find(x => x.id === turnoId);
    if (!t) return { ok: false, message: 'Turno no encontrado en el sistema.' };

    // Validar bloqueo por mora en suscripción SaaS SuperAdmin
    if (this.isCooperativaBlockedForDispatch(t.cooperativaId)) {
      return {
        ok: false,
        message: '⛔ DESPACHO BLOQUEADO: La cooperativa se encuentra en suspensión temporal de despacho por mora en la suscripción de plataforma. El rastreo GPS permanece activo.'
      };
    }

    if (t.ubicacion_fisica === 'prebase') {
      return {
        ok: false,
        message: 'Regla de Oro: Solo se puede dar SALIDA desde Base Real, nunca desde Pre-Base.'
      };
    }

    if (t.pasajeros_actuales < t.pasajeros_max && !motivoForzado) {
      return {
        ok: false,
        message: `El vehículo no está completo (${t.pasajeros_max}/${t.pasajeros_max}). Para dar salida incompleta debe registrar un motivo justificado.`
      };
    }

    const veh = this.vehiculos.find(v => v.id === t.vehiculo_id);
    const base = this.bases.find(b => b.id === t.baseId);
    const user = this.getCurrentUser();
    const horaSalida = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Crear documento en despachos
    const destinoId = t.baseId === 'base-a' ? 'base-b' : 'base-a';
    const despacho: Despacho = {
      id: `desp-${Date.now()}`,
      cooperativaId: t.cooperativaId,
      turno_id: t.id,
      vehiculo_id: t.vehiculo_id,
      chofer_id: t.chofer_id,
      base_origen_id: t.baseId,
      base_destino_id: destinoId,
      hora_salida: horaSalida,
      pasajeros_base: t.pasajeros_actuales,
      pasajeros_ruta: 0,
      pasajeros_totales: t.pasajeros_actuales,
      pasajeros_max: t.pasajeros_max,
      tarifa_plana: t.tarifa_viaje || 1.50,
      recaudacion_bruta: t.total_recaudado || Number((t.pasajeros_actuales * (t.tarifa_viaje || 1.50)).toFixed(2)),
      km_inicio: veh?.km_actual || 45000,
      estado: 'en_ruta',
      salida_incompleta: !!motivoForzado,
      motivo_salida_incompleta: motivoForzado || ''
    };

    this.despachos.unshift(despacho);
    syncDespachoToFirestore(despacho);

    // 2. Registrar en auditoría de turnos si fue salida forzada
    if (motivoForzado) {
      const logAudit: LogAuditoriaTurno = {
        id: `log-tur-${Date.now()}`,
        cooperativaId: t.cooperativaId,
        usuario_id: user?.uid || 'usr-desp-a',
        usuario_nombre: user?.nombre_completo || 'Despachador de Turno',
        rol: user?.rol || 'despachador',
        accion: 'salida_forzada',
        turno_id: t.id,
        motivo: motivoForzado,
        detalle: `Salida incompleta forzada para Unidad #${veh?.numero_unidad || ''} con ${t.pasajeros_actuales}/${t.pasajeros_max} pax. Motivo: ${motivoForzado}`,
        antes: { pasajeros: t.pasajeros_actuales, estado: t.estado },
        despues: { estado: 'despachado', salida_incompleta: true },
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      this.logsTurnos.unshift(logAudit);
      syncLogAuditoriaTurnoToFirestore(logAudit);
    }

    // 3. El vehículo sale de la cola activa
    this.turnos = this.turnos.filter(x => x.id !== turnoId);
    deleteTurnoFromFirestore(turnoId);

    // Notificar al chofer de la salida
    this.agregarNotificacionChofer(
      t.chofer_id,
      t.vehiculo_id,
      `¡Salida confirmada a las ${horaSalida}! Pasajeros: ${t.pasajeros_actuales}/${t.pasajeros_max}. Destino: ${base?.nombre ? (t.baseId === 'base-a' ? 'Base B Centro' : 'Base A Sauces') : 'Destino'}. Buen viaje.`,
      'avance_base'
    );

    // 4. Auto-avance de Pre-Base a Base Real si hay espacio disponible
    const baseId = t.baseId;
    const capacidadBase = base?.capacidad_base || base?.capacidad_max || 4;
    const unidadesEnBaseReal = this.turnos.filter(
      x => x.baseId === baseId && x.ubicacion_fisica === 'base_real'
    ).length;

    if (unidadesEnBaseReal < capacidadBase) {
      // Buscar la unidad en prebase con menor número de turno
      const prebaseQueue = this.turnos
        .filter(x => x.baseId === baseId && x.ubicacion_fisica === 'prebase')
        .sort((a, b) => a.numero_turno - b.numero_turno);

      if (prebaseQueue.length > 0) {
        const siguienteAvanzar = prebaseQueue[0];
        siguienteAvanzar.ubicacion_fisica = 'base_real';
        syncTurnoToFirestore(siguienteAvanzar);

        const vehAvanza = this.vehiculos.find(v => v.id === siguienteAvanzar.vehiculo_id);

        this.agregarNotificacionChofer(
          siguienteAvanzar.chofer_id,
          siguienteAvanzar.vehiculo_id,
          `¡Espacio libre en Base Real! Avanza ahora de Pre-Base a Base Real (Turno #${siguienteAvanzar.numero_turno}).`,
          'avance_base'
        );

        this.addAuditLog(
          'AVANCE_PREBASE_A_BASE',
          `Unidad #${vehAvanza?.numero_unidad || ''} (Turno #${siguienteAvanzar.numero_turno}) avanza automáticamente de Pre-Base a Base Real por espacio liberado.`
        );
      }
    }

    // 5. Renumerar toda la cola para que no haya huecos
    this.renumerarCola(baseId);

    this.addAuditLog(
      'DESPACHO_SALIDA',
      `Salida efectuada: Unidad #${veh?.numero_unidad || ''} desde ${base?.nombre || 'Base'}. Pasajeros: ${t.pasajeros_actuales}/${t.pasajeros_max}. Recaudación: $${despacho.recaudacion_bruta.toFixed(2)}.`
    );

    this.notify();
    return { ok: true, message: `Despacho exitoso de Unidad #${veh?.numero_unidad || ''}. Cola renumerada.` };
  }

  /**
   * Compatibilidad hacia atrás para dispatchTurn
   */
  public dispatchTurn(turnoId: string): void {
    this.darSalidaTurno(turnoId);
  }

  /**
   * REASIGNAR TURNO FIFO: Toda reasignación requiere motivo obligatorio y queda en log
   * Mueve la unidad a la nueva posición y renumera toda la cola
   */
  public reasignarTurno(turnoId: string, nuevaPosicion: number, motivoObligatorio: string, usuarioId?: string): { ok: boolean; message: string } {
    if (!motivoObligatorio || motivoObligatorio.trim().length < 5) {
      return { ok: false, message: 'El motivo de reasignación es estrictamente obligatorio (mínimo 5 caracteres).' };
    }

    const t = this.turnos.find(x => x.id === turnoId);
    if (!t) return { ok: false, message: 'Turno no encontrado.' };

    const veh = this.vehiculos.find(v => v.id === t.vehiculo_id);
    const user = usuarioId ? this.usuarios.find(u => u.uid === usuarioId) : this.getCurrentUser();
    const posicionAnterior = t.numero_turno;

    // Obtener cola de la base ordenada
    const colaBase = this.turnos
      .filter(x => x.baseId === t.baseId)
      .sort((a, b) => a.numero_turno - b.numero_turno);

    // Mover elemento
    const idxActual = colaBase.findIndex(x => x.id === turnoId);
    if (idxActual !== -1) {
      colaBase.splice(idxActual, 1);
    }
    const idxDestino = Math.max(0, Math.min(colaBase.length, nuevaPosicion - 1));
    colaBase.splice(idxDestino, 0, t);

    // Reasignar números corridos
    colaBase.forEach((item, index) => {
      item.numero_turno = index + 1;
      if (item.id === turnoId) {
        item.motivo_reasignacion = motivoObligatorio;
      }
      syncTurnoToFirestore(item);
    });

    // Guardar en logs_auditoria_turnos
    const logTurno: LogAuditoriaTurno = {
      id: `log-tur-${Date.now()}`,
      cooperativaId: t.cooperativaId,
      usuario_id: user?.uid || 'usr-desp-a',
      usuario_nombre: user?.nombre_completo || 'Despachador',
      rol: user?.rol || 'despachador',
      accion: 'reasignacion',
      turno_id: t.id,
      motivo: motivoObligatorio,
      detalle: `Reasignación de Unidad #${veh?.numero_unidad || ''} del Turno #${posicionAnterior} al Turno #${nuevaPosicion} por ${user?.nombre_completo || 'Despachador'}. Motivo: ${motivoObligatorio}`,
      antes: { numero_turno: posicionAnterior, ubicacion: t.ubicacion_fisica },
      despues: { numero_turno: nuevaPosicion, ubicacion: t.ubicacion_fisica },
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.logsTurnos.unshift(logTurno);
    syncLogAuditoriaTurnoToFirestore(logTurno);

    this.addAuditLog(
      'REASIGNACION_TURNO_FIFO',
      `Reasignación: Unidad #${veh?.numero_unidad || ''} del Turno #${posicionAnterior} al Turno #${nuevaPosicion}. Motivo: ${motivoObligatorio}`
    );

    this.notify();
    return { ok: true, message: `Unidad #${veh?.numero_unidad || ''} reasignada al Turno #${nuevaPosicion}. Auditoría registrada.` };
  }

  /**
   * Compatibilidad hacia atrás para reorderOrReassignTurn
   */
  public reorderOrReassignTurn(turnoId: string, nuevoNumero: number, motivoObligatorio: string): { ok: boolean; message: string } {
    return this.reasignarTurno(turnoId, nuevoNumero, motivoObligatorio);
  }

  /**
   * Asignar Solicitud de Pasajero en Ruta a un Turno
   */
  public asignarSolicitudPasajero(solicitudId: string, turnoId: string): { ok: boolean; message: string } {
    const sol = this.solicitudesPasajeros.find(s => s.id === solicitudId);
    if (!sol) return { ok: false, message: 'Solicitud no encontrada' };

    const t = this.turnos.find(x => x.id === turnoId);
    if (!t) return { ok: false, message: 'Turno no encontrado' };

    const veh = this.vehiculos.find(v => v.id === t.vehiculo_id);
    const cantidadPaxs = sol.cantidad_pasajeros || 1;

    // NO PERMITIR si no hay cupo suficiente
    const espacioLibre = t.pasajeros_max - (t.pasajeros_actuales || 0);
    if (cantidadPaxs > espacioLibre) {
      return { 
        ok: false, 
        message: `No hay cupo suficiente en la unidad. Espacio disponible: ${espacioLibre} asientos.` 
      };
    }

    // Incrementar pasajeros_actuales
    t.pasajeros_actuales = (t.pasajeros_actuales || 0) + cantidadPaxs;
    if (t.pasajeros_actuales >= t.pasajeros_max) {
      t.estado = 'listo';
    }
    t.total_recaudado = t.pasajeros_actuales * (t.tarifa_viaje || 1.50);

    sol.estado = 'asignada';
    sol.turno_asignado_id = turnoId;
    sol.unidad_asignada_id = t.vehiculo_id;
    sol.fecha_asignacion = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    syncTurnoToFirestore(t);
    syncSolicitudPasajeroToFirestore(sol);

    // Si la unidad tiene un despacho activo en ruta
    const despacho = this.despachos.find(d => (d.turno_id === t.id || d.vehiculo_id === t.vehiculo_id) && d.estado === 'en_ruta');
    if (despacho) {
      despacho.pasajeros_ruta = (despacho.pasajeros_ruta || 0) + cantidadPaxs;
      despacho.pasajeros_totales = despacho.pasajeros_base + despacho.pasajeros_ruta;
      despacho.recaudacion_bruta = despacho.pasajeros_totales * (despacho.tarifa_plana || 1.50);
      syncDespachoToFirestore(despacho);
    }

    // Sincronizar reserva de cliente activa si coincide por teléfono
    const resCliente = this.reservasClientes.find(r => r.cliente_telefono === sol.pasajero_telefono && r.estado === 'pendiente');
    if (resCliente) {
      resCliente.estado = 'asignada';
      resCliente.unidad_asignada_id = t.vehiculo_id;
      resCliente.vehiculo_asignado = {
        numero_unidad: veh?.numero_unidad || '15',
        placa: veh?.placa || 'GXY-1234',
        modelo: veh?.modelo || 'Toyota Hiace',
        color: veh?.color || 'Blanco',
        chofer_nombre: this.usuarios.find(u => u.uid === t.chofer_id)?.nombre_completo || 'Chofer Asignado',
        tiempo_estimado_llegada_min: 5
      };
      saveStorage(STORAGE_KEYS.RESERVAS_CLIENTES, this.reservasClientes);
    }

    // Notificar al chofer
    this.agregarNotificacionChofer(
      t.chofer_id,
      t.vehiculo_id,
      `Recogida en ruta asignada: ${sol.referencia} (${cantidadPaxs} pax). Se restaron ${cantidadPaxs} asientos disponibles (Ocupación: ${t.pasajeros_actuales}/${t.pasajeros_max}).`,
      'recogida_ruta'
    );

    this.addAuditLog(
      'ASIGNAR_PASAJERO_RUTA',
      `Solicitud de ${sol.pasajero_nombre} (${cantidadPaxs} pax) asignada a Unidad #${veh?.numero_unidad || ''} (Turno #${t.numero_turno}). Asientos ocupados: ${t.pasajeros_actuales}/${t.pasajeros_max}.`
    );

    this.notify();
    const libres = Math.max(0, t.pasajeros_max - t.pasajeros_actuales);
    return { 
      ok: true, 
      message: `✓ Pasajero (${cantidadPaxs} pax) asignado a Unidad #${veh?.numero_unidad || ''}. Restados de asientos disponibles (${t.pasajeros_actuales}/${t.pasajeros_max} pax, ${libres} libres).` 
    };
  }

  /**
   * Cambiar estado de solicitud de pasajero en ruta
   */
  public cambiarEstadoSolicitud(solicitudId: string, nuevoEstado: SolicitudPasajeroRuta['estado'], posicionEspera?: number): void {
    const sol = this.solicitudesPasajeros.find(s => s.id === solicitudId);
    if (!sol) return;

    sol.estado = nuevoEstado;
    if (posicionEspera !== undefined) {
      sol.posicion_espera = posicionEspera;
    }

    syncSolicitudPasajeroToFirestore(sol);
    this.notify();
  }

  /**
   * Crear nueva solicitud de pasajero en ruta
   */
  public crearSolicitudPasajero(datos: Partial<SolicitudPasajeroRuta>): SolicitudPasajeroRuta {
    const nuevaSol: SolicitudPasajeroRuta = {
      id: `sol-pax-${Date.now()}`,
      cooperativaId: this.currentCoopId,
      pasajero_nombre: datos.pasajero_nombre || 'Pasajero',
      pasajero_telefono: datos.pasajero_telefono || '0900000000',
      lat: datos.lat || -2.1550,
      lng: datos.lng || -79.8920,
      referencia: datos.referencia || 'En ruta',
      cantidad_pasajeros: datos.cantidad_pasajeros || 1,
      estado: datos.estado || 'pendiente',
      turno_asignado_id: datos.turno_asignado_id || null,
      creada_por: datos.creada_por || 'despachador',
      fecha_solicitud: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      posicion_espera: datos.posicion_espera || null
    };

    this.solicitudesPasajeros.unshift(nuevaSol);
    syncSolicitudPasajeroToFirestore(nuevaSol);
    this.notify();
    return nuevaSol;
  }

  /**
   * Agregar notificación al chofer
   */
  public agregarNotificacionChofer(choferId: string, vehiculoId: string, mensaje: string, tipo: NotificacionChofer['tipo']): void {
    const notif: NotificacionChofer = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      chofer_id: choferId,
      vehiculo_id: vehiculoId,
      mensaje,
      tipo,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false
    };

    this.notificacionesChofer.unshift(notif);
    this.notify();
  }

  /**
   * Marcar notificación de chofer como leída
   */
  public marcarNotificacionChoferLeida(notifId: string): void {
    const notif = this.notificacionesChofer.find(n => n.id === notifId);
    if (notif) {
      notif.leido = true;
      this.notify();
    }
  }

  /**
   * Actualizar configuración de Base (Capacidades, tiempos de espera, geocercas)
   */
  public actualizarConfigBase(baseId: string, config: Partial<Base>): { ok: boolean; message: string } {
    const base = this.bases.find(b => b.id === baseId);
    if (!base) return { ok: false, message: 'Base no encontrada' };

    Object.assign(base, config);
    syncBaseToFirestore(base);

    this.addAuditLog(
      'CONFIGURACION_BASE',
      `Parámetros actualizados para ${base.nombre}: Cap. Base: ${base.capacidad_base || base.capacidad_max}, Cap. Pre-Base: ${base.capacidad_prebase || 20}, T. Espera: ${base.tiempo_max_espera_base || 15} min.`
    );

    this.notify();
    return { ok: true, message: 'Configuración de base guardada con éxito.' };
  }

  /**
   * REGLA 8 & 9: Bloqueo de vehículo por socio
   * - Solo el mismo socio que bloqueó puede desbloquear
   * - Si socio bloquea >5 veces en 7 días, sistema suspende automáticamente su acceso
   */
  public toggleVehicleLock(vehiculoId: string, socioId: string, motivo?: string): { ok: boolean; message: string } {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    if (!veh) return { ok: false, message: 'Vehículo no existe' };

    const socio = this.usuarios.find(u => u.uid === socioId);
    if (!socio) return { ok: false, message: 'Usuario no autenticado' };

    if (veh.socio_id !== socioId && socio.rol !== 'admin_coop' && socio.rol !== 'superadmin') {
      return { ok: false, message: 'Solo el socio propietario o un administrador puede gestionar este vehículo.' };
    }

    if (veh.estado === 'bloqueado_por_socio') {
      // Intentando desbloquear
      if (veh.bloqueado_por && veh.bloqueado_por !== socioId && socio.rol !== 'admin_coop') {
        return {
          ok: false,
          message: 'Regla de seguridad: Solo el mismo socio que aplicó el bloqueo (o directiva) puede desbloquear esta unidad.'
        };
      }

      veh.estado = 'activo';
      veh.bloqueado_por = undefined;
      veh.fecha_bloqueo = undefined;
      veh.motivo_bloqueo = undefined;

      this.addAuditLog(
        'DESBLOQUEO_VEHICULO',
        `Unidad #${veh.numero_unidad} (${veh.placa}) desbloqueada por ${socio.nombre_completo}. Unidad habilitada para turnos.`,
        socioId
      );

      return { ok: true, message: `Unidad #${veh.numero_unidad} desbloqueada y habilitada.` };
    } else {
      // Bloquear vehículo
      const bloqueosActuales = (socio.bloqueos_ultimos_7_dias || 0) + 1;
      socio.bloqueos_ultimos_7_dias = bloqueosActuales;

      veh.estado = 'bloqueado_por_socio';
      veh.bloqueado_por = socioId;
      veh.fecha_bloqueo = new Date().toISOString().replace('T', ' ').substring(0, 16);
      veh.motivo_bloqueo = motivo || 'Bloqueo administrativo por el socio propietario';

      // Cancelar cualquier turno en cola si existiera
      this.turnos = this.turnos.filter(t => {
        if (t.vehiculo_id === vehiculoId && t.estado !== 'despachado') {
          return false;
        }
        return true;
      });

      this.addAuditLog(
        'BLOQUEO_VEHICULO',
        `Unidad #${veh.numero_unidad} (${veh.placa}) BLOQUEADA por ${socio.nombre_completo}. Motivo: ${veh.motivo_bloqueo}. Turnos pendientes retirados de la cola.`,
        socioId
      );

      // Verificación de REGLA 9: > 5 bloqueos en 7 días
      if (bloqueosActuales > 5) {
        socio.suspendido_por_bloqueos = true;
        this.addAuditLog(
          'SUSPENSION_AUTOMATICA_SOCIO',
          `ALERTA SISTEMA: Socio ${socio.nombre_completo} ha superado el límite de 5 bloqueos en 7 días (${bloqueosActuales} bloqueos). Acceso suspendido automáticamente para revisión del consejo de administración.`,
          'sistema'
        );
        return {
          ok: true,
          message: `Unidad bloqueada. ATENCIÓN: Superaste el límite de 5 bloqueos semanales. Tu cuenta ha quedado en revisión directiva.`
        };
      }

      return { ok: true, message: `Unidad #${veh.numero_unidad} bloqueada con éxito.` };
    }
  }

  /**
   * Cambiar estado de un vehículo de la cooperativa (para administradores)
   */
  public updateVehicleState(vehiculoId: string, nuevoEstado: EstadoVehiculo): void {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    if (!veh) return;

    const estadoAnterior = veh.estado;
    veh.estado = nuevoEstado;

    // Si pasa a activo, asegurar que tenga tracking live inicializado para aparecer en el mapa
    if (nuevoEstado === 'activo') {
      veh.bloqueado_por = undefined;
      veh.fecha_bloqueo = undefined;
      veh.motivo_bloqueo = undefined;

      if (!this.trackingLive[vehiculoId]) {
        this.trackingLive[vehiculoId] = {
          unidadId: veh.id,
          cooperativaId: veh.cooperativaId,
          numero_unidad: veh.numero_unidad,
          placa: veh.placa,
          chofer_nombre: 'Chofer Titular',
          lat: veh.ubicacion_actual?.lat || -2.1384,
          lng: veh.ubicacion_actual?.lng || -79.8967,
          velocidad: 0,
          rumbo: 0,
          timestamp: Date.now(),
          estado: 'en_base',
          pasajeros: 0,
          bateria_chofer: 90,
          precision_gps: 5,
          desviado_de_ruta: false
        };
      }
    }

    // Cancelar turnos en cola si se inactiva o bloquea
    if (nuevoEstado !== 'activo' && nuevoEstado !== 'en_registro') {
      this.turnos = this.turnos.filter(t => {
        if (t.vehiculo_id === vehiculoId && t.estado !== 'despachado') {
          return false; // Sacar de la cola
        }
        return true;
      });
      // Renumerar turnos restantes
      this.bases.forEach(b => {
        const cola = this.turnos.filter(t => t.baseId === b.id && t.estado !== 'despachado');
        cola.forEach((turno, index) => {
          turno.numero_turno = index + 1;
        });
      });
    }

    syncVehiculoToFirestore(veh);
    this.addAuditLog(
      'ESTADO_VEHICULO_ADMIN',
      `Administrador actualizó estado de Unidad #${veh.numero_unidad} (${veh.placa}) de "${estadoAnterior}" a "${nuevoEstado}".`
    );
    this.notify();
  }

  public activePlateSessions: Record<string, string> = {}; // placa -> sessionId

  public registerPlateSession(placa: string): string {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.activePlateSessions[placa.toUpperCase()] = sessionId;
    return sessionId;
  }

  public checkPlateSession(placa: string, sessionId: string): boolean {
    const active = this.activePlateSessions[placa.toUpperCase()];
    return !active || active === sessionId;
  }

  public goOffline(vehiculoId: string): void {
    if (this.trackingLive[vehiculoId]) {
      delete this.trackingLive[vehiculoId];
      this.notify();
    }
  }

  public resetDriverPassword(vehiculoId: string, nuevaClave: string): void {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    if (!veh) return;
    veh.password = nuevaClave || '1234';
    veh.password_cambiado = false;
    this.addAuditLog(
      'RESET_CLAVE_CONDUCTOR',
      `Administrador restableció la contraseña de la placa ${veh.placa} (Unidad #${veh.numero_unidad}).`
    );
    this.notify();
  }

  public deleteCooperativa(coopId: string): void {
    this.eliminarCooperativaCompleta(coopId);
  }

  /**
   * Eliminar vehículo de la base de datos de la cooperativa y liberar placa
   */
  public deleteVehicle(vehiculoId: string): void {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    if (!veh) return;

    const placa = veh.placa;
    this.vehiculos = this.vehiculos.filter(v => v.id !== vehiculoId);
    this.vehiculosPendientes = this.vehiculosPendientes.filter(p => p.placa.toUpperCase() !== placa.toUpperCase());
    if (this.trackingLive[vehiculoId]) {
      delete this.trackingLive[vehiculoId];
    }
    this.turnos = this.turnos.filter(t => t.vehiculo_id !== vehiculoId);

    this.addAuditLog(
      'ELIMINAR_VEHICULO_ADMIN',
      `Administrador eliminó permanentemente la Unidad #${veh.numero_unidad} (${placa}) de la base de datos, liberando la placa para nuevo registro.`
    );
    this.notify();
  }

  /**
   * FINALIZAR DESPACHO:
   * - Cierra el viaje actual
   * - Registra km final y duración
   * - Re-enlista AUTOMÁTICAMENTE al conductor en la base destino (Ciclo continuo)
   */
  public finalizarDespacho(despachoId: string, kmFinal?: number): { ok: boolean; message: string } {
    const despacho = this.despachos.find(d => d.id === despachoId);
    if (!despacho) return { ok: false, message: 'Viaje no encontrado.' };

    if (despacho.estado === 'cerrado') return { ok: false, message: 'El viaje ya fue finalizado previamente.' };

    const vehiculo = this.vehiculos.find(v => v.id === despacho.vehiculo_id);
    const baseDestino = this.bases.find(b => b.id === despacho.base_destino_id);
    
    // 1. Cerrar despacho
    despacho.estado = 'cerrado';
    despacho.hora_llegada = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    despacho.km_fin = kmFinal || (despacho.km_inicio + 45); // Simulación de 45km si no se provee
    
    if (vehiculo) {
      vehiculo.km_actual = despacho.km_fin;
    }

    // 2. Auditoría
    this.addAuditLog(
      'FINALIZAR_VIAJE_AUTO',
      `Unidad #${vehiculo?.numero_unidad || ''} finalizó viaje en ${baseDestino?.nombre || 'Base Destino'}. Pasajeros totales: ${despacho.pasajeros_totales}.`
    );

    // 3. RE-ENLISTAMIENTO AUTOMÁTICO (Regla: El turno se da al final de los turnos)
    if (vehiculo && baseDestino) {
      const enrollResult = this.enrollInQueue(baseDestino.id, vehiculo.id, despacho.chofer_id);
      
      this.notify();
      
      return { 
        ok: true, 
        message: `Viaje finalizado. ${enrollResult.message}` 
      };
    }

    this.notify();
    return { ok: true, message: 'Viaje finalizado con éxito.' };
  }

  /**
   * Cambiar estado de disponibilidad del conductor
   */
  public setDriverOnlineStatus(vehiculoId: string, online: boolean): void {
    if (!this.trackingLive[vehiculoId]) {
      const veh = this.vehiculos.find(v => v.id === vehiculoId);
      if (veh) {
        this.trackingLive[vehiculoId] = {
          unidadId: veh.id,
          cooperativaId: veh.cooperativaId,
          numero_unidad: veh.numero_unidad,
          placa: veh.placa,
          chofer_nombre: 'Conductor',
          lat: veh.ubicacion_actual?.lat || -2.1384,
          lng: veh.ubicacion_actual?.lng || -79.8967,
          velocidad: 0,
          rumbo: 0,
          timestamp: Date.now(),
          estado: 'en_base',
          pasajeros: 0,
          bateria_chofer: 100,
          precision_gps: 3,
          esta_en_linea: online
        };
      }
    } else {
      this.trackingLive[vehiculoId].esta_en_linea = online;
    }
    this.notify();
    
    this.addAuditLog(
      'CAMBIO_ESTADO_LINEA',
      `Unidad #${this.trackingLive[vehiculoId]?.numero_unidad || ''} se puso ${online ? 'EN LÍNEA' : 'FUERA DE LÍNEA'}.`
    );
  }

  /**
   * Actualizar posición GPS y verificar geocercas para auto-enlistamiento
   */
  public updateDriverLocation(vehiculoId: string, lat: number, lng: number): void {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    if (!veh) return;

    // Actualizar tracking live
    if (!this.trackingLive[vehiculoId]) {
      this.trackingLive[vehiculoId] = {
        unidadId: veh.id,
        cooperativaId: veh.cooperativaId,
        numero_unidad: veh.numero_unidad,
        placa: veh.placa,
        chofer_nombre: 'Conductor',
        lat,
        lng,
        velocidad: 0,
        rumbo: 0,
        timestamp: Date.now(),
        estado: 'en_ruta',
        pasajeros: 0,
        bateria_chofer: 100,
        precision_gps: 3,
        desviado_de_ruta: false,
        esta_en_linea: false
      };
    } else {
      this.trackingLive[vehiculoId].lat = lat;
      this.trackingLive[vehiculoId].lng = lng;
      this.trackingLive[vehiculoId].timestamp = Date.now();
    }

    // VERIFICAR PROXIMIDAD A BASES PARA AUTO-ENLISTAMIENTO
    // REGLA: Solo si está EN LÍNEA, no tiene turno activo y no tiene viaje activo
    const enLinea = this.trackingLive[vehiculoId].esta_en_linea;
    const tieneTurnoActivo = this.turnos.some(t => t.vehiculo_id === vehiculoId && t.estado !== 'despachado');
    const tieneViajeActivo = this.despachos.some(d => d.vehiculo_id === vehiculoId && d.estado === 'en_ruta');

    if (enLinea && !tieneTurnoActivo && !tieneViajeActivo) {
      for (const base of this.bases.filter(b => b.cooperativaId === veh.cooperativaId)) {
        const distancia = this.getDistance(lat, lng, base.lat, base.lng);
        if (distancia <= (base.radio_geocerca || 200)) {
          this.enrollInQueue(base.id, vehiculoId, veh.chofer_titular_id);
          this.addAuditLog(
            'AUTO_ENLISTAMIENTO_GPS',
            `Detección por proximidad: Unidad #${veh.numero_unidad} entró al radio de ${base.nombre} y fue enlistada automáticamente.`
          );
          break;
        }
      }
    }

    this.notify();
  }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
  public switchDriverType(vehiculoId: string, nuevoTipo: 'chofer_titular' | 'propietario', motivo: string): void {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    if (!veh) return;

    const socio = this.usuarios.find(u => u.uid === veh.socio_id);
    const chofer = this.usuarios.find(u => u.uid === veh.chofer_titular_id);

    veh.conductor_actual_tipo = nuevoTipo;
    const nombreConductor = nuevoTipo === 'propietario' ? socio?.nombre_completo : chofer?.nombre_completo;

    const fechaHoy = new Date().toLocaleDateString('es-EC');
    this.addAuditLog(
      'CAMBIO_CONDUCTOR_ACTUAL',
      `${fechaHoy} - Conduce ${nuevoTipo === 'propietario' ? 'propietario (' + socio?.nombre_completo + ')' : 'chofer titular (' + chofer?.nombre_completo + ')'}. Motivo: ${motivo}.`
    );

    this.notify();
  }

  /**
   * SUPERADMIN: Marcar pagado +30 días
   */
  public renewCooperativePayment(coopId: string, monto: number, referencia: string): void {
    const coop = this.cooperativas.find(c => c.id === coopId);
    if (!coop) return;

    const fechaActual = new Date(coop.fecha_vencimiento_suscripcion);
    fechaActual.setDate(fechaActual.getDate() + 30);
    coop.fecha_vencimiento_suscripcion = fechaActual.toISOString().substring(0, 10);
    coop.estado = 'activa';
    coop.monto_deuda = 0;
    coop.bloqueo_tipo = 'ninguno';

    if (!coop.historial_pagos) coop.historial_pagos = [];
    coop.historial_pagos.unshift({
      id: `pay-${Date.now()}`,
      fecha: new Date().toISOString().substring(0, 10),
      monto,
      referencia,
      dias_agregados: 30
    });

    this.addAuditLog(
      'RENOVACION_SUSCRIPCION_SAAS',
      `SuperAdmin acreditó pago de $${monto} (+30 días) para cooperativa "${coop.nombre}". Nueva vigencia: ${coop.fecha_vencimiento_suscripcion}. Ref: ${referencia}.`
    );

    this.notify();
  }

  /**
   * SUPERADMIN: Bloqueo progresivo manual
   */
  public setCooperativeBlock(coopId: string, tipo: 'ninguno' | 'parcial' | 'total'): void {
    const coop = this.cooperativas.find(c => c.id === coopId);
    if (!coop) return;

    coop.bloqueo_tipo = tipo;
    if (tipo === 'total') {
      coop.estado = 'suspendida';
    } else if (tipo === 'parcial') {
      coop.estado = 'suspendida';
    } else {
      coop.estado = 'activa';
    }

    this.addAuditLog(
      'ESTADO_BLOQUEO_COOPERATIVA',
      `SuperAdmin actualizó estado de "${coop.nombre}" a: Bloqueo ${tipo.toUpperCase()}.`
    );

    this.notify();
  }

  /**
   * ADMIN COOP: Aprobar o rechazar vehículo pendiente
   */
  public reviewPendingVehicle(solicitudId: string, accion: 'aprobar' | 'rechazar', observaciones: string): void {
    const sol = this.vehiculosPendientes.find(s => s.id === solicitudId);
    if (!sol) return;

    if (accion === 'aprobar') {
      sol.estado_revision = 'aprobado';
      sol.observaciones = observaciones;

      // Pasa a colección vehiculos en estado 'en_registro'
      const nuevoVeh: Vehiculo = {
        id: `veh-${sol.placa.replace('-', '').toLowerCase()}`,
        cooperativaId: sol.cooperativaId,
        numero_unidad: String(1000 + this.vehiculos.length + 1),
        placa: sol.placa,
        modelo: sol.modelo,
        anio: 2023,
        color: sol.color,
        capacidad: 4,
        tipo_vehiculo: 'sedan',
        foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
        socio_id: 'usr-socio',
        chofer_titular_id: 'usr-chofer',
        conductor_actual_tipo: 'chofer_titular',
        estado: 'en_registro', // No puede entrar a turnos hasta revisión física
        documentos: {
          matricula_vigencia: '2027-01-01',
          soat_vigencia: '2027-01-01',
          revision_tecnica_vigencia: 'Pendiente inspección física'
        },
        km_actual: 10000,
        fecha_registro: new Date().toISOString().substring(0, 10),
        password: '1234',
        password_cambiado: false
      };

      if (!this.vehiculos.some(v => v.id === nuevoVeh.id)) {
        this.vehiculos.push(nuevoVeh);
      } else {
        this.vehiculos = this.vehiculos.map(v => v.id === nuevoVeh.id ? nuevoVeh : v);
      }
      this.addAuditLog(
        'APROBACION_PRE_REGISTRO',
        `Solicitud de placa ${sol.placa} aprobada. Ingresada a flota como 'en_registro' (Unidad #${nuevoVeh.numero_unidad}). ${observaciones}`
      );
    } else {
      sol.estado_revision = 'rechazado';
      sol.observaciones = observaciones;
      this.addAuditLog(
        'RECHAZO_PRE_REGISTRO',
        `Solicitud de placa ${sol.placa} rechazada. Motivo: ${observaciones}`
      );
    }

    this.notify();
  }

  /**
   * Promover vehículo de 'en_registro' a 'activo' tras inspección física
   */
  public activateRegisteredVehicle(vehiculoId: string): void {
    const v = this.vehiculos.find(x => x.id === vehiculoId);
    if (v && v.estado === 'en_registro') {
      v.estado = 'activo';
      v.documentos.revision_tecnica_vigencia = '2027-06-30 (Aprobada)';
      this.addAuditLog(
        'ACTIVACION_FLOTA_VEHICULO',
        `Unidad #${v.numero_unidad} (${v.placa}) aprobó inspección física técnica y ha sido promovida a estado ACTIVO para despacho.`
      );
      this.notify();
    }
  }

  /**
   * Emergencia SOS / Alerta Chofer
   */
  public sendEmergencyAlert(vehiculoId: string, tipo: 'SOS_ROJO' | 'ALERTA_AMARILLA', mensaje: string): void {
    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    const user = this.getCurrentUser();

    const nuevaAlerta: AlertaEmergencia = {
      id: `alt-${Date.now()}`,
      cooperativaId: veh?.cooperativaId || this.currentCoopId,
      vehiculo_id: vehiculoId,
      chofer_id: user?.uid || 'usr-chofer',
      chofer_nombre: user?.nombre_completo || 'Chofer en ruta',
      numero_unidad: veh?.numero_unidad || 'S/N',
      tipo,
      mensaje,
      lat: veh?.ubicacion_actual?.lat || -2.1550,
      lng: veh?.ubicacion_actual?.lng || -79.8930,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      atendida: false
    };

    this.alertas.unshift(nuevaAlerta);

    // Actualizar estado de tracking en vivo a emergencia si es SOS_ROJO
    if (tipo === 'SOS_ROJO') {
      this.updateTrackingLive(nuevaAlerta.cooperativaId, vehiculoId, { estado: 'emergencia' });
    }

    // También registrar como un mensaje de conductor para que aparezca en el chat de base
    const vehiculoObj = this.vehiculos.find(v => v.id === vehiculoId);
    this.mensajesConductorBase.unshift({
      id: `msg-alt-${Date.now()}`,
      cooperativaId: nuevaAlerta.cooperativaId,
      chofer_id: nuevaAlerta.chofer_id || 'chofer',
      chofer_nombre: nuevaAlerta.chofer_nombre,
      conductor_id: nuevaAlerta.chofer_id || 'chofer',
      conductor_nombre: nuevaAlerta.chofer_nombre,
      vehiculo_id: vehiculoId,
      unidad_numero: nuevaAlerta.numero_unidad,
      placa: vehiculoObj?.placa || 'PLACA-SOS',
      destinatario_base: 'ambas',
      destinatario_nombre: 'Todas las Bases',
      texto: `🚨 [${tipo}] ALERTA/SOS: ${mensaje}`,
      tipo: 'libre',
      timestamp: nuevaAlerta.timestamp,
      hora: nuevaAlerta.timestamp,
      fecha: new Date().toLocaleDateString(),
      estado: 'pendiente',
      leido: false,
    });

    this.addAuditLog(
      tipo === 'SOS_ROJO' ? 'EMERGENCIA_SOS_ACTIVADA' : 'ALERTA_PRECAUCION_CHOFER',
      `[${tipo}] Chofer ${nuevaAlerta.chofer_nombre} - Unidad #${nuevaAlerta.numero_unidad}: "${mensaje}". Coordenadas: (${nuevaAlerta.lat}, ${nuevaAlerta.lng})`
    );

    this.notify();
  }

  public resolveAlert(alertaId: string): void {
    const alt = this.alertas.find(a => a.id === alertaId);
    if (alt) {
      alt.atendida = true;
      alt.atendida_por = this.getCurrentUser()?.nombre_completo || 'Central';

      // Resetear estado de tracking si ya no hay SOS activos para esta unidad
      const stillActive = this.alertas.some(a => a.vehiculo_id === alt.vehiculo_id && a.tipo === 'SOS_ROJO' && !a.atendida);
      if (!stillActive) {
        this.updateTrackingLive(alt.cooperativaId, alt.vehiculo_id, { estado: 'en_ruta' });
      }

      this.notify();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // MÓDULO DE TRACKING GPS EN VIVO Y GEOCERCAS
  // ════════════════════════════════════════════════════════════════

  public getTrackingLiveArray(cooperativaId?: string): TrackingLive[] {
    const coopId = cooperativaId || this.currentCoopId;
    return Object.values(this.trackingLive).filter(t => t.cooperativaId === coopId);
  }

  public updateTrackingLive(cooperativaId: string, unidadId: string, patch: Partial<TrackingLive>): void {
    const existing = this.trackingLive[unidadId] || {
      unidadId,
      cooperativaId,
      lat: -2.1384,
      lng: -79.8967,
      velocidad: 0,
      rumbo: 0,
      timestamp: Date.now(),
      estado: 'en_base',
      pasajeros: 0,
      bateria_chofer: 80,
      precision_gps: 10
    };

    const updated: TrackingLive = {
      ...existing,
      ...patch,
      cooperativaId,
      unidadId,
      timestamp: patch.timestamp || Date.now()
    };

    // Verificar si está dentro de alguna geocerca
    const activeGeocercas = this.geocercas.filter(g => g.cooperativaId === cooperativaId && g.activa);
    for (const geo of activeGeocercas) {
      const inside = isPointInsideGeocerca({ lat: updated.lat, lng: updated.lng }, geo);
      if (inside) {
        if (geo.tipo === 'zona_riesgo') {
          const isCritical = isRiskZoneInCriticalHours(geo);
          updated.en_zona_riesgo = true;
          updated.zona_riesgo_nombre = geo.nombre;

          if (isCritical) {
            // Verificar si ya existe alerta activa para no duplicar
            const existingAlert = this.alertasTracking.find(
              a => a.unidadId === unidadId && a.tipo === 'entrada_zona_riesgo' && !a.atendida
            );
            if (!existingAlert) {
              this.createAlertaTracking({
                cooperativaId,
                unidadId,
                choferId: updated.chofer_nombre || 'chofer',
                chofer_nombre: updated.chofer_nombre,
                numero_unidad: updated.numero_unidad,
                tipo: 'entrada_zona_riesgo',
                severidad: 'rojo',
                mensaje: `Unidad #${updated.numero_unidad || unidadId} ingresó a ${geo.nombre} en horario crítico nocturno`,
                lat: updated.lat,
                lng: updated.lng
              });
            }
          }
        }
      }
    }

    // Verificar desvío de ruta (> 500m del corredor principal) si está en_ruta
    if (updated.estado === 'en_ruta') {
      const distToCorridor = getDistanceToPolylineMeters(
        { lat: updated.lat, lng: updated.lng },
        RUTA_CORREDOR_DEFAULT
      );
      if (distToCorridor > 500) {
        updated.desviado_de_ruta = true;
        const existingDesvioAlert = this.alertasTracking.find(
          a => a.unidadId === unidadId && a.tipo === 'desvio_ruta' && !a.atendida
        );
        if (!existingDesvioAlert) {
          this.createAlertaTracking({
            cooperativaId,
            unidadId,
            choferId: updated.chofer_nombre || 'chofer',
            chofer_nombre: updated.chofer_nombre,
            numero_unidad: updated.numero_unidad,
            tipo: 'desvio_ruta',
            severidad: 'amarillo',
            mensaje: `Unidad #${updated.numero_unidad || unidadId} se desvió ${Math.round(distToCorridor)}m de la ruta estimada`,
            lat: updated.lat,
            lng: updated.lng
          });
        }
      } else {
        updated.desviado_de_ruta = false;
      }

      // Exceso de velocidad (> 70 km/h)
      if (updated.velocidad > 70) {
        const existingSpeedAlert = this.alertasTracking.find(
          a => a.unidadId === unidadId && a.tipo === 'velocidad_excesiva' && !a.atendida
        );
        if (!existingSpeedAlert) {
          this.createAlertaTracking({
            cooperativaId,
            unidadId,
            choferId: updated.chofer_nombre || 'chofer',
            chofer_nombre: updated.chofer_nombre,
            numero_unidad: updated.numero_unidad,
            tipo: 'velocidad_excesiva',
            severidad: 'rojo',
            mensaje: `Exceso de velocidad: ${Math.round(updated.velocidad)} km/h en zona regulada (límite 50 km/h)`,
            lat: updated.lat,
            lng: updated.lng
          });
        }
      }
    }

    this.trackingLive[unidadId] = updated;

    // Sincronizar también ubicación del vehículo en la lista general de vehículos
    const veh = this.vehiculos.find(v => v.id === unidadId);
    if (veh) {
      veh.ubicacion_actual = {
        lat: updated.lat,
        lng: updated.lng,
        velocidad_kmh: Math.round(updated.velocidad),
        rumbo: updated.rumbo,
        ultima_actualizacion: 'GPS en vivo'
      };
    }

    this.notify();
  }

  public addGeocerca(data: Omit<Geocerca, 'id'>): Geocerca {
    const nueva: Geocerca = {
      id: `geo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...data
    };
    this.geocercas.push(nueva);
    syncGeocercaToFirestore(nueva).catch(() => {});
    this.addAuditLog('CREAR_GEOCERCA', `Nueva geocerca "${nueva.nombre}" (${nueva.tipo}) creada con radio de ${nueva.radio_metros}m.`);
    this.notify();
    return nueva;
  }

  public updateGeocerca(id: string, patch: Partial<Geocerca>): void {
    const geo = this.geocercas.find(g => g.id === id);
    if (geo) {
      Object.assign(geo, patch);
      syncGeocercaToFirestore(geo).catch(() => {});
      this.notify();
    }
  }

  public deleteGeocerca(id: string): void {
    const geo = this.geocercas.find(g => g.id === id);
    if (geo) {
      this.geocercas = this.geocercas.filter(g => g.id !== id);
      deleteGeocercaFromFirestore(id).catch(() => {});
      this.addAuditLog('ELIMINAR_GEOCERCA', `Geocerca "${geo.nombre}" eliminada.`);
      this.notify();
    }
  }

  public createAlertaTracking(alerta: Omit<AlertaTracking, 'id' | 'timestamp' | 'atendida' | 'atendida_por'>): AlertaTracking {
    const nueva: AlertaTracking = {
      id: `alt-trk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...alerta,
      atendida: false,
      atendida_por: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.alertasTracking.unshift(nueva);
    syncAlertaTrackingToFirestore(nueva).catch(() => {});
    this.notify();
    return nueva;
  }

  public atenderAlertaTracking(alertaId: string, atendidaPor?: string): void {
    const alt = this.alertasTracking.find(a => a.id === alertaId);
    if (alt) {
      const user = atendidaPor || this.getCurrentUser()?.nombre_completo || 'Operador Central';
      alt.atendida = true;
      alt.atendida_por = user;
      attendAlertaTrackingInFirestore(alertaId, user).catch(() => {});
      this.addAuditLog('ATENDER_ALERTA_TRACKING', `Alerta [${alt.tipo}] de Unidad #${alt.numero_unidad || alt.unidadId} atendida por ${user}.`);
      this.notify();
    }
  }

  public addTrackingHistorial(historial: TrackingHistorial): void {
    this.trackingHistorial.unshift(historial);
    syncTrackingHistorialToFirestore(historial).catch(() => {});
    this.notify();
  }

  /**
   * Simulación de movimiento GPS realista a lo largo de la ruta de Guayaquil
   */
  public simulateLiveGpsPings(): void {
    let changed = false;

    // Actualizar unidades en vivo en el corredor
    Object.values(this.trackingLive).forEach(t => {
      if (t.estado === 'en_ruta') {
        const jitterLat = (Math.random() - 0.48) * 0.0015;
        const jitterLng = (Math.random() - 0.5) * 0.0015;
        const newLat = Number((t.lat + jitterLat).toFixed(6));
        const newLng = Number((t.lng + jitterLng).toFixed(6));
        const rumbo = calculateBearing(t.lat, t.lng, newLat, newLng);

        t.lat = newLat;
        t.lng = newLng;
        t.rumbo = rumbo || t.rumbo;
        t.velocidad = Math.min(65, Math.max(15, t.velocidad + (Math.random() - 0.5) * 10));
        t.timestamp = Date.now();
        changed = true;

        // Registrar punto en historial de trayecto si hay despacho activo
        if (t.despacho_id) {
          const hist = this.trackingHistorial.find(h => h.despacho_id === t.despacho_id);
          if (hist) {
            hist.puntos.push({
              lat: t.lat,
              lng: t.lng,
              timestamp: Date.now(),
              velocidad: Math.round(t.velocidad),
              pasajeros: t.pasajeros
            });
          }
        }
      } else if (t.estado === 'desembarcando') {
        // En bahía desembarcando pasajeros gradualmente
        if (t.pasajeros > 0 && Math.random() > 0.4) {
          t.pasajeros = Math.max(0, t.pasajeros - 2);
          changed = true;
        }
      }
    });

    this.vehiculos.forEach(v => {
      if (v.estado === 'activo' && v.ubicacion_actual) {
        const trk = this.trackingLive[v.id];
        if (trk) {
          v.ubicacion_actual.lat = trk.lat;
          v.ubicacion_actual.lng = trk.lng;
          v.ubicacion_actual.velocidad_kmh = Math.round(trk.velocidad);
          v.ubicacion_actual.rumbo = trk.rumbo;
          v.ubicacion_actual.ultima_actualizacion = 'Hace 5 seg';
          changed = true;
        }
      }
    });

    if (changed) {
      this.notify();
    }
  }

  /**
   * Sincronizar estado completo a Firebase Firestore
   */

  public async hydrateFromFirestore(): Promise<void> {
    try {
      const { fetchUsuariosFromFirestore, fetchVehiculosFromFirestore, fetchBasesFromFirestore, fetchCooperativasFromFirestore } = await import('./firebase');
      
      const [fsUsuarios, fsVehiculos, fsBases, fsCooperativas, fsTurnos, fsAlertas, fsVehiculosPendientes] = await Promise.all([
        fetchUsuariosFromFirestore(),
        fetchVehiculosFromFirestore(),
        fetchBasesFromFirestore(),
        fetchCooperativasFromFirestore(),
        import('./firebase').then(m => m.fetchTurnosFromFirestore ? m.fetchTurnosFromFirestore() : []),
        import('./firebase').then(m => m.fetchAlertasFromFirestore ? m.fetchAlertasFromFirestore() : []),
        import('./firebase').then(m => m.fetchVehiculosPendientesFromFirestore ? m.fetchVehiculosPendientesFromFirestore() : [])
      ]);

      if (fsCooperativas && fsCooperativas.length > 0) {
        this.cooperativas = fsCooperativas;
        saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
      }
      
      if (fsBases && fsBases.length > 0) {
        this.bases = fsBases;
        saveStorage(STORAGE_KEYS.BASES, this.bases);
      }

      if (fsUsuarios && fsUsuarios.length > 0) {
        this.usuarios = fsUsuarios;
        saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
      }

      if (fsVehiculos && fsVehiculos.length > 0) {
        this.vehiculos = fsVehiculos;
        saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
      }

      if (fsTurnos && fsTurnos.length > 0) {
        this.turnos = fsTurnos;
        saveStorage(STORAGE_KEYS.TURNOS, this.turnos);
      }

      if (fsAlertas && fsAlertas.length > 0) {
        this.alertasTracking = fsAlertas;
        saveStorage(STORAGE_KEYS.ALERTAS_TRACKING, this.alertasTracking);
      }

      if (fsVehiculosPendientes && fsVehiculosPendientes.length > 0) {
        this.vehiculosPendientes = fsVehiculosPendientes;
        saveStorage(STORAGE_KEYS.VEHICULOS_PENDIENTES, this.vehiculosPendientes);
      }

      this.notify();
    } catch (e) {
      console.error('Error hydrating store from firestore:', e);
    }
  }

  public async syncAllToFirestore(): Promise<{ success: boolean; message: string }> {
    try {
      for (const coop of this.cooperativas) {
        await syncCooperativaToFirestore(coop).catch(() => {});
      }
      for (const base of this.bases) {
        await syncBaseToFirestore(base).catch(() => {});
      }
      for (const user of this.usuarios) {
        await syncUsuarioToFirestore(user).catch(() => {});
      }
      for (const veh of this.vehiculos) {
        await syncVehiculoToFirestore(veh).catch(() => {});
      }
      for (const sol of this.vehiculosPendientes) {
        await syncVehiculoPendienteToFirestore(sol).catch(() => {});
      }
      for (const turno of this.turnos) {
        await syncTurnoToFirestore(turno).catch(() => {});
      }
      for (const geo of this.geocercas) {
        await syncGeocercaToFirestore(geo).catch(() => {});
      }
      for (const alt of this.alertasTracking) {
        await syncAlertaTrackingToFirestore(alt).catch(() => {});
      }
      for (const hist of this.trackingHistorial) {
        await syncTrackingHistorialToFirestore(hist).catch(() => {});
      }
      return { success: true, message: 'Base de datos Firestore y colecciones de Tracking sincronizadas con éxito.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: 'Error en sincronización Firestore: ' + msg };
    }
  }

  /**
   * Vaciar búfer offline de tracking GPS y subir a Firestore cuando recupera conectividad
   */
  public async flushOfflineTrackingBufferToFirestore(): Promise<{ flushedCount: number }> {
    const bufferedPoints = flushOfflineBuffer();
    if (!bufferedPoints || bufferedPoints.length === 0) {
      return { flushedCount: 0 };
    }

    bufferedPoints.forEach(pt => {
      const hist = this.trackingHistorial.find(h => h.cooperativaId === pt.cooperativaId && h.puntos);
      if (hist) {
        hist.puntos.push({
          lat: pt.lat,
          lng: pt.lng,
          timestamp: pt.timestamp,
          velocidad: pt.velocidad,
          pasajeros: pt.pasajeros
        });
      }
    });

    saveStorage(STORAGE_KEYS.TRACKING_HISTORIAL, this.trackingHistorial);
    this.addAuditLog('OFFLINE_GPS_SYNC', `Sincronizados ${bufferedPoints.length} pings GPS acumulados en el búfer offline.`);
    this.notify();

    for (const hist of this.trackingHistorial) {
      await syncTrackingHistorialToFirestore(hist).catch(() => {});
    }

    return { flushedCount: bufferedPoints.length };
  }

  // ═══════════════════════════════════════════════════════
  // MÓDULO FINANCIERO: LIQUIDACIONES, ARQUEOS Y CAJA
  // ═══════════════════════════════════════════════════════

  public getLiquidacionesViajes(): LiquidacionViaje[] {
    return [...this.liquidaciones];
  }

  public guardarLiquidacionViaje(liq: LiquidacionViaje): void {
    const idx = this.liquidaciones.findIndex(l => l.id === liq.id || (l.despacho_id && l.despacho_id === liq.despacho_id));
    if (idx >= 0) {
      this.liquidaciones[idx] = { ...liq };
    } else {
      this.liquidaciones.unshift({ ...liq });
    }
    saveStorage(STORAGE_KEYS.LIQUIDACIONES, this.liquidaciones);
    this.addAuditLog('LIQUIDACION_CARRERA', `Liquidación generada para Unidad #${liq.numero_unidad} - Bruto: $${liq.recaudacion_bruta.toFixed(2)}`);
    this.notify();
  }

  public getArqueosTurno(): ArqueoTurnoChofer[] {
    return [...this.arqueos];
  }

  public guardarArqueoTurno(arq: ArqueoTurnoChofer): void {
    const idx = this.arqueos.findIndex(a => a.id === arq.id);
    if (idx >= 0) {
      this.arqueos[idx] = { ...arq };
    } else {
      this.arqueos.unshift({ ...arq });
    }
    saveStorage(STORAGE_KEYS.ARQUEOS, this.arqueos);
    this.addAuditLog('ARQUEO_TURNO', `Arqueo de turno completado por chofer ${arq.chofer_nombre} para Unidad #${arq.numero_unidad}`);
    this.notify();
  }

  public confirmarRecepcionArqueo(arqId: string): void {
    const arq = this.arqueos.find(a => a.id === arqId);
    if (arq) {
      arq.estado_entrega = 'confirmado_socio';
      saveStorage(STORAGE_KEYS.ARQUEOS, this.arqueos);
      this.addAuditLog('RECEPCION_DINERO_SOCIO', `Socio confirmó recepción de dinero para arqueo #${arqId} de Unidad #${arq.numero_unidad}`);
      this.notify();
    }
  }

  public getVehiculos(): Vehiculo[] {
    return [...this.vehiculos];
  }

  public getUsuarios(): Usuario[] {
    return [...this.usuarios];
  }

  public getGastosTurno(): GastoTurno[] {
    return [...this.gastos];
  }

  public registrarGastoTurno(gasto: GastoTurno): void {
    this.gastos.unshift(gasto);
    saveStorage(STORAGE_KEYS.GASTOS, this.gastos);
    this.addAuditLog('GASTO_TURNO', `Gasto registrado: ${gasto.descripcion} por $${gasto.monto.toFixed(2)} (${gasto.tipo})`);
    this.notify();
  }

  public eliminarGastoTurno(gastoId: string): void {
    this.gastos = this.gastos.filter(g => g.id !== gastoId);
    saveStorage(STORAGE_KEYS.GASTOS, this.gastos);
    this.notify();
  }

  public getConfigFinancieraCoop(coopId?: string): ConfiguracionFinancieraCoop {
    const id = coopId || this.currentCoopId || 'coop-daule';
    return this.configFinanciera[id] || {
      cooperativaId: id,
      cuota_admin_por_carrera: 0.15,
      cuota_admin_diaria_unidad: 2.50,
      fondo_auxilio_por_carrera: 0.05,
      fondo_multa_retraso_salida: 1.00,
      porcentaje_comision_chofer_defecto: 30,
      permite_gastos_sin_foto: true
    };
  }

  public guardarConfigFinancieraCoop(config: ConfiguracionFinancieraCoop): void {
    this.configFinanciera[config.cooperativaId] = { ...config };
    saveStorage(STORAGE_KEYS.CONFIG_FINANCIERA, this.configFinanciera);
    this.addAuditLog('CONFIG_FINANCIERA', `Parámetros financieros actualizados para Cooperativa ${config.cooperativaId}`);
    this.notify();
  }

  public cerrarDespacho(despachoId: string, data?: Partial<Despacho>): void {
    const desp = this.despachos.find(d => d.id === despachoId);
    if (desp) {
      desp.estado = 'cerrado';
      if (data) {
        Object.assign(desp, data);
      }
      saveStorage(STORAGE_KEYS.DESPACHOS, this.despachos);
      this.addAuditLog('CERRAR_DESPACHO', `Despacho ${despachoId} cerrado satisfactoriamente.`);
      this.notify();
    }
  }

  // ═══════════════════════════════════════════════════════
  // MÓDULO DE PASAJEROS FRECUENTES
  // ═══════════════════════════════════════════════════════

  public getPasajerosFrecuentes(coopId?: string): PasajeroFrecuente[] {
    const id = coopId || this.currentCoopId;
    return this.pasajerosFrecuentes.filter(p => !id || p.cooperativaId === id);
  }

  public getPasajeroById(id: string): PasajeroFrecuente | undefined {
    return this.pasajerosFrecuentes.find(p => p.id === id);
  }

  public buscarPasajeros(query: string, coopId?: string): PasajeroFrecuente[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const list = this.getPasajerosFrecuentes(coopId);
    return list.filter(p => 
      p.nombre_completo.toLowerCase().includes(q) ||
      p.telefono.includes(q) ||
      (p.cedula && p.cedula.includes(q)) ||
      (p.contacto_empresa_nombre && p.contacto_empresa_nombre.toLowerCase().includes(q))
    );
  }

  public crearPasajeroFrecuente(datos: Partial<PasajeroFrecuente>): PasajeroFrecuente {
    const coopId = datos.cooperativaId || this.currentCoopId || 'coop-daule';
    
    // Regla: 1 teléfono = 1 pasajero por cooperativa
    if (datos.telefono) {
      const existing = this.pasajerosFrecuentes.find(p => p.cooperativaId === coopId && p.telefono.trim() === datos.telefono?.trim());
      if (existing) {
        throw new Error(`Ya existe un pasajero registrado con el teléfono ${datos.telefono} en esta cooperativa.`);
      }
    }

    const nuevo: PasajeroFrecuente = {
      id: datos.id || `pax-${Date.now().toString(36)}`,
      cooperativaId: coopId,
      nombre_completo: datos.nombre_completo || 'Pasajero Sin Nombre',
      telefono: datos.telefono || '',
      cedula: datos.cedula || null,
      email: datos.email || null,
      tipo: datos.tipo || 'frecuente',
      puntos_recogida: datos.puntos_recogida || [],
      preferencia_asiento: datos.preferencia_asiento || 'indistinto',
      preferencia_chofer_id: datos.preferencia_chofer_id || null,
      preferencia_horario: datos.preferencia_horario || null,
      notas: datos.notas || '',
      tiene_credito: !!datos.tiene_credito,
      cupo_mensual: datos.cupo_mensual || 0,
      precio_pactado: datos.precio_pactado !== undefined ? datos.precio_pactado : null,
      saldo_pendiente: datos.saldo_pendiente || 0,
      contacto_empresa_nombre: datos.contacto_empresa_nombre,
      contacto_empresa_telefono: datos.contacto_empresa_telefono,
      dia_corte_pago: datos.dia_corte_pago || 15,
      total_viajes: datos.total_viajes || 0,
      ultimo_viaje: datos.ultimo_viaje || null,
      primera_fecha: datos.primera_fecha || new Date().toISOString().split('T')[0],
      estado: datos.estado || 'activo',
      creado_por: datos.creado_por || this.currentUserId || 'usr-admin',
      timestamp: datos.timestamp || new Date().toISOString()
    };

    this.pasajerosFrecuentes.unshift(nuevo);
    saveStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, this.pasajerosFrecuentes);
    this.addAuditLog('CREAR_PASAJERO_FRECUENTE', `Pasajero registrado: ${nuevo.nombre_completo} (${nuevo.tipo}) - Tel: ${nuevo.telefono}`);
    this.notify();
    return nuevo;
  }

  public actualizarPasajeroFrecuente(id: string, datos: Partial<PasajeroFrecuente>): void {
    const idx = this.pasajerosFrecuentes.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.pasajerosFrecuentes[idx] = {
        ...this.pasajerosFrecuentes[idx],
        ...datos
      };
      saveStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, this.pasajerosFrecuentes);
      this.addAuditLog('ACTUALIZAR_PASAJERO', `Actualizado pasajero ${this.pasajerosFrecuentes[idx].nombre_completo}`);
      this.notify();
    }
  }

  public eliminarPasajeroFrecuente(id: string): void {
    const p = this.pasajerosFrecuentes.find(x => x.id === id);
    this.pasajerosFrecuentes = this.pasajerosFrecuentes.filter(x => x.id !== id);
    saveStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, this.pasajerosFrecuentes);
    if (p) {
      this.addAuditLog('ELIMINAR_PASAJERO', `Pasajero eliminado: ${p.nombre_completo}`);
    }
    this.notify();
  }

  // ═══════════════════════════════════════════════════════
  // GESTIÓN DE RESERVAS
  // ═══════════════════════════════════════════════════════

  public getReservas(coopId?: string): Reserva[] {
    const id = coopId || this.currentCoopId;
    return this.reservas.filter(r => !id || r.cooperativaId === id);
  }

  public getReservasPorFecha(fecha: string, coopId?: string): Reserva[] {
    return this.getReservas(coopId).filter(r => r.fecha === fecha);
  }

  public crearReserva(datos: Partial<Reserva>): Reserva {
    const coopId = datos.cooperativaId || this.currentCoopId || 'coop-daule';
    const nueva: Reserva = {
      id: datos.id || `res-${Date.now().toString(36)}`,
      cooperativaId: coopId,
      pasajero_id: datos.pasajero_id || '',
      pasajero_nombre: datos.pasajero_nombre || '',
      pasajero_telefono: datos.pasajero_telefono || '',
      pasajero_tipo: datos.pasajero_tipo || 'frecuente',
      fecha: datos.fecha || new Date().toISOString().split('T')[0],
      hora_deseada: datos.hora_deseada || '06:30',
      hora_limite: datos.hora_limite || '06:45',
      punto_recogida: datos.punto_recogida || {
        nombre: 'Punto de recogida',
        lat: -2.1384,
        lng: -79.8967,
        referencia: 'Base'
      },
      base_origen_id: datos.base_origen_id || 'base-sauces',
      ruta_id: datos.ruta_id || 'ruta-1',
      ruta_nombre: datos.ruta_nombre || 'Sauces ↔ Centro Guayaquil',
      cantidad_pasajeros: datos.cantidad_pasajeros || 1,
      estado: datos.estado || 'pendiente',
      turno_asignado_id: datos.turno_asignado_id || null,
      unidad_asignada_id: datos.unidad_asignada_id || null,
      numero_unidad: datos.numero_unidad,
      placa_unidad: datos.placa_unidad,
      chofer_asignado_id: datos.chofer_asignado_id || null,
      chofer_nombre: datos.chofer_nombre,
      chofer_telefono: datos.chofer_telefono,
      notificacion_whatsapp_enviada: false,
      hora_notificacion: null,
      es_credito_empresa: !!datos.es_credito_empresa,
      monto_tarifa: datos.monto_tarifa || 0,
      observaciones: datos.observaciones || '',
      creada_por: datos.creada_por || 'despachador',
      fecha_creacion: new Date().toISOString(),
      fecha_asignacion: datos.fecha_asignacion || null,
      fecha_recogida: null,
      motivo_cancelacion: null,
      cancelada_por: null
    };

    // Auto-registrar punto frecuente si acumula uso
    if (nueva.punto_recogida && nueva.punto_recogida.lat) {
      this.detectarOActualizarPuntoFrecuente(
        nueva.punto_recogida.lat,
        nueva.punto_recogida.lng,
        nueva.punto_recogida.nombre,
        nueva.pasajero_id
      );
    }

    this.reservas.unshift(nueva);
    saveStorage(STORAGE_KEYS.RESERVAS, this.reservas);
    this.addAuditLog('CREAR_RESERVA', `Reserva creada para ${nueva.pasajero_nombre} - ${nueva.fecha} ${nueva.hora_deseada} en ${nueva.punto_recogida.nombre}`);

    // Si tiene WhatsApp habilitado, registrar log automático
    const cfg = this.getConfigPasajeros(coopId);
    if (cfg.whatsapp_habilitado && nueva.pasajero_telefono) {
      const msg = interpolateWhatsAppTemplate(cfg.plantilla_mensajes.reserva_confirmada, {
        nombre: nueva.pasajero_nombre,
        fecha: nueva.fecha,
        hora: nueva.hora_deseada,
        punto: nueva.punto_recogida.nombre
      });
      this.registrarWhatsAppLog({
        cooperativaId: coopId,
        tipo: 'reserva_confirmada',
        destinatario_nombre: nueva.pasajero_nombre || 'Pasajero',
        destinatario_telefono: nueva.pasajero_telefono,
        mensaje: msg,
        estado: 'entregado',
        whatsapp_message_id: `wamid.sim_${Date.now()}`
      });
      nueva.notificacion_whatsapp_enviada = true;
      nueva.hora_notificacion = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    this.notify();
    return nueva;
  }

  public asignarReservaATurno(
    reservaId: string,
    turnoId: string,
    vehiculoId: string,
    choferId: string
  ): void {
    const res = this.reservas.find(r => r.id === reservaId);
    if (!res) return;

    const veh = this.vehiculos.find(v => v.id === vehiculoId);
    const chof = this.usuarios.find(u => u.uid === choferId);

    res.estado = 'asignada';
    res.turno_asignado_id = turnoId;
    res.unidad_asignada_id = vehiculoId;
    res.numero_unidad = veh?.numero_unidad || 'S/N';
    res.placa_unidad = veh?.placa || '';
    res.chofer_asignado_id = choferId;
    res.chofer_nombre = chof?.nombre_completo || 'Chofer';
    res.chofer_telefono = chof?.telefono || '';
    res.fecha_asignacion = new Date().toISOString();

    saveStorage(STORAGE_KEYS.RESERVAS, this.reservas);
    this.addAuditLog('ASIGNAR_RESERVA', `Reserva #${reservaId} (${res.pasajero_nombre}) asignada a Unidad #${res.numero_unidad}`);

    // WhatsApp al asignar unidad
    const cfg = this.getConfigPasajeros(res.cooperativaId);
    if (cfg.whatsapp_habilitado && cfg.notificar_pasajero.al_asignar_unidad && res.pasajero_telefono) {
      const msg = interpolateWhatsAppTemplate(cfg.plantilla_mensajes.unidad_asignada, {
        nombre: res.pasajero_nombre,
        numero: res.numero_unidad,
        placa: res.placa_unidad,
        hora: res.hora_deseada,
        punto: res.punto_recogida.nombre,
        chofer: res.chofer_nombre
      });
      this.registrarWhatsAppLog({
        cooperativaId: res.cooperativaId,
        tipo: 'unidad_asignada',
        destinatario_nombre: res.pasajero_nombre || 'Pasajero',
        destinatario_telefono: res.pasajero_telefono,
        mensaje: msg,
        estado: 'entregado',
        whatsapp_message_id: `wamid.asig_${Date.now()}`
      });
    }

    this.notify();
  }

  public marcarRecogidaReserva(reservaId: string, choferId?: string): void {
    const res = this.reservas.find(r => r.id === reservaId);
    if (!res) return;

    res.estado = 'recogida';
    res.fecha_recogida = new Date().toISOString();

    // Actualizar conteo de viajes del pasajero
    if (res.pasajero_id) {
      const pax = this.pasajerosFrecuentes.find(p => p.id === res.pasajero_id);
      if (pax) {
        pax.total_viajes += res.cantidad_pasajeros;
        pax.ultimo_viaje = new Date().toISOString();
        if (res.es_credito_empresa && res.monto_tarifa) {
          pax.saldo_pendiente += res.monto_tarifa;
        }
        saveStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, this.pasajerosFrecuentes);
      }
    }

    saveStorage(STORAGE_KEYS.RESERVAS, this.reservas);
    this.addAuditLog('RECOGIDA_PASAJERO', `Pasajero recogido para reserva #${reservaId}: ${res.pasajero_nombre} (${res.cantidad_pasajeros} pax)`);
    this.notify();
  }

  public marcarNoShowReserva(reservaId: string, motivo = 'No se presentó al punto'): void {
    const res = this.reservas.find(r => r.id === reservaId);
    if (!res) return;

    res.estado = 'no_show';
    res.motivo_cancelacion = motivo;
    saveStorage(STORAGE_KEYS.RESERVAS, this.reservas);

    // Si tiene 3 no-shows seguidos, alertar o bloquear
    if (res.pasajero_id) {
      const pastNoShows = this.reservas.filter(r => r.pasajero_id === res.pasajero_id && r.estado === 'no_show').length;
      if (pastNoShows >= 3) {
        this.addAuditLog('ALERTA_NO_SHOW_REPETIDO', `Pasajero ${res.pasajero_nombre} acumula ${pastNoShows} no-shows consecutivos.`);
      }
    }

    this.addAuditLog('NO_SHOW_RESERVA', `No-show en reserva #${reservaId} (${res.pasajero_nombre}): ${motivo}`);
    this.notify();
  }

  public cancelarReserva(reservaId: string, motivo: string, usuarioId?: string): void {
    const res = this.reservas.find(r => r.id === reservaId);
    if (!res) return;

    res.estado = 'cancelada';
    res.motivo_cancelacion = motivo;
    res.cancelada_por = usuarioId || this.currentUserId;
    saveStorage(STORAGE_KEYS.RESERVAS, this.reservas);
    this.addAuditLog('CANCELAR_RESERVA', `Reserva #${reservaId} cancelada. Motivo: ${motivo}`);
    this.notify();
  }

  // ═══════════════════════════════════════════════════════
  // PUNTOS DE RECOGIDA FRECUENTES & MAPA DE CALOR
  // ═══════════════════════════════════════════════════════

  public getPuntosRecogidaFrecuentes(coopId?: string): PuntoRecogidaFrecuente[] {
    const id = coopId || this.currentCoopId;
    return this.puntosRecogidaFrecuentes.filter(p => !id || p.cooperativaId === id);
  }

  public crearPuntoRecogidaFrecuente(punto: Partial<PuntoRecogidaFrecuente>): PuntoRecogidaFrecuente {
    const nuevo: PuntoRecogidaFrecuente = {
      id: punto.id || `prf-${Date.now().toString(36)}`,
      cooperativaId: punto.cooperativaId || this.currentCoopId || 'coop-daule',
      nombre: punto.nombre || 'Punto Frecuente',
      lat: punto.lat || -2.1384,
      lng: punto.lng || -79.8967,
      radio: punto.radio || 50,
      total_recogidas: punto.total_recogidas || 1,
      pasajeros_que_usan: punto.pasajeros_que_usan || [],
      ultima_recogida: punto.ultima_recogida || new Date().toISOString(),
      activa: punto.activa !== undefined ? punto.activa : true,
      creada_por: punto.creada_por || 'admin'
    };

    this.puntosRecogidaFrecuentes.unshift(nuevo);
    saveStorage(STORAGE_KEYS.PUNTOS_RECOGIDA_FRECUENTES, this.puntosRecogidaFrecuentes);
    this.notify();
    return nuevo;
  }

  public detectarOActualizarPuntoFrecuente(
    lat: number,
    lng: number,
    nombre: string,
    pasajeroId?: string
  ): void {
    const match = this.puntosRecogidaFrecuentes.find(p => {
      const d = Math.sqrt(Math.pow(p.lat - lat, 2) + Math.pow(p.lng - lng, 2)) * 111000;
      return d <= (p.radio || 60);
    });

    if (match) {
      match.total_recogidas += 1;
      match.ultima_recogida = new Date().toISOString();
      if (pasajeroId && !match.pasajeros_que_usan.includes(pasajeroId)) {
        match.pasajeros_que_usan.push(pasajeroId);
      }
      saveStorage(STORAGE_KEYS.PUNTOS_RECOGIDA_FRECUENTES, this.puntosRecogidaFrecuentes);
    } else {
      this.crearPuntoRecogidaFrecuente({
        nombre,
        lat,
        lng,
        radio: 50,
        total_recogidas: 1,
        pasajeros_que_usan: pasajeroId ? [pasajeroId] : [],
        creada_por: 'sistema'
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // NOTIFICACIONES WHATSAPP LOGS
  // ═══════════════════════════════════════════════════════

  public getWhatsAppLogs(coopId?: string): NotificacionWhatsAppLog[] {
    const id = coopId || this.currentCoopId;
    return this.whatsappLogs.filter(l => !id || l.cooperativaId === id);
  }

  public registrarWhatsAppLog(log: Omit<NotificacionWhatsAppLog, 'id' | 'timestamp'>): NotificacionWhatsAppLog {
    const nuevo: NotificacionWhatsAppLog = {
      ...log,
      id: `wlog-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString()
    };
    this.whatsappLogs.unshift(nuevo);
    saveStorage(STORAGE_KEYS.WHATSAPP_LOGS, this.whatsappLogs);
    this.notify();
    return nuevo;
  }

  // ═══════════════════════════════════════════════════════
  // CONFIGURACIÓN DE PASAJEROS
  // ═══════════════════════════════════════════════════════

  public getConfigPasajeros(coopId?: string): ConfiguracionPasajeros {
    const id = coopId || this.currentCoopId || 'coop-daule';
    return this.configPasajeros[id] || {
      ...CONFIG_PASAJEROS_DEFAULT,
      cooperativaId: id
    };
  }

  public guardarConfigPasajeros(config: ConfiguracionPasajeros): void {
    this.configPasajeros[config.cooperativaId] = { ...config };
    saveStorage(STORAGE_KEYS.CONFIG_PASAJEROS, this.configPasajeros);
    this.addAuditLog('CONFIG_PASAJEROS', `Configuración de pasajeros y WhatsApp actualizada para ${config.cooperativaId}`);
    this.notify();
  }

  // ═══════════════════════════════════════════════════════
  // GESTIÓN DE CRÉDITO Y PAGOS EMPRESAS
  // ═══════════════════════════════════════════════════════

  public getPagosEmpresas(coopId?: string): PagoCreditoEmpresa[] {
    return [...this.pagosEmpresas];
  }

  public registrarPagoEmpresa(pago: Omit<PagoCreditoEmpresa, 'id'>): PagoCreditoEmpresa {
    const nuevo: PagoCreditoEmpresa = {
      ...pago,
      id: `pag-emp-${Date.now().toString(36)}`
    };

    const pax = this.pasajerosFrecuentes.find(p => p.id === pago.empresa_id);
    if (pax) {
      pax.saldo_pendiente = Math.max(0, pax.saldo_pendiente - pago.monto);
      saveStorage(STORAGE_KEYS.PASAJEROS_FRECUENTES, this.pasajerosFrecuentes);
    }

    this.pagosEmpresas.unshift(nuevo);
    saveStorage(STORAGE_KEYS.PAGOS_EMPRESAS, this.pagosEmpresas);
    this.addAuditLog('PAGO_CREDITO_EMPRESA', `Pago registrado para ${pago.empresa_nombre} por $${pago.monto.toFixed(2)} - Comp: ${pago.comprobante}`);
    this.notify();
    return nuevo;
  }

  // ═══════════════════════════════════════════════════════
  // MÓDULO DE SEGURIDAD SOS, ANTIRROBO BIOMÉTRICO Y NOTIFICACIONES
  // ═══════════════════════════════════════════════════════

  public getAlertasSeguridad(coopId?: string): AlertaSeguridad[] {
    const id = coopId || this.currentCoopId;
    return this.alertasSeguridad.filter(a => a.cooperativaId === id);
  }

  public getAlertasSeguridadActivas(coopId?: string): AlertaSeguridad[] {
    const id = coopId || this.currentCoopId;
    return this.alertasSeguridad.filter(a => a.cooperativaId === id && a.estado === 'activa');
  }

  public activarSOS(
    choferId: string,
    unidadId: string,
    lat: number,
    lng: number,
    direccion?: string,
    motivo?: string
  ): AlertaSeguridad {
    const chofer = this.usuarios.find(u => u.uid === choferId);
    const vehiculo = this.vehiculos.find(v => v.id === unidadId || v.numero_unidad === unidadId);
    const socio = this.usuarios.find(u => u.uid === vehiculo?.socio_id);
    const coopId = vehiculo?.cooperativaId || chofer?.cooperativaId || this.currentCoopId;
    const config = this.getConfigSeguridad(coopId);

    const nuevaAlerta: AlertaSeguridad = {
      id: `alt-sos-${Date.now().toString(36)}`,
      cooperativaId: coopId,
      unidadId: vehiculo?.id || unidadId,
      unidadNumero: vehiculo?.numero_unidad || unidadId,
      placa: vehiculo?.placa || 'G-0000',
      choferId,
      choferNombre: chofer?.nombre_completo || 'Conductor en Turno',
      socioId: vehiculo?.socio_id || 'usr-socio',
      socioNombre: socio?.nombre_completo || 'Socio Propietario',
      tipo: 'sos_accidente',
      subtipo: null,
      motivo_detalle: motivo || '¡BOTÓN ROJO SOS ACTIVADO! Posible emergencia o asalto en curso.',
      lat,
      lng,
      direccion_referencia: direccion || 'Av. Principal en Ruta Sauces-Centro',
      timestamp_activacion: new Date().toISOString(),
      timestamp_atencion: null,
      timestamp_cierre: null,
      estado: 'activa',
      atendida_por: null,
      atendida_por_nombre: null,
      cerrada_por: null,
      cerrada_por_nombre: null,
      audio_url: 'blob:audio/sos_live.wav',
      audio_urls: [
        {
          id: `aud-${Date.now()}`,
          url: 'blob:audio/sos_live.wav',
          timestamp: new Date().toISOString(),
          duracion_seg: 10,
          titulo: 'Audio Ambiente SOS'
        }
      ],
      puntos_gps_robos: [
        { lat, lng, velocidad: 0, timestamp: new Date().toISOString() }
      ],
      duracion_min: 0,
      tipo_desactivacion: null,
      mensaje_coaccion: null,
      contactos_notificados: [
        { tipo: 'admin', nombre: 'Central Base', telefono: '0990000000', notificado_en: new Date().toISOString(), respondio: true },
        { tipo: 'socio', nombre: socio?.nombre_completo || 'Dueño', telefono: socio?.telefono || '0980000000', notificado_en: new Date().toISOString(), respondio: false }
      ],
      resolucion: null,
      observaciones_cierre: '',
      pdf_reporte_url: null,
      prioridad: 'alta'
    };

    this.alertasSeguridad.unshift(nuevaAlerta);
    if (vehiculo) {
      vehiculo.sos_activo = true;
      saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
    }
    saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);

    // Integración con flujo de SOS unificado (alertas)
    const emerAlert: AlertaEmergencia = {
      id: `alt-uni-${nuevaAlerta.id}`,
      cooperativaId: nuevaAlerta.cooperativaId,
      vehiculo_id: nuevaAlerta.unidadId,
      chofer_id: nuevaAlerta.choferId,
      chofer_nombre: nuevaAlerta.choferNombre,
      numero_unidad: nuevaAlerta.unidadNumero,
      tipo: 'SOS_ROJO',
      mensaje: nuevaAlerta.motivo_detalle || '¡SOS ACTIVADO!',
      lat: nuevaAlerta.lat,
      lng: nuevaAlerta.lng,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      atendida: false
    };
    this.alertas.unshift(emerAlert);

    // Actualizar estado de tracking en vivo a emergencia
    this.updateTrackingLive(nuevaAlerta.cooperativaId, nuevaAlerta.unidadId, { estado: 'emergencia' });

    // Registrar como mensaje de conductor para el chat
    this.mensajesConductorBase.unshift({
      id: `msg-sos-${Date.now()}`,
      cooperativaId: nuevaAlerta.cooperativaId,
      chofer_id: emerAlert.chofer_id || 'chofer',
      chofer_nombre: nuevaAlerta.choferNombre,
      conductor_id: emerAlert.chofer_id || 'chofer',
      conductor_nombre: nuevaAlerta.choferNombre,
      vehiculo_id: nuevaAlerta.unidadId,
      unidad_numero: nuevaAlerta.unidadNumero,
      placa: vehiculo?.placa || 'PLACA-SOS',
      destinatario_base: 'ambas',
      destinatario_nombre: 'Todas las Bases',
      texto: `🚨 EMERGENCY SOS ACTIVATED: ${nuevaAlerta.motivo_detalle}`,
      tipo: 'libre',
      timestamp: emerAlert.timestamp,
      hora: emerAlert.timestamp,
      fecha: new Date().toLocaleDateString(),
      estado: 'pendiente',
      leido: false,
    });

    // Reproducir sirena si la config lo permite
    if (config.notificar_contactos?.admin) {
      playSecurityAlarm('sos');
    }

    // Registrar log
    this.addLogSeguridad('sos_activado', `Alerta SOS Activada por Conductor ${chofer?.nombre_completo || choferId} en Unidad ${vehiculo?.numero_unidad || unidadId}`, choferId, vehiculo?.id, lat, lng);
    this.addAuditLog('ALERTA_SOS', `¡EMERGENCIA SOS! Unidad ${vehiculo?.numero_unidad || unidadId} en (${lat.toFixed(4)}, ${lng.toFixed(4)})`);

    this.notify();
    return nuevaAlerta;
  }

  public activarAntirrobo(
    choferId: string,
    unidadId: string,
    lat: number,
    lng: number,
    direccion?: string
  ): AlertaSeguridad {
    const chofer = this.usuarios.find(u => u.uid === choferId);
    const vehiculo = this.vehiculos.find(v => v.id === unidadId || v.numero_unidad === unidadId);
    const socio = this.usuarios.find(u => u.uid === vehiculo?.socio_id);
    const coopId = vehiculo?.cooperativaId || chofer?.cooperativaId || this.currentCoopId;
    const config = this.getConfigSeguridad(coopId);

    const nuevaAlerta: AlertaSeguridad = {
      id: `alt-robo-${Date.now().toString(36)}`,
      cooperativaId: coopId,
      unidadId: vehiculo?.id || unidadId,
      unidadNumero: vehiculo?.numero_unidad || unidadId,
      placa: vehiculo?.placa || 'G-0000',
      choferId,
      choferNombre: chofer?.nombre_completo || 'Conductor en Turno',
      socioId: vehiculo?.socio_id || 'usr-socio',
      socioNombre: socio?.nombre_completo || 'Socio Propietario',
      tipo: 'antirrobo',
      subtipo: null,
      motivo_detalle: '🚨 MODO ANTIRROBO SILENCIOSO ACTIVADO: Teléfono del chofer bloqueado. Rastreo de alta frecuencia (3s) y micrófono activado.',
      lat,
      lng,
      direccion_referencia: direccion || 'Vía Perimetral / Av. Francisco de Orellana',
      timestamp_activacion: new Date().toISOString(),
      timestamp_atencion: null,
      timestamp_cierre: null,
      estado: 'activa',
      atendida_por: null,
      atendida_por_nombre: null,
      cerrada_por: null,
      cerrada_por_nombre: null,
      audio_url: 'blob:audio/robo_env_live.wav',
      audio_urls: [
        {
          id: `aud-robo-${Date.now()}`,
          url: 'blob:audio/robo_env_live.wav',
          timestamp: new Date().toISOString(),
          duracion_seg: 15,
          titulo: 'Audio Ambiente Antirrobo 1'
        }
      ],
      puntos_gps_robos: [
        { lat, lng, velocidad: 42, timestamp: new Date().toISOString() }
      ],
      duracion_min: 0,
      tipo_desactivacion: null,
      mensaje_coaccion: null,
      contactos_notificados: [
        { tipo: 'admin', nombre: 'Central Base', telefono: '0990000000', notificado_en: new Date().toISOString(), respondio: true },
        { tipo: 'socio', nombre: socio?.nombre_completo || 'Dueño', telefono: socio?.telefono || '0980000000', notificado_en: new Date().toISOString(), respondio: false }
      ],
      resolucion: null,
      observaciones_cierre: '',
      pdf_reporte_url: null,
      prioridad: 'alta'
    };

    this.alertasSeguridad.unshift(nuevaAlerta);
    saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);

    if (config.notificar_contactos?.admin) {
      playSecurityAlarm('critica');
    }

    this.addLogSeguridad('antirrobo_activado', `Modo Antirrobo silencioso activado por Chofer ${chofer?.nombre_completo || choferId} - Unidad ${vehiculo?.numero_unidad || unidadId}`, choferId, vehiculo?.id, lat, lng);
    this.addAuditLog('ANTIRROBO_ACTIVADO', `🚨 ANTIRROBO: Unidad ${vehiculo?.numero_unidad || unidadId} rastreada en tiempo real`);

    this.notify();
    return nuevaAlerta;
  }

  public activarAlertaAmarilla(
    choferId: string,
    unidadId: string,
    subtipo: SubtipoAlertaAmarilla,
    lat: number,
    lng: number,
    detalle?: string
  ): AlertaSeguridad {
    const chofer = this.usuarios.find(u => u.uid === choferId);
    const vehiculo = this.vehiculos.find(v => v.id === unidadId || v.numero_unidad === unidadId);
    const socio = this.usuarios.find(u => u.uid === vehiculo?.socio_id);
    const coopId = vehiculo?.cooperativaId || chofer?.cooperativaId || this.currentCoopId;

    const mapText: Record<string, string> = {
      llanta: 'Avería / Pinchazo de Llanta',
      mecanica: 'Falla Mecánica / Motor / Calentamiento',
      pasajero_conflictivo: 'Pasajero Conflictivo / Alteración del orden',
      trafico: 'Tráfico pesado / Bloqueo en ruta',
      via_cerrada: 'Vía cerrada / Desvío obligatorio',
      relevo: 'Solicitud de relevo urgente',
      accidente: 'Percance / Accidente menor',
      otro: 'Novedad en ruta'
    };

    const nuevaAlerta: AlertaSeguridad = {
      id: `alt-ama-${Date.now().toString(36)}`,
      cooperativaId: coopId,
      unidadId: vehiculo?.id || unidadId,
      unidadNumero: vehiculo?.numero_unidad || unidadId,
      placa: vehiculo?.placa || 'G-0000',
      choferId,
      choferNombre: chofer?.nombre_completo || 'Conductor en Turno',
      socioId: vehiculo?.socio_id || 'usr-socio',
      socioNombre: socio?.nombre_completo || 'Socio Propietario',
      tipo: 'alerta_amarilla',
      subtipo,
      motivo_detalle: `⚠️ ALERTA AMARILLA: ${mapText[subtipo] || subtipo}. ${detalle || ''}`,
      lat,
      lng,
      direccion_referencia: 'En ruta operativa',
      timestamp_activacion: new Date().toISOString(),
      timestamp_atencion: null,
      timestamp_cierre: null,
      estado: 'activa',
      atendida_por: null,
      atendida_por_nombre: null,
      cerrada_por: null,
      cerrada_por_nombre: null,
      audio_url: null,
      audio_urls: [],
      puntos_gps_robos: [],
      duracion_min: 0,
      tipo_desactivacion: null,
      mensaje_coaccion: null,
      contactos_notificados: [
        { tipo: 'admin', nombre: 'Central Base', telefono: '0990000000', notificado_en: new Date().toISOString(), respondio: true }
      ],
      resolucion: null,
      observaciones_cierre: '',
      pdf_reporte_url: null,
      prioridad: 'media'
    };

    this.alertasSeguridad.unshift(nuevaAlerta);
    saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);

    this.addLogSeguridad('alerta_amarilla_reportada', `Alerta Amarilla (${subtipo}): ${detalle || ''} - Unidad ${vehiculo?.numero_unidad || unidadId}`, choferId, vehiculo?.id, lat, lng);
    this.addAuditLog('ALERTA_AMARILLA', `Unidad ${vehiculo?.numero_unidad || unidadId} reportó ${subtipo}`);

    this.enviarNotificacionConductores({
      cooperativaId: coopId,
      titulo: '⚠️ ALERTA EN RUTA',
      mensaje: `El conductor ${chofer?.nombre_completo} (Unidad ${vehiculo?.numero_unidad}) reporta: ${mapText[subtipo] || subtipo}.`,
      prioridad: 'critica',
      para: 'todos',
      unidad_destino_id: null,
      requiere_confirmacion: true,
      leer_en_voz_alta: true,
      expira_en_min: 60,
      de: {
        usuario_id: choferId,
        rol: 'chofer',
        nombre: chofer?.nombre_completo || 'Conductor'
      }
    });

    this.notify();
    return nuevaAlerta;
  }

  public desactivarConHuella(
    choferId: string,
    tipoHuella: 'normal' | 'coaccion'
  ): { exito: boolean; mensaje: string; esCoaccion: boolean } {
    const huellaRec = this.huellasRegistradas.find(h => h.chofer_id === choferId);
    const alertaActiva = this.alertasSeguridad.find(a => a.choferId === choferId && a.estado === 'activa');

    if (tipoHuella === 'normal') {
      stopSecurityAlarm();

      if (alertaActiva) {
        alertaActiva.estado = 'cerrada';
        alertaActiva.resolucion = 'chofer_a_salvo';
        alertaActiva.timestamp_cierre = new Date().toISOString();
        alertaActiva.cerrada_por = choferId;
        alertaActiva.tipo_desactivacion = 'huella_normal';
        alertaActiva.observaciones_cierre = 'Alerta desactivada legítimamente mediante Huella Digital (Dedo Índice)';
        saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);
      }

      this.addLogSeguridad('huella_normal_usada', `Desactivación legítima con Huella Normal por chofer ${choferId}`, choferId, alertaActiva?.unidadId);
      this.notify();

      return {
        exito: true,
        mensaje: 'Identidad verificada. Alerta de seguridad desactivada con éxito.',
        esCoaccion: false
      };
    } else {
      if (alertaActiva) {
        alertaActiva.mensaje_coaccion = '⚠️ ¡URGENTE! EL CHOFER USÓ HUELLA DE COACCIÓN (DEDO MEDIO). ESTÁ SIENDO FORZADO BAJO AMENAZA. NO LLAMAR AL CHOFER.';
        alertaActiva.tipo_desactivacion = 'huella_coaccion';
        saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);
      }

      this.addLogSeguridad('huella_coaccion_usada', `⚠️ HUELLA DE COACCIÓN DETECTADA para chofer ${choferId}. Alerta se mantiene oculta y activa.`, choferId, alertaActiva?.unidadId);
      this.notify();

      return {
        exito: false,
        mensaje: 'Alarma de seguridad desactivada correctamente.',
        esCoaccion: true
      };
    }
  }

  public desactivarConPIN(
    choferId: string,
    pin: string
  ): { exito: boolean; mensaje: string; esCoaccion: boolean } {
    const huellaRec = this.huellasRegistradas.find(h => h.chofer_id === choferId);
    if (!huellaRec) {
      return { exito: false, mensaje: 'No hay registro de seguridad para este conductor', esCoaccion: false };
    }

    if (pin === huellaRec.pin_emergencia_6_digitos) {
      return this.desactivarConHuella(choferId, 'normal');
    } else if (pin === '9999' || pin === '999999') {
      return this.desactivarConHuella(choferId, 'coaccion');
    } else {
      return { exito: false, mensaje: 'PIN de seguridad incorrecto', esCoaccion: false };
    }
  }

  public desactivarConClaveMaestra(
    alertaId: string,
    clave: string,
    adminId: string
  ): boolean {
    const alerta = this.alertasSeguridad.find(a => a.id === alertaId);
    if (!alerta) return false;

    if (clave === '911911' || clave === '123456') {
      stopSecurityAlarm();
      alerta.estado = 'cerrada';
      alerta.resolucion = 'chofer_a_salvo';
      alerta.timestamp_cierre = new Date().toISOString();
      alerta.cerrada_por = adminId;
      alerta.tipo_desactivacion = 'clave_maestra';
      alerta.observaciones_cierre = `Desactivación autorizada con Clave Maestra de Base por ${adminId}`;
      saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);

      this.addLogSeguridad('clave_maestra_usada', `Clave Maestra usada por Administrador ${adminId} para cerrar alerta ${alertaId}`, adminId, alerta.unidadId);
      this.notify();
      return true;
    }
    return false;
  }

  public marcarAlertaAtendida(alertaId: string, usuarioId: string, motivo?: string): void {
    const alerta = this.alertasSeguridad.find(a => a.id === alertaId);
    if (alerta) {
      const usuario = this.usuarios.find(u => u.uid === usuarioId);
      alerta.estado = 'atendiendo';
      alerta.timestamp_atencion = new Date().toISOString();
      alerta.atendida_por = usuarioId;
      alerta.atendida_por_nombre = usuario?.nombre_completo || 'Operador de Central';
      if (motivo) {
        alerta.motivo_detalle = `${alerta.motivo_detalle || ''} | Operador: ${motivo}`;
      }
      saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);
      this.notify();
    }
  }

  public cerrarAlerta(
    alertaId: string,
    resolucion: ResolucionAlerta,
    observaciones: string,
    usuarioId: string
  ): void {
    const alerta = this.alertasSeguridad.find(a => a.id === alertaId);
    if (alerta) {
      const usuario = this.usuarios.find(u => u.uid === usuarioId);
      stopSecurityAlarm();
      alerta.estado = 'cerrada';
      alerta.resolucion = resolucion;
      alerta.observaciones_cierre = observaciones;
      alerta.timestamp_cierre = new Date().toISOString();
      alerta.cerrada_por = usuarioId;
      alerta.cerrada_por_nombre = usuario?.nombre_completo || 'Administrador';
      saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);

      this.addLogSeguridad('sos_activado', `Alerta ${alertaId} cerrada como ${resolucion}: ${observaciones}`, usuarioId, alerta.unidadId);
      this.notify();
    }
  }

  public marcarAlertaFalsa(alertaId: string, motivo: string, usuarioId: string): void {
    this.cerrarAlerta(alertaId, 'falsa_alarma', motivo, usuarioId);
  }

  public agregarPuntoGPSRobo(
    unidadId: string,
    lat: number,
    lng: number,
    velocidad: number = 0
  ): void {
    const alerta = this.alertasSeguridad.find(a => (a.unidadId === unidadId || a.unidadNumero === unidadId) && a.estado === 'activa');
    if (alerta) {
      alerta.lat = lat;
      alerta.lng = lng;
      alerta.puntos_gps_robos.push({
        lat,
        lng,
        velocidad,
        timestamp: new Date().toISOString()
      });
      saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);
      this.notify();
    }
  }

  public agregarAudioEvidencia(alertaId: string, duracionSeg: number = 10): void {
    const alerta = this.alertasSeguridad.find(a => a.id === alertaId);
    if (alerta) {
      alerta.audio_urls.push({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        duracion_seg: duracionSeg,
        url: `blob:audio/grabacion_${Date.now()}.wav`,
        titulo: `Evidencia Audio #${alerta.audio_urls.length + 1}`
      });
      saveStorage(STORAGE_KEYS.ALERTAS_SEGURIDAD, this.alertasSeguridad);
      this.notify();
    }
  }

  // ═══════════════════════════════════════════════════════
  // HUELLAS BIOMÉTRICAS Y PERFILES CONDUCTORES
  // ═══════════════════════════════════════════════════════

  public registrarHuellaChofer(huellas: Omit<HuellasRegistradas, 'id'>): HuellasRegistradas {
    const idx = this.huellasRegistradas.findIndex(h => h.chofer_id === huellas.chofer_id);
    const nueva: HuellasRegistradas = {
      ...huellas,
      id: idx >= 0 ? this.huellasRegistradas[idx].id : `cue-${Date.now().toString(36)}`
    };

    if (idx >= 0) {
      this.huellasRegistradas[idx] = nueva;
    } else {
      this.huellasRegistradas.unshift(nueva);
    }

    saveStorage(STORAGE_KEYS.HUELLAS_REGISTRADAS, this.huellasRegistradas);
    this.addLogSeguridad('huella_normal_usada', `Registro biométrico de huellas y PIN actualizado para conductor ${huellas.chofer_id}`, huellas.chofer_id);
    this.notify();
    return nueva;
  }

  public getHuellaChofer(choferId: string): HuellasRegistradas | undefined {
    return this.huellasRegistradas.find(h => h.chofer_id === choferId);
  }

  // ═══════════════════════════════════════════════════════
  // ZONAS DE RIESGO
  // ═══════════════════════════════════════════════════════

  public getZonasRiesgo(coopId?: string): ZonaRiesgo[] {
    const id = coopId || this.currentCoopId;
    return this.zonasRiesgo.filter(z => z.cooperativaId === id);
  }

  public crearZonaRiesgo(
    zona: Omit<ZonaRiesgo, 'id' | 'timestamp' | 'total_entradas_historico' | 'incidentes_reportados'>
  ): ZonaRiesgo {
    const nueva: ZonaRiesgo = {
      ...zona,
      id: `zn-rsg-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      total_entradas_historico: 0,
      incidentes_reportados: 0
    };

    this.zonasRiesgo.unshift(nueva);
    saveStorage(STORAGE_KEYS.ZONAS_RIESGO, this.zonasRiesgo);
    this.addAuditLog('ZONA_RIESGO_CREADA', `Zona de riesgo agregada: ${zona.nombre} (${zona.nivel_alerta.toUpperCase()})`);
    this.notify();
    return nueva;
  }

  public toggleZonaRiesgo(id: string, activa: boolean): void {
    const zona = this.zonasRiesgo.find(z => z.id === id);
    if (zona) {
      zona.activa = activa;
      saveStorage(STORAGE_KEYS.ZONAS_RIESGO, this.zonasRiesgo);
      this.notify();
    }
  }

  public eliminarZonaRiesgo(id: string): void {
    this.zonasRiesgo = this.zonasRiesgo.filter(z => z.id !== id);
    saveStorage(STORAGE_KEYS.ZONAS_RIESGO, this.zonasRiesgo);
    this.notify();
  }

  public verificarEntradaZonaRiesgo(
    lat: number,
    lng: number,
    choferId: string,
    unidadId: string
  ): ZonaRiesgo | null {
    for (const zona of this.zonasRiesgo.filter(z => z.activa)) {
      const dist = calculateDistanceMeters(lat, lng, zona.lat, zona.lng);
      if (dist <= zona.radio) {
        zona.total_entradas_historico += 1;
        saveStorage(STORAGE_KEYS.ZONAS_RIESGO, this.zonasRiesgo);

        this.addLogSeguridad('entrada_zona_riesgo', `Unidad ${unidadId} ingresó a ${zona.nombre} (${zona.nivel_alerta})`, choferId, unidadId, lat, lng);
        return zona;
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════
  // NOTIFICACIONES BASE ↔ CHOFERES
  // ═══════════════════════════════════════════════════════

  public getNotificacionesConductores(coopId?: string): NotificacionBaseConductores[] {
    const id = coopId || this.currentCoopId;
    return this.notificacionesConductores.filter(n => n.cooperativaId === id);
  }

  public enviarNotificacionConductores(
    notif: Omit<NotificacionBaseConductores, 'id' | 'timestamp' | 'leida_por' | 'no_leida_por' | 'confirmada_por'>
  ): NotificacionBaseConductores {
    const targetPendientes: PendienteLecturaNotificacion[] = [];

    if (notif.para === 'todos') {
      this.usuarios.filter(u => u.rol === 'chofer' || u.rol === 'socio').forEach(u => {
        const v = this.vehiculos.find(veh => veh.chofer_titular_id === u.uid);
        targetPendientes.push({
          chofer_id: u.uid,
          chofer_nombre: u.nombre_completo,
          unidad_id: v?.id || '',
          unidad_numero: v?.numero_unidad || ''
        });
      });
    } else if (notif.unidad_destino_id) {
      const v = this.vehiculos.find(veh => veh.id === notif.unidad_destino_id || veh.numero_unidad === notif.unidad_destino_id);
      const ch = this.usuarios.find(u => u.uid === v?.chofer_titular_id);
      targetPendientes.push({
        chofer_id: ch?.uid || '',
        chofer_nombre: ch?.nombre_completo || 'Chofer Asignado',
        unidad_id: v?.id || notif.unidad_destino_id,
        unidad_numero: v?.numero_unidad || ''
      });
    }

    const nueva: NotificacionBaseConductores = {
      ...notif,
      id: `not-drv-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      leida_por: [],
      no_leida_por: targetPendientes,
      confirmada_por: []
    };

    this.notificacionesConductores.unshift(nueva);
    saveStorage(STORAGE_KEYS.NOTIFICACIONES_CONDUCTORES, this.notificacionesConductores);

    if (notif.leer_en_voz_alta) {
      speakNotificationText(notif.mensaje);
    }

    this.addAuditLog('NOTIFICACION_CONDUCTORES', `Base envió: "${notif.titulo}" a ${notif.para}`);
    this.notify();
    return nueva;
  }

  public confirmarRecibidoNotificacion(notifId: string, choferId: string, unidadId: string): void {
    const notif = this.notificacionesConductores.find(n => n.id === notifId);
    if (notif) {
      if (!notif.confirmada_por.includes(choferId)) {
        notif.confirmada_por.push(choferId);
        notif.no_leida_por = notif.no_leida_por.filter(p => p.chofer_id !== choferId);
        
        const chofer = this.usuarios.find(u => u.uid === choferId);
        const yaEnLeidas = notif.leida_por.some(l => l.chofer_id === choferId);
        if (!yaEnLeidas) {
          notif.leida_por.push({
            chofer_id: choferId,
            chofer_nombre: chofer?.nombre_completo || 'Chofer',
            unidad_id: unidadId,
            unidad_numero: unidadId,
            timestamp_lectura: new Date().toISOString()
          });
        }

        saveStorage(STORAGE_KEYS.NOTIFICACIONES_CONDUCTORES, this.notificacionesConductores);
        this.notify();
      }
    }
  }

  public marcarLeidaNotificacion(notifId: string, choferId: string, unidadId: string): void {
    const notif = this.notificacionesConductores.find(n => n.id === notifId);
    if (notif) {
      const chofer = this.usuarios.find(u => u.uid === choferId);
      const yaEnLeidas = notif.leida_por.some(l => l.chofer_id === choferId);
      if (!yaEnLeidas) {
        notif.leida_por.push({
          chofer_id: choferId,
          chofer_nombre: chofer?.nombre_completo || 'Chofer',
          unidad_id: unidadId,
          unidad_numero: unidadId,
          timestamp_lectura: new Date().toISOString()
        });
      }
      notif.no_leida_por = notif.no_leida_por.filter(p => p.chofer_id !== choferId);
      saveStorage(STORAGE_KEYS.NOTIFICACIONES_CONDUCTORES, this.notificacionesConductores);
      this.notify();
    }
  }

  // ═══════════════════════════════════════════════════════
  // LOGS Y AUDITORÍA DE SEGURIDAD
  // ═══════════════════════════════════════════════════════

  public getLogsSeguridad(coopId?: string): LogSeguridad[] {
    const id = coopId || this.currentCoopId;
    return this.logsSeguridad.filter(l => l.cooperativaId === id);
  }

  public addLogSeguridad(
    evento: TipoEventoSeguridad,
    detalle: string,
    choferId?: string,
    unidadId?: string,
    lat?: number,
    lng?: number
  ): void {
    const chofer = this.usuarios.find(u => u.uid === choferId);
    const vehiculo = this.vehiculos.find(v => v.id === unidadId);

    const nuevo: LogSeguridad = {
      id: `log-sec-${Date.now().toString(36)}`,
      cooperativaId: this.currentCoopId,
      evento,
      chofer_id: choferId,
      chofer_nombre: chofer?.nombre_completo,
      unidad_id: unidadId,
      unidad_numero: vehiculo?.numero_unidad,
      detalle,
      timestamp: new Date().toISOString(),
      lat,
      lng
    };

    this.logsSeguridad.unshift(nuevo);
    if (this.logsSeguridad.length > 500) {
      this.logsSeguridad = this.logsSeguridad.slice(0, 500);
    }
    saveStorage(STORAGE_KEYS.LOGS_SEGURIDAD, this.logsSeguridad);
    this.notify();
  }

  // ═══════════════════════════════════════════════════════
  // CONFIGURACIÓN DE SEGURIDAD
  // ═══════════════════════════════════════════════════════

  public getConfigSeguridad(coopId?: string): ConfiguracionSeguridadCoop {
    const id = coopId || this.currentCoopId;
    if (this.configSeguridad[id]) {
      return { ...this.configSeguridad[id] };
    }
    return {
      ...CONFIG_SEGURIDAD_DEFAULT,
      cooperativaId: id
    };
  }

  public guardarConfigSeguridad(config: ConfiguracionSeguridadCoop): void {
    this.configSeguridad[config.cooperativaId] = { ...config };
    saveStorage(STORAGE_KEYS.CONFIG_SEGURIDAD, this.configSeguridad);
    this.addAuditLog('CONFIG_SEGURIDAD', `Configuración de seguridad y alertas actualizada`);
    this.notify();
  }

  // ═══════════════════════════════════════════════════════
  // MÓDULO SUPERADMIN DE COBROS Y GESTIÓN MULTI-COOPERATIVA
  // ═══════════════════════════════════════════════════════

  /**
   * 1. Contar unidades activas para una cooperativa
   */
  public contarUnidadesActivas(cooperativaId: string): number {
    const unidades = this.vehiculos.filter(v => v.cooperativaId === cooperativaId && v.estado === 'activo');
    return unidades.length;
  }

  /**
   * 2. Calcular monto mensual según vehículos ingresados por la cooperativa,
   * con prorrateo por días restantes del mes para vehículos de recién registro ($15/unidad/mes).
   */
  public calcularMontoMensual(cooperativaId: string): number {
    const suscripcion = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const plan = this.planes.find(p => p.id === (suscripcion?.plan_id || 'plan_pro_unico')) || this.planes[0];
    const precioPorUnidad = plan?.precio_por_unidad || 15;
    
    // Obtener vehículos activos de la cooperativa
    const vehiculosCoop = this.vehiculos.filter(v => v.cooperativaId === cooperativaId && v.estado !== 'inactivo');
    const unidadesActivas = vehiculosCoop.length;

    // Prorrateo si el vehículo fue ingresado en el mes corriente
    const ahora = new Date();
    const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();

    let total = 0;

    if (vehiculosCoop.length === 0) {
      total = 0; // Si no hay vehículos registrados por la cooperativa aún
    } else {
      for (const veh of vehiculosCoop) {
        if (veh.fecha_registro) {
          const fechaReg = new Date(veh.fecha_registro);
          // Si se registró en el mes actual, calcular proporcional por días usados del mes
          if (fechaReg.getFullYear() === ahora.getFullYear() && fechaReg.getMonth() === ahora.getMonth()) {
            const diasUsados = Math.max(1, diasEnMes - fechaReg.getDate() + 1);
            const cobroProrrateado = (precioPorUnidad / diasEnMes) * diasUsados;
            total += cobroProrrateado;
            continue;
          }
        }
        total += precioPorUnidad;
      }
    }

    if (suscripcion?.descuento_porcentaje && suscripcion.descuento_porcentaje > 0) {
      total = total * (1 - (suscripcion.descuento_porcentaje / 100));
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * 3. Crear nueva cooperativa desde el panel SuperAdmin
   */
  public crearCooperativa(datos: {
    nombre: string;
    ruc: string;
    direccion: string;
    presidente_nombre: string;
    presidente_cedula: string;
    presidente_celular: string;
    presidente_email: string;
    logo_url?: string;
    plan_id?: string;
    unidades_estimadas?: number;
    primer_vencimiento?: string;
    mes_gracia_inicial?: boolean;
    rutas_iniciales?: Array<{ nombre: string; tarifa_plana: number }>;
  }): { coop: Cooperativa; suscripcion: SuscripcionCooperativa; adminUser: Usuario } {
    const coopId = `coop-${datos.nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}-${Date.now().toString().slice(-4)}`;
    const plan = this.planes.find(p => p.id === (datos.plan_id || 'plan_pro_unico')) || this.planes[0];
    const precioUnidad = plan?.precio_por_unidad || 15;
    const unidadesActivas = datos.unidades_estimadas ?? 0;
    const montoCalculado = Math.round(precioUnidad * unidadesActivas * (datos.mes_gracia_inicial ? 0.5 : 1));
    const fechaInicio = new Date().toISOString();
    
    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 30);
    const fechaVenc = datos.primer_vencimiento || vencimiento.toISOString();

    const nuevaCoop: Cooperativa = {
      id: coopId,
      nombre: datos.nombre,
      ruc: datos.ruc,
      logo_url: datos.logo_url || 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=200&q=80',
      telefono: datos.presidente_celular,
      direccion: datos.direccion,
      presidente_nombre: datos.presidente_nombre,
      presidente_celular: datos.presidente_celular,
      estado: 'activa',
      fecha_creacion: new Date().toISOString().split('T')[0],
      fecha_vencimiento_suscripcion: fechaVenc.split('T')[0],
      plan: plan.nombre.toLowerCase() as any,
      telefono_emergencia: datos.presidente_celular,
      monto_deuda: 0,
      bloqueo_tipo: 'ninguno',
      historial_pagos: [],
      rutas: (datos.rutas_iniciales && datos.rutas_iniciales.length > 0)
        ? datos.rutas_iniciales.map((r, idx) => ({
            id: `ruta-${coopId}-${idx + 1}`,
            nombre: r.nombre,
            tarifa_plana: r.tarifa_plana,
            activa: true,
            fecha_vigencia: new Date().toISOString().split('T')[0]
          }))
        : [{ id: `ruta-${coopId}-1`, nombre: 'Ruta Troncal Principal', tarifa_plana: 0.50, activa: true }]
    };

    const nuevaSuscripcion: SuscripcionCooperativa = {
      id: `susc-${coopId}`,
      cooperativaId: coopId,
      plan_id: plan.id,
      precio_por_unidad: precioUnidad,
      unidades_activas: unidadesActivas,
      monto_mensual: montoCalculado,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVenc,
      dias_gracia: this.configSuperAdmin.dias_gracia_inicial || 3,
      estado_suscripcion: 'activa',
      dias_mora: 0,
      mes_gracia_inicial: datos.mes_gracia_inicial || false,
      bloqueos_historial: [],
      recordatorios_enviados: []
    };

    const adminUser: Usuario = {
      uid: `usr-admin-${coopId}`,
      cooperativaId: coopId,
      cedula: datos.presidente_cedula || '0900000000',
      nombre_completo: `${datos.presidente_nombre} (Admin)`,
      telefono: datos.presidente_celular,
      email: datos.presidente_email || `admin@${coopId}.ec`,
      rol: 'admin_coop',
      rol_secundario: null,
      base_asignada: null,
      foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      licencia_tipo: 'C',
      activo: true,
      fecha_registro: new Date().toISOString().split('T')[0],
      huella_registrada: true
    };

    // Crear base inicial
    const baseInicial: Base = {
      id: `base-${coopId}-1`,
      cooperativaId: coopId,
      nombre: `Terminal Principal ${datos.nombre}`,
      direccion: datos.direccion,
      lat: -2.1895,
      lng: -79.8890,
      radio_geocerca: 150,
      capacidad_max: 4,
      capacidad_base: 4,
      capacidad_prebase: 15,
      color_pin: '#0284C7',
      tiene_prebase: true,
      prebase: {
        nombre: 'Bahía de Espera Virtual',
        lat: -2.1930,
        lng: -79.8910,
        radio_geocerca: 200,
        capacidad_max: 15,
        distancia_a_base: 500
      },
      tiempo_max_espera_prebase: 90,
      tiempo_para_avanzar: 5,
      tiempo_max_espera_base: 15,
      tiempo_max_desembarque: 10,
      salida_incompleta_permitida: true,
      tiempo_min_forzar_salida: 15
    };

    this.cooperativas.unshift(nuevaCoop);
    this.suscripciones.unshift(nuevaSuscripcion);
    this.usuarios.push(adminUser);
    this.bases.push(baseInicial);

    saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
    saveStorage(STORAGE_KEYS.BASES, this.bases);

    this.addLogSuperAdmin(
      'crear_cooperativa',
      `Alta de nueva cooperativa "${datos.nombre}" con ${datos.unidades_estimadas} unidades estimadas en Plan ${plan.nombre}.`,
      coopId,
      null,
      nuevaSuscripcion
    );

    this.calcularMetricasGlobales();
    this.notify();

    return { coop: nuevaCoop, suscripcion: nuevaSuscripcion, adminUser };
  }

  /**
   * 4. Editar datos de cooperativa (actualización integral de datos, presidente, plan y contacto)
   */
  public editarCooperativa(cooperativaId: string, datos: Partial<Cooperativa> & {
    plan_id?: string;
    descuento_porcentaje?: number;
    motivo_descuento?: string;
  }): Cooperativa {
    const idx = this.cooperativas.findIndex(c => c.id === cooperativaId);
    if (idx === -1) throw new Error('Cooperativa no encontrada');
    const antes = { ...this.cooperativas[idx] };
    
    // Actualizar cooperativa
    this.cooperativas[idx] = { ...this.cooperativas[idx], ...datos };
    saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);

    // Actualizar suscripción si se cambió el plan o descuento
    const susc = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    if (susc) {
      if (datos.plan_id) {
        susc.plan_id = datos.plan_id;
        const plan = this.planes.find(p => p.id === datos.plan_id);
        if (plan) susc.precio_por_unidad = plan.precio_por_unidad;
      }
      if (datos.descuento_porcentaje !== undefined) {
        susc.descuento_porcentaje = Number(datos.descuento_porcentaje);
        if (datos.motivo_descuento) susc.motivo_descuento = datos.motivo_descuento;
      }
      if (datos.fecha_vencimiento_suscripcion) {
        susc.fecha_vencimiento = new Date(datos.fecha_vencimiento_suscripcion).toISOString();
      }
      susc.monto_mensual = this.calcularMontoMensual(cooperativaId);
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    }

    // Actualizar usuario admin principal si existe
    const adminUser = this.usuarios.find(u => u.cooperativaId === cooperativaId && u.rol === 'admin_coop');
    if (adminUser) {
      if (datos.presidente_nombre) adminUser.nombre_completo = `${datos.presidente_nombre} (Admin)`;
      if (datos.presidente_celular) adminUser.telefono = datos.presidente_celular;
      if (datos.presidente_cedula) adminUser.cedula = datos.presidente_cedula;
      saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
    }

    this.addLogSuperAdmin('editar_cooperativa', `Edición de datos para ${this.cooperativas[idx].nombre}`, cooperativaId, antes, this.cooperativas[idx]);

    // Enviar notificación interna a la cooperativa
    this.crearNotificacionInterna(cooperativaId, {
      tipo: 'comunicado_general',
      titulo: 'Información Institucional Actualizada',
      mensaje: `Los datos administrativos de la cooperativa "${this.cooperativas[idx].nombre}" han sido actualizados satisfactoriamente en el sistema.`,
      prioridad: 'normal',
      enviado_por: 'SuperAdmin Creador'
    });

    this.calcularMetricasGlobales();
    this.notify();
    return this.cooperativas[idx];
  }

  /**
   * 4.b. Borrado de Cooperativa preservando el Histórico Contable de Pagos para Reportes
   */
  public eliminarCooperativaCompleta(cooperativaId: string): void {
    const coop = this.cooperativas.find(c => c.id === cooperativaId);
    if (!coop) throw new Error('Cooperativa no encontrada');
    const coopNombre = coop.nombre;
    const coopRuc = coop.ruc || 'N/A';

    // 1. Preservar histórico contable de pagos aprobados antes de eliminar la cooperativa
    const pagosDeCoop = this.comprobantesPago.filter(p => p.cooperativaId === cooperativaId);
    for (const p of pagosDeCoop) {
      if (p.estado === 'aprobado') {
        p.cooperativa_eliminada = true;
        p.cooperativa_nombre_historico = coopNombre;
        p.cooperativa_ruc_historico = coopRuc;

        const yaArchivado = this.historicoPagosArchivados.some(h => h.comprobante_id === p.id);
        if (!yaArchivado) {
          this.historicoPagosArchivados.unshift({
            id: `hist-${p.id}`,
            comprobante_id: p.id,
            cooperativa_id: cooperativaId,
            cooperativa_nombre: coopNombre,
            cooperativa_ruc: coopRuc,
            monto: p.monto,
            moneda: 'USD',
            metodo: p.metodo,
            banco: p.banco,
            numero_operacion: p.numero_operacion,
            fecha_pago: p.fecha_operacion || p.fecha_subida,
            periodo_desde: p.periodo_desde,
            periodo_hasta: p.periodo_hasta,
            aprobado_por: p.revisado_por || 'usr-superadmin',
            fecha_aprobacion: p.fecha_revision || p.fecha_subida,
            unidades_facturadas: p.unidades_detalle ? p.unidades_detalle.length : undefined,
            cooperativa_eliminada: true,
            fecha_archivo: new Date().toISOString()
          });
        }
      }
    }

    // 2. Filtrar arreglos en memoria (los comprobantes aprobados se mantienen con flag de cooperativa_eliminada)
    this.cooperativas = this.cooperativas.filter(c => c.id !== cooperativaId);
    this.suscripciones = this.suscripciones.filter(s => s.cooperativaId !== cooperativaId);
    this.comprobantesPago = this.comprobantesPago.filter(p => p.cooperativaId !== cooperativaId || p.estado === 'aprobado');
    this.vehiculos = this.vehiculos.filter(v => v.cooperativaId !== cooperativaId);
    this.usuarios = this.usuarios.filter(u => u.cooperativaId !== cooperativaId);
    this.bases = this.bases.filter(b => b.cooperativaId !== cooperativaId);
    this.zonasRiesgo = this.zonasRiesgo.filter(z => z.cooperativaId !== cooperativaId);
    this.vehiculosPendientes = this.vehiculosPendientes.filter(s => s.cooperativaId !== cooperativaId);
    this.turnos = this.turnos.filter(t => t.cooperativaId !== cooperativaId);
    this.reservas = this.reservas.filter((r: any) => r.cooperativaId !== cooperativaId);
    this.solicitudesPasajeros = this.solicitudesPasajeros.filter(s => s.cooperativaId !== cooperativaId);
    this.alertas = this.alertas.filter(a => a.cooperativaId !== cooperativaId);
    this.alertasTracking = this.alertasTracking.filter(a => a.cooperativaId !== cooperativaId);
    this.trackingHistorial = this.trackingHistorial.filter(t => t.cooperativaId !== cooperativaId);
    this.geocercas = this.geocercas.filter(g => g.cooperativaId !== cooperativaId);
    this.despachos = this.despachos.filter(d => d.cooperativaId !== cooperativaId);
    if (this.liquidaciones) {
      this.liquidaciones = this.liquidaciones.filter(l => l.cooperativaId !== cooperativaId);
    }

    // 3. Persistir en localStorage
    saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    saveStorage(STORAGE_KEYS.COMPROBANTES, this.comprobantesPago);
    saveStorage(STORAGE_KEYS.HISTORICO_PAGOS_ARCHIVADOS, this.historicoPagosArchivados);
    saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
    saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
    saveStorage(STORAGE_KEYS.BASES, this.bases);
    saveStorage(STORAGE_KEYS.TURNOS, this.turnos);

    // 4. Borrar de Firestore si está conectado
    deleteCooperativaFromFirestore(cooperativaId).catch(err => {
      console.warn('Error eliminando cooperativa de Firestore:', err);
    });

    // 5. Registro de auditoría SuperAdmin
    this.addLogSuperAdmin(
      'eliminar_cooperativa',
      `Eliminación de la cooperativa "${coopNombre}" (ID: ${cooperativaId}). Los valores y registros de pagos efectuados se han preservado en el histórico para reportes contables.`,
      cooperativaId,
      coop,
      null
    );

    // 6. Recalcular métricas y notificar
    this.calcularMetricasGlobales();
    this.notify();
  }

  /**
   * 5. Subir comprobante de pago
   */
  public subirComprobante(cooperativaId: string, datos: {
    monto: number;
    metodo: 'transferencia' | 'efectivo' | 'deposito';
    banco: 'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros';
    numero_operacion: string;
    fecha_operacion: string;
    cuenta_destino: string;
    comprobante_url: string;
    comprobante_nombre: string;
    periodo_desde: string;
    periodo_hasta: string;
    subido_por: string;
  }): ComprobantePago {
    const suscripcion = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const nuevoComprobante: ComprobantePago = {
      id: `comp-${Date.now()}`,
      cooperativaId,
      suscripcion_id: suscripcion?.id || `susc-${cooperativaId}`,
      monto: Number(datos.monto),
      moneda: 'USD',
      metodo: datos.metodo,
      banco: datos.banco,
      numero_operacion: datos.numero_operacion,
      fecha_operacion: datos.fecha_operacion,
      cuenta_destino: datos.cuenta_destino,
      comprobante_url: datos.comprobante_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      comprobante_nombre: datos.comprobante_nombre || `recibo_${Date.now()}.jpg`,
      estado: 'pendiente_revision',
      revisado_por: null,
      fecha_revision: null,
      motivo_rechazo: null,
      periodo_desde: datos.periodo_desde,
      periodo_hasta: datos.periodo_hasta,
      subido_por: datos.subido_por,
      fecha_subida: new Date().toISOString(),
      ip: '190.152.1.20',
      dispositivo: 'Web Applet / Admin Portal'
    };

    this.comprobantesPago.unshift(nuevoComprobante);
    saveStorage(STORAGE_KEYS.COMPROBANTES, this.comprobantesPago);

    // Notificación interna de recepción
    this.crearNotificacionInterna(cooperativaId, {
      tipo: 'comunicado_general',
      titulo: 'Comprobante de Pago Recibido',
      mensaje: `Hemos recibido su comprobante por $${Number(datos.monto).toFixed(2)} USD (${datos.banco} #${datos.numero_operacion}). Está en proceso de validación por el Creador.`,
      prioridad: 'normal',
      enviado_por: 'Sistema de Cobros'
    });

    this.calcularMetricasGlobales();
    this.notify();
    return nuevoComprobante;
  }

  /**
   * 6. Revisar comprobante (Aprobar / Rechazar) con archivo en histórico y notificación interna
   */
  public revisarComprobante(comprobanteId: string, decision: 'aprobado' | 'rechazado', motivo?: string, superadmin_id?: string): boolean {
    const comp = this.comprobantesPago.find(c => c.id === comprobanteId);
    if (!comp) return false;

    comp.estado = decision;
    comp.revisado_por = superadmin_id || 'usr-superadmin';
    comp.fecha_revision = new Date().toISOString();
    comp.motivo_rechazo = decision === 'rechazado' ? (motivo || 'Comprobante no legible o datos inconsistentes') : null;

    const suscripcion = this.suscripciones.find(s => s.cooperativaId === comp.cooperativaId);
    const coop = this.cooperativas.find(c => c.id === comp.cooperativaId);

    if (decision === 'aprobado' && suscripcion) {
      // Calcular nueva fecha de vencimiento (+30 días desde el vencimiento actual o desde hoy si ya venció)
      const fechaBase = new Date(suscripcion.fecha_vencimiento) > new Date()
        ? new Date(suscripcion.fecha_vencimiento)
        : new Date();
      
      fechaBase.setDate(fechaBase.getDate() + 30);
      const nuevaFechaVenc = fechaBase.toISOString();

      suscripcion.fecha_vencimiento = nuevaFechaVenc;
      suscripcion.estado_suscripcion = 'activa';
      suscripcion.dias_mora = 0;
      suscripcion.ultimo_pago = {
        monto: comp.monto,
        fecha: new Date().toISOString(),
        metodo: comp.metodo,
        comprobante_url: comp.comprobante_url,
        registrado_por: superadmin_id || 'usr-superadmin',
        periodo_cubierto: { desde: comp.periodo_desde, hasta: comp.periodo_hasta }
      };

      // Si estaba bloqueada, desbloquearla
      if (coop) {
        coop.estado = 'activa';
        coop.bloqueo_tipo = 'ninguno';
        coop.monto_deuda = 0;
        coop.fecha_vencimiento_suscripcion = nuevaFechaVenc.split('T')[0];
        if (!coop.historial_pagos) coop.historial_pagos = [];
        coop.historial_pagos.unshift({
          id: `pay-${Date.now()}`,
          fecha: new Date().toISOString().split('T')[0],
          monto: comp.monto,
          referencia: `${comp.banco} #${comp.numero_operacion}`,
          dias_agregados: 30
        });
      }

      // Archivar en histórico contable persistente
      const yaArchivado = this.historicoPagosArchivados.some(h => h.comprobante_id === comp.id);
      if (!yaArchivado) {
        this.historicoPagosArchivados.unshift({
          id: `hist-${comp.id}`,
          comprobante_id: comp.id,
          cooperativa_id: comp.cooperativaId,
          cooperativa_nombre: coop?.nombre || comp.cooperativa_nombre_historico || comp.cooperativaId,
          cooperativa_ruc: coop?.ruc || comp.cooperativa_ruc_historico || 'N/A',
          monto: comp.monto,
          moneda: 'USD',
          metodo: comp.metodo,
          banco: comp.banco,
          numero_operacion: comp.numero_operacion,
          fecha_pago: comp.fecha_operacion || comp.fecha_subida,
          periodo_desde: comp.periodo_desde,
          periodo_hasta: comp.periodo_hasta,
          aprobado_por: superadmin_id || 'usr-superadmin',
          fecha_aprobacion: new Date().toISOString(),
          unidades_facturadas: comp.unidades_detalle ? comp.unidades_detalle.length : undefined,
          cooperativa_eliminada: false,
          fecha_archivo: new Date().toISOString()
        });
        saveStorage(STORAGE_KEYS.HISTORICO_PAGOS_ARCHIVADOS, this.historicoPagosArchivados);
      }

      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
      saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);

      this.addLogSuperAdmin(
        'aprobar_comprobante',
        `Aprobación de comprobante #${comp.id} ($${comp.monto}) para ${coop?.nombre}. Vencimiento extendido al ${new Date(nuevaFechaVenc).toLocaleDateString('es-EC')}.`,
        comp.cooperativaId,
        null,
        { comprobanteId, nuevoVencimiento: nuevaFechaVenc },
        superadmin_id
      );

      // Notificación interna a la cooperativa
      this.crearNotificacionInterna(comp.cooperativaId, {
        tipo: 'comprobante_aprobado',
        titulo: 'Comprobante de Pago Aprobado',
        mensaje: `Su pago por $${comp.monto.toFixed(2)} USD (${comp.banco} #${comp.numero_operacion}) ha sido verificado con éxito. La suscripción de su cooperativa queda activa hasta el ${new Date(nuevaFechaVenc).toLocaleDateString('es-EC')}.`,
        prioridad: 'normal',
        enviado_por: 'SuperAdmin Creador',
        metadatos: { monto: comp.monto, numero_operacion: comp.numero_operacion }
      });
    } else if (decision === 'rechazado') {
      this.addLogSuperAdmin(
        'rechazar_comprobante',
        `Rechazo de comprobante #${comp.id} para ${coop?.nombre}. Motivo: ${motivo || 'Inconsistencia de datos'}`,
        comp.cooperativaId,
        null,
        { comprobanteId, motivo },
        superadmin_id
      );

      // Notificación interna a la cooperativa
      this.crearNotificacionInterna(comp.cooperativaId, {
        tipo: 'comprobante_rechazado',
        titulo: 'Comprobante de Pago Observado / Rechazado',
        mensaje: `Su comprobante por $${comp.monto.toFixed(2)} USD no pudo ser validado. Motivo: ${motivo || 'Inconsistencia en los datos registrados'}. Por favor suba un nuevo comprobante legible.`,
        prioridad: 'alta',
        enviado_por: 'SuperAdmin Creador',
        metadatos: { monto: comp.monto }
      });
    }

    saveStorage(STORAGE_KEYS.COMPROBANTES, this.comprobantesPago);
    this.calcularMetricasGlobales();
    this.notify();
    return true;
  }

  /**
   * 7. Extender suscripción manualmente (días de gracia)
   */
  public extenderSuscripcion(cooperativaId: string, dias: number, superadmin_id?: string): SuscripcionCooperativa {
    const suscripcion = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    if (!suscripcion) throw new Error('Suscripción no encontrada');

    const fechaActual = new Date(suscripcion.fecha_vencimiento);
    fechaActual.setDate(fechaActual.getDate() + dias);
    suscripcion.fecha_vencimiento = fechaActual.toISOString();
    suscripcion.estado_suscripcion = 'activa';
    suscripcion.dias_mora = 0;

    const coop = this.cooperativas.find(c => c.id === cooperativaId);
    if (coop) {
      coop.fecha_vencimiento_suscripcion = suscripcion.fecha_vencimiento.split('T')[0];
      coop.estado = 'activa';
      coop.bloqueo_tipo = 'ninguno';
    }

    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);

    this.addLogSuperAdmin(
      'cambiar_estado_manual',
      `Extensión manual de suscripción (+${dias} días) para ${coop?.nombre}. Nuevo vencimiento: ${fechaActual.toLocaleDateString('es-EC')}`,
      cooperativaId,
      null,
      { dias, nuevaFecha: suscripcion.fecha_vencimiento },
      superadmin_id
    );

    // Notificación interna
    this.crearNotificacionInterna(cooperativaId, {
      tipo: 'comunicado_general',
      titulo: `Prórroga de Suscripción Otorgada (+${dias} días)`,
      mensaje: `El SuperAdmin Creador ha otorgado una extensión de ${dias} días de gracia. Su nuevo vencimiento es el ${fechaActual.toLocaleDateString('es-EC')}.`,
      prioridad: 'normal',
      enviado_por: 'SuperAdmin Creador'
    });

    this.calcularMetricasGlobales();
    this.notify();
    return suscripcion;
  }

  /**
   * 8. Bloquear cooperativa (parcial o total)
   */
  public bloquearCooperativa(cooperativaId: string, tipo: 'parcial' | 'total', motivo: string, superadmin_id?: string): void {
    const suscripcion = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const coop = this.cooperativas.find(c => c.id === cooperativaId);

    if (suscripcion) {
      suscripcion.estado_suscripcion = tipo === 'parcial' ? 'bloqueo_parcial' : 'bloqueada';
      suscripcion.bloqueos_historial.push({
        tipo,
        fecha: new Date().toISOString(),
        motivo
      });
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    }

    if (coop) {
      coop.bloqueo_tipo = tipo;
      coop.estado = tipo === 'parcial' ? 'suspendida' : 'bloqueada';
      saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
    }

    this.addLogSuperAdmin(
      'bloquear_cooperativa',
      `Bloqueo ${tipo.toUpperCase()} aplicado a ${coop?.nombre}. Motivo: ${motivo}`,
      cooperativaId,
      null,
      { tipo, motivo },
      superadmin_id
    );

    // Notificación interna de bloqueo
    this.crearNotificacionInterna(cooperativaId, {
      tipo: 'bloqueo_aviso',
      titulo: tipo === 'parcial' ? 'Suspensión Parcial de Despachos' : 'Bloqueo Total del Sistema por Mora',
      mensaje: `Se ha aplicado un bloqueo ${tipo.toUpperCase()} a su cooperativa. Motivo: ${motivo}. Regularice su pago en la pestaña Comprobantes.`,
      prioridad: 'urgente',
      enviado_por: 'Sistema de Seguridad y Cobros'
    });

    this.calcularMetricasGlobales();
    this.notify();
  }

  /**
   * 9. Desbloquear cooperativa
   */
  public desbloquearCooperativa(cooperativaId: string, superadmin_id?: string): void {
    const suscripcion = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const coop = this.cooperativas.find(c => c.id === cooperativaId);

    if (suscripcion) {
      suscripcion.estado_suscripcion = 'activa';
      suscripcion.dias_mora = 0;
      if (suscripcion.bloqueos_historial.length > 0) {
        const last = suscripcion.bloqueos_historial[suscripcion.bloqueos_historial.length - 1];
        if (!last.levantado_en) last.levantado_en = new Date().toISOString();
      }
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    }

    if (coop) {
      coop.bloqueo_tipo = 'ninguno';
      coop.estado = 'activa';
      saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
    }

    this.addLogSuperAdmin(
      'desbloquear_cooperativa',
      `Levantamiento de bloqueo para ${coop?.nombre}. Servicios restaurados a estado ACTIVO.`,
      cooperativaId,
      null,
      null,
      superadmin_id
    );

    // Notificación interna
    this.crearNotificacionInterna(cooperativaId, {
      tipo: 'comunicado_general',
      titulo: 'Servicio Restaurado - Bloqueo Levantado',
      mensaje: `Los servicios de despacho, GPS y administración de su cooperativa han sido restablecidos completamente.`,
      prioridad: 'normal',
      enviado_por: 'SuperAdmin Creador'
    });

    this.calcularMetricasGlobales();
    this.notify();
  }

  /**
   * 10. Cancelar suscripción
   */
  public cancelarSuscripcion(cooperativaId: string, motivo: string, superadmin_id?: string): void {
    const suscripcion = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const coop = this.cooperativas.find(c => c.id === cooperativaId);

    if (suscripcion) {
      suscripcion.estado_suscripcion = 'cancelada';
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    }

    if (coop) {
      coop.estado = 'inactiva';
      coop.bloqueo_tipo = 'total';
      saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
    }

    this.addLogSuperAdmin(
      'cancelar_suscripcion',
      `Cancelación definitiva de suscripción para ${coop?.nombre}. Motivo: ${motivo}`,
      cooperativaId,
      null,
      { motivo },
      superadmin_id
    );

    this.calcularMetricasGlobales();
    this.notify();
  }

  /**
   * 11. Ejecutar bloqueo progresivo automático (Día 0, Día 3, Día 5, Día 30)
   */
  public ejecutarBloqueoProgresivo(notifyAdmins = true): void {
    if (!this.configSuperAdmin.bloqueo_automatico_activo) return;

    const ahora = new Date();
    let cambios = 0;

    for (const susc of this.suscripciones) {
      if (susc.estado_suscripcion === 'cancelada') continue;

      const fechaVenc = new Date(susc.fecha_vencimiento);
      const diffMs = ahora.getTime() - fechaVenc.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Recalcular unidades activas y monto mensual en cada ciclo
      const unidadesReales = this.contarUnidadesActivas(susc.cooperativaId);
      if (unidadesReales > 0 && unidadesReales !== susc.unidades_activas) {
        susc.unidades_activas = unidadesReales;
        susc.monto_mensual = this.calcularMontoMensual(susc.cooperativaId);
      }

      if (diffDays < 0 && Math.abs(diffDays) <= 3) {
        // Por vencer (a 3 días o menos)
        if (susc.estado_suscripcion === 'activa') {
          susc.estado_suscripcion = 'por_vencer';
          cambios++;
        }
      } else if (diffDays >= 0 && diffDays < this.configSuperAdmin.dias_para_bloqueo_parcial) {
        // Vencida (dentro del periodo de gracia de 0 a 3 días)
        if (susc.estado_suscripcion !== 'vencida') {
          susc.estado_suscripcion = 'vencida';
          susc.dias_mora = Math.max(1, diffDays);
          cambios++;
        }
      } else if (diffDays >= this.configSuperAdmin.dias_para_bloqueo_parcial && diffDays < this.configSuperAdmin.dias_para_bloqueo_total) {
        // Bloqueo Parcial (Día 3 a 5: Despacho deshabilitado, GPS activo)
        if (susc.estado_suscripcion !== 'bloqueo_parcial') {
          susc.estado_suscripcion = 'bloqueo_parcial';
          susc.dias_mora = diffDays;
          const coop = this.cooperativas.find(c => c.id === susc.cooperativaId);
          if (coop) {
            coop.bloqueo_tipo = 'parcial';
            coop.estado = 'suspendida';
          }
          susc.bloqueos_historial.push({
            tipo: 'parcial',
            fecha: new Date().toISOString(),
            motivo: `Mora de ${diffDays} días tras vencimiento sin comprobante de pago.`
          });
          cambios++;
        }
      } else if (diffDays >= this.configSuperAdmin.dias_para_bloqueo_total && diffDays < this.configSuperAdmin.dias_para_borrado_datos) {
        // Bloqueo Total (Día 5+: Todo bloqueado excepto login de admin_coop)
        if (susc.estado_suscripcion !== 'bloqueada') {
          susc.estado_suscripcion = 'bloqueada';
          susc.dias_mora = diffDays;
          const coop = this.cooperativas.find(c => c.id === susc.cooperativaId);
          if (coop) {
            coop.bloqueo_tipo = 'total';
            coop.estado = 'bloqueada';
          }
          susc.bloqueos_historial.push({
            tipo: 'total',
            fecha: new Date().toISOString(),
            motivo: `Mora de ${diffDays} días acumulada (supera límite de 5 días de gracia).`
          });
          cambios++;
        }
      } else if (diffDays >= this.configSuperAdmin.dias_para_borrado_datos) {
        // Cancelada (> 30 días)
        if ((susc.estado_suscripcion as string) !== 'cancelada') {
          susc.estado_suscripcion = 'cancelada';
          susc.dias_mora = diffDays;
          cambios++;
        }
      }
    }

    if (cambios > 0) {
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
      saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
      this.calcularMetricasGlobales();
      if (notifyAdmins) this.notify();
    }
  }

  /**
   * 12. Enviar recordatorio de pago por WhatsApp (simulado)
   */
  public enviarRecordatorio(cooperativaId: string, tipo: 'por_vencer' | 'vencida' | 'bloqueo_parcial' | 'bloqueo_total'): string {
    const susc = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const coop = this.cooperativas.find(c => c.id === cooperativaId);
    if (!susc || !coop) return '';

    let plantilla = this.configSuperAdmin.plantilla_por_vencer;
    if (tipo === 'vencida') plantilla = this.configSuperAdmin.plantilla_vencida;
    if (tipo === 'bloqueo_parcial') plantilla = this.configSuperAdmin.plantilla_bloqueo_parcial;
    if (tipo === 'bloqueo_total') plantilla = this.configSuperAdmin.plantilla_bloqueo_total;

    const fechaVencStr = new Date(susc.fecha_vencimiento).toLocaleDateString('es-EC');
    const diasFaltantes = Math.max(0, Math.ceil((new Date(susc.fecha_vencimiento).getTime() - Date.now()) / (1000 * 3600 * 24)));

    const mensaje = plantilla
      .replace(/{presidente}/g, coop.presidente_nombre)
      .replace(/{nombre}/g, coop.nombre)
      .replace(/{dias}/g, diasFaltantes.toString())
      .replace(/{dias_mora}/g, susc.dias_mora.toString())
      .replace(/{fecha_venc}/g, fechaVencStr)
      .replace(/{monto}/g, susc.monto_mensual.toString())
      .replace(/{cuenta}/g, this.configSuperAdmin.cuenta_banco_principal);

    susc.recordatorios_enviados.push({
      tipo,
      fecha: new Date().toISOString()
    });

    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    this.notify();
    return mensaje;
  }

  /**
   * 13. Calcular métricas globales de negocio SaaS (MRR, Morosidad, etc.)
   * El dashboard del creador se calcula dinámicamente sólo con cooperativas activas
   * y las unidades activas ingresadas por cada cooperativa.
   */
  public calcularMetricasGlobales(): MetricasGlobales {
    let totalMRR = 0;
    let totalPorCobrar = 0;
    let totalUnidadesRegistradas = 0;
    let unidadesActivasTotales = 0;
    let unidadesMorosas = 0;
    let coopsActivas = 0;
    let coopsMorosas = 0;
    let coopsBloqueadas = 0;

    const topCoops: Array<{ cooperativaId: string; nombre: string; unidades: number; monto_mensual: number; plan: string }> = [];

    // Calcular métricas SOLO con cooperativas y unidades activas registradas
    for (const coop of this.cooperativas) {
      if (coop.estado === 'inactiva') continue;

      const susc = this.suscripciones.find(s => s.cooperativaId === coop.id);
      const plan = this.planes.find(p => p.id === (susc?.plan_id || 'plan_pro_unico')) || this.planes[0];
      
      // Vehículos reales ingresados por la cooperativa
      const vehiculosCoop = this.vehiculos.filter(v => v.cooperativaId === coop.id);
      const vehiculosActivos = vehiculosCoop.filter(v => v.estado === 'activo').length;
      const totalVehiculosCoop = vehiculosCoop.length;
      
      totalUnidadesRegistradas += totalVehiculosCoop;

      const precioUnidad = plan?.precio_por_unidad || 15;
      const descuento = susc?.descuento_porcentaje || 0;
      const montoCalculado = Math.max(0, Math.round(vehiculosActivos * precioUnidad * (1 - descuento / 100)));

      // Sincronizar monto en la suscripción
      if (susc) {
        susc.unidades_activas = vehiculosActivos;
        susc.monto_mensual = montoCalculado;
      }

      if (coop.estado === 'activa' || susc?.estado_suscripcion === 'activa' || susc?.estado_suscripcion === 'por_vencer') {
        coopsActivas++;
        unidadesActivasTotales += vehiculosActivos;
        totalMRR += montoCalculado;

        topCoops.push({
          cooperativaId: coop.id,
          nombre: coop.nombre,
          unidades: vehiculosActivos,
          monto_mensual: montoCalculado,
          plan: plan?.nombre || 'Pro Integral'
        });
      } else if (coop.estado === 'suspendida' || susc?.estado_suscripcion === 'bloqueo_parcial' || susc?.estado_suscripcion === 'vencida') {
        coopsMorosas++;
        unidadesMorosas += vehiculosActivos;
        totalPorCobrar += montoCalculado;
      } else if (coop.estado === 'bloqueada' || susc?.estado_suscripcion === 'bloqueada') {
        coopsBloqueadas++;
        unidadesMorosas += vehiculosActivos;
        totalPorCobrar += montoCalculado;
      }
    }

    topCoops.sort((a, b) => b.unidades - a.unidades);

    const pendientesRevision = this.comprobantesPago.filter(c => c.estado === 'pendiente_revision').length;

    const metricas: MetricasGlobales = {
      id: 'metricas_actuales',
      fecha_actualizacion: new Date().toISOString(),
      total_cooperativas: this.cooperativas.length,
      cooperativas_activas: coopsActivas,
      cooperativas_morosas: coopsMorosas,
      cooperativas_bloqueadas: coopsBloqueadas,
      cooperativas_nuevas_mes: 2,
      cooperativas_canceladas_mes: 0,
      total_unidades: totalUnidadesRegistradas,
      unidades_activas: unidadesActivasTotales,
      unidades_en_coops_morosas: unidadesMorosas,
      mrr_actual: totalMRR,
      mrr_mes_anterior: Math.round(totalMRR * 0.9),
      variacion_mrr_pct: Number((((totalMRR - Math.round(totalMRR * 0.9)) / (Math.round(totalMRR * 0.9) || 1)) * 100).toFixed(2)),
      ingresos_mes_corriente: totalMRR,
      ingresos_mes_anterior: Math.round(totalMRR * 0.88),
      churn_rate_mes: 0,
      churn_rate_unidades: 0,
      total_por_cobrar: totalPorCobrar,
      comprobantes_pendientes_revision: pendientesRevision,
      top_cooperativas_por_unidades: topCoops.slice(0, 5),
      proyeccion_proximos_3_meses: [
        Math.round(totalMRR * 1.05),
        Math.round(totalMRR * 1.12),
        Math.round(totalMRR * 1.20)
      ]
    };

    this.metricasGlobales = metricas;
    saveStorage(STORAGE_KEYS.METRICAS_GLOBALES, this.metricasGlobales);
    return metricas;
  }

  /**
   * 14. Generar reporte mensual financiero PDF
   */
  public generarReporteMensual(): void {
    exportFinancialReportPDF(this.metricasGlobales, this.suscripciones, this.cooperativas);
    this.addLogSuperAdmin('exportar_reporte', 'Exportación de Reporte Financiero Mensual en formato PDF');
  }

  /**
   * 15. Exportar datos a Excel / CSV (incluye pagos archivados de cooperativas eliminadas)
   */
  public exportarDatosExcel(): void {
    exportExcelCSV(this.suscripciones, this.cooperativas, this.comprobantesPago, this.historicoPagosArchivados);
    this.addLogSuperAdmin('exportar_reporte', 'Exportación de Base de Suscripciones, Facturación e Histórico a CSV/Excel');
  }

  /**
   * 16. Crear nuevo Plan de Suscripción (Creador / SuperAdmin)
   * Los planes contemplan el uso integral de la aplicación.
   */
  public crearPlanSuscripcion(datos: {
    nombre: string;
    precio_por_unidad: number;
    caracteristicas?: string[];
    incluye_todo?: boolean;
    unidades_minimas?: number;
    unidades_maximas?: number | null;
  }): PlanSuscripcion {
    const slug = datos.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const nuevoPlan: PlanSuscripcion = {
      id: `plan-${slug}-${Date.now().toString().slice(-4)}`,
      nombre: datos.nombre,
      precio_por_unidad: Number(datos.precio_por_unidad),
      moneda: 'USD',
      caracteristicas: datos.caracteristicas && datos.caracteristicas.length > 0 ? datos.caracteristicas : [
        'Uso integral de la aplicación (100% módulos activos)',
        'Despacho Inteligente & Pantalla de Control Base (Tablet)',
        'App Conductor con GPS Satelital, Turnos & Control de Cupo',
        'App Pasajeros / Cliente con Solicitud de Rutas y Asignación',
        'Monitoreo Satelital & Sistema de Alertas SOS con Sirena',
        'Portal Administrativo de Cooperativa, Socios & Flota',
        'Facturación y Conciliación Mensual Automatizada'
      ],
      incluye_todo: true,
      unidades_minimas: datos.unidades_minimas || 1,
      unidades_maximas: datos.unidades_maximas || null,
      activo: true,
      fecha_creacion: new Date().toISOString()
    };

    this.planes.push(nuevoPlan);
    saveStorage(STORAGE_KEYS.PLANES, this.planes);
    this.addLogSuperAdmin(
      'crear_plan',
      `Creación de nuevo plan SaaS "${nuevoPlan.nombre}" a $${nuevoPlan.precio_por_unidad} USD/unidad mensual con uso integral.`
    );
    this.notify();
    return nuevoPlan;
  }

  /**
   * Actualizar plan de suscripción existente
   */
  public actualizarPlanSuscripcion(planId: string, datos: Partial<PlanSuscripcion>): PlanSuscripcion {
    const idx = this.planes.findIndex(p => p.id === planId);
    if (idx === -1) throw new Error('Plan no encontrado');
    const antes = { ...this.planes[idx] };
    
    this.planes[idx] = {
      ...this.planes[idx],
      ...datos,
      precio_por_unidad: datos.precio_por_unidad !== undefined ? Number(datos.precio_por_unidad) : this.planes[idx].precio_por_unidad,
      unidades_minimas: datos.unidades_minimas !== undefined ? Number(datos.unidades_minimas) : this.planes[idx].unidades_minimas,
      unidades_maximas: datos.unidades_maximas !== undefined ? (datos.unidades_maximas ? Number(datos.unidades_maximas) : null) : this.planes[idx].unidades_maximas,
    };
    saveStorage(STORAGE_KEYS.PLANES, this.planes);

    // Actualizar precio de suscripciones vinculadas
    for (const susc of this.suscripciones) {
      if (susc.plan_id === planId) {
        susc.precio_por_unidad = this.planes[idx].precio_por_unidad;
        susc.monto_mensual = this.calcularMontoMensual(susc.cooperativaId);
      }
    }
    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);

    this.addLogSuperAdmin(
      'editar_plan',
      `Actualización del plan SaaS "${this.planes[idx].nombre}". Nuevo precio: $${this.planes[idx].precio_por_unidad} USD/unidad.`,
      null,
      antes,
      this.planes[idx]
    );

    // Enviar notificación interna a cooperativas adscritas
    const coopsConPlan = this.suscripciones.filter(s => s.plan_id === planId).map(s => s.cooperativaId);
    for (const coopId of coopsConPlan) {
      this.crearNotificacionInterna(coopId, {
        tipo: 'actualizacion_plan',
        titulo: `Actualización de Condiciones: ${this.planes[idx].nombre}`,
        mensaje: `Se han actualizado las tarifas del plan a $${this.planes[idx].precio_por_unidad} USD/unidad mensual. El uso integral de la plataforma sigue habilitado al 100%.`,
        prioridad: 'normal',
        enviado_por: 'SuperAdmin Creador'
      });
    }

    this.calcularMetricasGlobales();
    this.notify();
    return this.planes[idx];
  }

  /**
   * Eliminar plan de suscripción creado
   */
  public eliminarPlanSuscripcion(planId: string): boolean {
    const idx = this.planes.findIndex(p => p.id === planId);
    if (idx === -1) return false;
    const plan = this.planes[idx];
    this.planes.splice(idx, 1);
    saveStorage(STORAGE_KEYS.PLANES, this.planes);
    this.addLogSuperAdmin('eliminar_plan', `Eliminación del plan SaaS "${plan.nombre}".`);
    this.notify();
    return true;
  }

  // ═══════════════════════════════════════════════════════
  // SISTEMA DE NOTIFICACIONES INTERNAS PARA COOPERATIVAS
  // ═══════════════════════════════════════════════════════

  /**
   * Enviar notificación interna a una cooperativa específica
   */
  public crearNotificacionInterna(cooperativaId: string, datos: {
    tipo: 'aviso_cobranza' | 'comprobante_aprobado' | 'comprobante_rechazado' | 'facturacion_anticipada' | 'bloqueo_aviso' | 'comunicado_general' | 'actualizacion_plan';
    titulo: string;
    mensaje: string;
    prioridad: 'normal' | 'alta' | 'urgente';
    enviado_por?: string;
    accion_url?: string;
    metadatos?: any;
  }): NotificacionInternaCooperativa {
    const notif: NotificacionInternaCooperativa = {
      id: `notif-int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      cooperativaId,
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      prioridad: datos.prioridad,
      leido: false,
      fecha_emision: new Date().toISOString(),
      fecha_lectura: null,
      enviado_por: datos.enviado_por || 'SuperAdmin Creador',
      accion_url: datos.accion_url,
      metadatos: datos.metadatos
    };

    this.notificacionesInternasCoop.unshift(notif);
    saveStorage(STORAGE_KEYS.NOTIFICACIONES_INTERNAS_COOP, this.notificacionesInternasCoop);
    this.notify();
    return notif;
  }

  /**
   * Enviar comunicado interno masivo a todas las cooperativas activas
   */
  public crearNotificacionBroadcast(datos: {
    tipo: 'aviso_cobranza' | 'comprobante_aprobado' | 'comprobante_rechazado' | 'facturacion_anticipada' | 'bloqueo_aviso' | 'comunicado_general' | 'actualizacion_plan';
    titulo: string;
    mensaje: string;
    prioridad: 'normal' | 'alta' | 'urgente';
    enviado_por?: string;
  }): void {
    const coopsActivas = this.cooperativas.filter(c => c.estado === 'activa');
    for (const coop of coopsActivas) {
      this.crearNotificacionInterna(coop.id, datos);
    }
    this.addLogSuperAdmin(
      'notificacion_interna',
      `Comunicado interno masivo emitido a ${coopsActivas.length} cooperativas activas: "${datos.titulo}"`
    );
  }

  /**
   * Marcar notificación interna como leída
   */
  public marcarNotificacionLeida(notificacionId: string): void {
    const notif = this.notificacionesInternasCoop.find(n => n.id === notificacionId);
    if (notif && !notif.leido) {
      notif.leido = true;
      notif.fecha_lectura = new Date().toISOString();
      saveStorage(STORAGE_KEYS.NOTIFICACIONES_INTERNAS_COOP, this.notificacionesInternasCoop);
      this.notify();
    }
  }

  /**
   * Marcar todas las notificaciones de una cooperativa como leídas
   */
  public marcarTodasNotificacionesLeidas(cooperativaId: string): void {
    let modificado = false;
    for (const n of this.notificacionesInternasCoop) {
      if (n.cooperativaId === cooperativaId && !n.leido) {
        n.leido = true;
        n.fecha_lectura = new Date().toISOString();
        modificado = true;
      }
    }
    if (modificado) {
      saveStorage(STORAGE_KEYS.NOTIFICACIONES_INTERNAS_COOP, this.notificacionesInternasCoop);
      this.notify();
    }
  }

  /**
   * Obtener lista de notificaciones internas de una cooperativa
   */
  public getNotificacionesPorCooperativa(cooperativaId: string): NotificacionInternaCooperativa[] {
    return this.notificacionesInternasCoop.filter(n => n.cooperativaId === cooperativaId);
  }

  /**
   * Conteo de notificaciones no leídas de una cooperativa
   */
  public getNotificacionesNoLeidasCoop(cooperativaId: string): number {
    return this.notificacionesInternasCoop.filter(n => n.cooperativaId === cooperativaId && !n.leido).length;
  }

  /**
   * Eliminar una notificación interna
   */
  public eliminarNotificacionInterna(notificacionId: string): void {
    this.notificacionesInternasCoop = this.notificacionesInternasCoop.filter(n => n.id !== notificacionId);
    saveStorage(STORAGE_KEYS.NOTIFICACIONES_INTERNAS_COOP, this.notificacionesInternasCoop);
    this.notify();
  }

  /**
   * 17. Generación automática de comprobantes de facturación mensual 5 días antes de terminar el mes.
   * La cooperativa se encarga de ingresar los vehículos y la factura se genera dinámicamente con base en todas las unidades ingresadas a nombre de la cooperativa.
   */
  public generarComprobantesMensualesCincoDiasAntes(forzar = false): { generados: number; coopsActualizadas: number; totalFacturado: number } {
    const ahora = new Date();
    const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    const diaActual = ahora.getDate();
    const diasRestantes = diasEnMes - diaActual;

    // Se ejecuta si faltan 5 días o menos para fin de mes, o si es forzado manualmente por el SuperAdmin
    if (!forzar && diasRestantes > 5) {
      return { generados: 0, coopsActualizadas: 0, totalFacturado: 0 };
    }

    let generados = 0;
    let coopsActualizadas = 0;
    let totalFacturado = 0;

    const mesProximo = ahora.getMonth() === 11 ? 0 : ahora.getMonth() + 1;
    const anioProximo = ahora.getMonth() === 11 ? ahora.getFullYear() + 1 : ahora.getFullYear();
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const periodoNombre = `${nombresMeses[mesProximo]} ${anioProximo}`;
    const periodoDesde = new Date(anioProximo, mesProximo, 1).toISOString().split('T')[0];
    const periodoHasta = new Date(anioProximo, mesProximo + 1, 0).toISOString().split('T')[0];

    for (const coop of this.cooperativas) {
      if (coop.estado === 'inactiva') continue;

      // Obtener todos los vehículos registrados por la cooperativa
      const vehiculosCoop = this.vehiculos.filter(v => v.cooperativaId === coop.id && v.estado !== 'inactivo');
      const susc = this.suscripciones.find(s => s.cooperativaId === coop.id);
      const plan = this.planes.find(p => p.id === (susc?.plan_id || 'plan_pro_unico')) || this.planes[0];
      const precioUnidad = plan?.precio_por_unidad || 15;
      
      const unidadesContadas = vehiculosCoop.length > 0 ? vehiculosCoop.length : (susc?.unidades_activas || 0);
      const montoTotal = Math.max(0, Math.round(unidadesContadas * precioUnidad * (1 - ((susc?.descuento_porcentaje || 0) / 100))));

      if (susc) {
        susc.unidades_activas = unidadesContadas;
        susc.monto_mensual = montoTotal;
        coopsActualizadas++;
      }

      // Verificar si ya existe comprobante/factura para este periodo
      const yaExiste = this.comprobantesPago.some(
        c => c.cooperativaId === coop.id && 
        (c.periodo_desde === periodoDesde || c.numero_operacion.includes(`AUT-${anioProximo}${String(mesProximo + 1).padStart(2, '0')}`))
      );

      if (!yaExiste && montoTotal > 0) {
        const nuevoComprobante: ComprobantePago = {
          id: `comp-automes-${coop.id}-${anioProximo}-${mesProximo + 1}`,
          cooperativaId: coop.id,
          suscripcion_id: susc?.id || `susc-${coop.id}`,
          monto: montoTotal,
          moneda: 'USD',
          metodo: 'transferencia',
          banco: 'Pichincha',
          numero_operacion: `FACT-AUT-${anioProximo}${String(mesProximo + 1).padStart(2, '0')}-${coop.id.slice(-4).toUpperCase()}`,
          fecha_operacion: ahora.toISOString().split('T')[0],
          cuenta_destino: this.configSuperAdmin.cuenta_banco_principal,
          comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
          comprobante_nombre: `comprobante_facturacion_${coop.id}_${periodoNombre.replace(' ', '_')}.pdf`,
          estado: 'pendiente_revision',
          revisado_por: null,
          fecha_revision: null,
          motivo_rechazo: null,
          periodo_desde: periodoDesde,
          periodo_hasta: periodoHasta,
          subido_por: 'Sistema de Facturación Automática (5 Días antes de Fin de Mes)',
          fecha_subida: ahora.toISOString(),
          tipo_comprobante: 'factura_sistema',
          unidades_detalle: vehiculosCoop.map(v => {
            const socioUser = this.usuarios.find(u => u.uid === v.socio_id);
            return {
              id: v.id,
              numero_unidad: v.numero_unidad,
              placa: v.placa,
              marca_modelo: v.modelo || 'Hino GH',
              fecha_ingreso: v.fecha_registro || new Date().toISOString().split('T')[0],
              socio: socioUser?.nombre_completo || 'Socio Cooperativa'
            };
          })
        };

        this.comprobantesPago.unshift(nuevoComprobante);
        generados++;
        totalFacturado += montoTotal;
      }
    }

    if (generados > 0 || coopsActualizadas > 0) {
      saveStorage(STORAGE_KEYS.COMPROBANTES, this.comprobantesPago);
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
      this.addLogSuperAdmin(
        'cambiar_estado_manual',
        `Facturación anticipada (5 días antes): ${generados} comprobantes generados ($${totalFacturado} USD) para ${coopsActualizadas} cooperativas con base en las unidades ingresadas.`
      );
      this.calcularMetricasGlobales();
      this.notify();
    }

    return { generados, coopsActualizadas, totalFacturado };
  }

  /**
   * 18. Protocolo de Bloqueo Automático tras los primeros 6 días del mes sin registrar pago.
   * Si la cooperativa no ha registrado su pago en los primeros 6 días del mes, la app se bloquea automáticamente.
   */
  public ejecutarProtocoloBloqueoDia6(forzar = false): { bloqueadas: number; revisadas: number } {
    const ahora = new Date();
    const diaActual = ahora.getDate();

    // Solo corre automáticamente después del día 6 del mes, a menos que sea forzado por el creador
    if (!forzar && diaActual <= 6) {
      return { bloqueadas: 0, revisadas: this.cooperativas.length };
    }

    let bloqueadas = 0;
    let revisadas = 0;

    for (const coop of this.cooperativas) {
      if (coop.estado === 'inactiva') continue;
      revisadas++;

      const susc = this.suscripciones.find(s => s.cooperativaId === coop.id);
      if (!susc) continue;

      // Verificar si tiene pago aprobado en el mes en curso o para su vencimiento vigente
      const fechaVenc = new Date(susc.fecha_vencimiento);
      const diffMs = ahora.getTime() - fechaVenc.getTime();
      const diasMora = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const tienePagoAprobadoEsteMes = this.comprobantesPago.some(
        c => c.cooperativaId === coop.id && 
        c.estado === 'aprobado' && 
        new Date(c.fecha_revision || c.fecha_operacion).getMonth() === ahora.getMonth() &&
        new Date(c.fecha_revision || c.fecha_operacion).getFullYear() === ahora.getFullYear()
      );

      // Si pasaron los 6 días y no tiene pago aprobado o está vencida
      if (!tienePagoAprobadoEsteMes && (diasMora >= 0 || diaActual > 6)) {
        if (susc.estado_suscripcion !== 'bloqueada' || coop.estado !== 'suspendida') {
          susc.estado_suscripcion = 'bloqueada';
          susc.dias_mora = Math.max(1, diasMora > 0 ? diasMora : diaActual - 6);
          
          coop.estado = 'suspendida';
          coop.bloqueo_tipo = 'total';

          susc.bloqueos_historial.push({
            tipo: 'total',
            fecha: ahora.toISOString(),
            motivo: `Protocolo Automático Día 6: Sin pago registrado de la cooperativa en los primeros 6 días del mes.`
          });

          this.addLogSuperAdmin(
            'bloquear_cooperativa',
            `Bloqueo Automático aplicado a ${coop.nombre}: Sin pago registrado tras los primeros 6 días del mes.`
          );

          bloqueadas++;
        }
      }
    }

    if (bloqueadas > 0) {
      saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
      saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
      this.calcularMetricasGlobales();
      this.notify();
    }

    return { bloqueadas, revisadas };
  }

  /**
   * 16. Obtener historial de pagos y comprobantes de una cooperativa
   */
  public obtenerHistorialPagos(cooperativaId: string): ComprobantePago[] {
    return this.comprobantesPago.filter(c => c.cooperativaId === cooperativaId);
  }

  /**
   * 17. Cambiar plan de suscripción
   */
  public cambiarPlan(cooperativaId: string, nuevo_plan_id: string, superadmin_id?: string): void {
    const susc = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    const plan = this.planes.find(p => p.id === nuevo_plan_id);
    if (!susc || !plan) throw new Error('Plan o suscripción no válida');

    const antes = { plan_id: susc.plan_id, precio_por_unidad: susc.precio_por_unidad, monto_mensual: susc.monto_mensual };
    susc.plan_id = plan.id;
    susc.precio_por_unidad = plan.precio_por_unidad;
    susc.monto_mensual = this.calcularMontoMensual(cooperativaId);

    const coop = this.cooperativas.find(c => c.id === cooperativaId);
    if (coop) {
      coop.plan = plan.nombre.toLowerCase() as any;
    }

    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);

    this.addLogSuperAdmin(
      'editar_plan',
      `Cambio de plan para ${coop?.nombre} a ${plan.nombre} ($${plan.precio_por_unidad}/ud). Nuevo monto mensual: $${susc.monto_mensual}`,
      cooperativaId,
      antes,
      { plan_id: plan.id, nuevoMonto: susc.monto_mensual },
      superadmin_id
    );

    this.calcularMetricasGlobales();
    this.notify();
  }

  /**
   * 18. Otorgar descuento especial
   */
  public otorgarDescuento(cooperativaId: string, porcentaje: number, motivo: string, superadmin_id?: string): void {
    const susc = this.suscripciones.find(s => s.cooperativaId === cooperativaId);
    if (!susc) return;

    susc.descuento_porcentaje = porcentaje;
    susc.motivo_descuento = motivo;
    susc.monto_mensual = this.calcularMontoMensual(cooperativaId);

    saveStorage(STORAGE_KEYS.SUSCRIPCIONES, this.suscripciones);
    this.addLogSuperAdmin(
      'otorgar_descuento',
      `Descuento del ${porcentaje}% aplicado a ${cooperativaId}. Motivo: ${motivo}. Nuevo monto: $${susc.monto_mensual}`,
      cooperativaId,
      null,
      { porcentaje, motivo },
      superadmin_id
    );

    this.calcularMetricasGlobales();
    this.notify();
  }

  /**
   * 19. Crear o editar planes
   */
  public crearPlan(datos: Omit<PlanSuscripcion, 'id' | 'fecha_creacion'>): PlanSuscripcion {
    const nuevoPlan: PlanSuscripcion = {
      id: `plan-${datos.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      ...datos,
      fecha_creacion: new Date().toISOString().split('T')[0]
    };
    this.planes.push(nuevoPlan);
    saveStorage(STORAGE_KEYS.PLANES, this.planes);
    this.addLogSuperAdmin('crear_plan', `Creación de nuevo plan "${nuevoPlan.nombre}" con tarifa $${nuevoPlan.precio_por_unidad}/ud`);
    this.notify();
    return nuevoPlan;
  }

  /**
   * 20. Editar configuración global SuperAdmin
   */
  public editarConfiguracionGlobal(datos: Partial<ConfiguracionSuperAdmin>, superadmin_id?: string): ConfiguracionSuperAdmin {
    this.configSuperAdmin = { ...this.configSuperAdmin, ...datos };
    saveStorage(STORAGE_KEYS.CONFIG_SUPERADMIN, this.configSuperAdmin);
    this.addLogSuperAdmin('editar_configuracion', 'Actualización de parámetros globales de cobros y cuentas bancarias', null, null, datos, superadmin_id);
    this.notify();
    return this.configSuperAdmin;
  }

  /**
   * Helper: Verificar si cooperativa tiene bloqueo parcial de despacho
   */
  public isCooperativaBlockedForDispatch(cooperativaId?: string): boolean {
    const id = cooperativaId || this.currentCoopId;
    const susc = this.suscripciones.find(s => s.cooperativaId === id);
    const coop = this.cooperativas.find(c => c.id === id);
    if (!susc && !coop) return false;

    return (
      susc?.estado_suscripcion === 'bloqueo_parcial' ||
      susc?.estado_suscripcion === 'bloqueada' ||
      susc?.estado_suscripcion === 'cancelada' ||
      coop?.bloqueo_tipo === 'parcial' ||
      coop?.bloqueo_tipo === 'total'
    );
  }

  /**
   * Helper: Verificar si cooperativa tiene bloqueo total
   */
  public isCooperativaTotalBlocked(cooperativaId?: string): boolean {
    const id = cooperativaId || this.currentCoopId;
    const susc = this.suscripciones.find(s => s.cooperativaId === id);
    const coop = this.cooperativas.find(c => c.id === id);
    if (!susc && !coop) return false;

    return (
      susc?.estado_suscripcion === 'bloqueada' ||
      susc?.estado_suscripcion === 'cancelada' ||
      coop?.bloqueo_tipo === 'total'
    );
  }

  /**
   * Helper: Registrar log inmutable de SuperAdmin
   */
  public addLogSuperAdmin(
    accion: LogSuperAdmin['accion'],
    detalle: string,
    cooperativaId: string | null = null,
    antes: any = null,
    despues: any = null,
    superadmin_id?: string
  ): LogSuperAdmin {
    const nuevoLog: LogSuperAdmin = {
      id: `log-sa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superadmin_id: superadmin_id || this.currentUserId || 'usr-superadmin',
      accion,
      cooperativa_id_afectada: cooperativaId,
      detalle,
      antes,
      despues,
      timestamp: new Date().toISOString(),
      ip: '190.152.1.20',
      dispositivo: 'SuperAdmin Web Console'
    };

    this.logsSuperAdmin.unshift(nuevoLog);
    if (this.logsSuperAdmin.length > 500) {
      this.logsSuperAdmin = this.logsSuperAdmin.slice(0, 500);
    }
    saveStorage(STORAGE_KEYS.LOGS_SUPERADMIN, this.logsSuperAdmin);
    return nuevoLog;
  }

  /**
   * Reset a datos de fábrica para demostración rápida
   */
  public resetToFactoryDefaults(): void {
    this.cooperativas = JSON.parse(JSON.stringify(INITIAL_COOPERATIVAS));
    this.bases = JSON.parse(JSON.stringify(INITIAL_BASES));
    this.usuarios = JSON.parse(JSON.stringify(INITIAL_USUARIOS));
    this.vehiculos = JSON.parse(JSON.stringify(INITIAL_VEHICULOS));
    this.turnos = JSON.parse(JSON.stringify(INITIAL_TURNOS));
    this.vehiculosPendientes = JSON.parse(JSON.stringify(INITIAL_VEHICULOS_PENDIENTES));
    this.logs = JSON.parse(JSON.stringify(INITIAL_LOGS));
    this.alertas = JSON.parse(JSON.stringify(INITIAL_ALERTAS));
    this.pasajerosFrecuentes = JSON.parse(JSON.stringify(INITIAL_PASAJEROS_FRECUENTES));
    this.reservas = JSON.parse(JSON.stringify(INITIAL_RESERVAS));
    this.puntosRecogidaFrecuentes = JSON.parse(JSON.stringify(INITIAL_PUNTOS_RECOGIDA_FRECUENTES));
    this.whatsappLogs = JSON.parse(JSON.stringify(INITIAL_WHATSAPP_LOGS));
    
    // SuperAdmin collections
    this.planes = JSON.parse(JSON.stringify(INITIAL_PLANES));
    this.suscripciones = JSON.parse(JSON.stringify(INITIAL_SUSCRIPCIONES));
    this.comprobantesPago = JSON.parse(JSON.stringify(INITIAL_COMPROBANTES));
    this.metricasGlobales = JSON.parse(JSON.stringify(INITIAL_METRICAS_GLOBALES));
    this.logsSuperAdmin = JSON.parse(JSON.stringify(INITIAL_LOGS_SUPERADMIN));
    this.configSuperAdmin = JSON.parse(JSON.stringify(INITIAL_CONFIG_SUPERADMIN));
    this.proformasPago = JSON.parse(JSON.stringify(INITIAL_PROFORMAS));
    this.chatBases = { 'coop-daule': JSON.parse(JSON.stringify(INITIAL_CHAT_BASES)) };
    this.coordinacionBases = { 'coop-daule': JSON.parse(JSON.stringify(INITIAL_COORDINACION)) };

    this.currentCoopId = 'coop-daule';
    this.currentUserId = 'usr-admin';
    this.notify();
  }

  // Módulo Proformas
  public getProformas(coopId?: string): ProformaPago[] {
    const id = coopId || this.currentCoopId;
    return this.proformasPago.filter(p => !id || p.cooperativaId === id);
  }

  public crearProformaParaVehiculos(cooperativaId: string, vehiculosNuevos: { id: string; numero_unidad: string; placa: string }[]): ProformaPago {
    const count = this.proformasPago.length + 1;
    const num = `PRO-2026-${String(count).padStart(3, '0')}`;
    const fechaEmision = new Date().toISOString().split('T')[0];
    const venc = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const periodoHasta = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const items: ProformaItem[] = vehiculosNuevos.map(v => ({
      tipo: 'registro_vehiculo',
      vehiculo_id: v.id,
      numero_unidad: v.numero_unidad,
      placa: v.placa,
      descripcion: `Registro Unidad ${v.numero_unidad} - Plan Pro`,
      precio_unitario: 15,
      cantidad: 1,
      subtotal: 15
    }));

    const total = items.reduce((acc, i) => acc + i.subtotal, 0);

    const nuevaProforma: ProformaPago = {
      id: `prof-${Date.now()}`,
      cooperativaId,
      numero_proforma: num,
      fecha_emision: fechaEmision,
      fecha_vencimiento: venc,
      items,
      subtotal: total,
      impuestos: 0,
      total,
      estado: 'pendiente',
      monto_pagado: 0,
      monto_pendiente: total,
      periodo_desde: fechaEmision,
      periodo_hasta: periodoHasta,
      comprobantes: [],
      recordatorios_enviados: [{ tipo: 'creada', fecha: fechaEmision }],
      creada_por: this.currentUserId,
      fecha_creacion: new Date().toISOString()
    };

    this.proformasPago.unshift(nuevaProforma);
    saveStorage(STORAGE_KEYS.PROFORMAS_PAGO, this.proformasPago);
    this.addAuditLog('CREAR_PROFORMA', `Proforma automática ${num} creada por $${total} (${items.length} vehículos)`);
    this.notify();
    return nuevaProforma;
  }

  public subirComprobanteProforma(proformaId: string, datos: { monto: number; metodo: 'transferencia' | 'efectivo' | 'deposito'; banco: any; numero_operacion: string; comprobante_url: string; subido_por: string }): void {
    const p = this.proformasPago.find(x => x.id === proformaId);
    if (!p) throw new Error('Proforma no encontrada');

    const comp: ProformaComprobante = {
      id: `comp-${Date.now()}`,
      monto: datos.monto,
      metodo: datos.metodo,
      banco: datos.banco,
      numero_operacion: datos.numero_operacion,
      comprobante_url: datos.comprobante_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      subido_por: datos.subido_por || this.currentUserId,
      fecha_subida: new Date().toISOString(),
      estado: 'pendiente_revision',
      revisado_por: null,
      motivo_rechazo: null
    };

    p.comprobantes.push(comp);
    p.estado = 'pendiente_revision';
    saveStorage(STORAGE_KEYS.PROFORMAS_PAGO, this.proformasPago);
    this.addAuditLog('SUBIR_COMPROBANTE', `Comprobante subido para proforma ${p.numero_proforma}`);
    this.notify();
  }

  public revisarProforma(proformaId: string, decision: 'aprobado' | 'rechazado', motivo?: string, superadmin_id?: string): void {
    const p = this.proformasPago.find(x => x.id === proformaId);
    if (!p) throw new Error('Proforma no encontrada');

    const comp = p.comprobantes[p.comprobantes.length - 1];
    if (comp) {
      comp.estado = decision === 'aprobado' ? 'aprobado' : 'rechazado';
      comp.revisado_por = superadmin_id || this.currentUserId;
      comp.motivo_rechazo = motivo || null;
    }

    if (decision === 'aprobado') {
      p.estado = 'pagada';
      p.monto_pagado = p.total;
      p.monto_pendiente = 0;

      // Activar vehículos asociados en estado 'en_registro'
      p.items.forEach(item => {
        if (item.vehiculo_id) {
          const v = this.vehiculos.find(veh => veh.id === item.vehiculo_id);
          if (v) {
            v.estado = 'activo';
          }
        }
      });
      saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
      this.addLogSuperAdmin('aprobar_comprobante', `Proforma ${p.numero_proforma} aprobada. Vehículos activados.`, p.cooperativaId);
    } else {
      p.estado = 'pendiente';
      this.addLogSuperAdmin('rechazar_comprobante', `Proforma ${p.numero_proforma} rechazada. Motivo: ${motivo}`, p.cooperativaId);
    }

    saveStorage(STORAGE_KEYS.PROFORMAS_PAGO, this.proformasPago);
    this.notify();
  }

  public getChatBases(coopId?: string): ChatBases {
    const id = coopId || this.currentCoopId;
    if (!this.chatBases[id]) {
      this.chatBases[id] = { ...INITIAL_CHAT_BASES, cooperativaId: id };
    }
    return this.chatBases[id];
  }

  public enviarMensajeChatBase(cooperativaId: string, texto: string, tipo: 'texto' | 'unidad_en_camino' | 'alerta' | 'solicitud_relevo', usuario: Usuario): void {
    const chat = this.getChatBases(cooperativaId);
    const baseLetra = usuario.base_asignada === 'base_b' ? 'B' : 'A';
    const nuevoMsg: MensajeChatBase = {
      id: `msg-${Date.now()}`,
      de: {
        usuario_id: usuario.uid,
        rol: usuario.rol,
        nombre: usuario.nombre_completo,
        base: baseLetra
      },
      texto,
      tipo,
      timestamp: new Date().toISOString(),
      leido_por: []
    };
    chat.mensajes.push(nuevoMsg);
    saveStorage(STORAGE_KEYS.CHAT_BASES, this.chatBases);
    this.notify();
  }

  public getCoordinacionBases(coopId?: string): CoordinacionBases {
    const id = coopId || this.currentCoopId;
    if (!this.coordinacionBases[id]) {
      this.coordinacionBases[id] = { ...INITIAL_COORDINACION, cooperativaId: id };
    }
    return this.coordinacionBases[id];
  }

  public actualizarCoordinacionBases(cooperativaId: string, patch: Partial<CoordinacionBases>): void {
    const coord = this.getCoordinacionBases(cooperativaId);
    this.coordinacionBases[cooperativaId] = { ...coord, ...patch, ultima_actualizacion: new Date().toISOString() };
    saveStorage(STORAGE_KEYS.COORDINACION_BASES, this.coordinacionBases);
    this.notify();
  }

  public asignarRecogidaEnRutaATurno(turnoId: string, solicitudId: string, forzarOvercapacity: boolean): { ok: boolean; message: string } {
    const turno = this.turnos.find(t => t.id === turnoId);
    const sol = this.solicitudesPasajeros.find(s => s.id === solicitudId);
    if (!turno || !sol) return { ok: false, message: 'Turno o solicitud no encontrada' };

    const cantidadPaxs = sol.cantidad_pasajeros || 1;

    if (turno.pasajeros_actuales >= turno.pasajeros_max && !forzarOvercapacity) {
      return { ok: false, message: `El Turno #${turno.numero_turno} está lleno (${turno.pasajeros_actuales}/${turno.pasajeros_max}). Requiere forzar overcapacity.` };
    }

    // Restar de los asientos disponibles (incrementar ocupación)
    turno.pasajeros_actuales = Math.min(turno.pasajeros_max, (turno.pasajeros_actuales || 0) + cantidadPaxs);
    if (turno.pasajeros_actuales >= turno.pasajeros_max) {
      turno.estado = 'listo';
    }
    turno.total_recaudado = turno.pasajeros_actuales * (turno.tarifa_viaje || 1.50);

    sol.estado = 'asignada';
    sol.unidad_asignada_id = turno.vehiculo_id;
    sol.turno_asignado_id = turno.id;

    syncTurnoToFirestore(turno);
    syncSolicitudPasajeroToFirestore(sol);

    // Actualizar despacho en ruta si existe
    const despacho = this.despachos.find(d => (d.turno_id === turno.id || d.vehiculo_id === turno.vehiculo_id) && d.estado === 'en_ruta');
    if (despacho) {
      despacho.pasajeros_ruta = (despacho.pasajeros_ruta || 0) + cantidadPaxs;
      despacho.pasajeros_totales = despacho.pasajeros_base + despacho.pasajeros_ruta;
      despacho.recaudacion_bruta = despacho.pasajeros_totales * (despacho.tarifa_plana || 1.50);
      syncDespachoToFirestore(despacho);
    }

    saveStorage(STORAGE_KEYS.SOLICITUDES_PASAJEROS, this.solicitudesPasajeros);

    this.addAuditLog('ASIGNAR_RECOGIDA_RUTA', `Recogida ${sol.referencia} (${cantidadPaxs} pax) asignada a Turno #${turno.numero_turno}. Asientos ocupados: ${turno.pasajeros_actuales}/${turno.pasajeros_max}`);
    this.notify();
    return { ok: true, message: `Recogida (${cantidadPaxs} pax) asignada exitosamente al Turno #${turno.numero_turno}. Asientos ocupados: ${turno.pasajeros_actuales}/${turno.pasajeros_max}.` };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÓDULO DE COMUNICACIÓN CONDUCTOR <-> BASE (OPTIMIZACIÓN 4)
  // ══════════════════════════════════════════════════════════════════════════

  public enviarMensajeConductor(params: {
    chofer_id: string;
    vehiculo_id: string;
    destinatario_base: string;
    texto: string;
    tipo?: 'rapido' | 'libre';
  }): MensajeConductorBase {
    const chofer = this.usuarios.find(u => u.uid === params.chofer_id);
    const vehiculo = this.vehiculos.find(v => v.id === params.vehiculo_id);
    const baseDest = this.bases.find(b => b.id === params.destinatario_base);

    const destinatarioNombre = params.destinatario_base === 'ambas'
      ? 'Todas las Bases'
      : (baseDest?.nombre || 'Base Central');

    const nuevoMsg: MensajeConductorBase = {
      id: `msg-c-${Date.now()}`,
      cooperativaId: vehiculo?.cooperativaId || this.currentCoopId,
      chofer_id: params.chofer_id,
      chofer_nombre: chofer?.nombre_completo || 'Conductor',
      unidad_numero: vehiculo?.numero_unidad || 'S/N',
      placa: vehiculo?.placa || 'GXY-1234',
      destinatario_base: params.destinatario_base,
      destinatario_nombre: destinatarioNombre,
      texto: params.texto,
      tipo: params.tipo || 'libre',
      respuesta_base: null,
      respondido_por: null,
      timestamp: new Date().toISOString(),
      timestamp_respuesta: null,
      leido: false
    };

    this.mensajesConductorBase.unshift(nuevoMsg);
    saveStorage(STORAGE_KEYS.MENSAJES_CONDUCTOR_BASE, this.mensajesConductorBase);
    this.addAuditLog('MENSAJE_CONDUCTOR_BASE', `Unidad #${nuevoMsg.unidad_numero} (${nuevoMsg.placa}) envió a ${nuevoMsg.destinatario_nombre}: "${nuevoMsg.texto}"`);
    this.notify();
    return nuevoMsg;
  }

  public enviarMensajeABase(params: {
    chofer_id?: string;
    conductor_id?: string;
    vehiculo_id?: string;
    unidad_id?: string;
    destinatario_base: string;
    texto: string;
    tipo?: 'rapido' | 'libre';
  }): MensajeConductorBase {
    return this.enviarMensajeConductor({
      chofer_id: params.chofer_id || params.conductor_id || 'usr-chofer',
      vehiculo_id: params.vehiculo_id || params.unidad_id || 'veh-15',
      destinatario_base: params.destinatario_base,
      texto: params.texto,
      tipo: params.tipo
    });
  }

  public responderMensajeBase(mensajeId: string, respuesta: string, respondidoPor: string): boolean {
    const msg = this.mensajesConductorBase.find(m => m.id === mensajeId);
    if (!msg) return false;

    msg.respuesta_base = respuesta;
    msg.respondido_por = respondidoPor;
    msg.timestamp_respuesta = new Date().toISOString();
    msg.leido = true;

    // Crear notificación push para el chofer
    const vehiculo = this.vehiculos.find(v => v.placa === msg.placa);
    this.agregarNotificacionChofer(
      msg.chofer_id,
      vehiculo?.id || 'veh-15',
      `Base (${msg.destinatario_nombre}): "${respuesta}"`,
      'info'
    );

    saveStorage(STORAGE_KEYS.MENSAJES_CONDUCTOR_BASE, this.mensajesConductorBase);
    this.addAuditLog('RESPUESTA_BASE_CONDUCTOR', `Base respondió a Unidad #${msg.unidad_numero}: "${respuesta}"`);
    this.notify();
    return true;
  }

  public marcarMensajesConductorLeidos(baseId: string): void {
    let modificado = false;
    this.mensajesConductorBase.forEach(m => {
      if ((m.destinatario_base === baseId || m.destinatario_base === 'ambas') && !m.leido) {
        m.leido = true;
        modificado = true;
      }
    });
    if (modificado) {
      saveStorage(STORAGE_KEYS.MENSAJES_CONDUCTOR_BASE, this.mensajesConductorBase);
      this.notify();
    }
  }

  public marcarMensajeLeido(mensajeId: string): void {
    const msg = this.mensajesConductorBase.find(m => m.id === mensajeId);
    if (msg && !msg.leido) {
      msg.leido = true;
      saveStorage(STORAGE_KEYS.MENSAJES_CONDUCTOR_BASE, this.mensajesConductorBase);
      this.notify();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GEOCERCA 50M Y GENERACIÓN AUTOMÁTICA DE TURNOS (OPTIMIZACIÓN 7)
  // ══════════════════════════════════════════════════════════════════════════

  public vaciarCarroConGeocerca50m(
    vehiculoId: string,
    choferId: string,
    latActual: number,
    lngActual: number
  ): {
    exito: boolean;
    distancia: number;
    base?: Base;
    turno?: Turno;
    esperaMinutos?: number;
    mensaje: string;
  } {
    const vehiculo = this.vehiculos.find(v => v.id === vehiculoId);
    if (!vehiculo) return { exito: false, distancia: 9999, mensaje: 'Vehículo no encontrado' };

    // Validar autorización de estado activo del vehículo para entrar en turno
    if (vehiculo.estado !== 'activo') {
      return {
        exito: false,
        distancia: 9999,
        mensaje: `La unidad #${vehiculo.numero_unidad} está en estado "${vehiculo.estado}". El estado ACTIVO es requerido para ingresar a la cola de turno.`
      };
    }

    // Buscar bases activas de la cooperativa (con fallback a bases activas generales si aún no tiene bases propias)
    let basesCoop = this.bases.filter(b => b.cooperativaId === vehiculo.cooperativaId && b.estado !== 'inactiva');
    if (basesCoop.length === 0) {
      basesCoop = this.bases.filter(b => b.estado !== 'inactiva');
    }
    if (basesCoop.length === 0) {
      return { exito: false, distancia: 9999, mensaje: 'No hay bases configuradas activas en el sistema' };
    }

    // Calcular distancia a cada base en metros
    let baseCercana: Base = basesCoop[0];
    let distanciaMinima = Infinity;

    for (const b of basesCoop) {
      const d = this.calcularDistanciaMetros(latActual, lngActual, b.lat, b.lng);
      if (d < distanciaMinima) {
        distanciaMinima = d;
        baseCercana = b;
      }
    }

    const distRedondeada = Math.round(distanciaMinima);

    // Si está fuera de los 50m
    if (distanciaMinima > 50) {
      return {
        exito: false,
        distancia: distRedondeada,
        base: baseCercana,
        mensaje: `⚠️ Acércate a la base (estás a ${distRedondeada} metros de ${baseCercana.nombre}, máx 50m permitidos). No se genera turno hasta estar dentro del rango.`
      };
    }

    // SI ESTÁ A 50M O MENOS: VACIAR CARRO Y GENERAR TURNO AUTOMÁTICO
    // 1. Si ya tiene un turno activo en esa base, no duplicar, sino resetear pasajeros
    const turnoExistente = this.turnos.find(
      t => t.vehiculo_id === vehiculoId && t.baseId === baseCercana.id && t.estado !== 'despachado'
    );

    if (turnoExistente) {
      turnoExistente.pasajeros_actuales = 0;
      turnoExistente.total_recaudado = 0;
      turnoExistente.estado = 'esperando';
      saveStorage(STORAGE_KEYS.TURNOS, this.turnos);
      this.notify();
      return {
        exito: true,
        distancia: distRedondeada,
        base: baseCercana,
        turno: turnoExistente,
        esperaMinutos: turnoExistente.numero_turno * 3,
        mensaje: `✅ Carro vaciado y turno #${turnoExistente.numero_turno} confirmado en ${baseCercana.nombre}.`
      };
    }

    // 2. Evaluar capacidad de Base Real para Pase Directo vs Pre-Base
    const ocupadosBaseReal = this.turnos.filter(
      t => t.baseId === baseCercana.id && t.ubicacion_fisica === 'base_real' && t.estado !== 'despachado'
    ).length;

    const capacidadBase = baseCercana.capacidad_max || baseCercana.capacidad_base || 4;
    const paseDirecto = ocupadosBaseReal < Math.max(1, capacidadBase - 1);
    const ubicacionFisica: UbicacionFisica = paseDirecto ? 'base_real' : 'prebase';

    // 3. Siguiente número correlativo FIFO
    const turnosBase = this.turnos.filter(t => t.baseId === baseCercana.id && t.estado !== 'despachado');
    const maxTurno = turnosBase.reduce((acc, curr) => Math.max(acc, curr.numero_turno), 0);
    const nuevoTurnoNum = maxTurno + 1;

    const nuevoTurno: Turno = {
      id: `tur-${Date.now()}`,
      cooperativaId: vehiculo.cooperativaId,
      baseId: baseCercana.id,
      vehiculo_id: vehiculoId,
      chofer_id: choferId,
      numero_turno: nuevoTurnoNum,
      ubicacion_fisica: ubicacionFisica,
      hora_llegada: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      hora_salida: null,
      pasajeros_actuales: 0,
      pasajeros_max: vehiculo.capacidad || 15,
      estado: 'esperando',
      tipo_conductor: 'chofer_titular',
      motivo_reasignacion: null,
      tarifa_viaje: 1.50,
      total_recaudado: 0
    };

    this.turnos.push(nuevoTurno);
    saveStorage(STORAGE_KEYS.TURNOS, this.turnos);

    const esperaEstimada = nuevoTurnoNum * 3; // 3 min aprox por unidad previa

    this.addAuditLog(
      'AUTO_TURNO_GEOCERCA_50M',
      `Unidad #${vehiculo.numero_unidad} (${vehiculo.placa}) detectada a ${distRedondeada}m de ${baseCercana.nombre}. Turno #${nuevoTurnoNum} generado automáticamente (${ubicacionFisica === 'base_real' ? 'Pase Directo a Andén' : 'Enviado a Pre-base'}).`
    );

    this.notify();

    return {
      exito: true,
      distancia: distRedondeada,
      base: baseCercana,
      turno: nuevoTurno,
      esperaMinutos: esperaEstimada,
      mensaje: `✅ Carro vaciado. Turno #${nuevoTurnoNum} generado en ${baseCercana.nombre} (${ubicacionFisica === 'base_real' ? 'Pase Directo' : 'Pre-Base'}).`
    };
  }

  public verificarLlegadaGeocerca(
    vehiculoId: string,
    choferId: string,
    latActual: number,
    lngActual: number
  ) {
    return this.vaciarCarroConGeocerca50m(vehiculoId, choferId, latActual, lngActual);
  }

  public calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DINÁMICA DE BASES CRUD (OPTIMIZACIÓN 5)
  // ══════════════════════════════════════════════════════════════════════════

  public addBase(baseData: Omit<Base, 'id'>): Base {
    const newBase: Base = {
      ...baseData,
      id: `base-${Date.now()}`,
      estado: baseData.estado || 'activa',
      rutas_asociadas: baseData.rutas_asociadas || []
    };

    this.bases.push(newBase);
    saveStorage(STORAGE_KEYS.BASES, this.bases);

    // Crear usuario para la base automáticamente
    const basesCount = this.bases.filter(b => b.cooperativaId === baseData.cooperativaId).length;
    const baseUsername = baseData.numero_base ? `base${baseData.numero_base}` : `base${basesCount}`;
    this.usuarios.push({
      uid: `usr-base-${Date.now()}`,
      cooperativaId: baseData.cooperativaId,
      cedula: '0000000000',
      rol_secundario: null,
      nombre_completo: `Administrador ${newBase.nombre}`,
      email: `${baseUsername}@${baseData.cooperativaId.replace('coop-', '')}.com`,
      telefono: '0990000000',
      rol: 'despachador',
      base_asignada: newBase.id,
      password: '1234',
      password_cambiado: false,
      activo: true,
      fecha_registro: new Date().toISOString().split('T')[0]
    });
    saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);

    this.addAuditLog('CREAR_BASE', `Nueva base creada: ${newBase.nombre} con capacidad ${newBase.capacidad_max} y usuario ${baseUsername}`);
    this.notify();
    return newBase;
  }

  public updateBase(baseId: string, patch: Partial<Base>): boolean {
    const base = this.bases.find(b => b.id === baseId);
    if (!base) return false;

    Object.assign(base, patch);
    saveStorage(STORAGE_KEYS.BASES, this.bases);
    
    // Update or create base user
    if (patch.numero_base) {
      let baseUser = this.usuarios.find(u => u.base_asignada === baseId && u.rol === 'despachador');
      const baseUsername = `base${patch.numero_base}`;
      const newEmail = `${baseUsername}@${base.cooperativaId.replace('coop-', '')}.com`;
      
      if (baseUser) {
        baseUser.email = newEmail;
        saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
      } else {
        this.usuarios.push({
          uid: `usr-base-${Date.now()}`,
          cooperativaId: base.cooperativaId,
          cedula: '0000000000',
          rol_secundario: null,
          nombre_completo: `Administrador ${base.nombre}`,
          email: newEmail,
          telefono: '0990000000',
          rol: 'despachador',
          base_asignada: base.id,
          password: '1234',
          password_cambiado: false,
          activo: true,
          fecha_registro: new Date().toISOString().split('T')[0]
        });
        saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
      }
    }

    this.addAuditLog('EDITAR_BASE', `Base actualizada: ${base.nombre}`);
    this.notify();
    return true;
  }

  public toggleEstadoBase(baseId: string): { ok: boolean; message: string } {
    const base = this.bases.find(b => b.id === baseId);
    if (!base) return { ok: false, message: 'Base no encontrada' };

    const turnosActivos = this.turnos.filter(t => t.baseId === baseId && t.estado !== 'despachado');
    if (base.estado === 'activa' && turnosActivos.length > 0) {
      return {
        ok: false,
        message: `No se puede desactivar ${base.nombre} porque tiene ${turnosActivos.length} turnos activos en cola.`
      };
    }

    base.estado = base.estado === 'activa' ? 'inactiva' : 'activa';
    saveStorage(STORAGE_KEYS.BASES, this.bases);
    this.addAuditLog('ESTADO_BASE', `Base ${base.nombre} cambiada a estado: ${base.estado}`);
    this.notify();
    return { ok: true, message: `Base ${base.nombre} ahora está ${base.estado}` };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÓDULO DE CLIENTES & RESERVAS (OPTIMIZACIONES 9 A 14)
  // ══════════════════════════════════════════════════════════════════════════

  public crearCliente(data: Omit<Cliente, 'id' | 'fecha_registro'>): Cliente {
    const nuevoCliente: Cliente = {
      ...data,
      id: `cli-${Date.now()}`,
      fecha_registro: new Date().toISOString().split('T')[0]
    };
    this.clientes.push(nuevoCliente);
    saveStorage(STORAGE_KEYS.CLIENTES, this.clientes);
    this.notify();
    return nuevoCliente;
  }

  public crearReservaCliente(data: {
    cooperativaId: string;
    cliente_id?: string;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_tipo: 'invitado' | 'registrado';
    fecha: string;
    hora_deseada: string;
    hora_limite?: string;
    punto_recogida: {
      nombre: string;
      lat: number;
      lng: number;
      referencia: string;
    };
    destino_es_base: boolean;
    base_destino_id?: string;
    destino_nombre: string;
    cantidad_pasajeros?: number;
    modo_pago: 'efectivo' | 'transferencia';
    monto: number;
    transferencia_banco?: 'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros';
    transferencia_numero_operacion?: string;
    transferencia_comprobante_url?: string;
  }): ReservaCliente {
    const cantidadPaxs = data.cantidad_pasajeros || 1;
    const nuevaReserva: ReservaCliente = {
      id: `res-c-${Date.now()}`,
      cooperativaId: data.cooperativaId,
      cliente_id: data.cliente_id || `cli-temp-${Date.now()}`,
      cliente_nombre: data.cliente_nombre,
      cliente_telefono: data.cliente_telefono,
      cliente_tipo: data.cliente_tipo,
      fecha: data.fecha,
      hora_deseada: data.hora_deseada,
      hora_limite: data.hora_limite || data.hora_deseada,
      punto_recogida: data.punto_recogida,
      destino_es_base: data.destino_es_base,
      base_destino_id: data.base_destino_id,
      destino_nombre: data.destino_nombre,
      cantidad_pasajeros: cantidadPaxs,
      modo_pago: data.modo_pago,
      monto: data.monto || 1.50,
      transferencia_banco: data.transferencia_banco,
      transferencia_numero_operacion: data.transferencia_numero_operacion,
      transferencia_comprobante_url: data.transferencia_comprobante_url,
      transferencia_estado: data.modo_pago === 'efectivo' ? 'aprobado' : 'pendiente',
      estado: 'pendiente',
      vehiculo_asignado: null,
      timestamp_creacion: new Date().toISOString()
    };

    this.reservasClientes.unshift(nuevaReserva);
    saveStorage(STORAGE_KEYS.RESERVAS_CLIENTES, this.reservasClientes);

    // Auto-crear solicitud en ruta para el panel/tablet de despacho
    this.crearSolicitudPasajero({
      cooperativaId: data.cooperativaId,
      pasajero_nombre: data.cliente_nombre,
      pasajero_telefono: data.cliente_telefono,
      lat: data.punto_recogida.lat,
      lng: data.punto_recogida.lng,
      referencia: `${data.punto_recogida.nombre} - ${data.punto_recogida.referencia || 'En ruta'}`,
      cantidad_pasajeros: cantidadPaxs,
      estado: 'pendiente',
      creada_por: 'pasajero_web'
    });

    this.addAuditLog('NUEVA_RESERVA_CLIENTE', `Reserva creada para ${nuevaReserva.cliente_nombre} (${cantidadPaxs} pax) (${nuevaReserva.punto_recogida.nombre} -> ${nuevaReserva.destino_nombre})`);
    this.notify();
    return nuevaReserva;
  }

  public asignarUnidadReserva(
    reservaId: string,
    vehiculoId: string,
    choferId: string,
    etaMinutos: number = 7
  ): boolean {
    const res = this.reservasClientes.find(r => r.id === reservaId);
    if (!res) return false;

    const vehiculo = this.vehiculos.find(v => v.id === vehiculoId);
    const chofer = this.usuarios.find(u => u.uid === choferId);
    const cantidadPaxs = res.cantidad_pasajeros || 1;

    // Buscar turno activo del vehículo para descontar de su capacidad disponible
    const t = this.turnos.find(tur => tur.vehiculo_id === vehiculoId && tur.estado !== 'despachado');
    if (t) {
      t.pasajeros_actuales = Math.min(t.pasajeros_max, (t.pasajeros_actuales || 0) + cantidadPaxs);
      if (t.pasajeros_actuales >= t.pasajeros_max) {
        t.estado = 'listo';
      }
      t.total_recaudado = t.pasajeros_actuales * (t.tarifa_viaje || 1.50);
      syncTurnoToFirestore(t);
    }

    res.estado = 'asignada';
    res.unidad_asignada_id = vehiculoId;
    res.vehiculo_asignado = {
      numero_unidad: vehiculo?.numero_unidad || '15',
      placa: vehiculo?.placa || 'GXY-1234',
      modelo: vehiculo?.modelo || 'Hyundai County',
      color: vehiculo?.color || 'Blanco/Verde',
      chofer_nombre: chofer?.nombre_completo || 'Pedro Pérez',
      tiempo_estimado_llegada_min: etaMinutos,
      ubicacion_en_vivo: {
        lat: vehiculo?.ubicacion_actual?.lat || -2.1384,
        lng: vehiculo?.ubicacion_actual?.lng || -79.8967
      }
    };
    res.ubicacion_compartida_activa = true;
    res.timestamp_asignacion = new Date().toISOString();

    // Notificar al chofer sobre el pasajero asignado para recoger
    this.agregarNotificacionChofer(
      choferId,
      vehiculoId,
      `Recoger a ${res.cliente_nombre} (${res.cliente_telefono}) - ${cantidadPaxs} pax en: ${res.punto_recogida.nombre} - ${res.punto_recogida.referencia}. Destino: ${res.destino_nombre}`,
      'recogida_ruta'
    );

    saveStorage(STORAGE_KEYS.RESERVAS_CLIENTES, this.reservasClientes);
    this.addAuditLog('ASIGNAR_RESERVA', `Reserva #${reservaId.slice(-4)} (${cantidadPaxs} pax) asignada a Unidad #${res.vehiculo_asignado.numero_unidad} (${res.vehiculo_asignado.placa}) - Chofer ${res.vehiculo_asignado.chofer_nombre}`);
    this.notify();
    return true;
  }

  public aprobarComprobanteReserva(reservaId: string): boolean {
    const res = this.reservasClientes.find(r => r.id === reservaId);
    if (!res) return false;

    res.transferencia_estado = 'aprobado';
    saveStorage(STORAGE_KEYS.RESERVAS_CLIENTES, this.reservasClientes);
    this.addAuditLog('APROBAR_COMPROBANTE', `Comprobante de pago verificado para reserva #${reservaId.slice(-4)}`);
    this.notify();
    return true;
  }

  public cancelarReservaCliente(reservaId: string, motivo?: string): boolean {
    const res = this.reservasClientes.find(r => r.id === reservaId);
    if (!res) return false;

    res.estado = 'cancelada';
    saveStorage(STORAGE_KEYS.RESERVAS_CLIENTES, this.reservasClientes);
    this.addAuditLog('CANCELAR_RESERVA', `Reserva #${reservaId.slice(-4)} cancelada. Motivo: ${motivo || 'Solicitud de cliente'}`);
    this.notify();
    return true;
  }
}

export const rutaxStore = new RutaxStore();
