import React, { useState } from 'react';
import {
  LiquidacionViaje,
  ArqueoTurnoChofer,
  ConfiguracionFinancieraCoop,
  Vehiculo
} from '../types';
import { rutaxStore } from '../services/store';
import {
  formatUSD,
  exportarLiquidacionesCSV,
  CONFIG_FINANCIERA_DEFAULT
} from '../services/financialServices';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Car,
  Sliders,
  WalletCards,
  Save,
  CreditCard,
  Banknote,
  Search
} from 'lucide-react';

export const FinanzasAdminCoop: React.FC = () => {
  const currentCoop = rutaxStore.getCurrentCoop();
  const vehiculos = rutaxStore.getVehiculos().filter(v => v.cooperativaId === currentCoop?.id);
  const liquidaciones = rutaxStore.getLiquidacionesViajes().filter(l => l.cooperativaId === currentCoop?.id);
  
  const [config, setConfig] = useState<ConfiguracionFinancieraCoop>(() => 
    rutaxStore.getConfigFinancieraCoop(currentCoop?.id || 'coop-daule') || CONFIG_FINANCIERA_DEFAULT
  );

  const [fechaFiltro, setFechaFiltro] = useState<string>('');
  const [unidadFiltro, setUnidadFiltro] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'resumen' | 'liquidaciones' | 'cuotas_unidades' | 'configuracion'>('resumen');
  const [configSaved, setConfigSaved] = useState(false);

  // Filtros
  const liquidacionesFiltradas = liquidaciones.filter(l => {
    if (fechaFiltro && l.fecha !== fechaFiltro) return false;
    if (unidadFiltro !== 'todas' && l.vehiculo_id !== unidadFiltro) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.chofer_nombre.toLowerCase().includes(q) || l.numero_unidad.includes(q) || l.ruta_nombre.toLowerCase().includes(q);
    }
    return true;
  });

  // Métricas de Caja Cooperativa
  const totalRecaudacionGlobal = liquidacionesFiltradas.reduce((s, l) => s + l.recaudacion_bruta, 0);
  const totalIngresoCajaCoop = liquidacionesFiltradas.reduce((s, l) => s + l.cuota_administracion_coop, 0);
  const totalFondoAuxilio = liquidacionesFiltradas.reduce((s, l) => s + l.fondo_auxilio_social, 0);
  const totalCarreras = liquidacionesFiltradas.length;
  const totalPasajeros = liquidacionesFiltradas.reduce((s, l) => s + l.pasajeros_totales, 0);

  // Estimación de cuotas diarias de la flota
  const cuotasDiariasFlota = vehiculos.length * config.cuota_admin_diaria_unidad;

  const handleGuardarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    rutaxStore.guardarConfigFinancieraCoop(config);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              CAJA & ADMINISTRACIÓN FINANCIERA
            </span>
            <span className="text-xs text-slate-400">{currentCoop?.nombre}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1">
            Arqueo General & Recaudación de Cuotas
          </h2>
          <p className="text-xs text-slate-400">
            Control de ingresos de administración, aporte gremial de auxilio y cobro por carrera/despacho.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportarLiquidacionesCSV(liquidacionesFiltradas, `balance_general_${currentCoop?.id}.csv`)}
            disabled={liquidacionesFiltradas.length === 0}
            className="h-11 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Todo a Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Ingreso Caja Admin</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
            {formatUSD(totalIngresoCajaCoop)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Aporte de {totalCarreras} carreras
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Fondo de Auxilio Social</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-mono font-black text-sky-400 mt-1">
            {formatUSD(totalFondoAuxilio)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Fondo gremial intangible
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Cuota Diaria Estimada</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-black text-amber-400 mt-1">
            {formatUSD(cuotasDiariasFlota)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {vehiculos.length} unidades × {formatUSD(config.cuota_admin_diaria_unidad)}/día
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Movimiento Bruto Flota</span>
            <DollarSign className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-2xl font-mono font-black text-slate-100 mt-1">
            {formatUSD(totalRecaudacionGlobal)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {totalPasajeros} pasajes totales
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('resumen')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeSubTab === 'resumen'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Resumen Contable</span>
        </button>

        <button
          onClick={() => setActiveSubTab('liquidaciones')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeSubTab === 'liquidaciones'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Historial de Liquidaciones ({liquidacionesFiltradas.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('configuracion')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
            activeSubTab === 'configuracion'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuración de Tarifas & Cuotas</span>
        </button>
      </div>

      {/* TAB 1: RESUMEN CONTABLE */}
      {activeSubTab === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <WalletCards className="w-4 h-4 text-emerald-400" />
              Estructura de Ingresos Cooperativos
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-200 block">Cuota por Carrera / Despacho:</span>
                  <span className="text-[11px] text-slate-400">Cobrado al cerrar cada vuelta</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatUSD(config.cuota_admin_por_carrera)} / vuelta
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-200 block">Cuota Diaria por Unidad Activa:</span>
                  <span className="text-[11px] text-slate-400">Mantenimiento de frecuencia y garaje</span>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {formatUSD(config.cuota_admin_diaria_unidad)} / día
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-200 block">Aporte a Fondo de Auxilio:</span>
                  <span className="text-[11px] text-slate-400">Cobertura mutual en siniestros y multas</span>
                </div>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {formatUSD(config.fondo_auxilio_por_carrera)} / vuelta
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-sky-400" />
              Datos Bancarios para Pago de Cuotas
            </h3>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Entidad Bancaria:</span>
                <span className="font-bold text-slate-200">{config.banco_cooperativa || 'Banco Pichincha'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Número de Cuenta:</span>
                <span className="font-mono font-bold text-slate-100">{config.numero_cuenta_coop || '2100458912'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Canal Digital:</span>
                <span className="text-emerald-400 font-semibold">DeUna / Transferencia Directa</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE LIQUIDACIONES */}
      {activeSubTab === 'liquidaciones' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por chofer o unidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-200 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={unidadFiltro}
                onChange={(e) => setUnidadFiltro(e.target.value)}
                className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-200 outline-none"
              >
                <option value="todas">Todas las unidades</option>
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>Unidad #{v.numero_unidad}</option>
                ))}
              </select>

              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Unidad</th>
                    <th className="p-3.5">Fecha/Hora</th>
                    <th className="p-3.5">Chofer</th>
                    <th className="p-3.5 text-center">Pasajeros</th>
                    <th className="p-3.5 text-right">Bruto</th>
                    <th className="p-3.5 text-right">Cuota Coop</th>
                    <th className="p-3.5 text-right">Auxilio</th>
                    <th className="p-3.5 text-right">Socio Dueño</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {liquidacionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-sans italic">
                        No se encontraron liquidaciones para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    liquidacionesFiltradas.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-emerald-400">#{l.numero_unidad}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">{l.fecha} {l.hora_cierre}</td>
                        <td className="p-3.5 text-slate-200 font-sans">{l.chofer_nombre}</td>
                        <td className="p-3.5 text-center text-slate-300">{l.pasajeros_totales}</td>
                        <td className="p-3.5 text-right text-slate-200">{formatUSD(l.recaudacion_bruta)}</td>
                        <td className="p-3.5 text-right text-emerald-400 font-bold">+{formatUSD(l.cuota_administracion_coop)}</td>
                        <td className="p-3.5 text-right text-sky-400">+{formatUSD(l.fondo_auxilio_social)}</td>
                        <td className="p-3.5 text-right text-slate-100 font-bold">{formatUSD(l.rendimiento_socio_estimado)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURACIÓN DE TARIFAS & CUOTAS */}
      {activeSubTab === 'configuracion' && (
        <form onSubmit={handleGuardarConfig} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Parámetros Financieros de la Cooperativa
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Define los valores automáticos que se descuentan en cada despacho y en el arqueo diario.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Cuota de Administración por Carrera ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.cuota_admin_por_carrera}
                  onChange={(e) => setConfig({ ...config, cuota_admin_por_carrera: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fondo de Auxilio Social por Carrera ($):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.fondo_auxilio_por_carrera}
                  onChange={(e) => setConfig({ ...config, fondo_auxilio_por_carrera: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Cuota Diaria por Unidad ($):
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={config.cuota_admin_diaria_unidad}
                  onChange={(e) => setConfig({ ...config, cuota_admin_diaria_unidad: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  % Comisión Chofer Sugerida (%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={config.porcentaje_comision_chofer_defecto}
                  onChange={(e) => setConfig({ ...config, porcentaje_comision_chofer_defecto: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="font-bold text-slate-200">Datos Bancarios para Recaudación</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Banco / Tipo de Cuenta:</label>
                  <input
                    type="text"
                    value={config.banco_cooperativa || ''}
                    onChange={(e) => setConfig({ ...config, banco_cooperativa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Número de Cuenta:</label>
                  <input
                    type="text"
                    value={config.numero_cuenta_coop || ''}
                    onChange={(e) => setConfig({ ...config, numero_cuenta_coop: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Parámetros Financieros</span>
            </button>

            {configSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                ¡Configuración guardada con éxito!
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
