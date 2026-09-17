/**
 * RUTAX-SMART — Servicios Financieros, Cálculos de Liquidación y Exportaciones
 */

import {
  LiquidacionViaje,
  ArqueoTurnoChofer,
  GastoTurno,
  ConfiguracionFinancieraCoop
} from '../types';

export const CONFIG_FINANCIERA_DEFAULT: ConfiguracionFinancieraCoop = {
  cooperativaId: 'coop-daule',
  cuota_admin_por_carrera: 0.15,
  cuota_admin_diaria_unidad: 2.50,
  fondo_auxilio_por_carrera: 0.05,
  fondo_multa_retraso_salida: 1.00,
  porcentaje_comision_chofer_defecto: 30, // 30% para chofer por defecto si no es sueldo fijo
  permite_gastos_sin_foto: true,
  banco_cooperativa: 'Banco Pichincha - Cta Cte',
  numero_cuenta_coop: '2100458912',
  qr_deuna_coop_url: '/icon.svg'
};

/**
 * Formatea valores numéricos en moneda USD ($0.00)
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

/**
 * Calcula el desglose contable de una carrera / vuelta
 */
export function calcularLiquidacionCarrera(params: {
  pasajerosBase: number;
  pasajerosRuta: number;
  tarifaUnitaria: number;
  montoEfectivo?: number;
  montoDigital?: number;
  gastosDirectos?: number;
  config?: ConfiguracionFinancieraCoop;
  porcentajeChofer?: number;
}) {
  const {
    pasajerosBase,
    pasajerosRuta,
    tarifaUnitaria,
    gastosDirectos = 0,
    config = CONFIG_FINANCIERA_DEFAULT,
    porcentajeChofer = config.porcentaje_comision_chofer_defecto
  } = params;

  const totalPasajeros = pasajerosBase + pasajerosRuta;
  const recaudacionBruta = totalPasajeros * tarifaUnitaria;
  const cuotaCoop = config.cuota_admin_por_carrera;
  const fondoAuxilio = config.fondo_auxilio_por_carrera;
  const deduccionesTotales = cuotaCoop + fondoAuxilio + gastosDirectos;
  
  const recaudacionNeta = Math.max(0, recaudacionBruta - deduccionesTotales);
  const gananciaChofer = Number(((recaudacionNeta * porcentajeChofer) / 100).toFixed(2));
  const gananciaSocio = Number((recaudacionNeta - gananciaChofer).toFixed(2));

  return {
    totalPasajeros,
    recaudacionBruta,
    cuotaCoop,
    fondoAuxilio,
    gastosDirectos,
    deduccionesTotales,
    recaudacionNeta,
    gananciaChofer,
    gananciaSocio
  };
}

/**
 * Genera el texto de comprobante para enviar por WhatsApp al Socio / Cooperativa
 */
export function generarTextoWhatsAppLiquidacion(liq: LiquidacionViaje): string {
  return encodeURIComponent(
    `*📋 RUTAX-SMART — LIQUIDACIÓN DE CARRERA*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Unidad:* #${liq.numero_unidad} | *Fecha:* ${liq.fecha} ${liq.hora_cierre}\n` +
    `*Chofer:* ${liq.chofer_nombre}\n` +
    `*Ruta:* ${liq.ruta_nombre}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👥 *Pasajeros:* ${liq.pasajeros_totales} (Base: ${liq.pasajeros_base}, Ruta: ${liq.pasajeros_ruta})\n` +
    `💵 *Recaudación Bruta:* ${formatUSD(liq.recaudacion_bruta)}\n` +
    `   • Efectivo: ${formatUSD(liq.monto_efectivo)}\n` +
    `   • Digital (DeUna/Transf): ${formatUSD(liq.monto_digital)}\n` +
    `────────────────────\n` +
    `📉 *Deducciones Operativas:*\n` +
    `   • Cuota Coop: -${formatUSD(liq.cuota_administracion_coop)}\n` +
    `   • Fondo Auxilio: -${formatUSD(liq.fondo_auxilio_social)}\n` +
    `   • Gastos Directos: -${formatUSD(liq.gastos_carrera)}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Rendimiento Neto:* ${formatUSD(liq.recaudacion_neta)}\n` +
    `   👤 Chofer (${liq.pago_chofer_estimado ? 'Comisión' : 'Fijo'}): ${formatUSD(liq.pago_chofer_estimado)}\n` +
    `   🚗 Saldo Socio Propietario: *${formatUSD(liq.rendimiento_socio_estimado)}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `_Generado automáticamente vía Rutax Smart Cloud_`
  );
}

/**
 * Genera el texto de cierre de turno para WhatsApp al Socio
 */
export function generarTextoWhatsAppArqueo(arq: ArqueoTurnoChofer): string {
  return encodeURIComponent(
    `*📊 RUTAX-SMART — ARQUEO FINAL DE TURNO*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Unidad:* #${arq.numero_unidad} | *Fecha:* ${arq.fecha}\n` +
    `*Chofer:* ${arq.chofer_nombre}\n` +
    `*Horario:* ${arq.hora_inicio} a ${arq.hora_cierre}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏁 *Carreras Realizadas:* ${arq.total_carreras}\n` +
    `👥 *Total Pasajeros:* ${arq.total_pasajeros}\n` +
    `💵 *Recaudación Bruta:* ${formatUSD(arq.recaudacion_bruta)}\n` +
    `   • Efectivo Recibido: ${formatUSD(arq.total_efectivo)}\n` +
    `   • Pagos Digitales: ${formatUSD(arq.total_digital)}\n` +
    `────────────────────\n` +
    `⛽ *Gastos Operativos:* -${formatUSD(arq.total_gastos)}\n` +
    `🏢 *Aportes Cooperativa:* -${formatUSD(arq.total_cuotas_coop + arq.total_fondo_auxilio)}\n` +
    `👨‍✈️ *Ganancia Chofer:* -${formatUSD(arq.comision_chofer)}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🤝 *SALDO EFECTIVO A ENTREGAR AL SOCIO:* *${formatUSD(arq.saldo_neto_entregar_socio)}*\n` +
    `*Código de Entrega:* ${arq.firma_digital_o_codigo || 'RX-' + Math.floor(1000 + Math.random() * 9000)}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `_Sistema Rutax-Smart Contable_`
  );
}

/**
 * Exporta un array de liquidaciones a formato CSV descargable
 */
export function exportarLiquidacionesCSV(liquidaciones: LiquidacionViaje[], filename = 'liquidaciones_rutax.csv'): void {
  const headers = [
    'ID',
    'Fecha',
    'Hora',
    'Unidad',
    'Chofer',
    'Ruta',
    'Pasajeros Base',
    'Pasajeros Ruta',
    'Total Pasajeros',
    'Tarifa',
    'Recaudacion Bruta',
    'Efectivo',
    'Digital',
    'Cuota Coop',
    'Fondo Auxilio',
    'Gastos Carrera',
    'Recaudacion Neta',
    'Pago Chofer',
    'Rendimiento Socio',
    'Estado'
  ];

  const rows = liquidaciones.map(l => [
    l.id,
    l.fecha,
    l.hora_cierre,
    l.numero_unidad,
    `"${l.chofer_nombre.replace(/"/g, '""')}"`,
    `"${l.ruta_nombre.replace(/"/g, '""')}"`,
    l.pasajeros_base,
    l.pasajeros_ruta,
    l.pasajeros_totales,
    l.tarifa_unitaria.toFixed(2),
    l.recaudacion_bruta.toFixed(2),
    l.monto_efectivo.toFixed(2),
    l.monto_digital.toFixed(2),
    l.cuota_administracion_coop.toFixed(2),
    l.fondo_auxilio_social.toFixed(2),
    l.gastos_carrera.toFixed(2),
    l.recaudacion_neta.toFixed(2),
    l.pago_chofer_estimado.toFixed(2),
    l.rendimiento_socio_estimado.toFixed(2),
    l.estado
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + 
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
