/**
 * RUTAX-SMART — Servicio de Gestión SuperAdmin, Cobros y Multi-Cooperativa
 * Catálogos de planes, suscripciones, comprobantes de pago, métricas globales y bloqueo progresivo
 */

import {
  PlanSuscripcion,
  SuscripcionCooperativa,
  ComprobantePago,
  MetricasGlobales,
  LogSuperAdmin,
  ConfiguracionSuperAdmin,
  Cooperativa,
  EstadoSuscripcion,
  NotificacionInternaCooperativa,
  HistoricoPagoArchivado
} from '../types';

export const INITIAL_NOTIFICACIONES_INTERNAS: NotificacionInternaCooperativa[] = [
  {
    id: 'notif-seed-1',
    cooperativaId: 'coop-daule',
    tipo: 'comprobante_aprobado',
    titulo: 'Comprobante de Pago Validado con Éxito',
    mensaje: 'Su transferencia bancaria por $480.00 USD ha sido aprobada. Su suscripción está activa con cobertura total hasta el 15/10/2026.',
    prioridad: 'normal',
    leido: false,
    fecha_emision: '2026-09-15T14:35:00Z',
    fecha_lectura: null,
    enviado_por: 'SuperAdmin Creador',
    metadatos: { monto: 480, numero_operacion: 'DEP-BCO-PICHINCHA-9821' }
  },
  {
    id: 'notif-seed-2',
    cooperativaId: 'coop-daule',
    tipo: 'facturacion_anticipada',
    titulo: 'Facturación Mensual Automática Generada',
    mensaje: 'Se ha emitido el comprobante de liquidación mensual anticipada (5 días antes de fin de mes) correspondiente a las unidades activas registradas.',
    prioridad: 'normal',
    leido: false,
    fecha_emision: '2026-09-16T08:00:00Z',
    fecha_lectura: null,
    enviado_por: 'Sistema Automatizado',
    metadatos: { unidades_activas: 10 }
  },
  {
    id: 'notif-seed-3',
    cooperativaId: 'coop-cisne',
    tipo: 'bloqueo_aviso',
    titulo: 'Alerta de Suspensión por Mora',
    mensaje: 'Su cooperativa presenta 5 días de vencimiento. Se ha activado el bloqueo parcial de despacho. Por favor regularice su pago de $270.00 USD.',
    prioridad: 'urgente',
    leido: false,
    fecha_emision: '2026-09-15T09:00:00Z',
    fecha_lectura: null,
    enviado_por: 'Sistema Automatizado',
    metadatos: { monto: 270, dias_mora: 5 }
  }
];

export const INITIAL_PLANES: PlanSuscripcion[] = [
  {
    id: 'plan_pro_unico',
    nombre: 'Rutax-Smart Pro',
    precio_por_unidad: 15,
    moneda: 'USD',
    caracteristicas: [
      'Turnos FIFO + Pre-Base con pase directo',
      'Tracking GPS en vivo cada 30 seg',
      'Liquidación automática por viaje',
      'Pasajeros frecuentes + Reservas',
      'WhatsApp automático',
      'Seguridad SOS + Antirrobo con huella',
      'Comunicación entre bases',
      'Reportes completos',
      'Soporte prioritario',
      'Proforma automática al registrar vehículos',
      'Mapa unificado sin superposiciones'
    ],
    incluye_todo: true,
    precio_fijo: true,
    activo: true,
    unidades_minimas: 1,
    unidades_maximas: 999,
    fecha_creacion: '2026-01-01'
  }
];

export const INITIAL_CONFIG_SUPERADMIN: ConfiguracionSuperAdmin = {
  id: 'config_global',
  cuenta_banco_principal: 'Pichincha 2234567890 (Cta. Corriente)',
  cuenta_banco_secundaria: 'Guayaquil 1234567890 (Cta. Ahorros)',
  nombre_titular: 'Rutax-Smart S.A.S.',
  ruc: '0992345678001',
  bloqueo_automatico_activo: true,
  dias_gracia_inicial: 3,
  dias_para_bloqueo_parcial: 3,
  dias_para_bloqueo_total: 5,
  dias_para_borrado_datos: 30,
  whatsapp_numero_negocio: '593991234567',
  whatsapp_api_token: 'rutax_sec_live_992102948',
  email_notificaciones: 'cobros@rutax-smart.ec',
  plantilla_por_vencer: 'Estimado {presidente}, su cooperativa {nombre} vence en {dias} días (el {fecha_venc}). Monto mensual: ${monto}. Cuenta {cuenta}. Favor subir su comprobante en admin.rutax-smart.ec/pagos',
  plantilla_vencida: 'Su cooperativa {nombre} ha vencido el {fecha_venc}. Dispone de {dias} días de gracia para regularizar el valor de ${monto}. Evite la suspensión del sistema de despacho.',
  plantilla_bloqueo_parcial: '⚠️ AVISO URGENTE: Su cooperativa {nombre} ha sido PARCIALMENTE BLOQUEADA por mora de {dias_mora} días. El botón [DAR SALIDA] ha sido deshabilitado. El rastreo GPS permanece activo. Regularice ${monto} hoy.',
  plantilla_bloqueo_total: '⛔ SUSPENSIÓN TOTAL: La cooperativa {nombre} ha sido bloqueada íntegramente por mora superior a 5 días. Todos los servicios quedan inhabilitados. Contacte inmediatamente a soporte@rutax-smart.ec.',
  generar_reporte_mensual_auto: true,
  dia_reporte_mensual: 1,
  superadmins_autorizados: ['superadmin1@rutax-smart.ec', 'superadmin2@rutax-smart.ec', 'medintegralbio@gmail.com'],
  ip_whitelist: []
};

export const INITIAL_SUSCRIPCIONES: SuscripcionCooperativa[] = [
  {
    id: 'susc-daule',
    cooperativaId: 'coop-daule',
    plan_id: 'plan_pro_unico',
    precio_por_unidad: 15,
    unidades_activas: 32,
    monto_mensual: 480,
    fecha_inicio: '2026-08-15T00:00:00Z',
    fecha_vencimiento: '2026-10-15T23:59:59Z',
    dias_gracia: 3,
    estado_suscripcion: 'activa',
    dias_mora: 0,
    ultimo_pago: {
      monto: 480,
      fecha: '2026-08-15T14:30:00Z',
      metodo: 'transferencia',
      comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      registrado_por: 'usr-superadmin',
      periodo_cubierto: { desde: '2026-08-16', hasta: '2026-09-15' }
    },
    bloqueos_historial: [],
    recordatorios_enviados: []
  },
  {
    id: 'susc-cisne',
    cooperativaId: 'coop-cisne',
    plan_id: 'plan_pro_unico',
    precio_por_unidad: 15,
    unidades_activas: 18,
    monto_mensual: 270,
    fecha_inicio: '2026-08-20T00:00:00Z',
    fecha_vencimiento: '2026-10-20T23:59:59Z',
    dias_gracia: 3,
    estado_suscripcion: 'activa',
    dias_mora: 0,
    ultimo_pago: {
      monto: 270,
      fecha: '2026-08-20T11:20:00Z',
      metodo: 'transferencia',
      comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      registrado_por: 'usr-superadmin',
      periodo_cubierto: { desde: '2026-08-21', hasta: '2026-09-20' }
    },
    bloqueos_historial: [],
    recordatorios_enviados: []
  },
  {
    id: 'susc-floresta',
    cooperativaId: 'coop-floresta',
    plan_id: 'plan_pro_unico',
    precio_por_unidad: 15,
    unidades_activas: 12,
    monto_mensual: 180,
    fecha_inicio: '2026-08-16T00:00:00Z',
    fecha_vencimiento: '2026-09-17T23:59:59Z', // vence en 2 días
    dias_gracia: 3,
    estado_suscripcion: 'por_vencer',
    dias_mora: 0,
    ultimo_pago: {
      monto: 180,
      fecha: '2026-08-16T09:00:00Z',
      metodo: 'deposito',
      comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      registrado_por: 'usr-superadmin',
      periodo_cubierto: { desde: '2026-08-16', hasta: '2026-09-16' }
    },
    bloqueos_historial: [],
    recordatorios_enviados: [
      { tipo: 'por_vencer', fecha: '2026-09-14T10:00:00Z' }
    ]
  },
  {
    id: 'susc-costena',
    cooperativaId: 'coop-costena',
    plan_id: 'plan_pro_unico',
    precio_por_unidad: 15,
    unidades_activas: 20,
    monto_mensual: 300,
    fecha_inicio: '2026-08-13T00:00:00Z',
    fecha_vencimiento: '2026-09-13T23:59:59Z', // venció hace 2 días
    dias_gracia: 3,
    estado_suscripcion: 'vencida',
    dias_mora: 2,
    ultimo_pago: {
      monto: 300,
      fecha: '2026-08-12T16:40:00Z',
      metodo: 'transferencia',
      comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      registrado_por: 'usr-superadmin',
      periodo_cubierto: { desde: '2026-08-13', hasta: '2026-09-13' }
    },
    bloqueos_historial: [],
    recordatorios_enviados: [
      { tipo: 'vencida', fecha: '2026-09-14T08:00:00Z' }
    ]
  },
  {
    id: 'susc-balzar',
    cooperativaId: 'coop-balzar',
    plan_id: 'plan_pro_unico',
    precio_por_unidad: 15,
    unidades_activas: 15,
    monto_mensual: 225,
    fecha_inicio: '2026-08-11T00:00:00Z',
    fecha_vencimiento: '2026-09-11T23:59:59Z', // venció hace 4 días
    dias_gracia: 3,
    estado_suscripcion: 'bloqueo_parcial',
    dias_mora: 4,
    ultimo_pago: {
      monto: 225,
      fecha: '2026-08-10T10:15:00Z',
      metodo: 'efectivo',
      comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      registrado_por: 'usr-superadmin',
      periodo_cubierto: { desde: '2026-08-11', hasta: '2026-09-11' }
    },
    bloqueos_historial: [
      { tipo: 'parcial', fecha: '2026-09-14T00:01:00Z', motivo: 'Mora de 3 días tras vencimiento sin comprobante' }
    ],
    recordatorios_enviados: [
      { tipo: 'bloqueo_parcial', fecha: '2026-09-14T00:05:00Z' }
    ]
  }
];

export const INITIAL_COMPROBANTES: ComprobantePago[] = [
  // 3 Pendientes de revisión
  {
    id: 'comp-001',
    cooperativaId: 'coop-daule',
    suscripcion_id: 'susc-daule',
    monto: 480,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Pichincha',
    numero_operacion: '001234567890',
    fecha_operacion: '2026-09-15',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'comprobante_daule_20260915.jpg',
    estado: 'pendiente_revision',
    revisado_por: null,
    fecha_revision: null,
    motivo_rechazo: null,
    periodo_desde: '2026-09-16',
    periodo_hasta: '2026-10-15',
    subido_por: 'José Zambrano (Presidente)',
    fecha_subida: '2026-09-15T14:32:00Z',
    ip: '181.198.42.10',
    dispositivo: 'Chrome Mobile / Android Galaxy S23'
  },
  {
    id: 'comp-002',
    cooperativaId: 'coop-cisne',
    suscripcion_id: 'susc-cisne',
    monto: 270,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Guayaquil',
    numero_operacion: '9876543210',
    fecha_operacion: '2026-09-15',
    cuenta_destino: '1234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'transf_cisne_sept2026.pdf',
    estado: 'pendiente_revision',
    revisado_por: null,
    fecha_revision: null,
    motivo_rechazo: null,
    periodo_desde: '2026-09-21',
    periodo_hasta: '2026-10-20',
    subido_por: 'Luis Morales (Presidente)',
    fecha_subida: '2026-09-15T16:45:00Z',
    ip: '186.68.102.5',
    dispositivo: 'Safari / macOS'
  },
  {
    id: 'comp-003',
    cooperativaId: 'coop-floresta',
    suscripcion_id: 'susc-floresta',
    monto: 60,
    moneda: 'USD',
    metodo: 'deposito',
    banco: 'Produbanco',
    numero_operacion: '1122334455',
    fecha_operacion: '2026-09-14',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'deposito_bancario_floresta.jpg',
    estado: 'pendiente_revision',
    revisado_por: null,
    fecha_revision: null,
    motivo_rechazo: null,
    periodo_desde: '2026-09-17',
    periodo_hasta: '2026-10-16',
    subido_por: 'Manuel Peña (Presidente)',
    fecha_subida: '2026-09-14T09:12:00Z',
    ip: '190.152.88.3',
    dispositivo: 'Firefox / Windows 11'
  },
  // 7 Aprobados en historial
  {
    id: 'comp-004',
    cooperativaId: 'coop-costena',
    suscripcion_id: 'susc-costena',
    monto: 300,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Pichincha',
    numero_operacion: '8877665544',
    fecha_operacion: '2026-08-12',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'comprobante_costena_ago.jpg',
    estado: 'aprobado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-08-12T17:00:00Z',
    motivo_rechazo: null,
    periodo_desde: '2026-08-13',
    periodo_hasta: '2026-09-13',
    subido_por: 'Fausto Cevallos (Presidente)',
    fecha_subida: '2026-08-12T16:40:00Z'
  },
  {
    id: 'comp-005',
    cooperativaId: 'coop-balzar',
    suscripcion_id: 'susc-balzar',
    monto: 225,
    moneda: 'USD',
    metodo: 'efectivo',
    banco: 'Otros',
    numero_operacion: 'REC-EFECT-8891',
    fecha_operacion: '2026-08-10',
    cuenta_destino: 'Oficina Central Rutax',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'recibo_efectivo_balzar.jpg',
    estado: 'aprobado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-08-10T10:30:00Z',
    motivo_rechazo: null,
    periodo_desde: '2026-08-11',
    periodo_hasta: '2026-09-11',
    subido_por: 'Héctor Vera',
    fecha_subida: '2026-08-10T10:15:00Z'
  },
  {
    id: 'comp-006',
    cooperativaId: 'coop-daule',
    suscripcion_id: 'susc-daule',
    monto: 480,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Pichincha',
    numero_operacion: '00987654321',
    fecha_operacion: '2026-08-15',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'comprobante_daule_ago2026.jpg',
    estado: 'aprobado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-08-15T15:00:00Z',
    motivo_rechazo: null,
    periodo_desde: '2026-08-16',
    periodo_hasta: '2026-09-15',
    subido_por: 'José Zambrano',
    fecha_subida: '2026-08-15T14:30:00Z'
  },
  {
    id: 'comp-007',
    cooperativaId: 'coop-floresta',
    suscripcion_id: 'susc-floresta',
    monto: 60,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Produbanco',
    numero_operacion: '5544332211',
    fecha_operacion: '2026-08-16',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'floresta_ago2026.png',
    estado: 'aprobado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-08-16T11:00:00Z',
    motivo_rechazo: null,
    periodo_desde: '2026-08-16',
    periodo_hasta: '2026-09-16',
    subido_por: 'Manuel Peña',
    fecha_subida: '2026-08-16T09:00:00Z'
  },
  {
    id: 'comp-008',
    cooperativaId: 'coop-cisne',
    suscripcion_id: 'susc-cisne',
    monto: 270,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Guayaquil',
    numero_operacion: '7766554433',
    fecha_operacion: '2026-08-20',
    cuenta_destino: '1234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'cisne_ago_transf.jpg',
    estado: 'aprobado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-08-20T12:00:00Z',
    motivo_rechazo: null,
    periodo_desde: '2026-08-21',
    periodo_hasta: '2026-09-20',
    subido_por: 'Luis Morales',
    fecha_subida: '2026-08-20T11:20:00Z'
  },
  {
    id: 'comp-009',
    cooperativaId: 'coop-daule',
    suscripcion_id: 'susc-daule',
    monto: 450,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Pichincha',
    numero_operacion: '0077889911',
    fecha_operacion: '2026-07-15',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'daule_jul2026.jpg',
    estado: 'aprobado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-07-15T16:00:00Z',
    motivo_rechazo: null,
    periodo_desde: '2026-07-16',
    periodo_hasta: '2026-08-15',
    subido_por: 'José Zambrano',
    fecha_subida: '2026-07-15T15:00:00Z'
  },
  {
    id: 'comp-010',
    cooperativaId: 'coop-floresta',
    suscripcion_id: 'susc-floresta',
    monto: 50,
    moneda: 'USD',
    metodo: 'transferencia',
    banco: 'Produbanco',
    numero_operacion: '9988776655',
    fecha_operacion: '2026-07-10',
    cuenta_destino: '2234567890',
    comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    comprobante_nombre: 'rechazo_monto_erroneo.jpg',
    estado: 'rechazado',
    revisado_por: 'usr-superadmin',
    fecha_revision: '2026-07-11T09:30:00Z',
    motivo_rechazo: 'Monto incorrecto ($50 transferidos cuando el valor mensual correspondía a $60)',
    periodo_desde: '2026-07-16',
    periodo_hasta: '2026-08-16',
    subido_por: 'Manuel Peña',
    fecha_subida: '2026-07-10T18:20:00Z'
  }
];

export const INITIAL_METRICAS_GLOBALES: MetricasGlobales = {
  id: 'metricas_actuales',
  fecha_actualizacion: '2026-09-15T19:00:00Z',
  total_cooperativas: 12,
  cooperativas_activas: 10,
  cooperativas_morosas: 2,
  cooperativas_bloqueadas: 1,
  cooperativas_nuevas_mes: 2,
  cooperativas_canceladas_mes: 0,
  total_unidades: 284,
  unidades_activas: 267,
  unidades_en_coops_morosas: 17,
  mrr_actual: 2450,
  mrr_mes_anterior: 2200,
  variacion_mrr_pct: 11.36,
  ingresos_mes_corriente: 3100,
  ingresos_mes_anterior: 2800,
  churn_rate_mes: 0,
  churn_rate_unidades: 2.1,
  total_por_cobrar: 255,
  comprobantes_pendientes_revision: 3,
  top_cooperativas_por_unidades: [
    { cooperativaId: 'coop-daule', nombre: 'Daule Express', unidades: 32, monto_mensual: 480, plan: 'Pro' },
    { cooperativaId: 'coop-costena', nombre: 'Costeña', unidades: 20, monto_mensual: 300, plan: 'Pro' },
    { cooperativaId: 'coop-cisne', nombre: 'Cisne Azul', unidades: 18, monto_mensual: 270, plan: 'Pro' },
    { cooperativaId: 'coop-balzar', nombre: 'Balzar Trans', unidades: 15, monto_mensual: 225, plan: 'Pro' },
    { cooperativaId: 'coop-floresta', nombre: 'La Floresta', unidades: 12, monto_mensual: 60, plan: 'Básico' }
  ],
  proyeccion_proximos_3_meses: [2550, 2680, 2820]
};

export const INITIAL_LOGS_SUPERADMIN: LogSuperAdmin[] = [
  {
    id: 'log-sa-001',
    superadmin_id: 'usr-superadmin',
    accion: 'aprobar_comprobante',
    cooperativa_id_afectada: 'coop-daule',
    detalle: 'Aprobación de comprobante #comp-006 por $480 (Pichincha Op: 00987654321). Suscripción extendida a 15/10/2026.',
    timestamp: '2026-08-15T15:00:00Z',
    ip: '190.152.1.20',
    dispositivo: 'Chrome Desktop / macOS'
  },
  {
    id: 'log-sa-002',
    superadmin_id: 'usr-superadmin',
    accion: 'bloquear_cooperativa',
    cooperativa_id_afectada: 'coop-balzar',
    detalle: 'Bloqueo parcial automático aplicado por mora de 3 días (despacho deshabilitado, GPS activo).',
    timestamp: '2026-09-14T00:01:00Z',
    ip: '127.0.0.1 (System Cron)',
    dispositivo: 'Automated Job Engine'
  },
  {
    id: 'log-sa-003',
    superadmin_id: 'usr-superadmin',
    accion: 'rechazar_comprobante',
    cooperativa_id_afectada: 'coop-floresta',
    detalle: 'Rechazo de comprobante #comp-010: Monto incorrecto ($50 en vez de $60 requeridos).',
    timestamp: '2026-07-11T09:30:00Z',
    ip: '190.152.1.20',
    dispositivo: 'Chrome Desktop / macOS'
  },
  {
    id: 'log-sa-004',
    superadmin_id: 'usr-superadmin',
    accion: 'crear_cooperativa',
    cooperativa_id_afectada: 'coop-floresta',
    detalle: 'Alta de nueva cooperativa "La Floresta" con 12 unidades en plan Básico.',
    timestamp: '2026-06-15T10:00:00Z',
    ip: '190.152.1.20',
    dispositivo: 'Chrome Desktop / macOS'
  },
  {
    id: 'log-sa-005',
    superadmin_id: 'usr-superadmin',
    accion: 'editar_plan',
    cooperativa_id_afectada: null,
    detalle: 'Actualización de características para el plan Pro: añadido soporte para Modo Antirrobo Biométrico.',
    timestamp: '2026-06-01T14:20:00Z',
    ip: '190.152.1.20',
    dispositivo: 'Chrome Desktop / macOS'
  }
];

export function exportFinancialReportPDF(metricas: MetricasGlobales, suscripciones: SuscripcionCooperativa[], cooperativas: Cooperativa[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte Financiero Global — RUTAX-SMART SaaS</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; }
          .kpi-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #334155; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
          .badge-activa { background: #dcfce7; color: #166534; }
          .badge-vencida { background: #ffedd5; color: #9a3412; }
          .badge-bloqueada { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">RUTAX-SMART — Reporte Financiero & MRR</h1>
            <div class="subtitle">Generado el ${new Date().toLocaleString('es-EC')} • Periodo Corriente</div>
          </div>
          <div style="text-align: right;">
            <strong style="color: #0284c7; font-size: 16px;">Rutax-Smart S.A.S.</strong><br />
            <span style="font-size: 11px; color: #64748b;">RUC: 0992345678001</span>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-val">$${metricas.mrr_actual.toLocaleString()}</div>
            <div class="kpi-lbl">MRR Recurrente</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">$${metricas.ingresos_mes_corriente.toLocaleString()}</div>
            <div class="kpi-lbl">Ingresos Cobrados Mes</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">${metricas.total_unidades} (${metricas.unidades_activas} activas)</div>
            <div class="kpi-lbl">Flota Total Monitoreada</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val">$${metricas.total_por_cobrar}</div>
            <div class="kpi-lbl">Cartera Vencida / Mora</div>
          </div>
        </div>

        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 5px;">Desglose de Suscripciones por Cooperativa</h3>
        <table>
          <thead>
            <tr>
              <th>Cooperativa</th>
              <th>Plan</th>
              <th>Unidades</th>
              <th>Tarifa/Ud</th>
              <th>Monto Mensual</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${suscripciones.map(s => {
              const coop = cooperativas.find(c => c.id === s.cooperativaId);
              return `
                <tr>
                  <td><strong>${coop?.nombre || s.cooperativaId}</strong><br /><span style="font-size: 10px; color: #64748b;">RUC: ${coop?.ruc || 'N/A'}</span></td>
                  <td>${s.plan_id.replace('plan-', '').toUpperCase()}</td>
                  <td>${s.unidades_activas} uds</td>
                  <td>$${s.precio_por_unidad}</td>
                  <td><strong>$${s.monto_mensual}</strong></td>
                  <td>${new Date(s.fecha_vencimiento).toLocaleDateString('es-EC')}</td>
                  <td><span class="badge badge-${s.estado_suscripcion}">${s.estado_suscripcion.toUpperCase()}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento confidencial emitido por la plataforma SuperAdmin de RUTAX-SMART S.A.S. • Guayaquil, Ecuador
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export function exportExcelCSV(
  suscripciones: SuscripcionCooperativa[],
  cooperativas: Cooperativa[],
  comprobantes: ComprobantePago[],
  historicoPagos?: HistoricoPagoArchivado[]
): void {
  const rows = [
    ['REPORTE FINANCIERO Y CONTROL DE SUSCRIPCIONES - RUTAX SMART'],
    ['Fecha de Generacion:', new Date().toLocaleString('es-EC')],
    [],
    ['--- RESUMEN DE COOPERATIVAS Y SUSCRIPCIONES VIGENTES ---'],
    ['COOPERATIVA', 'RUC', 'PLAN', 'UNIDADES_ACTIVAS', 'TARIFA_POR_UNIDAD_USD', 'MONTO_MENSUAL_USD', 'ESTADO', 'FECHA_VENCIMIENTO', 'DIAS_MORA'],
    ...suscripciones.map(s => {
      const coop = cooperativas.find(c => c.id === s.cooperativaId);
      return [
        `"${coop?.nombre || s.cooperativaId}"`,
        `"${coop?.ruc || ''}"`,
        `"${s.plan_id}"`,
        s.unidades_activas,
        s.precio_por_unidad,
        s.monto_mensual,
        `"${s.estado_suscripcion}"`,
        `"${s.fecha_vencimiento.split('T')[0]}"`,
        s.dias_mora
      ];
    }),
    [],
    ['--- HISTORICO AUDITABLE DE COMPROBANTES Y PAGOS REALIZADOS (INCLUYE COOPERATIVAS ARCHIVADAS) ---'],
    ['ID_COMPROBANTE', 'COOPERATIVA', 'RUC', 'MONTO_USD', 'METODO', 'BANCO', 'NUMERO_OPERACION', 'FECHA_PAGO', 'PERIODO', 'ESTADO', 'COOPERATIVA_ACTIVA_O_ARCHIVADA'],
    ...comprobantes.map(comp => {
      const coop = cooperativas.find(c => c.id === comp.cooperativaId);
      const nombreCoop = comp.cooperativa_nombre_historico || coop?.nombre || comp.cooperativaId;
      const rucCoop = comp.cooperativa_ruc_historico || coop?.ruc || 'N/A';
      const estadoCoop = comp.cooperativa_eliminada || !coop ? 'Archivada / Eliminada (Pago Preservado)' : 'Activa';
      return [
        `"${comp.id}"`,
        `"${nombreCoop}"`,
        `"${rucCoop}"`,
        comp.monto,
        `"${comp.metodo}"`,
        `"${comp.banco}"`,
        `"${comp.numero_operacion}"`,
        `"${comp.fecha_operacion || comp.fecha_subida}"`,
        `"${comp.periodo_desde} al ${comp.periodo_hasta}"`,
        `"${comp.estado}"`,
        `"${estadoCoop}"`
      ];
    })
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `rutax_reporte_financiero_historico_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
