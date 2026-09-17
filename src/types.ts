/**
 * RUTAX-SMART — Tipos y Modelos de Dominio
 * Multi-cooperativa, fixed-route dispatch FIFO y seguimiento en tiempo real
 */

export type RolUsuario = 'superadmin' | 'admin_coop' | 'despachador' | 'socio' | 'chofer' | 'cliente';
export type RolSecundario = 'chofer' | 'socio' | null;
export type EstadoCooperativa = 'activa' | 'suspendida' | 'prueba' | 'bloqueada' | 'inactiva' | 'bloqueo_parcial' | 'cancelada';
export type PlanCooperativa = 'basico' | 'pro' | 'enterprise';

export type EstadoVehiculo = 
  | 'activo' 
  | 'mantenimiento' 
  | 'bloqueado_por_socio' 
  | 'en_registro' 
  | 'inactivo';

export type TipoVehiculo = 'sedan' | 'camioneta' | 'minibus' | 'bus';
export type ConductorActualTipo = 'chofer_titular' | 'propietario';

export type UbicacionFisica = 'base_real' | 'prebase' | 'desembarcando';

export type EstadoTurno = 
  | 'esperando' 
  | 'llenando' 
  | 'listo' 
  | 'despachado' 
  | 'desembarcando';

export interface ParadaSugerida {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  orden: number;
}

export interface Ruta {
  id: string;
  nombre: string;
  tarifa_plana: number;
  activa: boolean;
  fecha_vigencia?: string;
  historial_tarifas?: Array<{ tarifa: number; fecha: string; motivo: string }>;
}

export type RutaFija = Ruta;

export interface Cooperativa {
  id: string;
  nombre: string;
  ruc: string;
  logo_url: string;
  telefono: string;
  direccion: string;
  presidente_nombre: string;
  presidente_celular: string;
  presidente_cedula?: string;
  presidente_email?: string;
  estado: EstadoCooperativa;
  fecha_creacion: string;
  fecha_vencimiento_suscripcion: string;
  plan: PlanCooperativa;
  rutas: Ruta[];
  paradas_sugeridas?: ParadaSugerida[];
  telefono_emergencia?: string;
  monto_deuda?: number;
  historial_pagos?: Array<{ id: string; fecha: string; monto: number; referencia: string; dias_agregados: number }>;
  bloqueo_tipo?: 'ninguno' | 'parcial' | 'total'; // Parcial: sin despacho, GPS sigue; Total: suspendido
}

export interface Usuario {
  uid: string;
  cooperativaId: string;
  numero_base?: string;
  cedula: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  rol: RolUsuario;
  rol_secundario: RolSecundario;
  base_asignada: string | null;
  foto_url?: string;
  licencia_tipo?: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_login?: string;
  huella_registrada?: boolean;
  password?: string;
  password_cambiado?: boolean;
  telefonos_emergencia?: {
    t1: string;
    t2?: string;
  };
  tipo_sangre?: string;
  clave_temporal?: boolean;
  bloqueos_ultimos_7_dias?: number;
  suspendido_por_bloqueos?: boolean;
  vehiculo_id?: string;
  placa_asignada?: string;
}

export interface DocumentosVehiculo {
  matricula_vigencia: string;
  soat_vigencia: string;
  revision_tecnica_vigencia: string;
}

export interface Vehiculo {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  numero_unidad: string;
  placa: string;
  modelo: string;
  anio: number;
  color: string;
  capacidad: 4 | 6 | 11 | 15 | 32;
  tipo_vehiculo: TipoVehiculo;
  foto_vehiculo_url: string;
  socio_id: string;
  chofer_titular_id: string;
  conductor_actual_tipo: ConductorActualTipo;
  estado: EstadoVehiculo;
  documentos: DocumentosVehiculo;
  km_actual: number;
  fecha_registro: string;
  bloqueado_por?: string;
  fecha_bloqueo?: string;
  motivo_bloqueo?: string;
  // Posición GPS simulada en tiempo real
  ubicacion_actual?: {
    lat: number;
    lng: number;
    velocidad_kmh: number;
    rumbo: number;
    ultima_actualizacion: string;
  };
  password?: string;
  password_cambiado?: boolean;
  sos_activo?: boolean;
}

export interface VehiculoPendiente {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  placa: string;
  modelo: string;
  color: string;
  propietario_nombre: string;
  propietario_cedula: string;
  propietario_telefono?: string;
  documentos_cargados: boolean;
  estado_revision: 'pendiente' | 'aprobado' | 'rechazado';
  observaciones: string;
  fecha_solicitud: string;
}

export interface PreBaseConfig {
  nombre: string;
  lat: number;
  lng: number;
  radio_geocerca: number; // metros
  capacidad_max: number;
  distancia_a_base: number; // metros
}

export interface Base {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  latitud?: number;
  longitud?: number;
  radio_geocerca: number;
  capacidad_max: number; // Capacidad Base Real (ej: 4)
  capacidad_base?: number; // Alias explícito de capacidad_max
  capacidad_prebase?: number; // Capacidad Pre-Base (ej: 20)
  color_pin: string;
  tiene_prebase: boolean;
  prebase?: PreBaseConfig;
  tiempo_max_espera_prebase?: number; // minutos (ej: 90)
  tiempo_para_avanzar?: number; // minutos (ej: 5)
  tiempo_max_espera_base?: number; // minutos antes de alerta amarilla (ej: 15)
  tiempo_max_desembarque?: number; // minutos en bahía (ej: 10)
  salida_incompleta_permitida?: boolean; // permitir forzar salida si no llena
  tiempo_min_forzar_salida?: number; // minutos mínimos para forzar (ej: 15)
  bahia_desembarque?: {
    lat: number;
    lng: number;
    radio: number;
  };
  estado?: 'activa' | 'inactiva';
  rutas_asociadas?: string[];
}

export interface Turno {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  baseId: string;
  vehiculo_id: string;
  chofer_id: string;
  numero_turno: number; // corrida única 1, 2, 3...
  ubicacion_fisica: UbicacionFisica; // 'base_real' | 'prebase' | 'desembarcando'
  hora_llegada: string; // ISO o HH:mm
  hora_salida?: string | null;
  pasajeros_actuales: number;
  pasajeros_max: number;
  estado: EstadoTurno; // 'esperando' | 'llenando' | 'listo' | 'despachado' | 'desembarcando'
  tipo_conductor?: 'chofer_titular' | 'propietario';
  motivo_reasignacion?: null | string;
  reasignado_por?: null | string;
  fecha_reasignacion?: null | string;
  tiempo_espera_min?: number; // Calculado en vivo
  observaciones?: string;
  tarifa_viaje?: number;
  total_recaudado?: number;
  bloqueado_por_socio?: boolean;
}

export interface Despacho {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  turno_id: string;
  vehiculo_id: string;
  chofer_id: string;
  base_origen_id: string;
  base_destino_id: string;
  hora_salida: string;
  hora_llegada?: string | null;
  pasajeros_base: number;
  pasajeros_ruta: number;
  pasajeros_totales: number;
  pasajeros_max: number;
  tarifa_plana: number;
  recaudacion_bruta: number;
  km_inicio: number;
  km_fin?: number;
  estado: 'en_ruta' | 'llegando' | 'desembarcando' | 'cerrado';
  duracion_min?: number;
  salida_incompleta?: boolean;
  motivo_salida_incompleta?: string;
}

export interface SolicitudPasajeroRuta {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  pasajero_nombre: string;
  pasajero_telefono: string;
  lat: number;
  lng: number;
  referencia: string;
  cantidad_pasajeros: number;
  estado: 'pendiente' | 'en_espera' | 'asignada' | 'recogida' | 'rechazada' | 'no_show';
  turno_asignado_id?: null | string;
  unidad_asignada_id?: null | string;
  creada_por: 'pasajero_web' | 'despachador';
  fecha_solicitud: string;
  fecha_asignacion?: string | null;
  posicion_espera?: null | number;
}

export interface LogAuditoriaTurno {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  usuario_id: string;
  usuario_nombre: string;
  rol: RolUsuario | string;
  accion: 'reasignacion' | 'salida_forzada' | 'cambio_estado' | 'edicion_manual';
  turno_id: string;
  motivo?: string;
  detalle: string;
  antes?: Record<string, unknown> | null;
  despues?: Record<string, unknown> | null;
  timestamp: string;
}

export interface NotificacionChofer {
  id: string;
  chofer_id: string;
  vehiculo_id: string;
  mensaje: string;
  tipo: 'avance_base' | 'tiempo_limite' | 'recogida_ruta' | 'bloqueo' | 'info';
  timestamp: string;
  leido: boolean;
}

export interface LogAuditoria {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  usuario_id: string;
  usuario_nombre?: string;
  accion: string;
  detalle: string;
  timestamp: string;
  ip: string;
  dispositivo: string;
}

export interface AlertaEmergencia {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  vehiculo_id: string;
  chofer_id: string;
  chofer_nombre: string;
  numero_unidad: string;
  tipo: 'SOS_ROJO' | 'ALERTA_AMARILLA';
  mensaje: string;
  lat: number;
  lng: number;
  timestamp: string;
  atendida: boolean;
  atendida_por?: string;
}

// ════════════════════════════════════════════════════════════════
// MÓDULO DE TRACKING GPS EN VIVO CON MAPAS (STACK GRATUITO LEAFLET / OSM)
// ════════════════════════════════════════════════════════════════

export type EstadoTrackingUnidad = 'en_base' | 'en_ruta' | 'emergencia' | 'desembarcando';

/**
 * 1) tracking_live (Firebase Realtime Database)
 * Ruta: /tracking/{cooperativaId}/{unidadId}
 */
export interface TrackingLive {
  unidadId: string;
  cooperativaId: string;
  numero_base?: string;
  lat: number;
  lng: number;
  velocidad: number;           // km/h
  rumbo: number;              // grados 0-360
  timestamp: number;          // epoch ms
  estado: EstadoTrackingUnidad;
  pasajeros: number;
  bateria_chofer: number;      // % batería celular (0-100)
  precision_gps: number;        // metros
  turno_id?: string;
  despacho_id?: string;
  numero_unidad?: string;
  placa?: string;
  chofer_nombre?: string;
  en_zona_riesgo?: boolean;
  zona_riesgo_nombre?: string;
  desviado_de_ruta?: boolean;
  esta_en_linea?: boolean;
}

/**
 * Punto individual registrado en el historial de trayecto
 */
export interface TrackingPuntoHistorial {
  lat: number;
  lng: number;
  timestamp: number;
  velocidad: number;
  pasajeros: number;
}

/**
 * 2) tracking_historial (Firestore - para reportes y replay de viajes)
 */
export interface TrackingHistorial {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  despacho_id: string;
  unidadId: string;
  numero_unidad?: string;
  chofer_nombre?: string;
  puntos: TrackingPuntoHistorial[];
  distancia_total_km: number;
  duracion_min: number;
  velocidad_max: number;
  velocidad_promedio: number;
  fecha: string; // YYYY-MM-DD
}

export type GeocercaTipo = 
  | 'base_real' 
  | 'prebase' 
  | 'bahia_desembarque' 
  | 'zona_riesgo' 
  | 'parada_sugerida';

export interface GeocercaConfig {
  horario_inicio?: string; // ej: '20:00'
  horario_fin?: string;    // ej: '04:00'
  nivel_alerta?: 'amarillo' | 'rojo';
  descripcion?: string;
}

/**
 * 3) geocercas (Firestore)
 */
export interface Geocerca {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  tipo: GeocercaTipo;
  nombre: string;
  lat: number;
  lng: number;
  radio_metros: number;
  activa: boolean;
  config?: GeocercaConfig;
}

export type AlertaTrackingTipo = 
  | 'desvio_ruta' 
  | 'velocidad_excesiva' 
  | 'parada_larga' 
  | 'entrada_zona_riesgo' 
  | 'salida_ruta_estimada';

export type AlertaTrackingSeveridad = 'info' | 'amarillo' | 'rojo';

/**
 * 4) alertas_tracking (Firestore)
 */
export interface AlertaTracking {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  unidadId: string;
  numero_unidad?: string;
  choferId: string;
  chofer_nombre?: string;
  tipo: AlertaTrackingTipo;
  severidad: AlertaTrackingSeveridad;
  mensaje: string;
  lat: number;
  lng: number;
  atendida: boolean;
  atendida_por: string | null;
  timestamp: number | string;
}

export type TileProviderType = 'osm' | 'carto_dark' | 'carto_light' | 'humanitarian' | 'mapbox';

export interface GPSAdaptiveStatus {
  intervaloSegundos: number;
  precisionMetros: number;
  modoAhorroBateria: boolean;
  forzadoPorZonaRiesgo: boolean;
  motivo: string;
  puntosEnBufferOffline: number;
}

// ════════════════════════════════════════════════════════════════
// MÓDULO FINANCIERO, LIQUIDACIONES & ARQUEO CONTABLE
// ════════════════════════════════════════════════════════════════

export type MetodoPago = 'efectivo' | 'deuna_qr' | 'transferencia' | 'saldo_prepago';

export type TipoGastoTurno = 
  | 'combustible' 
  | 'peaje' 
  | 'lavado' 
  | 'llanta_pinchada' 
  | 'mecanica_menor' 
  | 'alimentacion' 
  | 'cuota_despacho' 
  | 'otro';

export interface GastoTurno {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  vehiculo_id: string;
  chofer_id: string;
  tipo: TipoGastoTurno;
  descripcion: string;
  monto: number;
  comprobante_url?: string;
  fecha: string;
  hora: string;
  aprobado_por_socio?: boolean;
}

export interface LiquidacionViaje {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  despacho_id?: string;
  turno_id?: string;
  vehiculo_id: string;
  numero_unidad: string;
  chofer_id: string;
  chofer_nombre: string;
  socio_id: string;
  fecha: string;               // YYYY-MM-DD
  hora_cierre: string;          // HH:mm
  ruta_nombre: string;
  pasajeros_base: number;
  pasajeros_ruta: number;
  pasajeros_totales: number;
  tarifa_unitaria: number;
  recaudacion_bruta: number;   // Total ingresado
  
  // Desglose por método de pago
  monto_efectivo: number;
  monto_digital: number;       // DeUna / Transferencia
  
  // Deducciones directas de la carrera
  cuota_administracion_coop: number; // Aporte por carrera
  fondo_auxilio_social: number;       // Seguro/Auxilio gremial
  gastos_carrera: number;             // Peajes/gastos directos
  
  // Rendimientos
  recaudacion_neta: number;          // Bruta - deducciones y gastos
  pago_chofer_estimado: number;      // Según esquema (ej. 30% o tarifa fija)
  rendimiento_socio_estimado: number; // Saldo para el dueño de la unidad
  
  estado: 'pendiente' | 'liquidado' | 'revisado' | 'observado';
  observaciones?: string;
}

export interface ArqueoTurnoChofer {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  chofer_id: string;
  chofer_nombre: string;
  vehiculo_id: string;
  numero_unidad: string;
  socio_id: string;
  fecha: string;                      // YYYY-MM-DD
  hora_inicio: string;
  hora_cierre: string;
  total_carreras: number;
  total_pasajeros: number;
  
  // Recaudación acumulada
  recaudacion_bruta: number;
  total_efectivo: number;
  total_digital: number;
  
  // Gastos registrados
  gastos: GastoTurno[];
  total_gastos: number;
  
  // Cuotas de cooperativa
  total_cuotas_coop: number;
  total_fondo_auxilio: number;
  
  // Liquidación final al Socio
  comision_chofer: number;           // Ganancia/Sueldo del chofer del turno
  saldo_neto_entregar_socio: number; // Dinero físico que debe entregar al dueño
  
  estado_entrega: 'pendiente' | 'entregado_al_socio' | 'confirmado_socio';
  fecha_entrega?: string;
  firma_digital_o_codigo?: string;
  notas?: string;
}

export interface ConfiguracionFinancieraCoop {
  cooperativaId: string;
  numero_base?: string;
  cuota_admin_por_carrera: number;    // Ej: $0.15 por despacho
  cuota_admin_diaria_unidad: number;  // Ej: $2.50 diarios por vehículo
  fondo_auxilio_por_carrera: number;  // Ej: $0.05 por carrera
  fondo_multa_retraso_salida: number; // Ej: $1.00 por demora injustificada
  porcentaje_comision_chofer_defecto: number; // Ej: 30% (o 0 si usa sueldo fijo)
  permite_gastos_sin_foto: boolean;
  banco_cooperativa?: string;
  numero_cuenta_coop?: string;
  qr_deuna_coop_url?: string;
}

// ═══════════════════════════════════════════════════════
// MÓDULO DE PASAJEROS FRECUENTES, RESERVAS Y NOTIFICACIONES
// ═══════════════════════════════════════════════════════

export type TipoPasajero = 'frecuente' | 'ocasional' | 'empresa' | 'estudiante' | 'tercera_edad';
export type PreferenciaAsiento = 'indistinto' | 'adelante' | 'ventana' | 'atras_solo';
export type EstadoPasajero = 'activo' | 'inactivo' | 'bloqueado';

export interface PuntoRecogidaGuardado {
  id: string;
  nombre: string;         // 'Casa' | 'Trabajo' | 'Universidad' | etc.
  lat: number;
  lng: number;
  referencia: string;     // Ej: 'Frente a TIA, casa esquinera reja negra'
  es_preferido: boolean;  // el que más usa
  veces_usado: number;
}

export interface PasajeroFrecuente {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  nombre_completo: string;
  telefono: string;       // único por cooperativa
  cedula: string | null;
  email: string | null;
  tipo: TipoPasajero;
  
  // Puntos de recogida
  puntos_recogida: PuntoRecogidaGuardado[];
  
  // Preferencias
  preferencia_asiento: PreferenciaAsiento;
  preferencia_chofer_id: string | null;  // "solo con Pedro"
  preferencia_horario: string | null;     // '6:15am', etc.
  notas: string;                          // 'Se marea atrás / Lleva maleta grande / Tercera edad'
  
  // Crédito (para empresas / convenios)
  tiene_credito: boolean;
  cupo_mensual: number;
  precio_pactado: number | null;          // tarifa especial
  saldo_pendiente: number;
  contacto_empresa_nombre?: string;
  contacto_empresa_telefono?: string;
  dia_corte_pago?: number;               // ej. día 15 de cada mes
  
  // Estadísticas
  total_viajes: number;
  ultimo_viaje: string | null;           // ISO string o timestamp
  primera_fecha: string;
  estado: EstadoPasajero;
  
  creado_por: string;
  timestamp: string;
}

export type EstadoReserva = 
  | 'pendiente' 
  | 'asignada' 
  | 'confirmada' 
  | 'recogida' 
  | 'no_show' 
  | 'cancelada' 
  | 'expirada';

export interface Reserva {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  pasajero_id: string;
  pasajero_nombre?: string;
  pasajero_telefono?: string;
  pasajero_tipo?: TipoPasajero;
  
  fecha: string;                          // YYYY-MM-DD (ej: '2026-09-17')
  hora_deseada: string;                   // '06:15'
  hora_limite: string;                    // '06:30' (si no se asigna en este rango, cancelar/expirar)
  
  punto_recogida: {
    id?: string;
    nombre: string;
    lat: number;
    lng: number;
    referencia: string;
  };
  
  base_origen_id?: string;
  ruta_id?: string;
  ruta_nombre?: string;
  cantidad_pasajeros: number;
  
  estado: EstadoReserva;
  
  turno_asignado_id: string | null;
  unidad_asignada_id: string | null;
  numero_unidad?: string;
  placa_unidad?: string;
  chofer_asignado_id: string | null;
  chofer_nombre?: string;
  chofer_telefono?: string;
  
  notificacion_whatsapp_enviada: boolean;
  hora_notificacion: string | null;
  
  es_credito_empresa?: boolean;
  monto_tarifa?: number;
  observaciones?: string;
  
  creada_por: 'pasajero_web' | 'despachador' | 'admin';
  fecha_creacion: string;
  fecha_asignacion: string | null;
  fecha_recogida: string | null;
  
  motivo_cancelacion: string | null;
  cancelada_por: string | null;
}

export interface PuntoRecogidaFrecuente {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  nombre: string;                         // 'Gasolinera Primax Km 12'
  lat: number;
  lng: number;
  radio: number;                          // metros de influencia (ej: 50m)
  total_recogidas: number;
  pasajeros_que_usan: string[];           // IDs de pasajeros
  ultima_recogida: string;
  activa: boolean;
  creada_por: 'sistema' | 'admin';
}

export type TipoNotificacionWhatsApp = 
  | 'reserva_confirmada' 
  | 'unidad_asignada' 
  | 'unidad_en_camino' 
  | 'llegada_inminente' 
  | 'recordatorio_diario' 
  | 'pago_pendiente';

export interface NotificacionWhatsAppLog {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  tipo: TipoNotificacionWhatsApp;
  destinatario_telefono: string;
  destinatario_nombre: string;
  mensaje: string;
  estado: 'enviado' | 'entregado' | 'fallido';
  whatsapp_message_id: string | null;
  timestamp: string;
}

export interface PlantillasMensajesWhatsApp {
  reserva_confirmada: string;
  unidad_asignada: string;
  unidad_en_camino: string;
  llegada_inminente: string;
  recordatorio_diario: string;
}

export interface ConfiguracionPasajeros {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  whatsapp_habilitado: boolean;
  whatsapp_numero_base: string;           // con código país, ej: '593991234567'
  whatsapp_api_token: string;
  
  permitir_reservas_anticipadas: boolean;
  dias_maximos_reserva: number;           // ej: 7 días
  hora_limite_cancelacion: number;        // horas antes de la reserva, ej: 2
  
  notificar_pasajero: {
    al_asignar_unidad: boolean;
    cuando_unidad_sale: boolean;
    cuando_unidad_esta_1km: boolean;
    cuando_unidad_llega: boolean;
    recordatorio_diario_reservas: boolean;
  };
  
  plantilla_mensajes: PlantillasMensajesWhatsApp;
  
  precio_reserva_adicional: number;       // cobro extra por reservar (ej: $0.00)
  permitir_credito_empresas: boolean;
  dias_credito_empresas: number;          // ej: 30 días
}

export interface HistorialViajePasajero {
  id: string;
  pasajero_id: string;
  fecha: string;
  hora: string;
  punto_nombre: string;
  numero_unidad: string;
  chofer_nombre: string;
  tarifa: number;
  es_credito: boolean;
  metodo_pago: 'efectivo' | 'digital' | 'credito';
}

export interface PagoCreditoEmpresa {
  id: string;
  empresa_id: string;
  empresa_nombre: string;
  monto: number;
  fecha: string;
  comprobante: string;
  registrado_por: string;
  notas?: string;
}

// ═══════════════════════════════════════════════════════════════════
// MÓDULO DE SEGURIDAD SOS, ANTIRROBO Y NOTIFICACIONES BASE-CHOFERES
// ═══════════════════════════════════════════════════════════════════

export type TipoAlertaSeguridad = 'sos_accidente' | 'antirrobo' | 'alerta_amarilla' | 'zona_riesgo';
export type SubtipoAlertaAmarilla = 
  | 'llanta' 
  | 'mecanica' 
  | 'pasajero_conflictivo' 
  | 'trafico' 
  | 'via_cerrada' 
  | 'relevo' 
  | 'asalto' 
  | 'accidente'
  | 'otro';

export type EstadoAlertaSeguridad = 'activa' | 'atendiendo' | 'cerrada' | 'falsa';

export type TipoDesactivacionAlerta = 
  | 'huella_normal' 
  | 'huella_coaccion' 
  | 'clave_maestra' 
  | 'timeout';

export type ResolucionAlerta = 
  | 'falsa_alarma' 
  | 'recuperado' 
  | 'denuncia_policia' 
  | 'chofer_a_salvo' 
  | 'unidad_recuperada';

export interface ContactoNotificadoAlerta {
  tipo: 'admin' | 'despachador' | 'socio' | 'emergencia1' | 'emergencia2' | 'cooperativa';
  nombre: string;
  telefono: string;
  notificado_en: string;
  respondio: boolean;
}

export interface PuntoGPSRobo {
  lat: number;
  lng: number;
  velocidad?: number;
  timestamp: string;
}

export interface AudioEvidencia {
  id: string;
  url: string;
  timestamp: string;
  duracion_seg: number;
  titulo: string;
}

export interface AlertaSeguridad {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  unidadId: string;
  unidadNumero?: string;
  choferId: string;
  choferNombre?: string;
  socioId?: string;
  socioNombre?: string;
  placa?: string;
  
  tipo: TipoAlertaSeguridad;
  subtipo: SubtipoAlertaAmarilla | null;
  motivo_detalle?: string;
  
  // UBICACIÓN Y TIEMPO
  lat: number;
  lng: number;
  direccion_referencia: string;
  timestamp_activacion: string;
  timestamp_atencion: string | null;
  timestamp_cierre: string | null;
  
  // ESTADO
  estado: EstadoAlertaSeguridad;
  atendida_por: string | null;
  atendida_por_nombre?: string | null;
  cerrada_por: string | null;
  cerrada_por_nombre?: string | null;
  
  // EVIDENCIA
  audio_url: string | null;            // grabación 2 min en antirrobo
  audio_urls: AudioEvidencia[];        // múltiples audios en bucle
  puntos_gps_robos: PuntoGPSRobo[];    // puntos cada 3 seg durante robo
  duracion_min: number;
  
  // HUELLA
  tipo_desactivacion: TipoDesactivacionAlerta | null;
  mensaje_coaccion: string | null;     // "Sigue en peligro" si usó huella coacción
  
  // CONTACTOS NOTIFICADOS
  contactos_notificados: ContactoNotificadoAlerta[];
  
  // RESOLUCIÓN
  resolucion: ResolucionAlerta | null;
  observaciones_cierre: string;
  
  // PDF REPORTE
  pdf_reporte_url: string | null;
  
  prioridad: 'alta' | 'media' | 'baja';
}

export type DestinatarioNotificacion = 
  | 'todos' 
  | 'en_ruta' 
  | 'en_base_a' 
  | 'en_base_b' 
  | 'en_prebase' 
  | 'unidad_especifica';

export type PrioridadNotificacion = 'normal' | 'urgente' | 'critica';

export interface LecturaNotificacion {
  chofer_id: string;
  chofer_nombre?: string;
  unidad_id: string;
  unidad_numero?: string;
  timestamp_lectura: string;
}

export interface PendienteLecturaNotificacion {
  chofer_id: string;
  unidad_id: string;
  unidad_numero?: string;
  chofer_nombre?: string;
}

export interface NotificacionBaseConductores {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  de: {
    usuario_id: string;
    rol: string;
    nombre: string;
    base_id?: string | null;
  };
  para: DestinatarioNotificacion;
  unidad_destino_id: string | null;
  unidad_destino_numero?: string;
  
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  
  // LECTURA
  leida_por: LecturaNotificacion[];
  no_leida_por: PendienteLecturaNotificacion[];
  
  // CONFIRMACIÓN
  requiere_confirmacion: boolean;
  confirmada_por: string[]; // chofer_ids que tocaron "RECIBIDO"
  
  // TTS
  leer_en_voz_alta: boolean;
  
  timestamp: string;
  expira_en_min: number;
}

export interface HorarioRiesgo {
  activo_todos_dias: boolean;
  dias_semana: string[];
  hora_inicio: string; // "20:00"
  hora_fin: string;    // "04:00"
}

export interface ZonaRiesgo {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  nombre: string;
  descripcion: string;
  
  // GEOCERCA
  tipo: 'circulo' | 'poligono';
  lat: number;
  lng: number;
  radio: number; // metros
  poligono_coords?: Array<[number, number]>;
  
  // HORARIO
  horario_activo: HorarioRiesgo;
  
  // CONFIGURACIÓN ALERTA
  nivel_alerta: 'amarillo' | 'rojo';
  gps_frecuencia_forzada: number; // segundos (ej: 10)
  grabar_audio_al_entrar: boolean;
  notificar_socio_al_entrar: boolean;
  
  // ESTADÍSTICAS
  total_entradas_historico: number;
  incidentes_reportados: number;
  ultima_entrada: string | null;
  
  activa: boolean;
  creada_por: string;
  timestamp: string;
}

export interface HuellasRegistradas {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  chofer_id: string;
  
  // HASHES DE HUELLA
  huella_normal_hash: string;   // índice: "Estoy bien"
  huella_coaccion_hash: string; // medio: "Sigo en peligro"
  
  // ALTERNATIVAS
  pin_emergencia_6_digitos: string; // PIN 6 dígitos hash
  face_id_registrado: boolean;
  
  fecha_registro: string;
  ultima_verificacion: string;
  
  modo_biometrico_activo: 'huella' | 'pin' | 'face_id';
}

export type TipoEventoSeguridad = 
  | 'sos_activado' 
  | 'antirrobo_activado' 
  | 'antirrobo_desactivado' 
  | 'huella_normal_usada' 
  | 'huella_coaccion_usada' 
  | 'entrada_zona_riesgo' 
  | 'salida_zona_riesgo' 
  | 'notificacion_enviada' 
  | 'notificacion_leida' 
  | 'audio_iniciado' 
  | 'audio_detenido' 
  | 'llamada_ecu911' 
  | 'pdf_generado'
  | 'clave_maestra_usada'
  | 'alerta_amarilla_reportada';

export interface LogSeguridad {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  evento: TipoEventoSeguridad;
  unidad_id?: string;
  unidad_numero?: string;
  chofer_id?: string;
  chofer_nombre?: string;
  lat?: number;
  lng?: number;
  detalle: string;
  timestamp: string;
  ip?: string;
  dispositivo?: string;
}

export interface ConfiguracionSeguridadCoop {
  cooperativaId: string;
  numero_base?: string;
  numero_emergencia_coop: string;
  grupo_whatsapp_seguridad: string;
  webhook_emergencia: string;
  
  sos_requiere_confirmacion: boolean;
  antirrobo_long_press_seg: number;
  tiempo_grabacion_audio_min: number;
  frecuencia_gps_emergencia_seg: number;
  
  notificar_contactos: {
    admin: boolean;
    despachadores: boolean;
    dueno_unidad: boolean;
    emergencia1: boolean;
    emergencia2: boolean;
  };
  
  tiempo_espera_emergencia1_seg: number;
  huella_coaccion_habilitada: boolean;
  pin_emergencia_alternativo: boolean;
  
  zonas_riesgo_habilitadas: boolean;
  grabar_audio_zonas_riesgo: boolean;
  notificar_dueno_zona_riesgo: boolean;
  
  generar_pdf_automatico: boolean;
  retener_audios_dias: number;
}

// ═══════════════════════════════════════════════════════════════
// MÓDULO SUPERADMIN DE COBROS Y GESTIÓN MULTI-COOPERATIVA (PROMPT 7)
// ═══════════════════════════════════════════════════════════════

export interface PlanSuscripcion {
  id: string;
  nombre: string;
  precio_por_unidad: number; // USD mensuales (5, 15, 25)
  moneda: 'USD';
  caracteristicas: string[];
  incluye_todo?: boolean;
  precio_fijo?: boolean;
  unidades_minimas: number;
  unidades_maximas: number | null;
  activo: boolean;
  fecha_creacion: string;
}

export type EstadoSuscripcion = 
  | 'activa' 
  | 'por_vencer' 
  | 'vencida' 
  | 'bloqueo_parcial' 
  | 'bloqueada' 
  | 'cancelada';

export interface UltimoPagoSuscripcion {
  monto: number;
  fecha: string;
  metodo: 'transferencia' | 'efectivo' | 'deposito';
  comprobante_url?: string;
  registrado_por: string;
  periodo_cubierto: { desde: string; hasta: string };
}

export interface BloqueoHistorial {
  tipo: 'parcial' | 'total';
  fecha: string;
  motivo: string;
  levantado_en?: string;
}

export interface RecordatorioEnviado {
  tipo: 'por_vencer' | 'vencida' | 'bloqueo_parcial' | 'bloqueo_total';
  fecha: string;
}

export interface SuscripcionCooperativa {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  plan_id: string;
  precio_por_unidad: number;
  unidades_activas: number;
  monto_mensual: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_gracia: number;
  estado_suscripcion: EstadoSuscripcion;
  dias_mora: number;
  descuento_porcentaje?: number;
  motivo_descuento?: string;
  mes_gracia_inicial?: boolean;
  ultimo_pago?: UltimoPagoSuscripcion;
  bloqueos_historial: BloqueoHistorial[];
  recordatorios_enviados: RecordatorioEnviado[];
}

export interface ComprobantePago {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  suscripcion_id: string;
  monto: number;
  moneda: 'USD';
  metodo: 'transferencia' | 'efectivo' | 'deposito';
  banco: 'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros';
  numero_operacion: string;
  fecha_operacion: string;
  cuenta_destino: string;
  comprobante_url: string;
  comprobante_nombre: string;
  estado: 'pendiente_revision' | 'aprobado' | 'rechazado';
  revisado_por: string | null;
  fecha_revision: string | null;
  motivo_rechazo: string | null;
  periodo_desde: string;
  periodo_hasta: string;
  subido_por: string;
  fecha_subida: string;
  ip?: string;
  dispositivo?: string;
  tipo_comprobante?: 'factura_sistema' | 'comprobante_cooperativa';
  cooperativa_eliminada?: boolean;
  cooperativa_nombre_historico?: string;
  cooperativa_ruc_historico?: string;
  unidades_detalle?: Array<{
    id: string;
    numero_unidad: string;
    placa: string;
    marca_modelo?: string;
    fecha_ingreso?: string;
    socio?: string;
  }>;
}

export interface HistoricoPagoArchivado {
  id: string;
  comprobante_id: string;
  cooperativa_id: string;
  cooperativa_nombre: string;
  cooperativa_ruc: string;
  monto: number;
  moneda: 'USD';
  metodo: string;
  banco: string;
  numero_operacion: string;
  fecha_pago: string;
  periodo_desde: string;
  periodo_hasta: string;
  aprobado_por: string;
  fecha_aprobacion: string;
  unidades_facturadas?: number;
  cooperativa_eliminada: boolean;
  fecha_archivo: string;
}

export type TipoNotificacionInterna = 
  | 'aviso_cobranza' 
  | 'comprobante_aprobado' 
  | 'comprobante_rechazado' 
  | 'facturacion_anticipada' 
  | 'bloqueo_aviso' 
  | 'comunicado_general' 
  | 'actualizacion_plan';

export interface NotificacionInternaCooperativa {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  tipo: TipoNotificacionInterna;
  titulo: string;
  mensaje: string;
  prioridad: 'normal' | 'alta' | 'urgente';
  leido: boolean;
  fecha_emision: string;
  fecha_lectura?: string | null;
  enviado_por: string; // 'Sistema Automatizado' | 'SuperAdmin Creador'
  accion_url?: string;
  metadatos?: {
    monto?: number;
    dias_mora?: number;
    plan_nombre?: string;
    numero_operacion?: string;
    unidades_activas?: number;
  };
}

export interface TopCooperativaMetrica {
  cooperativaId: string;
  numero_base?: string;
  nombre: string;
  unidades: number;
  monto_mensual: number;
  plan?: string;
}

export interface MetricasGlobales {
  id: string;
  fecha_actualizacion: string;
  total_cooperativas: number;
  cooperativas_activas: number;
  cooperativas_morosas: number;
  cooperativas_bloqueadas: number;
  cooperativas_nuevas_mes: number;
  cooperativas_canceladas_mes: number;
  total_unidades: number;
  unidades_activas: number;
  unidades_en_coops_morosas: number;
  mrr_actual: number;
  mrr_mes_anterior: number;
  variacion_mrr_pct: number;
  ingresos_mes_corriente: number;
  ingresos_mes_anterior: number;
  churn_rate_mes: number;
  churn_rate_unidades: number;
  total_por_cobrar: number;
  comprobantes_pendientes_revision: number;
  top_cooperativas_por_unidades: TopCooperativaMetrica[];
  proyeccion_proximos_3_meses: number[];
}

export interface LogSuperAdmin {
  id: string;
  superadmin_id: string;
  accion: 'crear_cooperativa' | 'editar_cooperativa' | 'eliminar_cooperativa' | 'crear_plan' | 'editar_plan' | 'eliminar_plan' | 'aprobar_comprobante' |
          'rechazar_comprobante' | 'bloquear_cooperativa' | 
          'desbloquear_cooperativa' | 'cancelar_suscripcion' |
          'cambiar_estado_manual' | 'exportar_reporte' | 'marcar_pagado' | 'otorgar_descuento' | 'editar_configuracion' | 'notificacion_interna';
  cooperativa_id_afectada: string | null;
  detalle: string;
  antes?: any;
  despues?: any;
  timestamp: string;
  ip?: string;
  dispositivo?: string;
}

export interface ConfiguracionSuperAdmin {
  id: string;
  cuenta_banco_principal: string;
  cuenta_banco_secundaria: string;
  nombre_titular: string;
  ruc: string;
  bloqueo_automatico_activo: boolean;
  dias_gracia_inicial: number;
  dias_para_bloqueo_parcial: number;
  dias_para_bloqueo_total: number;
  dias_para_borrado_datos: number;
  whatsapp_numero_negocio: string;
  whatsapp_api_token: string;
  email_notificaciones: string;
  email_notificaciones_cobranza?: string;
  telefono_contacto_cobranza?: string;
  plantilla_por_vencer: string;
  plantilla_vencida: string;
  plantilla_bloqueo_parcial: string;
  plantilla_bloqueo_total: string;
  generar_reporte_mensual_auto: boolean;
  dia_reporte_mensual: number;
  superadmins_autorizados: string[];
  ip_whitelist: string[];
}

export interface ProformaItem {
  tipo: 'registro_vehiculo' | 'renovacion';
  vehiculo_id?: string;
  numero_unidad: string;
  placa: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

export interface ProformaComprobante {
  id: string;
  monto: number;
  metodo: 'transferencia' | 'efectivo' | 'deposito';
  banco: 'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros';
  numero_operacion: string;
  comprobante_url: string;
  subido_por: string;
  fecha_subida: string;
  estado: 'pendiente_revision' | 'aprobado' | 'rechazado';
  revisado_por: string | null;
  motivo_rechazo: string | null;
}

export interface ProformaPago {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  numero_proforma: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  items: ProformaItem[];
  subtotal: number;
  impuestos: number;
  total: number;
  estado: 'pendiente' | 'pagada' | 'vencida' | 'parcial' | 'pendiente_revision';
  monto_pagado: number;
  monto_pendiente: number;
  periodo_desde: string;
  periodo_hasta: string;
  comprobantes: ProformaComprobante[];
  recordatorios_enviados: Array<{ tipo: 'creada' | 'por_vencer' | 'vencida'; fecha: string }>;
  creada_por: string;
  fecha_creacion: string;
}

export interface MensajeChatBase {
  id: string;
  de: { usuario_id: string; rol: string; nombre: string; base: 'A' | 'B' };
  texto: string;
  tipo: 'texto' | 'unidad_en_camino' | 'alerta' | 'solicitud_relevo';
  timestamp: string;
  leido_por: Array<{ usuario_id: string; timestamp: string }>;
}

export interface ChatBases {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  tipo: 'general' | 'coordinacion' | 'emergencia';
  participantes: string[];
  mensajes: MensajeChatBase[];
}

export interface CoordinacionBases {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  base_a_para_base_b: {
    unidades_en_camino_hacia_b: Array<{
      unidadId: string;
      placa: string;
      chofer_nombre: string;
      pasajeros: number;
      hora_salida: string;
      eta_min: number;
    }>;
    cola_base_a_resumen: {
      ocupados: number;
      capacidad: number;
      proximo_despacho_estimado: string;
    };
    alertas_activas_base_a: Array<{ tipo: string; mensaje: string; timestamp: string }>;
  };
  base_b_para_base_a: {
    unidades_en_camino_hacia_a: Array<{
      unidadId: string;
      placa: string;
      chofer_nombre: string;
      pasajeros: number;
      hora_salida: string;
      eta_min: number;
    }>;
    cola_base_b_resumen: {
      ocupados: number;
      capacidad: number;
      proximo_despacho_estimado: string;
    };
    alertas_activas_base_b: Array<{ tipo: string; mensaje: string; timestamp: string }>;
  };
  ultima_actualizacion: string;
}

export interface MensajeConductorBase {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  chofer_id: string;
  conductor_id?: string;
  chofer_nombre: string;
  conductor_nombre?: string;
  unidad_numero: string;
  vehiculo_id?: string;
  placa: string;
  destinatario_base: 'base-a' | 'base-b' | 'ambas' | string;
  destinatario_nombre: string;
  texto: string;
  tipo: 'rapido' | 'libre';
  respuesta?: string | null;
  respuesta_base?: string | null;
  respondido_por?: string | null;
  timestamp: string;
  hora?: string;
  fecha?: string;
  timestamp_respuesta?: string | null;
  leido: boolean;
  estado?: 'pendiente' | 'respondido';
}

export type Liquidacion = LiquidacionViaje;
export type EntregaDia = ArqueoTurnoChofer;
export type CierreDiario = any;
export type ConfiguracionLiquidacion = ConfiguracionFinancieraCoop;
export type DisputaLiquidacion = any;

export interface Cliente {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  tipo: 'invitado' | 'registrado';
  modo_pago_preferido?: 'efectivo' | 'transferencia';
  puntos_recogida: PuntoRecogidaGuardado[];
  total_viajes: number;
  ultimo_viaje?: string;
  fecha_registro: string;
}

export interface ReservaCliente {
  id: string;
  cooperativaId: string;
  numero_base?: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_tipo: 'invitado' | 'registrado';
  fecha: string;
  hora_deseada: string;
  hora_limite: string;
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
  transferencia_comprobante_url?: string | null;
  transferencia_estado?: 'pendiente' | 'aprobado' | 'rechazado';
  estado: 'pendiente' | 'asignada' | 'confirmada' | 'recogida' | 'cancelada' | 'no_show';
  turno_asignado_id?: string | null;
  unidad_asignada_id?: string | null;
  vehiculo_asignado?: {
    numero_unidad: string;
    placa: string;
    modelo: string;
    color: string;
    foto_chofer?: string;
    chofer_nombre?: string;
    tiempo_estimado_llegada_min?: number;
    ubicacion_en_vivo?: { lat: number; lng: number };
  } | null;
  ubicacion_compartida_activa?: boolean;
  notificacion_confirmacion_enviada?: boolean;
  notificacion_en_camino_enviada?: boolean;
  timestamp_creacion: string;
  timestamp_asignacion?: string | null;
  timestamp_recogida?: string | null;
}



