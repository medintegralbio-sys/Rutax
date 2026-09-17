import React, { useState } from 'react';
import { PlanSuscripcion } from '../../types';
import { rutaxStore } from '../../services/store';
import { 
  Package, 
  Check, 
  Sparkles, 
  Calculator, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  Car,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Cpu,
  Smartphone,
  Tablet,
  Radio,
  Building2,
  Edit3
} from 'lucide-react';

interface Props {
  planes: PlanSuscripcion[];
  onCrearPlan?: (plan: any) => void;
  onActualizarPlan?: (planId: string, datos: any) => void;
}

export const SuperAdminPlanesTab: React.FC<Props> = ({ planes, onCrearPlan, onActualizarPlan }) => {
  const [calcUnits, setCalcUnits] = useState<number>(20);
  const [calcPlan, setCalcPlan] = useState<string>(planes[0]?.id || 'plan_pro_unico');
  const [calcDescuento, setCalcDescuento] = useState<number>(0);
  
  // Modal de Crear Nuevo Plan
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(15);
  const [nuevoUnidadesMin, setNuevoUnidadesMin] = useState<number>(1);
  const [modulosSeleccionados, setModulosSeleccionados] = useState<string[]>([
    'Uso integral de la aplicación (100% de los módulos)',
    'Despacho Inteligente & Pantalla de Control Base (Tablet)',
    'App Conductor con GPS Satelital, Turnos & Control de Cupo',
    'App Pasajeros / Cliente con Solicitud de Rutas y Asignación',
    'Monitoreo Satelital & Sistema de Alertas SOS con Sirena',
    'Portal Administrativo de Cooperativa, Socios & Flota',
    'Facturación y Conciliación Mensual Automatizada'
  ]);

  // Modal de Editar Plan
  const [planParaEditar, setPlanParaEditar] = useState<PlanSuscripcion | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecio, setEditPrecio] = useState<number>(15);
  const [editUnidadesMin, setEditUnidadesMin] = useState<number>(1);
  const [editModulos, setEditModulos] = useState<string[]>([]);

  const handleOpenEditarPlan = (plan: PlanSuscripcion, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlanParaEditar(plan);
    setEditNombre(plan.nombre);
    setEditPrecio(plan.precio_por_unidad);
    setEditUnidadesMin(plan.unidades_minimas || 1);
    setEditModulos(plan.caracteristicas && plan.caracteristicas.length > 0 ? [...plan.caracteristicas] : [
      'Uso integral de la aplicación (100% de los módulos)',
      'Despacho Inteligente & Pantalla de Control Base (Tablet)',
      'App Conductor con GPS Satelital, Turnos & Control de Cupo',
      'App Pasajeros / Cliente con Solicitud de Rutas y Asignación',
      'Monitoreo Satelital & Sistema de Alertas SOS con Sirena',
      'Portal Administrativo de Cooperativa, Socios & Flota',
      'Facturación y Conciliación Mensual Automatizada'
    ]);
  };

  const handleGuardarEdicionPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planParaEditar || !editNombre.trim() || editPrecio <= 0) return;

    if (onActualizarPlan) {
      onActualizarPlan(planParaEditar.id, {
        nombre: editNombre.trim(),
        precio_por_unidad: editPrecio,
        unidades_minimas: editUnidadesMin,
        caracteristicas: editModulos,
        incluye_todo: true
      });
    } else {
      rutaxStore.actualizarPlanSuscripcion(planParaEditar.id, {
        nombre: editNombre.trim(),
        precio_por_unidad: editPrecio,
        unidades_minimas: editUnidadesMin,
        caracteristicas: editModulos,
        incluye_todo: true
      });
    }

    setPlanParaEditar(null);
  };

  const selectedPlan = planes.find(p => p.id === calcPlan) || planes[0];
  const baseTotal = (selectedPlan?.precio_por_unidad || 15) * calcUnits;
  const totalConDescuento = baseTotal * (1 - (calcDescuento / 100));

  const handleCrearNuevoPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || nuevoPrecio <= 0) return;

    if (onCrearPlan) {
      onCrearPlan({
        nombre: nuevoNombre.trim(),
        precio_por_unidad: nuevoPrecio,
        caracteristicas: modulosSeleccionados,
        unidades_minimas: nuevoUnidadesMin,
        incluye_todo: true
      });
    } else {
      rutaxStore.crearPlanSuscripcion({
        nombre: nuevoNombre.trim(),
        precio_por_unidad: nuevoPrecio,
        caracteristicas: modulosSeleccionados,
        unidades_minimas: nuevoUnidadesMin,
        incluye_todo: true
      });
    }

    setShowCrearModal(false);
    setNuevoNombre('');
    setNuevoPrecio(15);
  };

  const handleEliminarPlan = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Está seguro de eliminar este plan del catálogo?')) {
      rutaxStore.eliminarPlanSuscripcion(planId);
    }
  };

  const toggleModulo = (modulo: string) => {
    if (modulosSeleccionados.includes(modulo)) {
      if (modulosSeleccionados.length > 1) {
        setModulosSeleccionados(modulosSeleccionados.filter(m => m !== modulo));
      }
    } else {
      setModulosSeleccionados([...modulosSeleccionados, modulo]);
    }
  };

  const toggleEditModulo = (modulo: string) => {
    if (editModulos.includes(modulo)) {
      if (editModulos.length > 1) {
        setEditModulos(editModulos.filter(m => m !== modulo));
      }
    } else {
      setEditModulos([...editModulos, modulo]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Creator Actions */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            Catálogo Oficial de Planes SaaS (Uso Integral de la Aplicación)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Como creador del sistema, puedes crear y gestionar planes. Todos los planes contemplan el acceso integral al 100% de las apps (Tablet Despacho, Chofer, Pasajeros, Admin).
          </p>
        </div>

        <button
          onClick={() => setShowCrearModal(true)}
          className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/25 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Plan</span>
        </button>
      </div>

      {/* Planes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {planes.map(plan => {
          const isPro = plan.id === 'plan-pro' || plan.id === 'plan_pro_unico';
          const isEnterprise = plan.id === 'plan-enterprise';
          const esPersonalizado = plan.id.startsWith('plan-') && plan.id !== 'plan-basico' && plan.id !== 'plan-pro' && plan.id !== 'plan-enterprise' && plan.id !== 'plan_pro_unico';

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 transition-all flex flex-col justify-between relative ${
                isPro
                  ? 'bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border-2 border-purple-500 shadow-2xl shadow-purple-950/50'
                  : 'bg-slate-900/90 border border-slate-800 shadow-lg'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                  Plan Más Popular
                </div>
              )}

              {esPersonalizado && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-[9px] uppercase tracking-wider">
                  Creado por Admin
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg text-slate-100 flex items-center gap-2">
                    {isEnterprise ? <Zap className="w-5 h-5 text-amber-400" /> : <Package className="w-5 h-5 text-purple-400" />}
                    Plan {plan.nombre}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-mono">
                      {plan.moneda}
                    </span>
                    <button
                      onClick={(e) => handleOpenEditarPlan(plan, e)}
                      title="Editar características y tarifas del plan"
                      className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 border border-purple-500/20 transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    {esPersonalizado && (
                      <button
                        onClick={(e) => handleEliminarPlan(plan.id, e)}
                        title="Eliminar plan personalizado"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-4xl font-extrabold text-white font-mono">
                    ${plan.precio_por_unidad}
                  </span>
                  <span className="text-xs text-slate-400">/ unidad / mes</span>
                </div>

                <div className="text-xs text-slate-300 pb-2 border-b border-slate-800 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Uso Integral de la App
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Módulos & Capacidades Incluidas (100%):
                  </div>
                  {plan.caracteristicas.map((caract, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{caract}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6">
                <div className="text-[11px] text-slate-400 text-center">
                  Ejemplo 20 unidades: <strong className="text-emerald-400 font-mono">${plan.precio_por_unidad * 20} USD/mes</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Billing Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Simulador de Facturación por Flota Conectada</h3>
            <p className="text-xs text-slate-400">Calcule el cobro estimado y configure proyecciones de ingresos según el tamaño de la cooperativa.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Número de Vehículos Activos:</span>
              <span className="font-mono text-purple-400 font-bold">{calcUnits} unidades</span>
            </label>
            <input
              type="range"
              min={5}
              max={150}
              step={1}
              value={calcUnits}
              onChange={e => setCalcUnits(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5 uds</span>
              <span>75 uds</span>
              <span>150 uds</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Seleccionar Plan:</label>
            <select
              value={calcPlan}
              onChange={e => setCalcPlan(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            >
              {planes.map(p => (
                <option key={p.id} value={p.id}>Plan {p.nombre} (${p.precio_por_unidad}/ud)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Descuento Especial (%):</label>
            <select
              value={calcDescuento}
              onChange={e => setCalcDescuento(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value={0}>Sin Descuento (0%)</option>
              <option value={10}>10% Convenio FENATAC</option>
              <option value={15}>15% Lanzamiento Provincial</option>
              <option value={20}>20% Afiliación Anual Anticipada</option>
              <option value={50}>50% Primer Mes de Gracia</option>
            </select>
          </div>
        </div>

        {/* Calculation Result Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Total Mensual Estimado:</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                ${totalConDescuento.toFixed(2)} USD
              </span>
              {calcDescuento > 0 && (
                <span className="text-xs text-slate-500 line-through font-mono">
                  ${baseTotal.toFixed(2)} USD
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Cálculo: {calcUnits} unidades × ${selectedPlan.precio_por_unidad}/ud
              {calcDescuento > 0 && ` - ${calcDescuento}% desc.`}
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="text-slate-400">Proyección Anual (12 meses):</div>
            <div className="font-mono font-bold text-sky-400 text-lg">
              ${(totalConDescuento * 12).toLocaleString('es-EC', { minimumFractionDigits: 2 })} USD
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Crear Nuevo Plan (Creador) */}
      {showCrearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Crear Nuevo Plan de Suscripción</h3>
                  <p className="text-xs text-slate-400">Los planes contemplan el uso integral de toda la suite de aplicaciones.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCrearModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoPlan} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Plan Integral Premium"
                  value={nuevoNombre}
                  onChange={e => setNuevoNombre(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Precio por Unidad (USD / mes) *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={0.5}
                      required
                      value={nuevoPrecio}
                      onChange={e => setNuevoPrecio(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Mínimo de Unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={nuevoUnidadesMin}
                    onChange={e => setNuevoUnidadesMin(parseInt(e.target.value) || 1)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Módulos de Uso Integral */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Módulos del Sistema (Uso Integral):</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">100% de Apps Habilitadas</span>
                </div>

                <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {[
                    'Uso integral de la aplicación (100% módulos activos)',
                    'Despacho Inteligente & Pantalla de Control Base (Tablet)',
                    'App Conductor con GPS Satelital, Turnos & Control de Cupo',
                    'App Pasajeros / Cliente con Solicitud de Rutas y Asignación',
                    'Monitoreo Satelital & Sistema de Alertas SOS con Sirena',
                    'Portal Administrativo de Cooperativa, Socios & Flota',
                    'Facturación y Conciliación Mensual Automatizada'
                  ].map((modulo, idx) => {
                    const isChecked = modulosSeleccionados.includes(modulo);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleModulo(modulo)}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors"
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-slate-300 text-[11px]">{modulo}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCrearModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar & Publicar Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Plan Existente */}
      {planParaEditar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Actualizar Plan: {planParaEditar.nombre}</h3>
                  <p className="text-xs text-slate-400">Modifica precios, condiciones y capacidades del catálogo SaaS.</p>
                </div>
              </div>
              <button 
                onClick={() => setPlanParaEditar(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionPlan} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Precio por Unidad (USD/mes) *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={0.5}
                      required
                      value={editPrecio}
                      onChange={e => setEditPrecio(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Mínimo de Unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={editUnidadesMin}
                    onChange={e => setEditUnidadesMin(parseInt(e.target.value) || 1)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Módulos de Uso Integral */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Módulos del Sistema:</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Uso Integral 100%</span>
                </div>

                <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                  {[
                    'Uso integral de la aplicación (100% módulos activos)',
                    'Despacho Inteligente & Pantalla de Control Base (Tablet)',
                    'App Conductor con GPS Satelital, Turnos & Control de Cupo',
                    'App Pasajeros / Cliente con Solicitud de Rutas y Asignación',
                    'Monitoreo Satelital & Sistema de Alertas SOS con Sirena',
                    'Portal Administrativo de Cooperativa, Socios & Flota',
                    'Facturación y Conciliación Mensual Automatizada'
                  ].map((modulo, idx) => {
                    const isChecked = editModulos.includes(modulo);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleEditModulo(modulo)}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors"
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-slate-300 text-[11px]">{modulo}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlanParaEditar(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios del Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
