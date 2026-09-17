import React, { useState } from 'react';
import {
  Usuario,
  Vehiculo,
  LiquidacionViaje,
  ArqueoTurnoChofer
} from '../types';
import { rutaxStore } from '../services/store';
import {
  formatUSD,
  exportarLiquidacionesCSV,
  generarTextoWhatsAppLiquidacion,
  generarTextoWhatsAppArqueo
} from '../services/financialServices';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Share2,
  Calendar,
  Car,
  Fuel,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface FinanzasSocioProps {
  currentUser: Usuario;
  misVehiculos: Vehiculo[];
}

export const FinanzasSocio: React.FC<FinanzasSocioProps> = ({
  currentUser,
  misVehiculos
}) => {
  const [vehiculoFiltro, setVehiculoFiltro] = useState<string>('todos');
  const [fechaFiltro, setFechaFiltro] = useState<string>(''); // Vacio = todas, o YYYY-MM-DD
  const [tabFinanzas, setTabFinanzas] = useState<'liquidaciones' | 'arqueos'>('liquidaciones');
  const [expandedLiqId, setExpandedLiqId] = useState<string | null>(null);

  // Obtener liquidaciones de vehículos del socio
  const misVehiculosIds = misVehiculos.map(v => v.id);
  const allLiquidaciones = rutaxStore.getLiquidacionesViajes().filter(
    l => l.socio_id === currentUser.uid || misVehiculosIds.includes(l.vehiculo_id)
  );

  const allArqueos = rutaxStore.getArqueosTurno().filter(
    a => a.socio_id === currentUser.uid || misVehiculosIds.includes(a.vehiculo_id)
  );

  // Aplicar filtros
  const liquidacionesFiltradas = allLiquidaciones.filter(l => {
    if (vehiculoFiltro !== 'todos' && l.vehiculo_id !== vehiculoFiltro) return false;
    if (fechaFiltro && l.fecha !== fechaFiltro) return false;
    return true;
  });

  const arqueosFiltrados = allArqueos.filter(a => {
    if (vehiculoFiltro !== 'todos' && a.vehiculo_id !== vehiculoFiltro) return false;
    if (fechaFiltro && a.fecha !== fechaFiltro) return false;
    return true;
  });

  // Métricas agregadas
  const totalBruto = liquidacionesFiltradas.reduce((s, l) => s + l.recaudacion_bruta, 0);
  const totalCuotasCoop = liquidacionesFiltradas.reduce((s, l) => s + l.cuota_administracion_coop + l.fondo_auxilio_social, 0);
  const totalGastos = liquidacionesFiltradas.reduce((s, l) => s + l.gastos_carrera, 0);
  const totalChoferes = liquidacionesFiltradas.reduce((s, l) => s + l.pago_chofer_estimado, 0);
  const rendimientoNetoSocio = liquidacionesFiltradas.reduce((s, l) => s + l.rendimiento_socio_estimado, 0);
  const totalPasajeros = liquidacionesFiltradas.reduce((s, l) => s + l.pasajeros_totales, 0);

  const handleConfirmarArqueo = (arqueoId: string) => {
    rutaxStore.confirmarRecepcionArqueo(arqueoId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                RENDICIÓN DE CUENTAS & CAJA SOCIO
              </span>
              <span className="text-xs text-slate-400">{misVehiculos.length} unidades a tu cargo</span>
            </div>
            <h2 className="text-xl font-black text-slate-100 mt-1">
              Control Financiero y Utilidad Neta
            </h2>
            <p className="text-xs text-slate-400">
              Auditoría en tiempo real de pasajes recaudados, comisiones de choferes y cuotas cooperativas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => exportarLiquidacionesCSV(liquidacionesFiltradas, `liquidaciones_socio_${currentUser.cedula}.csv`)}
              disabled={liquidacionesFiltradas.length === 0}
              className="h-10 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              Recaudación Bruta
            </span>
            <span className="text-xl font-black font-mono text-slate-100 mt-1 block">
              {formatUSD(totalBruto)}
            </span>
            <span className="text-[10px] text-slate-500">{totalPasajeros} pasajeros transportados</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              Cuotas Cooperativa
            </span>
            <span className="text-xl font-black font-mono text-rose-400 mt-1 block">
              -{formatUSD(totalCuotasCoop)}
            </span>
            <span className="text-[10px] text-slate-500">Administración & Fondo Auxilio</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-semibold block flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Pago a Choferes
            </span>
            <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
              -{formatUSD(totalChoferes)}
            </span>
            <span className="text-[10px] text-slate-500">Comisiones de servicio</span>
          </div>

          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 font-semibold block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Tu Utilidad Neta
            </span>
            <span className="text-2xl font-black font-mono text-emerald-300 mt-1 block">
              {formatUSD(rendimientoNetoSocio)}
            </span>
            <span className="text-[10px] text-emerald-500/80 font-semibold">Dinero líquido generado</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabFinanzas('liquidaciones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              tabFinanzas === 'liquidaciones'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Liquidaciones de Carrera ({liquidacionesFiltradas.length})</span>
          </button>

          <button
            onClick={() => setTabFinanzas('arqueos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              tabFinanzas === 'arqueos'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Arqueos de Turno / Entregas ({arqueosFiltrados.length})</span>
          </button>
        </div>

        {/* Dropdowns Filters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={vehiculoFiltro}
              onChange={(e) => setVehiculoFiltro(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs"
            >
              <option value="todos">Todos los Vehículos</option>
              {misVehiculos.map(v => (
                <option key={v.id} value={v.id}>Unidad #{v.numero_unidad} - {v.placa}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs"
            />
            {fechaFiltro && (
              <button onClick={() => setFechaFiltro('')} className="text-slate-500 hover:text-slate-300 text-[10px]">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: List of Trip Liquidations */}
      {tabFinanzas === 'liquidaciones' && (
        <div className="space-y-3">
          {liquidacionesFiltradas.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No hay liquidaciones registradas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Las carreras concluidas por los choferes en sus turnos aparecerán automáticamente desglosadas aquí.
              </p>
            </div>
          ) : (
            liquidacionesFiltradas.map(liq => {
              const isExpanded = expandedLiqId === liq.id;
              return (
                <div
                  key={liq.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                        #{liq.numero_unidad}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{liq.ruta_nombre}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                            {liq.fecha} {liq.hora_cierre}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Chofer: <span className="text-slate-300 font-semibold">{liq.chofer_nombre}</span> • {liq.pasajeros_totales} pasajeros
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tu Utilidad Neta</span>
                        <span className="text-base font-black font-mono text-emerald-400">
                          {formatUSD(liq.rendimiento_socio_estimado)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const text = generarTextoWhatsAppLiquidacion(liq);
                            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                          }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-700 text-xs transition-all"
                          title="Compartir por WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setExpandedLiqId(isExpanded ? null : liq.id)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Bruto Cobrado:</span>
                        <span className="font-bold text-slate-200">{formatUSD(liq.recaudacion_bruta)}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          (Efec: {formatUSD(liq.monto_efectivo)} | Dig: {formatUSD(liq.monto_digital)})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Cuota Coop / Auxilio:</span>
                        <span className="font-bold text-rose-400">
                          -{formatUSD(liq.cuota_administracion_coop + liq.fondo_auxilio_social)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Pago al Chofer:</span>
                        <span className="font-bold text-amber-400">-{formatUSD(liq.pago_chofer_estimado)}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">Gastos de Vuelta:</span>
                        <span className="font-bold text-slate-400">-{formatUSD(liq.gastos_carrera)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Arqueos de Turno / Shift Closures */}
      {tabFinanzas === 'arqueos' && (
        <div className="space-y-3">
          {arqueosFiltrados.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">No hay arqueos de turno pendientes</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cuando los choferes cierren sus turnos diarios, aquí podrás verificar el efectivo a entregarte y confirmar la recepción.
              </p>
            </div>
          ) : (
            arqueosFiltrados.map(arq => {
              return (
                <div
                  key={arq.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">
                          Arqueo Turno: Unidad #{arq.numero_unidad}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          arq.estado_entrega === 'confirmado_socio'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        }`}>
                          {arq.estado_entrega === 'confirmado_socio' ? 'Dinero Recibido' : 'Pendiente de Entrega'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Chofer: <span className="text-slate-200 font-semibold">{arq.chofer_nombre}</span> • Fecha: {arq.fecha} ({arq.hora_inicio} - {arq.hora_cierre})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-semibold">Efectivo Físico a Entregarte:</span>
                      <span className="text-xl font-black font-mono text-emerald-400">
                        {formatUSD(arq.saldo_neto_entregar_socio)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Carreras Totales:</span>
                      <span className="font-bold text-slate-200">{arq.total_carreras} vueltas</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Recaudado Bruto:</span>
                      <span className="font-bold text-slate-200">{formatUSD(arq.recaudacion_bruta)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Gastos Descontados:</span>
                      <span className="font-bold text-amber-400">-{formatUSD(arq.total_gastos)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Ganancia Chofer:</span>
                      <span className="font-bold text-sky-400">{formatUSD(arq.comision_chofer)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400 font-mono">
                      Código de Validación: <strong className="text-slate-200">{arq.firma_digital_o_codigo}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = generarTextoWhatsAppArqueo(arq);
                          window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Compartir</span>
                      </button>

                      {arq.estado_entrega !== 'confirmado_socio' && (
                        <button
                          onClick={() => handleConfirmarArqueo(arq.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Recepción de Dinero</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
