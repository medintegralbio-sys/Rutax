import {
  PasajeroFrecuente,
  Reserva,
  PuntoRecogidaFrecuente,
  NotificacionWhatsAppLog,
  ConfiguracionPasajeros,
  HistorialViajePasajero,
  PagoCreditoEmpresa
} from '../types';

export const CONFIG_PASAJEROS_DEFAULT: ConfiguracionPasajeros = {
  id: 'cfg-pax-coop-daule',
  cooperativaId: 'coop-daule',
  whatsapp_habilitado: true,
  whatsapp_numero_base: '593991234567',
  whatsapp_api_token: 'rtx_waba_live_token_77a9',
  permitir_reservas_anticipadas: true,
  dias_maximos_reserva: 7,
  hora_limite_cancelacion: 2,
  notificar_pasajero: {
    al_asignar_unidad: true,
    cuando_unidad_sale: true,
    cuando_unidad_esta_1km: true,
    cuando_unidad_llega: true,
    recordatorio_diario_reservas: true
  },
  plantilla_mensajes: {
    reserva_confirmada: 'Hola {nombre}, tu reserva para {fecha} a las {hora} fue confirmada. Te recogeremos en {punto}. Responde SI para confirmar. - Rutax Smart',
    unidad_asignada: 'Hola {nombre}, tu unidad {numero} (Placa {placa}) te recogerá a las {hora} en {punto}. Chofer: {chofer}. - Rutax Smart',
    unidad_en_camino: 'Hola {nombre}, tu unidad va en camino. Llega en {eta} min. Placa: {placa}. - Rutax Smart',
    llegada_inminente: 'Hola {nombre}, tu unidad está a 200m. Por favor sal al punto de recogida. - Rutax Smart',
    recordatorio_diario: 'Hola {nombre}, te recordamos tu reserva para mañana {fecha} a las {hora} en {punto}. Responde SI para confirmar. - Rutax Smart'
  },
  precio_reserva_adicional: 0,
  permitir_credito_empresas: true,
  dias_credito_empresas: 30
};

// 25 Pasajeros Demo
export const INITIAL_PASAJEROS_FRECUENTES: PasajeroFrecuente[] = [
  // 1. Juan Pérez
  {
    id: 'pax-001',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Juan Pérez Quinde',
    telefono: '0991234567',
    cedula: '0928374651',
    email: 'juan.perez@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-101', nombre: 'Casa', lat: -2.1245, lng: -79.9160, referencia: 'Primax Km 12, frente a TIA', es_preferido: true, veces_usado: 65 },
      { id: 'pt-102', nombre: 'Trabajo', lat: -2.1850, lng: -79.8890, referencia: 'Av. 25 de Julio y Portete', es_preferido: false, veces_usado: 18 },
      { id: 'pt-103', nombre: 'Universidad', lat: -2.1520, lng: -79.8970, referencia: 'Entry 8 U. Estatal', es_preferido: false, veces_usado: 4 }
    ],
    preferencia_asiento: 'adelante',
    preferencia_chofer_id: 'usr-chofer',
    preferencia_horario: '6:15am',
    notas: 'Se marea atrás. Siempre puntual en la gasolinera.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 87,
    ultimo_viaje: '2026-09-15T06:15:00',
    primera_fecha: '2026-01-15',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-01-15T08:00:00'
  },
  // 2. María López
  {
    id: 'pax-002',
    cooperativaId: 'coop-daule',
    nombre_completo: 'María López Álava',
    telefono: '0998887766',
    cedula: '0912445566',
    email: 'marialopez@yahoo.es',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-201', nombre: 'Trabajo', lat: -2.1850, lng: -79.8890, referencia: 'Av. 25 de Julio, parada Metro', es_preferido: true, veces_usado: 54 },
      { id: 'pt-202', nombre: 'Casa', lat: -2.1310, lng: -79.9020, referencia: 'La Joya, etapa Rubí', es_preferido: false, veces_usado: 18 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '6:30am',
    notas: 'Lleva maleta grande los lunes.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 72,
    ultimo_viaje: '2026-09-15T06:30:00',
    primera_fecha: '2026-02-01',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-02-01T07:30:00'
  },
  // 3. Empresa 1: Hacienda San Carlos
  {
    id: 'pax-003',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Hacienda San Carlos (Empresa)',
    telefono: '0991112233',
    cedula: '0992384756001',
    email: 'logistica@haciendasancarlos.ec',
    tipo: 'empresa',
    puntos_recogida: [
      { id: 'pt-301', nombre: 'Entrada Principal', lat: -2.0950, lng: -79.9320, referencia: 'Km 15 Vía Daule, portón verde', es_preferido: true, veces_usado: 65 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: '6:00am - 7:00am',
    notas: 'Transporte de 5 empleados en turno matutino. Pago mensual contra factura.',
    tiene_credito: true,
    cupo_mensual: 500,
    precio_pactado: 1.30,
    saldo_pendiente: 130.00,
    contacto_empresa_nombre: 'María González',
    contacto_empresa_telefono: '0991112233',
    dia_corte_pago: 15,
    total_viajes: 65,
    ultimo_viaje: '2026-09-15T07:00:00',
    primera_fecha: '2026-01-20',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-01-20T10:00:00'
  },
  // 4. Carlos Vera
  {
    id: 'pax-004',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Carlos Vera Zambrano',
    telefono: '0983344556',
    cedula: '0934567812',
    email: 'carlos.vera@outlook.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-401', nombre: 'Universidad', lat: -2.1520, lng: -79.8970, referencia: 'Entry 8 Facultad Agronomía', es_preferido: true, veces_usado: 48 },
      { id: 'pt-402', nombre: 'Casa', lat: -2.1245, lng: -79.9160, referencia: 'Primax Km 12', es_preferido: false, veces_usado: 10 }
    ],
    preferencia_asiento: 'adelante',
    preferencia_chofer_id: null,
    preferencia_horario: '6:45am',
    notas: 'Profesor universitario, requiere recibo electrónico.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 58,
    ultimo_viaje: '2026-09-14T06:45:00',
    primera_fecha: '2026-02-10',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-02-10T12:00:00'
  },
  // 5. Ana Torres
  {
    id: 'pax-005',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Ana Torres Macías',
    telefono: '0975566778',
    cedula: '0945678923',
    email: 'anatorres@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-501', nombre: 'Mall del Sur', lat: -2.2280, lng: -79.8980, referencia: 'Parada frente a Pharmacys', es_preferido: true, veces_usado: 42 },
      { id: 'pt-502', nombre: 'Centro Daule', lat: -1.9830, lng: -79.9800, referencia: 'Parque Central Daule', es_preferido: false, veces_usado: 10 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '7:30am',
    notas: 'Supervisora comercial.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 52,
    ultimo_viaje: '2026-09-15T07:30:00',
    primera_fecha: '2026-03-01',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-01T09:00:00'
  },
  // 6. Empresa 2: Exportadora Del Mar
  {
    id: 'pax-006',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Exportadora Del Mar S.A.',
    telefono: '0993344112',
    cedula: '0993128945001',
    email: 'admin@exportadoradelmar.ec',
    tipo: 'empresa',
    puntos_recogida: [
      { id: 'pt-601', nombre: 'Planta Empacadora', lat: -2.1150, lng: -79.9250, referencia: 'Vía Daule Km 10.5', es_preferido: true, veces_usado: 45 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: '07:15am',
    notas: 'Convenio corporativo 4 cupos. Al día en pagos.',
    tiene_credito: true,
    cupo_mensual: 300,
    precio_pactado: 1.25,
    saldo_pendiente: 0.00,
    contacto_empresa_nombre: 'Ing. Fernando Roca',
    contacto_empresa_telefono: '0993344112',
    dia_corte_pago: 10,
    total_viajes: 45,
    ultimo_viaje: '2026-09-10T07:15:00',
    primera_fecha: '2026-03-05',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-05T11:00:00'
  },
  // 7. Empresa 3: Colegio San José
  {
    id: 'pax-007',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Colegio San José (Docentes)',
    telefono: '0987654321',
    cedula: '0991827364001',
    email: 'colecturia@colegiosanjose.edu.ec',
    tipo: 'empresa',
    puntos_recogida: [
      { id: 'pt-701', nombre: 'Puerta Principal Colegio', lat: -1.9860, lng: -79.9770, referencia: 'Av. Daule frente al parque infantil', es_preferido: true, veces_usado: 38 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: '06:40am',
    notas: 'Ruta fija de profesores. 3 pasajeros.',
    tiene_credito: true,
    cupo_mensual: 200,
    precio_pactado: 1.00,
    saldo_pendiente: 45.00,
    contacto_empresa_nombre: 'Lcda. Carmen Morales',
    contacto_empresa_telefono: '0987654321',
    dia_corte_pago: 1,
    total_viajes: 38,
    ultimo_viaje: '2026-09-14T06:40:00',
    primera_fecha: '2026-03-12',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-12T08:00:00'
  },
  // 8. José Mendoza
  {
    id: 'pax-008',
    cooperativaId: 'coop-daule',
    nombre_completo: 'José Mendoza Cedeño',
    telefono: '0994455667',
    cedula: '0918273645',
    email: null,
    tipo: 'tercera_edad',
    puntos_recogida: [
      { id: 'pt-801', nombre: 'Casa', lat: -2.1245, lng: -79.9160, referencia: 'Primax Km 12, banca azul', es_preferido: true, veces_usado: 49 }
    ],
    preferencia_asiento: 'adelante',
    preferencia_chofer_id: null,
    preferencia_horario: '07:00am',
    notas: 'Tercera edad, necesita ayuda para subir escalón y ubicar bastón.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: 0.25,
    saldo_pendiente: 0,
    total_viajes: 49,
    ultimo_viaje: '2026-09-15T07:00:00',
    primera_fecha: '2026-02-15',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-02-15T09:00:00'
  },
  // 9. Lucía Romero
  {
    id: 'pax-009',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Lucía Romero Intriago',
    telefono: '0982233445',
    cedula: '0929384756',
    email: 'lucia.romero@hotmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-901', nombre: 'Casa', lat: -2.1310, lng: -79.9020, referencia: 'La Joya, Etapa Coral villa 45', es_preferido: true, veces_usado: 35 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '06:20am',
    notas: 'Paga con DeUna / Código QR.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 35,
    ultimo_viaje: '2026-09-15T06:20:00',
    primera_fecha: '2026-03-20',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-20T08:00:00'
  },
  // 10. David Castro (Estudiante)
  {
    id: 'pax-010',
    cooperativaId: 'coop-daule',
    nombre_completo: 'David Castro Benítez',
    telefono: '0978899001',
    cedula: '0956473829',
    email: 'dcastro@ug.edu.ec',
    tipo: 'estudiante',
    puntos_recogida: [
      { id: 'pt-1001', nombre: 'Entry 8', lat: -2.1520, lng: -79.8970, referencia: 'Entry 8 Universidad Guayaquil', es_preferido: true, veces_usado: 40 }
    ],
    preferencia_asiento: 'atras_solo',
    preferencia_chofer_id: null,
    preferencia_horario: '06:15am',
    notas: 'Tarifa estudiante carnet vigente.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: 0.25,
    saldo_pendiente: 0,
    total_viajes: 40,
    ultimo_viaje: '2026-09-14T06:15:00',
    primera_fecha: '2026-02-18',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-02-18T10:00:00'
  },
  // 11. Andrea Viteri (Estudiante)
  {
    id: 'pax-011',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Andrea Viteri Solís',
    telefono: '0981122334',
    cedula: '0948372615',
    email: 'andrea.viteri@politecnica.edu.ec',
    tipo: 'estudiante',
    puntos_recogida: [
      { id: 'pt-1101', nombre: 'Campus ESPOL', lat: -2.1460, lng: -79.9650, referencia: 'Garita de Prosperina', es_preferido: true, veces_usado: 32 }
    ],
    preferencia_asiento: 'adelante',
    preferencia_chofer_id: null,
    preferencia_horario: '06:30am',
    notas: 'Estudiante Politécnica.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: 0.25,
    saldo_pendiente: 0,
    total_viajes: 32,
    ultimo_viaje: '2026-09-15T06:30:00',
    primera_fecha: '2026-03-01',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-01T10:00:00'
  },
  // 12. Pedro Navas
  {
    id: 'pax-012',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Pedro Navas Barzola',
    telefono: '0990011223',
    cedula: '0917263548',
    email: 'pedro.navas@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1201', nombre: 'Mercado Central', lat: -2.1920, lng: -79.8850, referencia: 'Frente a puesto de frutas 12', es_preferido: true, veces_usado: 28 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: '05:45am',
    notas: 'Comerciante mayorista.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 28,
    ultimo_viaje: '2026-09-15T05:45:00',
    primera_fecha: '2026-03-10',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-10T06:00:00'
  },
  // 13. Gabriela Ortiz
  {
    id: 'pax-013',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Gabriela Ortiz Pincay',
    telefono: '0984455221',
    cedula: '0938475610',
    email: 'gabyortiz@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1301', nombre: 'Terminal Daule', lat: -1.9790, lng: -79.9820, referencia: 'Andén 3', es_preferido: true, veces_usado: 26 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '06:10am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 26,
    ultimo_viaje: '2026-09-14T06:10:00',
    primera_fecha: '2026-03-15',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-15T08:00:00'
  },
  // 14. Byron Villamar
  {
    id: 'pax-014',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Byron Villamar Holguín',
    telefono: '0997788112',
    cedula: '0921345678',
    email: 'byron_vh@hotmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1401', nombre: 'Gasolinera La Joya', lat: -2.1310, lng: -79.9020, referencia: 'Frente a cajero automático', es_preferido: true, veces_usado: 25 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: '07:05am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 25,
    ultimo_viaje: '2026-09-15T07:05:00',
    primera_fecha: '2026-03-18',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-18T07:30:00'
  },
  // 15. Carmen Tigrero
  {
    id: 'pax-015',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Carmen Tigrero Vera',
    telefono: '0989911224',
    cedula: '0919283746',
    email: null,
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1501', nombre: 'Parque Central Daule', lat: -1.9830, lng: -79.9800, referencia: 'Frente a Iglesia Matriz', es_preferido: true, veces_usado: 24 }
    ],
    preferencia_asiento: 'adelante',
    preferencia_chofer_id: null,
    preferencia_horario: '06:00am',
    notas: 'Enfermera en Hospital Guayaquil.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 24,
    ultimo_viaje: '2026-09-15T06:00:00',
    primera_fecha: '2026-03-22',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-22T08:00:00'
  },
  // 16. Walter Yánez
  {
    id: 'pax-016',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Walter Yánez Salazar',
    telefono: '0995544332',
    cedula: '0928394012',
    email: 'walter.yanez@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1601', nombre: 'Primax Km 12', lat: -2.1245, lng: -79.9160, referencia: 'Junto al cajero Banco Pacífico', es_preferido: true, veces_usado: 23 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '06:50am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 23,
    ultimo_viaje: '2026-09-14T06:50:00',
    primera_fecha: '2026-03-25',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-03-25T08:00:00'
  },
  // 17. Elena Moreira
  {
    id: 'pax-017',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Elena Moreira Zambrano',
    telefono: '0983322114',
    cedula: '0937482910',
    email: 'elena.moreira@outlook.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1701', nombre: 'Av. 25 de Julio', lat: -2.1850, lng: -79.8890, referencia: 'Diagonal a Hospital Teodoro Maldonado', es_preferido: true, veces_usado: 22 }
    ],
    preferencia_asiento: 'adelante',
    preferencia_chofer_id: null,
    preferencia_horario: '06:15am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 22,
    ultimo_viaje: '2026-09-15T06:15:00',
    primera_fecha: '2026-04-01',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-04-01T08:00:00'
  },
  // 18. Raúl Cañarte
  {
    id: 'pax-018',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Raúl Cañarte Rosado',
    telefono: '0996611225',
    cedula: '0910293847',
    email: null,
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1801', nombre: 'Primax Km 12', lat: -2.1245, lng: -79.9160, referencia: 'Frente a farmacia TIA', es_preferido: true, veces_usado: 21 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: '06:30am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 21,
    ultimo_viaje: '2026-09-13T06:30:00',
    primera_fecha: '2026-04-05',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-04-05T08:00:00'
  },
  // 19. Mónica Choez
  {
    id: 'pax-019',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Mónica Choez Vera',
    telefono: '0987744119',
    cedula: '0940192837',
    email: 'monicachoez@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-1901', nombre: 'Entry 8', lat: -2.1520, lng: -79.8970, referencia: 'Puerta peatonal 2', es_preferido: true, veces_usado: 20 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '07:00am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 20,
    ultimo_viaje: '2026-09-15T07:00:00',
    primera_fecha: '2026-04-10',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-04-10T08:00:00'
  },
  // 20. Ocasional 1: Fabricio Meza
  {
    id: 'pax-020',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Fabricio Meza Alarcón',
    telefono: '0992288334',
    cedula: '0923847192',
    email: null,
    tipo: 'ocasional',
    puntos_recogida: [
      { id: 'pt-2001', nombre: 'Mall del Sur', lat: -2.2280, lng: -79.8980, referencia: 'Puerta 3', es_preferido: true, veces_usado: 4 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: null,
    notas: 'Cliente esporádico fin de semana.',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 4,
    ultimo_viaje: '2026-09-12T14:30:00',
    primera_fecha: '2026-08-01',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-08-01T14:00:00'
  },
  // 21. Ocasional 2: Sandra Barreno
  {
    id: 'pax-021',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Sandra Barreno Pinto',
    telefono: '0985511447',
    cedula: '0931294857',
    email: null,
    tipo: 'ocasional',
    puntos_recogida: [
      { id: 'pt-2101', nombre: 'Primax Km 12', lat: -2.1245, lng: -79.9160, referencia: 'Frente al semáforo', es_preferido: true, veces_usado: 3 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: null,
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 3,
    ultimo_viaje: '2026-09-11T09:00:00',
    primera_fecha: '2026-08-15',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-08-15T09:00:00'
  },
  // 22. Ocasional 3: Xavier Quimi
  {
    id: 'pax-022',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Xavier Quimi Solórzano',
    telefono: '0994411883',
    cedula: '0948571938',
    email: null,
    tipo: 'ocasional',
    puntos_recogida: [
      { id: 'pt-2201', nombre: 'Terminal Daule', lat: -1.9790, lng: -79.9820, referencia: 'Puerta principal', es_preferido: true, veces_usado: 2 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: null,
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 2,
    ultimo_viaje: '2026-09-08T18:20:00',
    primera_fecha: '2026-08-20',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-08-20T18:00:00'
  },
  // 23. Ocasional 4: Viviana Coello
  {
    id: 'pax-023',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Viviana Coello Ronquillo',
    telefono: '0981144772',
    cedula: '0929384716',
    email: null,
    tipo: 'ocasional',
    puntos_recogida: [
      { id: 'pt-2301', nombre: 'Av. 25 de Julio', lat: -2.1850, lng: -79.8890, referencia: 'Frente a banco', es_preferido: true, veces_usado: 1 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: null,
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 1,
    ultimo_viaje: '2026-09-13T11:00:00',
    primera_fecha: '2026-09-13',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-09-13T11:00:00'
  },
  // 24. Ocasional 5: Guillermo Loor
  {
    id: 'pax-024',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Guillermo Loor Balón',
    telefono: '0979922338',
    cedula: '0918274635',
    email: null,
    tipo: 'ocasional',
    puntos_recogida: [
      { id: 'pt-2401', nombre: 'Mercado Central', lat: -2.1920, lng: -79.8850, referencia: 'Parada sur', es_preferido: true, veces_usado: 1 }
    ],
    preferencia_asiento: 'indistinto',
    preferencia_chofer_id: null,
    preferencia_horario: null,
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 1,
    ultimo_viaje: '2026-09-14T16:00:00',
    primera_fecha: '2026-09-14',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-09-14T16:00:00'
  },
  // 25. Nancy Bazán
  {
    id: 'pax-025',
    cooperativaId: 'coop-daule',
    nombre_completo: 'Nancy Bazán Cobeña',
    telefono: '0998833221',
    cedula: '0947382910',
    email: 'nancy.bazan@gmail.com',
    tipo: 'frecuente',
    puntos_recogida: [
      { id: 'pt-2501', nombre: 'Gasolinera La Joya', lat: -2.1310, lng: -79.9020, referencia: 'Junto a farmacia Fybeca', es_preferido: true, veces_usado: 19 }
    ],
    preferencia_asiento: 'ventana',
    preferencia_chofer_id: null,
    preferencia_horario: '07:10am',
    notas: '',
    tiene_credito: false,
    cupo_mensual: 0,
    precio_pactado: null,
    saldo_pendiente: 0,
    total_viajes: 19,
    ultimo_viaje: '2026-09-15T07:10:00',
    primera_fecha: '2026-04-20',
    estado: 'activo',
    creado_por: 'usr-admin',
    timestamp: '2026-04-20T08:00:00'
  }
];

// 8 Puntos de recogida frecuentes (Heatmap)
export const INITIAL_PUNTOS_RECOGIDA_FRECUENTES: PuntoRecogidaFrecuente[] = [
  {
    id: 'prf-001',
    cooperativaId: 'coop-daule',
    nombre: 'Gasolinera Primax Km 12 (Vía Daule)',
    lat: -2.1245,
    lng: -79.9160,
    radio: 50,
    total_recogidas: 142,
    pasajeros_que_usan: ['pax-001', 'pax-004', 'pax-008', 'pax-016', 'pax-018', 'pax-021'],
    ultima_recogida: '2026-09-15T07:10:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-002',
    cooperativaId: 'coop-daule',
    nombre: 'Av. 25 de Julio & Portete',
    lat: -2.1850,
    lng: -79.8890,
    radio: 50,
    total_recogidas: 98,
    pasajeros_que_usan: ['pax-001', 'pax-002', 'pax-017', 'pax-023'],
    ultima_recogida: '2026-09-15T06:30:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-003',
    cooperativaId: 'coop-daule',
    nombre: 'Entry 8 Universidad de Guayaquil',
    lat: -2.1520,
    lng: -79.8970,
    radio: 45,
    total_recogidas: 65,
    pasajeros_que_usan: ['pax-001', 'pax-004', 'pax-010', 'pax-019'],
    ultima_recogida: '2026-09-15T07:00:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-004',
    cooperativaId: 'coop-daule',
    nombre: 'Mall del Sur (Parada Pharmacys)',
    lat: -2.2280,
    lng: -79.8980,
    radio: 50,
    total_recogidas: 52,
    pasajeros_que_usan: ['pax-005', 'pax-020'],
    ultima_recogida: '2026-09-15T07:30:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-005',
    cooperativaId: 'coop-daule',
    nombre: 'Mercado Central de Guayaquil',
    lat: -2.1920,
    lng: -79.8850,
    radio: 40,
    total_recogidas: 28,
    pasajeros_que_usan: ['pax-012', 'pax-024'],
    ultima_recogida: '2026-09-15T05:45:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-006',
    cooperativaId: 'coop-daule',
    nombre: 'Terminal Terrestre Daule',
    lat: -1.9790,
    lng: -79.9820,
    radio: 60,
    total_recogidas: 22,
    pasajeros_que_usan: ['pax-013', 'pax-022'],
    ultima_recogida: '2026-09-14T18:20:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-007',
    cooperativaId: 'coop-daule',
    nombre: 'Gasolinera La Joya (Av. León Febres)',
    lat: -2.1310,
    lng: -79.9020,
    radio: 50,
    total_recogidas: 18,
    pasajeros_que_usan: ['pax-009', 'pax-014', 'pax-025'],
    ultima_recogida: '2026-09-15T07:10:00',
    activa: true,
    creada_por: 'sistema'
  },
  {
    id: 'prf-008',
    cooperativaId: 'coop-daule',
    nombre: 'Parque Central de Daule (Matriz)',
    lat: -1.9830,
    lng: -79.9800,
    radio: 40,
    total_recogidas: 12,
    pasajeros_que_usan: ['pax-005', 'pax-007', 'pax-015'],
    ultima_recogida: '2026-09-15T06:00:00',
    activa: true,
    creada_por: 'admin'
  }
];

// 10 Reservas Demo
export const INITIAL_RESERVAS: Reserva[] = [
  // HOY: 3 reservas
  {
    id: 'res-001',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-001',
    pasajero_nombre: 'Juan Pérez Quinde',
    pasajero_telefono: '0991234567',
    pasajero_tipo: 'frecuente',
    fecha: new Date().toISOString().split('T')[0], // Hoy
    hora_deseada: '06:15',
    hora_limite: '06:30',
    punto_recogida: {
      nombre: 'Casa - Primax Km 12',
      lat: -2.1245,
      lng: -79.9160,
      referencia: 'Frente a TIA, Primax Km 12'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'asignada',
    turno_asignado_id: 'tur-001',
    unidad_asignada_id: 'veh-15',
    numero_unidad: '15',
    placa_unidad: 'GSG-1015',
    chofer_asignado_id: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    chofer_telefono: '0991234567',
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '05:45',
    observaciones: 'Se marea atrás. Prefiere asiento delantero.',
    creada_por: 'despachador',
    fecha_creacion: '2026-09-14T20:00:00',
    fecha_asignacion: '2026-09-15T05:30:00',
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  {
    id: 'res-002',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-002',
    pasajero_nombre: 'María López Álava',
    pasajero_telefono: '0998887766',
    pasajero_tipo: 'frecuente',
    fecha: new Date().toISOString().split('T')[0], // Hoy
    hora_deseada: '06:30',
    hora_limite: '06:45',
    punto_recogida: {
      nombre: 'Av. 25 de Julio',
      lat: -2.1850,
      lng: -79.8890,
      referencia: 'Parada frente a Metro'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 2,
    estado: 'pendiente',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    numero_unidad: undefined,
    placa_unidad: undefined,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '20:10',
    observaciones: 'Lleva maleta grande.',
    creada_por: 'pasajero_web',
    fecha_creacion: '2026-09-14T20:05:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  {
    id: 'res-003',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-004',
    pasajero_nombre: 'Carlos Vera Zambrano',
    pasajero_telefono: '0983344556',
    pasajero_tipo: 'frecuente',
    fecha: new Date().toISOString().split('T')[0], // Hoy
    hora_deseada: '07:15',
    hora_limite: '07:30',
    punto_recogida: {
      nombre: 'Entry 8 Universidad',
      lat: -2.1520,
      lng: -79.8970,
      referencia: 'Facultad Agronomía'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'recogida',
    turno_asignado_id: 'tur-001',
    unidad_asignada_id: 'veh-15',
    numero_unidad: '15',
    placa_unidad: 'GSG-1015',
    chofer_asignado_id: 'usr-chofer',
    chofer_nombre: 'Juan Pérez Quinde',
    chofer_telefono: '0991234567',
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '07:00',
    observaciones: '',
    creada_por: 'despachador',
    fecha_creacion: '2026-09-14T18:00:00',
    fecha_asignacion: '2026-09-15T06:00:00',
    fecha_recogida: '2026-09-15T07:18:00',
    motivo_cancelacion: null,
    cancelada_por: null
  },
  // MAÑANA: 4 reservas
  {
    id: 'res-004',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-003',
    pasajero_nombre: 'Hacienda San Carlos (Empresa)',
    pasajero_telefono: '0991112233',
    pasajero_tipo: 'empresa',
    fecha: getFechaOffset(1), // Mañana
    hora_deseada: '07:00',
    hora_limite: '07:15',
    punto_recogida: {
      nombre: 'Entrada Principal Portón Verde',
      lat: -2.0950,
      lng: -79.9320,
      referencia: 'Km 15 Vía Daule'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 5,
    estado: 'confirmada',
    turno_asignado_id: 'tur-002',
    unidad_asignada_id: 'veh-1012',
    numero_unidad: '1012',
    placa_unidad: 'GBL-8840',
    chofer_asignado_id: 'usr-chofer',
    chofer_nombre: 'Roberto Yagual',
    chofer_telefono: '0997788990',
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '16:00',
    es_credito_empresa: true,
    monto_tarifa: 6.50,
    observaciones: 'A crédito corporativo mensual. 5 empleados.',
    creada_por: 'admin',
    fecha_creacion: '2026-09-14T15:00:00',
    fecha_asignacion: '2026-09-15T09:00:00',
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  {
    id: 'res-005',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-005',
    pasajero_nombre: 'Ana Torres Macías',
    pasajero_telefono: '0975566778',
    pasajero_tipo: 'frecuente',
    fecha: getFechaOffset(1), // Mañana
    hora_deseada: '07:30',
    hora_limite: '07:45',
    punto_recogida: {
      nombre: 'Mall del Sur',
      lat: -2.2280,
      lng: -79.8980,
      referencia: 'Parada Pharmacys'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'pendiente',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '12:00',
    observaciones: '',
    creada_por: 'pasajero_web',
    fecha_creacion: '2026-09-15T12:00:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  {
    id: 'res-006',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-008',
    pasajero_nombre: 'José Mendoza Cedeño',
    pasajero_telefono: '0994455667',
    pasajero_tipo: 'tercera_edad',
    fecha: getFechaOffset(1), // Mañana
    hora_deseada: '07:00',
    hora_limite: '07:20',
    punto_recogida: {
      nombre: 'Primax Km 12',
      lat: -2.1245,
      lng: -79.9160,
      referencia: 'Banca azul Primax'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'pendiente',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '14:30',
    observaciones: 'Tercera edad. Asiento delantero preferencial.',
    creada_por: 'despachador',
    fecha_creacion: '2026-09-15T14:30:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  {
    id: 'res-007',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-010',
    pasajero_nombre: 'David Castro Benítez',
    pasajero_telefono: '0978899001',
    pasajero_tipo: 'estudiante',
    fecha: getFechaOffset(1), // Mañana
    hora_deseada: '06:15',
    hora_limite: '06:30',
    punto_recogida: {
      nombre: 'Entry 8 Universidad Guayaquil',
      lat: -2.1520,
      lng: -79.8970,
      referencia: 'Puerta peatonal 1'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'pendiente',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '17:00',
    observaciones: '',
    creada_por: 'pasajero_web',
    fecha_creacion: '2026-09-15T17:00:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  // PASADO MAÑANA: 2 reservas
  {
    id: 'res-008',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-006',
    pasajero_nombre: 'Exportadora Del Mar S.A.',
    pasajero_telefono: '0993344112',
    pasajero_tipo: 'empresa',
    fecha: getFechaOffset(2), // Pasado mañana
    hora_deseada: '07:15',
    hora_limite: '07:30',
    punto_recogida: {
      nombre: 'Planta Empacadora Km 10.5',
      lat: -2.1150,
      lng: -79.9250,
      referencia: 'Vía Daule Km 10.5'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 4,
    estado: 'pendiente',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '10:00',
    es_credito_empresa: true,
    monto_tarifa: 5.00,
    observaciones: 'Convenio corporativo.',
    creada_por: 'admin',
    fecha_creacion: '2026-09-15T10:00:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  {
    id: 'res-009',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-009',
    pasajero_nombre: 'Lucía Romero Intriago',
    pasajero_telefono: '0982233445',
    pasajero_tipo: 'frecuente',
    fecha: getFechaOffset(2), // Pasado mañana
    hora_deseada: '06:20',
    hora_limite: '06:35',
    punto_recogida: {
      nombre: 'La Joya Coral',
      lat: -2.1310,
      lng: -79.9020,
      referencia: 'Etapa Coral Villa 45'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'pendiente',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '11:20',
    observaciones: 'Pago DeUna.',
    creada_por: 'pasajero_web',
    fecha_creacion: '2026-09-15T11:20:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: null,
    cancelada_por: null
  },
  // CANCELADA: 1 reserva
  {
    id: 'res-010',
    cooperativaId: 'coop-daule',
    pasajero_id: 'pax-001',
    pasajero_nombre: 'Juan Pérez Quinde',
    pasajero_telefono: '0991234567',
    pasajero_tipo: 'frecuente',
    fecha: '2026-09-12',
    hora_deseada: '06:15',
    hora_limite: '06:30',
    punto_recogida: {
      nombre: 'Primax Km 12',
      lat: -2.1245,
      lng: -79.9160,
      referencia: 'Frente a TIA'
    },
    base_origen_id: 'base-sauces',
    ruta_id: 'ruta-1',
    ruta_nombre: 'Sauces ↔ Centro Guayaquil',
    cantidad_pasajeros: 1,
    estado: 'cancelada',
    turno_asignado_id: null,
    unidad_asignada_id: null,
    chofer_asignado_id: null,
    notificacion_whatsapp_enviada: true,
    hora_notificacion: '05:00',
    observaciones: 'Pasajero avisó cambio de turno laboral.',
    creada_por: 'despachador',
    fecha_creacion: '2026-09-11T20:00:00',
    fecha_asignacion: null,
    fecha_recogida: null,
    motivo_cancelacion: 'Pasajero avisó con 2 horas de anticipación.',
    cancelada_por: 'usr-admin'
  }
];

// 15 Logs de Notificaciones WhatsApp Demo
export const INITIAL_WHATSAPP_LOGS: NotificacionWhatsAppLog[] = [
  {
    id: 'wlog-001',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593991234567',
    destinatario_nombre: 'Juan Pérez Quinde',
    mensaje: 'Hola Juan Pérez Quinde, tu reserva para hoy a las 06:15 fue confirmada. Te recogeremos en Primax Km 12. Responde SI para confirmar. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkxMjM0NTY3FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyAA==',
    timestamp: '2026-09-15T05:45:10'
  },
  {
    id: 'wlog-002',
    cooperativaId: 'coop-daule',
    tipo: 'unidad_asignada',
    destinatario_telefono: '593991234567',
    destinatario_nombre: 'Juan Pérez Quinde',
    mensaje: 'Hola Juan Pérez Quinde, tu unidad Bus #15 (Placa GSG-1015) te recogerá a las 06:15 en Primax Km 12. Chofer: Juan Pérez Quinde. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkxMjM0NTY3FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyBB==',
    timestamp: '2026-09-15T05:50:00'
  },
  {
    id: 'wlog-003',
    cooperativaId: 'coop-daule',
    tipo: 'unidad_en_camino',
    destinatario_telefono: '593991234567',
    destinatario_nombre: 'Juan Pérez Quinde',
    mensaje: 'Hola Juan Pérez Quinde, tu unidad va en camino. Llega en 4 min. Placa: GSG-1015. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkxMjM0NTY3FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyCC==',
    timestamp: '2026-09-15T06:10:00'
  },
  {
    id: 'wlog-004',
    cooperativaId: 'coop-daule',
    tipo: 'llegada_inminente',
    destinatario_telefono: '593991234567',
    destinatario_nombre: 'Juan Pérez Quinde',
    mensaje: 'Hola Juan Pérez Quinde, tu unidad está a 200m. Por favor sal al punto de recogida. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkxMjM0NTY3FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyDD==',
    timestamp: '2026-09-15T06:13:30'
  },
  {
    id: 'wlog-005',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593998887766',
    destinatario_nombre: 'María López Álava',
    mensaje: 'Hola María López Álava, tu reserva para hoy a las 06:30 fue confirmada. Te recogeremos en Av. 25 de Julio. Responde SI para confirmar. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTk4ODg3NzY2FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyRk==',
    timestamp: '2026-09-14T20:10:00'
  },
  {
    id: 'wlog-006',
    cooperativaId: 'coop-daule',
    tipo: 'recordatorio_diario',
    destinatario_telefono: '593991112233',
    destinatario_nombre: 'Hacienda San Carlos (Empresa)',
    mensaje: 'Hola Hacienda San Carlos, te recordamos tu reserva corporativa para mañana a las 07:00 en Entrada Principal. Responde SI para confirmar. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkxMTEyMjMzFQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyR0==',
    timestamp: '2026-09-15T18:00:00'
  },
  {
    id: 'wlog-007',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593983344556',
    destinatario_nombre: 'Carlos Vera Zambrano',
    mensaje: 'Hola Carlos Vera Zambrano, tu reserva para hoy a las 07:15 fue confirmada. Te recogeremos en Entry 8 Universidad. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTgzMzQ0NTU2FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEySA==',
    timestamp: '2026-09-14T18:05:00'
  },
  {
    id: 'wlog-008',
    cooperativaId: 'coop-daule',
    tipo: 'unidad_asignada',
    destinatario_telefono: '593983344556',
    destinatario_nombre: 'Carlos Vera Zambrano',
    mensaje: 'Hola Carlos Vera Zambrano, tu unidad Bus #15 (Placa GSG-1015) te recogerá a las 07:15 en Entry 8. Chofer: Juan Pérez Quinde. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTgzMzQ0NTU2FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEySU==',
    timestamp: '2026-09-15T06:05:00'
  },
  {
    id: 'wlog-009',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593975566778',
    destinatario_nombre: 'Ana Torres Macías',
    mensaje: 'Hola Ana Torres Macías, tu reserva para mañana a las 07:30 fue confirmada. Te recogeremos en Mall del Sur. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTc1NTY2Nzc4FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEySk==',
    timestamp: '2026-09-15T12:05:00'
  },
  {
    id: 'wlog-010',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593994455667',
    destinatario_nombre: 'José Mendoza Cedeño',
    mensaje: 'Hola José Mendoza Cedeño, tu reserva para mañana a las 07:00 fue confirmada. Te recogeremos en Primax Km 12. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTk0NDU1NjY3FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyS0==',
    timestamp: '2026-09-15T14:35:00'
  },
  {
    id: 'wlog-011',
    cooperativaId: 'coop-daule',
    tipo: 'pago_pendiente',
    destinatario_telefono: '593991112233',
    destinatario_nombre: 'Hacienda San Carlos (Empresa)',
    mensaje: 'Estimado cliente Hacienda San Carlos, su saldo mensual al corte es de $130.00 correspondiente a 100 pasajes. Banco Pichincha Cta 2100458912. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkxMTEyMjMzFQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyTE==',
    timestamp: '2026-09-15T08:00:00'
  },
  {
    id: 'wlog-012',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593978899001',
    destinatario_nombre: 'David Castro Benítez',
    mensaje: 'Hola David Castro Benítez, tu reserva para mañana a las 06:15 fue confirmada. Te recogeremos en Entry 8. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTc4ODk5MDAxFQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyTT==',
    timestamp: '2026-09-15T17:05:00'
  },
  {
    id: 'wlog-013',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593993344112',
    destinatario_nombre: 'Exportadora Del Mar S.A.',
    mensaje: 'Hola Exportadora Del Mar S.A., su reserva para pasado mañana a las 07:15 fue confirmada. Te recogeremos en Planta Empacadora. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTkzMzQ0MTEyFQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyTk==',
    timestamp: '2026-09-15T10:05:00'
  },
  {
    id: 'wlog-014',
    cooperativaId: 'coop-daule',
    tipo: 'reserva_confirmada',
    destinatario_telefono: '593982233445',
    destinatario_nombre: 'Lucía Romero Intriago',
    mensaje: 'Hola Lucía Romero Intriago, tu reserva para pasado mañana a las 06:20 fue confirmada. Te recogeremos en La Joya Coral. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTgyMjMzNDQ1FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyT0==',
    timestamp: '2026-09-15T11:25:00'
  },
  {
    id: 'wlog-015',
    cooperativaId: 'coop-daule',
    tipo: 'unidad_en_camino',
    destinatario_telefono: '593983344556',
    destinatario_nombre: 'Carlos Vera Zambrano',
    mensaje: 'Hola Carlos Vera Zambrano, tu unidad va en camino. Llega en 3 min. Placa: GSG-1015. - Rutax Smart',
    estado: 'entregado',
    whatsapp_message_id: 'wamid.HBgLNTkzOTgzMzQ0NTU2FQIAERgSRTU3RDI4QTYzMEVGNDZDMkEyUA==',
    timestamp: '2026-09-15T07:12:00'
  }
];

// Helper para fechas offset
function getFechaOffset(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════
// UTILIDADES Y FUNCIONES DE NEGOCIO
// ═══════════════════════════════════════════════════════

/**
 * Interpola variables en plantillas de WhatsApp
 */
export function interpolateWhatsAppTemplate(
  template: string,
  params: {
    nombre?: string;
    fecha?: string;
    hora?: string;
    punto?: string;
    numero?: string;
    placa?: string;
    chofer?: string;
    eta?: string | number;
    hora_estimada?: string;
  }
): string {
  let res = template;
  if (params.nombre) res = res.replace(/{nombre}/g, params.nombre);
  if (params.fecha) res = res.replace(/{fecha}/g, params.fecha);
  if (params.hora) res = res.replace(/{hora}/g, params.hora);
  if (params.punto) res = res.replace(/{punto}/g, params.punto);
  if (params.numero) res = res.replace(/{numero}/g, params.numero);
  if (params.placa) res = res.replace(/{placa}/g, params.placa);
  if (params.chofer) res = res.replace(/{chofer}/g, params.chofer);
  if (params.eta !== undefined) res = res.replace(/{eta}/g, String(params.eta));
  if (params.hora_estimada) res = res.replace(/{hora_estimada}/g, params.hora_estimada);
  return res;
}

/**
 * Genera link directo a WhatsApp Web / App
 */
export function buildWhatsAppLink(telefono: string, mensaje: string): string {
  // Limpiar teléfono ecuatoriano: si empieza con 09 -> 5939...
  let cleanTel = telefono.replace(/\D/g, '');
  if (cleanTel.startsWith('09') && cleanTel.length === 10) {
    cleanTel = '593' + cleanTel.substring(1);
  } else if (!cleanTel.startsWith('593') && cleanTel.length === 9) {
    cleanTel = '593' + cleanTel;
  }
  return `https://api.whatsapp.com/send?phone=${cleanTel}&text=${encodeURIComponent(mensaje)}`;
}

/**
 * Exporta pasajeros frecuentes a CSV
 */
export function exportarPasajerosCSV(pasajeros: PasajeroFrecuente[], filename = 'pasajeros_frecuentes.csv'): void {
  const headers = [
    'ID',
    'Nombre Completo',
    'Telefono',
    'Cedula',
    'Tipo',
    'Punto Preferido',
    'Asiento Preferido',
    'Horario Habitual',
    'Total Viajes',
    'Credito Activo',
    'Saldo Pendiente',
    'Estado'
  ];

  const rows = pasajeros.map(p => {
    const ptPref = p.puntos_recogida.find(pt => pt.es_preferido) || p.puntos_recogida[0];
    return [
      p.id,
      `"${p.nombre_completo.replace(/"/g, '""')}"`,
      p.telefono,
      p.cedula || 'N/A',
      p.tipo,
      ptPref ? `"${ptPref.nombre} - ${ptPref.referencia.replace(/"/g, '""')}"` : 'N/A',
      p.preferencia_asiento,
      p.preferencia_horario || 'N/A',
      p.total_viajes,
      p.tiene_credito ? 'SI' : 'NO',
      p.saldo_pendiente.toFixed(2),
      p.estado
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta reservas a CSV
 */
export function exportarReservasCSV(reservas: Reserva[], filename = 'reservas_rutax.csv'): void {
  const headers = [
    'ID',
    'Fecha',
    'Hora',
    'Pasajero',
    'Telefono',
    'Punto Recogida',
    'Pax',
    'Estado',
    'Unidad Asignada',
    'Chofer',
    'Es Credito Empresa'
  ];

  const rows = reservas.map(r => [
    r.id,
    r.fecha,
    r.hora_deseada,
    `"${(r.pasajero_nombre || '').replace(/"/g, '""')}"`,
    r.pasajero_telefono || 'N/A',
    `"${r.punto_recogida.nombre} - ${r.punto_recogida.referencia.replace(/"/g, '""')}"`,
    r.cantidad_pasajeros,
    r.estado,
    r.numero_unidad ? `#${r.numero_unidad}` : 'Sin asignar',
    `"${(r.chofer_nombre || 'Sin asignar').replace(/"/g, '""')}"`,
    r.es_credito_empresa ? 'SI' : 'NO'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
