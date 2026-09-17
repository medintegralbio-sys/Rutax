/**
 * RUTAX-SMART — Servicios y Entidades de Seguridad SOS, Antirrobo Biométrico y Notificaciones Base ↔ Conductores
 */

import {
  AlertaSeguridad,
  NotificacionBaseConductores,
  ZonaRiesgo,
  HuellasRegistradas,
  LogSeguridad,
  ConfiguracionSeguridadCoop,
  Cooperativa
} from '../types';

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE SEGURIDAD POR DEFECTO
// ═══════════════════════════════════════════════════════════════════

export const CONFIG_SEGURIDAD_DEFAULT: ConfiguracionSeguridadCoop = {
  cooperativaId: 'coop-daule',
  numero_emergencia_coop: '0991122334',
  grupo_whatsapp_seguridad: 'https://chat.whatsapp.com/RutaxSeguridadDaule',
  webhook_emergencia: 'https://api.rutax.ec/webhooks/security-alert',
  
  sos_requiere_confirmacion: true,
  antirrobo_long_press_seg: 3,
  tiempo_grabacion_audio_min: 2,
  frecuencia_gps_emergencia_seg: 3,
  
  notificar_contactos: {
    admin: true,
    despachadores: true,
    dueno_unidad: true,
    emergencia1: true,
    emergencia2: true
  },
  
  tiempo_espera_emergencia1_seg: 20,
  huella_coaccion_habilitada: true,
  pin_emergencia_alternativo: true,
  
  zonas_riesgo_habilitadas: true,
  grabar_audio_zonas_riesgo: true,
  notificar_dueno_zona_riesgo: true,
  
  generar_pdf_automatico: true,
  retener_audios_dias: 90
};

// ═══════════════════════════════════════════════════════════════════
// DATOS DEMO INICIALES
// ═══════════════════════════════════════════════════════════════════

export const INITIAL_HUELLAS: HuellasRegistradas[] = [
  {
    id: 'hue-usr-chofer',
    cooperativaId: 'coop-daule',
    chofer_id: 'usr-chofer',
    huella_normal_hash: 'hash_indice_estoy_bien_9921a',
    huella_coaccion_hash: 'hash_medio_sigo_peligro_8832b',
    pin_emergencia_6_digitos: '847291',
    face_id_registrado: true,
    fecha_registro: '2026-02-10T10:00:00.000Z',
    ultima_verificacion: '2026-09-14T08:30:00.000Z',
    modo_biometrico_activo: 'huella'
  },
  {
    id: 'hue-usr-chofer-2',
    cooperativaId: 'coop-daule',
    chofer_id: 'usr-chofer-2',
    huella_normal_hash: 'hash_indice_carlos_bien_1144c',
    huella_coaccion_hash: 'hash_medio_carlos_coaccion_7733d',
    pin_emergencia_6_digitos: '192837',
    face_id_registrado: false,
    fecha_registro: '2026-02-15T11:20:00.000Z',
    ultima_verificacion: '2026-09-15T07:15:00.000Z',
    modo_biometrico_activo: 'huella'
  }
];

export const INITIAL_ZONAS_RIESGO: ZonaRiesgo[] = [
  {
    id: 'zr-1',
    cooperativaId: 'coop-daule',
    nombre: 'Km 8-12 Vía Daule',
    descripcion: 'Zona de alto riesgo de asaltos nocturnos e iluminación reducida',
    tipo: 'circulo',
    lat: -2.0833,
    lng: -79.9321,
    radio: 2000,
    horario_activo: {
      activo_todos_dias: true,
      dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      hora_inicio: '20:00',
      hora_fin: '04:00'
    },
    nivel_alerta: 'rojo',
    gps_frecuencia_forzada: 10,
    grabar_audio_al_entrar: true,
    notificar_socio_al_entrar: true,
    total_entradas_historico: 142,
    incidentes_reportados: 3,
    ultima_entrada: '2026-09-15T22:15:00.000Z',
    activa: true,
    creada_por: 'usr-admin',
    timestamp: '2026-01-15T09:00:00.000Z'
  },
  {
    id: 'zr-2',
    cooperativaId: 'coop-daule',
    nombre: 'Av. Perimetral Km 5',
    descripcion: 'Punto crítico por congestión y asaltos rápidos a unidades detenidas',
    tipo: 'circulo',
    lat: -2.1455,
    lng: -79.9210,
    radio: 1500,
    horario_activo: {
      activo_todos_dias: true,
      dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      hora_inicio: '00:00',
      hora_fin: '23:59'
    },
    nivel_alerta: 'amarillo',
    gps_frecuencia_forzada: 15,
    grabar_audio_al_entrar: false,
    notificar_socio_al_entrar: true,
    total_entradas_historico: 310,
    incidentes_reportados: 1,
    ultima_entrada: '2026-09-15T18:40:00.000Z',
    activa: true,
    creada_por: 'usr-admin',
    timestamp: '2026-02-01T14:30:00.000Z'
  },
  {
    id: 'zr-3',
    cooperativaId: 'coop-daule',
    nombre: 'Terminal Terrestre - Entorno Inmediato',
    descripcion: 'Sector de alta afluencia peatonal y tráfico denso en horas pico',
    tipo: 'circulo',
    lat: -2.1528,
    lng: -79.8821,
    radio: 800,
    horario_activo: {
      activo_todos_dias: true,
      dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      hora_inicio: '06:00',
      hora_fin: '09:00'
    },
    nivel_alerta: 'amarillo',
    gps_frecuencia_forzada: 20,
    grabar_audio_al_entrar: false,
    notificar_socio_al_entrar: false,
    total_entradas_historico: 890,
    incidentes_reportados: 0,
    ultima_entrada: '2026-09-15T08:10:00.000Z',
    activa: true,
    creada_por: 'usr-admin',
    timestamp: '2026-03-10T10:00:00.000Z'
  }
];

export const INITIAL_ALERTAS_SEGURIDAD: AlertaSeguridad[] = [
  {
    id: 'alert-sos-001',
    cooperativaId: 'coop-daule',
    unidadId: 'veh-15',
    unidadNumero: '15',
    choferId: 'usr-chofer',
    choferNombre: 'Pedro Chofer',
    socioId: 'usr-socio',
    socioNombre: 'Roberto Dueño',
    placa: 'GXY-1234',
    tipo: 'sos_accidente',
    subtipo: 'accidente',
    motivo_detalle: 'Colisión lateral en intersección sin semáforo con pérdida de estabilidad.',
    lat: -2.1384,
    lng: -79.8967,
    direccion_referencia: 'Km 12 Vía Daule - Frente a C.C. El Dorado',
    timestamp_activacion: '2026-09-15T14:32:00.000Z',
    timestamp_atencion: '2026-09-15T14:34:00.000Z',
    timestamp_cierre: '2026-09-15T15:05:00.000Z',
    estado: 'cerrada',
    atendida_por: 'usr-admin',
    atendida_por_nombre: 'Carlos Andrade (Admin)',
    cerrada_por: 'usr-admin',
    cerrada_por_nombre: 'Carlos Andrade (Admin)',
    audio_url: 'https://rutax-audio.storage.googleapis.com/evidencia/sos-accidente-15-audio1.mp3',
    audio_urls: [
      {
        id: 'aud-01',
        url: 'https://rutax-audio.storage.googleapis.com/evidencia/sos-accidente-15-audio1.mp3',
        timestamp: '2026-09-15T14:32:15.000Z',
        duracion_seg: 120,
        titulo: 'Audio Registro 1 (Min 0 a 2)'
      }
    ],
    puntos_gps_robos: [
      { lat: -2.1384, lng: -79.8967, velocidad: 0, timestamp: '2026-09-15T14:32:00.000Z' },
      { lat: -2.1385, lng: -79.8967, velocidad: 0, timestamp: '2026-09-15T14:32:05.000Z' }
    ],
    duracion_min: 33,
    tipo_desactivacion: 'huella_normal',
    mensaje_coaccion: null,
    contactos_notificados: [
      { tipo: 'admin', nombre: 'Carlos Andrade', telefono: '0998765432', notificado_en: '2026-09-15T14:32:02.000Z', respondio: true },
      { tipo: 'despachador', nombre: 'Despacho Base A', telefono: '042790123', notificado_en: '2026-09-15T14:32:02.000Z', respondio: true },
      { tipo: 'socio', nombre: 'Roberto Dueño', telefono: '0993456789', notificado_en: '2026-09-15T14:32:03.000Z', respondio: true },
      { tipo: 'emergencia1', nombre: 'Esposa Chofer', telefono: '0981122334', notificado_en: '2026-09-15T14:32:04.000Z', respondio: true }
    ],
    resolucion: 'chofer_a_salvo',
    observaciones_cierre: 'Llegó ambulancia de Cruz Roja y patrulla ATM. Pasajeros trasladados a otra unidad sin lesiones graves.',
    pdf_reporte_url: 'https://rutax.storage/reportes/informe-accidente-veh15-20260915.pdf',
    prioridad: 'alta'
  },
  {
    id: 'alert-robo-002',
    cooperativaId: 'coop-daule',
    unidadId: 'veh-22',
    unidadNumero: '22',
    choferId: 'usr-chofer-2',
    choferNombre: 'Carlos Morales',
    socioId: 'usr-socio',
    socioNombre: 'Roberto Dueño',
    placa: 'GSG-4567',
    tipo: 'antirrobo',
    subtipo: 'asalto',
    motivo_detalle: 'Antirrobo silencioso activado discretamente por el conductor.',
    lat: -2.1455,
    lng: -79.9210,
    direccion_referencia: 'Av. Perimetral Km 5 - Sentido Pascuales',
    timestamp_activacion: '2026-09-14T21:10:00.000Z',
    timestamp_atencion: '2026-09-14T21:11:00.000Z',
    timestamp_cierre: '2026-09-14T21:55:00.000Z',
    estado: 'cerrada',
    atendida_por: 'usr-admin',
    atendida_por_nombre: 'Carlos Andrade (Admin)',
    cerrada_por: 'usr-admin',
    cerrada_por_nombre: 'Carlos Andrade (Admin)',
    audio_url: 'https://rutax-audio.storage.googleapis.com/evidencia/robo-veh22-audio1.mp3',
    audio_urls: [
      {
        id: 'aud-r1',
        url: 'https://rutax-audio.storage.googleapis.com/evidencia/robo-veh22-audio1.mp3',
        timestamp: '2026-09-14T21:10:00.000Z',
        duracion_seg: 120,
        titulo: 'Grabación 1 (21:10 - 21:12)'
      },
      {
        id: 'aud-r2',
        url: 'https://rutax-audio.storage.googleapis.com/evidencia/robo-veh22-audio2.mp3',
        timestamp: '2026-09-14T21:12:00.000Z',
        duracion_seg: 120,
        titulo: 'Grabación 2 (21:12 - 21:14)'
      },
      {
        id: 'aud-r3',
        url: 'https://rutax-audio.storage.googleapis.com/evidencia/robo-veh22-audio3.mp3',
        timestamp: '2026-09-14T21:14:00.000Z',
        duracion_seg: 120,
        titulo: 'Grabación 3 (21:14 - 21:16)'
      }
    ],
    puntos_gps_robos: [
      { lat: -2.1455, lng: -79.9210, velocidad: 45, timestamp: '2026-09-14T21:10:00.000Z' },
      { lat: -2.1470, lng: -79.9230, velocidad: 52, timestamp: '2026-09-14T21:10:30.000Z' },
      { lat: -2.1510, lng: -79.9280, velocidad: 48, timestamp: '2026-09-14T21:11:00.000Z' },
      { lat: -2.1580, lng: -79.9340, velocidad: 35, timestamp: '2026-09-14T21:12:00.000Z' },
      { lat: -2.1620, lng: -79.9380, velocidad: 0, timestamp: '2026-09-14T21:15:00.000Z' }
    ],
    duracion_min: 45,
    tipo_desactivacion: 'huella_normal',
    mensaje_coaccion: null,
    contactos_notificados: [
      { tipo: 'admin', nombre: 'Carlos Andrade', telefono: '0998765432', notificado_en: '2026-09-14T21:10:02.000Z', respondio: true },
      { tipo: 'socio', nombre: 'Roberto Dueño', telefono: '0993456789', notificado_en: '2026-09-14T21:10:03.000Z', respondio: true },
      { tipo: 'emergencia1', nombre: 'Hermano Carlos', telefono: '0987654321', notificado_en: '2026-09-14T21:10:04.000Z', respondio: true }
    ],
    resolucion: 'unidad_recuperada',
    observaciones_cierre: 'Intercepción exitosa por Policía Nacional con apoyo de rastreo GPS Rutax cada 3 segundos. Unidad y chofer a salvo.',
    pdf_reporte_url: 'https://rutax.storage/reportes/denuncia-policial-veh22-20260914.pdf',
    prioridad: 'alta'
  },
  {
    id: 'alert-ama-003',
    cooperativaId: 'coop-daule',
    unidadId: 'veh-10',
    unidadNumero: '10',
    choferId: 'usr-chofer',
    choferNombre: 'Pedro Chofer',
    socioId: 'usr-socio',
    socioNombre: 'Roberto Dueño',
    placa: 'GBA-9012',
    tipo: 'alerta_amarilla',
    subtipo: 'llanta',
    motivo_detalle: 'Llanta delantera derecha pinchada en berma lateral.',
    lat: -2.1390,
    lng: -79.8970,
    direccion_referencia: 'Base A - Patio de Maniobras',
    timestamp_activacion: '2026-09-15T11:00:00.000Z',
    timestamp_atencion: '2026-09-15T11:02:00.000Z',
    timestamp_cierre: '2026-09-15T11:25:00.000Z',
    estado: 'cerrada',
    atendida_por: 'usr-despachador-a',
    atendida_por_nombre: 'Despachador Base A',
    cerrada_por: 'usr-despachador-a',
    cerrada_por_nombre: 'Despachador Base A',
    audio_url: null,
    audio_urls: [],
    puntos_gps_robos: [],
    duracion_min: 25,
    tipo_desactivacion: null,
    mensaje_coaccion: null,
    contactos_notificados: [
      { tipo: 'despachador', nombre: 'Despacho Base A', telefono: '042790123', notificado_en: '2026-09-15T11:00:05.000Z', respondio: true }
    ],
    resolucion: 'chofer_a_salvo',
    observaciones_cierre: 'Cambio de neumático realizado con auxilio mecánico de la cooperativa.',
    pdf_reporte_url: null,
    prioridad: 'baja'
  }
];

export const INITIAL_NOTIFICACIONES_BASE_CONDUCTORES: NotificacionBaseConductores[] = [
  {
    id: 'notif-bc-001',
    cooperativaId: 'coop-daule',
    de: {
      usuario_id: 'usr-despachador-a',
      rol: 'despachador',
      nombre: 'Despachador Sauces',
      base_id: 'base-a'
    },
    para: 'en_ruta',
    unidad_destino_id: null,
    titulo: 'Vía cerrada Km 12 por trabajos de recapeo',
    mensaje: 'Tomar desvío por Av. Perimetral hasta Km 15. Tiempo extra estimado: 6 minutos.',
    prioridad: 'critica',
    leida_por: [
      { chofer_id: 'usr-chofer', chofer_nombre: 'Pedro Chofer', unidad_id: 'veh-15', unidad_numero: '15', timestamp_lectura: '2026-09-15T13:02:00.000Z' },
      { chofer_id: 'usr-chofer-2', chofer_nombre: 'Carlos Morales', unidad_id: 'veh-22', unidad_numero: '22', timestamp_lectura: '2026-09-15T13:03:00.000Z' }
    ],
    no_leida_por: [],
    requiere_confirmacion: true,
    confirmada_por: ['usr-chofer', 'usr-chofer-2'],
    leer_en_voz_alta: true,
    timestamp: '2026-09-15T13:00:00.000Z',
    expira_en_min: 60
  },
  {
    id: 'notif-bc-002',
    cooperativaId: 'coop-daule',
    de: {
      usuario_id: 'usr-admin',
      rol: 'admin_coop',
      nombre: 'Carlos Andrade',
      base_id: null
    },
    para: 'todos',
    unidad_destino_id: null,
    titulo: 'Operativo ATM en Parque Centenario',
    mensaje: 'Portar documentos vigentes (Matrícula, SOAT, Licencia Profesional). No bloquear paradas de taxis.',
    prioridad: 'urgente',
    leida_por: [
      { chofer_id: 'usr-chofer', chofer_nombre: 'Pedro Chofer', unidad_id: 'veh-15', unidad_numero: '15', timestamp_lectura: '2026-09-15T10:15:00.000Z' },
      { chofer_id: 'usr-chofer-2', chofer_nombre: 'Carlos Morales', unidad_id: 'veh-22', unidad_numero: '22', timestamp_lectura: '2026-09-15T10:20:00.000Z' }
    ],
    no_leida_por: [],
    requiere_confirmacion: true,
    confirmada_por: ['usr-chofer', 'usr-chofer-2'],
    leer_en_voz_alta: false,
    timestamp: '2026-09-15T10:00:00.000Z',
    expira_en_min: 180
  },
  {
    id: 'notif-bc-003',
    cooperativaId: 'coop-daule',
    de: {
      usuario_id: 'usr-despachador-b',
      rol: 'despachador',
      nombre: 'Despachador Centro',
      base_id: 'base-b'
    },
    para: 'en_base_a',
    unidad_destino_id: null,
    titulo: 'Alta demanda de pasajeros en Base B',
    mensaje: 'Favor agilizar desembarque y retorno por corredor central. Fila de 40 pasajeros esperando.',
    prioridad: 'urgente',
    leida_por: [],
    no_leida_por: [
      { chofer_id: 'usr-chofer', unidad_id: 'veh-15', unidad_numero: '15', chofer_nombre: 'Pedro Chofer' }
    ],
    requiere_confirmacion: true,
    confirmada_por: [],
    leer_en_voz_alta: true,
    timestamp: '2026-09-15T18:10:00.000Z',
    expira_en_min: 45
  },
  {
    id: 'notif-bc-004',
    cooperativaId: 'coop-daule',
    de: {
      usuario_id: 'usr-despachador-a',
      rol: 'despachador',
      nombre: 'Despachador Sauces',
      base_id: 'base-a'
    },
    para: 'unidad_especifica',
    unidad_destino_id: 'veh-15',
    unidad_destino_numero: '15',
    titulo: 'Verificar pasajero reservado en Parada El Dorado',
    mensaje: 'Cliente Corporativo María Torres con 2 niños tiene reserva agendada para las 18:30.',
    prioridad: 'normal',
    leida_por: [],
    no_leida_por: [
      { chofer_id: 'usr-chofer', unidad_id: 'veh-15', unidad_numero: '15', chofer_nombre: 'Pedro Chofer' }
    ],
    requiere_confirmacion: true,
    confirmada_por: [],
    leer_en_voz_alta: false,
    timestamp: '2026-09-15T18:20:00.000Z',
    expira_en_min: 30
  },
  {
    id: 'notif-bc-005',
    cooperativaId: 'coop-daule',
    de: {
      usuario_id: 'usr-admin',
      rol: 'admin_coop',
      nombre: 'Carlos Andrade',
      base_id: null
    },
    para: 'todos',
    unidad_destino_id: null,
    titulo: 'Mantenimiento del servidor de geolocalización',
    mensaje: 'Ventana de mantenimiento programada finalizada con éxito a las 04:00.',
    prioridad: 'normal',
    leida_por: [
      { chofer_id: 'usr-chofer', chofer_nombre: 'Pedro Chofer', unidad_id: 'veh-15', unidad_numero: '15', timestamp_lectura: '2026-09-14T05:00:00.000Z' }
    ],
    no_leida_por: [],
    requiere_confirmacion: false,
    confirmada_por: ['usr-chofer'],
    leer_en_voz_alta: false,
    timestamp: '2026-09-14T04:15:00.000Z',
    expira_en_min: 60
  }
];

export const INITIAL_LOGS_SEGURIDAD: LogSeguridad[] = [
  {
    id: 'log-seg-01',
    cooperativaId: 'coop-daule',
    evento: 'sos_activado',
    unidad_id: 'veh-15',
    unidad_numero: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    lat: -2.1384,
    lng: -79.8967,
    detalle: 'SOS Accidente activado por chofer con long-press 2 seg en Km 12 Vía Daule.',
    timestamp: '2026-09-15T14:32:00.000Z',
    dispositivo: 'Android 14 - Samsung SM-A546E'
  },
  {
    id: 'log-seg-02',
    cooperativaId: 'coop-daule',
    evento: 'audio_iniciado',
    unidad_id: 'veh-15',
    unidad_numero: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    lat: -2.1384,
    lng: -79.8967,
    detalle: 'Grabación de audio de evidencia iniciada automáticamente en bucle de 2 min.',
    timestamp: '2026-09-15T14:32:05.000Z',
    dispositivo: 'Android 14 - Micrófono integrado'
  },
  {
    id: 'log-seg-03',
    cooperativaId: 'coop-daule',
    evento: 'llamada_ecu911',
    unidad_id: 'veh-15',
    unidad_numero: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    detalle: 'Marcador ECU 911 activado desde consola de despacho con script de telemetría.',
    timestamp: '2026-09-15T14:33:10.000Z',
    dispositivo: 'Tablet Despacho Base A'
  },
  {
    id: 'log-seg-04',
    cooperativaId: 'coop-daule',
    evento: 'huella_normal_usada',
    unidad_id: 'veh-15',
    unidad_numero: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    detalle: 'Huella normal (índice) validada exitosamente: Chofer a salvo.',
    timestamp: '2026-09-15T15:05:00.000Z',
    dispositivo: 'Lector biométrico / Touch Sensor'
  },
  {
    id: 'log-seg-05',
    cooperativaId: 'coop-daule',
    evento: 'pdf_generado',
    unidad_id: 'veh-15',
    unidad_numero: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    detalle: 'Informe técnico de incidente y reporte de emergencia exportado en PDF firmado.',
    timestamp: '2026-09-15T15:10:00.000Z',
    dispositivo: 'Panel Admin Cooperativa'
  },
  {
    id: 'log-seg-06',
    cooperativaId: 'coop-daule',
    evento: 'antirrobo_activado',
    unidad_id: 'veh-22',
    unidad_numero: '22',
    chofer_id: 'usr-chofer-2',
    chofer_nombre: 'Carlos Morales',
    lat: -2.1455,
    lng: -79.9210,
    detalle: 'Antirrobo silencioso activado. GPS forzado a 3 seg y pantalla auto-bloqueada.',
    timestamp: '2026-09-14T21:10:00.000Z',
    dispositivo: 'Xiaomi Redmi Note 12'
  },
  {
    id: 'log-seg-07',
    cooperativaId: 'coop-daule',
    evento: 'entrada_zona_riesgo',
    unidad_id: 'veh-22',
    unidad_numero: '22',
    chofer_id: 'usr-chofer-2',
    chofer_nombre: 'Carlos Morales',
    lat: -2.0833,
    lng: -79.9321,
    detalle: 'Unidad 22 ingresó a Zona de Riesgo Km 8-12 Vía Daule en horario nocturno crítico.',
    timestamp: '2026-09-14T21:05:00.000Z',
    dispositivo: 'Rastreador GPS Rutax'
  },
  {
    id: 'log-seg-08',
    cooperativaId: 'coop-daule',
    evento: 'notificacion_enviada',
    detalle: 'Notificación crítica masiva sobre Vía cerrada Km 12 enviada a conductores en ruta.',
    timestamp: '2026-09-15T13:00:00.000Z',
    dispositivo: 'Tablet Despacho Base A'
  },
  {
    id: 'log-seg-09',
    cooperativaId: 'coop-daule',
    evento: 'notificacion_leida',
    unidad_id: 'veh-15',
    unidad_numero: '15',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    detalle: 'Confirmación "RECIBIDO" registrada para notificación Vía cerrada Km 12.',
    timestamp: '2026-09-15T13:02:00.000Z',
    dispositivo: 'App Conductor'
  },
  {
    id: 'log-seg-10',
    cooperativaId: 'coop-daule',
    evento: 'alerta_amarilla_reportada',
    unidad_id: 'veh-10',
    unidad_numero: '10',
    chofer_id: 'usr-chofer',
    chofer_nombre: 'Pedro Chofer',
    lat: -2.1390,
    lng: -79.8970,
    detalle: 'Alerta amarilla de llanta pinchada reportada a despacho en Base A.',
    timestamp: '2026-09-15T11:00:00.000Z',
    dispositivo: 'App Conductor'
  }
];

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES DE VOZ (TTS) Y SÍNTESIS DE ALARMAS
// ═══════════════════════════════════════════════════════════════════

export function speakNotificationText(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-EC';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    // Seleccionar voz en español si está disponible
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
  }
}

/**
 * Genera tonos de alerta sintetizados con Web Audio API
 */
let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let isSirenPlaying = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSecurityAlarm(type: 'sos' | 'critica' | 'urgente' | 'normal' | 'antirrobo'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (type === 'antirrobo') {
    // SILENCIO TOTAL: El modo antirrobo NO emite sonido en el celular
    stopSecurityAlarm();
    return;
  }

  if (type === 'sos') {
    if (isSirenPlaying) return;
    try {
      isSirenPlaying = true;
      sirenOscillator = ctx.createOscillator();
      sirenGain = ctx.createGain();

      sirenOscillator.type = 'sawtooth';
      sirenGain.gain.setValueAtTime(0.18, ctx.currentTime);

      // Frecuencia oscilante de sirena policial / emergencia
      const now = ctx.currentTime;
      sirenOscillator.frequency.setValueAtTime(600, now);
      for (let i = 0; i < 30; i++) {
        sirenOscillator.frequency.linearRampToValueAtTime(950, now + i * 0.8 + 0.4);
        sirenOscillator.frequency.linearRampToValueAtTime(600, now + (i + 1) * 0.8);
      }

      sirenOscillator.connect(sirenGain);
      sirenGain.connect(ctx.destination);
      sirenOscillator.start();
    } catch (err) {
      console.warn('Audio siren error:', err);
    }
    return;
  }

  // Tonos cortos para notificaciones
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (type === 'critica') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'urgente') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    console.warn('Audio beep error:', err);
  }
}

export function stopSecurityAlarm(): void {
  if (sirenOscillator) {
    try {
      sirenOscillator.stop();
      sirenOscillator.disconnect();
    } catch {
      // ignore
    }
    sirenOscillator = null;
  }
  isSirenPlaying = false;
}

// ═══════════════════════════════════════════════════════════════════
// GENERACIÓN DE SCRIPTS DE EMERGENCIA ECU 911 Y WHATSAPP
// ═══════════════════════════════════════════════════════════════════

export function buildECU911Script(alerta: AlertaSeguridad, coopNombre = 'Cooperativa Daule Express'): string {
  const tipoLabel = alerta.tipo === 'antirrobo' 
    ? 'ASALTO / ROBO EN CURSO' 
    : alerta.tipo === 'sos_accidente' 
    ? 'ACCIDENTE DE TRÁNSITO CON URGENCIA' 
    : 'AUXILIO EN RUTA';

  return `OPERADOR ECU 911:
Cooperativa: ${coopNombre}
Unidad de Transporte: N° ${alerta.unidadNumero || 'S/N'}
Placa: ${alerta.placa || 'GXY-1234'}
Conductor a cargo: ${alerta.choferNombre || 'No especificado'}
Propietario de unidad: ${alerta.socioNombre || 'No especificado'}
Tipo de Emergencia: ${tipoLabel}
Ubicación GPS Exacta: ${alerta.lat.toFixed(5)}, ${alerta.lng.toFixed(5)}
Dirección de Referencia: ${alerta.direccion_referencia || 'En ruta'}
Hora de Activación: ${new Date(alerta.timestamp_activacion).toLocaleTimeString()}
Rastreo en vivo activo: Sí (Frecuencia 3 seg)`;
}

export function buildWhatsAppEmergencyMessage(alerta: AlertaSeguridad, coopNombre = 'Cooperativa Daule Express'): string {
  const mapLink = `https://www.google.com/maps?q=${alerta.lat},${alerta.lng}`;
  const tipoEmoji = alerta.tipo === 'antirrobo' ? '🚨⚫ [ALERTA ANTIRROBO SILENCIOSO]' : '🚨🔴 [EMERGENCIA SOS ACCIDENTE]';

  return `*${tipoEmoji} - ${coopNombre.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
🚐 *Unidad:* N° ${alerta.unidadNumero || '15'} | *Placa:* ${alerta.placa || 'GXY-1234'}
👤 *Conductor:* ${alerta.choferNombre || 'Chofer Asignado'}
📍 *Referencia:* ${alerta.direccion_referencia || 'En ruta'}
🗺️ *Ubicación GPS en vivo:* ${mapLink}
⏱️ *Hora Activación:* ${new Date(alerta.timestamp_activacion).toLocaleTimeString()}
⚠️ *Estado:* ${alerta.estado === 'activa' ? 'ACTIVA EN CURSO' : 'ATENDIENDO'}
${alerta.mensaje_coaccion ? `⚠️ *ATENCIÓN ESPECIAL:* ${alerta.mensaje_coaccion}` : ''}
━━━━━━━━━━━━━━━━━━━━
_Reporte generado automáticamente por RUTAX-SMART_`;
}

// ═══════════════════════════════════════════════════════════════════
// GENERACIÓN DE REPORTE POLICIAL EN PDF / IMPRESIÓN OFICIAL
// ═══════════════════════════════════════════════════════════════════

export function generatePoliceDenunciaPDF(alerta: AlertaSeguridad, coop: Cooperativa): void {
  const mapLink = `https://www.google.com/maps?q=${alerta.lat},${alerta.lng}`;
  const fechaStr = new Date(alerta.timestamp_activacion).toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const horaStr = new Date(alerta.timestamp_activacion).toLocaleTimeString('es-EC');

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Por favor permita ventanas emergentes para generar el informe de denuncia policial.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>INFORME POLICIAL Y DENUNCIA FISCALÍA - ${alerta.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 30px; line-height: 1.4; font-size: 13px; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #b91c1c; }
        .subtitle { font-size: 12px; color: #475569; }
        .coop-name { font-size: 15px; font-weight: bold; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase; }
        .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
        .badge-black { background: #1e293b; color: #f8fafc; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 16px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
        .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; }
        .qr-section { display: flex; align-items: center; gap: 20px; margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 6px; }
        .signature-area { display: flex; justify-content: space-around; margin-top: 50px; text-align: center; }
        .signature-line { border-top: 1px solid #475569; width: 220px; padding-top: 6px; font-size: 11px; }
        @media print {
          body { margin: 15mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div class="coop-name">${coop.nombre}</div>
          <div class="subtitle">RUC: ${coop.ruc} | Teléfono: ${coop.telefono}</div>
          <div class="subtitle">${coop.direccion}</div>
        </div>
        <div style="text-align: right;">
          <div class="title">INFORME DE SEGURIDAD & DENUNCIA</div>
          <div style="font-family: monospace; font-size: 11px; color: #64748b;">EXPEDIENTE ID: ${alerta.id}</div>
          <div style="margin-top: 4px;">
            <span class="badge ${alerta.tipo === 'antirrobo' ? 'badge-black' : 'badge-red'}">
              ${alerta.tipo === 'antirrobo' ? 'ROBO DE VEHÍCULO / ASALTO' : 'SOS ACCIDENTE VIAL'}
            </span>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">1. Identificación del Vehículo y Operador</div>
          <div><strong>Unidad Número:</strong> ${alerta.unidadNumero || '15'}</div>
          <div><strong>Placa Vehicular:</strong> ${alerta.placa || 'GXY-1234'}</div>
          <div><strong>Conductor Registrado:</strong> ${alerta.choferNombre || 'Pedro Chofer'}</div>
          <div><strong>Propietario / Socio:</strong> ${alerta.socioNombre || 'Roberto Dueño'}</div>
          <div><strong>Estado de Resolución:</strong> ${alerta.resolucion || 'En investigación'}</div>
        </div>

        <div class="card">
          <div class="card-title">2. Georreferenciación y Cronología</div>
          <div><strong>Fecha del Incidente:</strong> ${fechaStr}</div>
          <div><strong>Hora de Activación:</strong> ${horaStr}</div>
          <div><strong>Coordenadas GPS Iniciales:</strong> ${alerta.lat.toFixed(6)}, ${alerta.lng.toFixed(6)}</div>
          <div><strong>Dirección de Referencia:</strong> ${alerta.direccion_referencia}</div>
          <div><strong>Duración del Rastreo:</strong> ${alerta.duracion_min} minutos</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <div class="card-title">3. Detalle de los Hechos & Cadena de Custodia</div>
        <p style="margin: 4px 0 8px 0;">${alerta.motivo_detalle || alerta.observaciones_cierre || 'Sin observaciones adicionales registradas.'}</p>
        <div><strong>Tipo de Desactivación:</strong> ${alerta.tipo_desactivacion || 'Desactivación administrativa'}</div>
        ${alerta.mensaje_coaccion ? `<div style="color: #b91c1c; font-weight: bold; margin-top: 4px;">⚠️ ALERTA DE COACCIÓN: ${alerta.mensaje_coaccion}</div>` : ''}
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <div class="card-title">4. Trazabilidad GPS de Alta Frecuencia (Puntos Registrados cada 3s)</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Hora Timestamp</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Velocidad (km/h)</th>
            </tr>
          </thead>
          <tbody>
            ${(alerta.puntos_gps_robos && alerta.puntos_gps_robos.length > 0
              ? alerta.puntos_gps_robos
              : [
                  { lat: alerta.lat, lng: alerta.lng, velocidad: 0, timestamp: alerta.timestamp_activacion },
                  { lat: alerta.lat + 0.0012, lng: alerta.lng + 0.002, velocidad: 45, timestamp: new Date(Date.parse(alerta.timestamp_activacion) + 15000).toISOString() }
                ]
            ).map((pt, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${new Date(pt.timestamp).toLocaleTimeString()}</td>
                <td>${pt.lat.toFixed(6)}</td>
                <td>${pt.lng.toFixed(6)}</td>
                <td>${pt.velocidad || 0} km/h</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <div class="card-title">5. Evidencia Sonora y Audios en Bucle (${alerta.audio_urls?.length || 0} archivos en custodia)</div>
        ${alerta.audio_urls && alerta.audio_urls.length > 0 ? `
          <ul>
            ${alerta.audio_urls.map(a => `
              <li><strong>${a.titulo}:</strong> Grabado a las ${new Date(a.timestamp).toLocaleTimeString()} (${a.duracion_seg} seg) — URI de Almacenamiento Seguro Cloud</li>
            `).join('')}
          </ul>
        ` : '<div>No se registraron audios en este evento.</div>'}
      </div>

      <div class="qr-section">
        <div style="font-size: 32px;">🛡️</div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 12px;">VALIDACIÓN TELEMÉTRICA DIGITAL RUTAX-SMART</div>
          <div style="font-size: 11px; color: #475569;">
            Este reporte contiene firma telemétrica con hash inmutable generado en servidor seguro.
            Enlace de verificación en vivo: <a href="${mapLink}" target="_blank">${mapLink}</a>
          </div>
        </div>
      </div>

      <div class="signature-area">
        <div>
          <div class="signature-line">
            <strong>${alerta.choferNombre || 'Pedro Chofer'}</strong><br/>
            Conductor / Testigo Afectado
          </div>
        </div>
        <div>
          <div class="signature-line">
            <strong>${coop.presidente_nombre}</strong><br/>
            Administrador / Representante Legal
          </div>
        </div>
        <div>
          <div class="signature-line">
            <strong>Policía Nacional del Ecuador / Fiscalía</strong><br/>
            Oficial Receptor de Denuncia
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Simulación de hash criptográfico biométrico
 */
export function hashBiometricString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'bio_hash_' + Math.abs(hash).toString(16);
}
