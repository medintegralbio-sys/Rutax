import fs from 'fs';

const storePath = './src/services/store.ts';
let code = fs.readFileSync(storePath, 'utf8');

const proformasRegex = /const INITIAL_PROFORMAS: ProformaPago\[\] = \[[\s\S]*?\];/;
const newProformas = `const INITIAL_PROFORMAS: ProformaPago[] = [
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
];`;
code = code.replace(proformasRegex, newProformas);
fs.writeFileSync(storePath, code);
