import React from 'react';
import { MetricasGlobales, SuscripcionCooperativa, Cooperativa, PlanSuscripcion } from '../../types';
import { 
  DollarSign, 
  Building2, 
  Car, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Receipt, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  CreditCard,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface Props {
  metricas: MetricasGlobales;
  suscripciones: SuscripcionCooperativa[];
  cooperativas: Cooperativa[];
  planes: PlanSuscripcion[];
  onSelectTab: (tab: any) => void;
  onSelectCoop: (coopId: string) => void;
  onEjecutarBloqueo: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const SuperAdminDashboardTab: React.FC<Props> = ({
  metricas,
  suscripciones,
  cooperativas,
  planes,
  onSelectTab,
  onSelectCoop,
  onEjecutarBloqueo,
  onExportPDF,
  onExportExcel
}) => {
  const getCoopName = (id: string) => cooperativas.find(c => c.id === id)?.nombre || id;

  const coopsEnRiesgo = suscripciones.filter(s => 
    s.estado_suscripcion === 'por_vencer' || 
    s.estado_suscripcion === 'vencida' || 
    s.estado_suscripcion === 'bloqueo_parcial' || 
    s.estado_suscripcion === 'bloqueada'
  );

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Visión Global de Facturación Multi-Cooperativa</h2>
            <p className="text-xs text-slate-400">Recálculo automático de cuotas mensuales por volumen de unidades activas en tiempo real.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onEjecutarBloqueo}
            title="Evalúa plazos de vencimiento y actualiza estados de gracia y bloqueo progresivo"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Ejecutar Cron Bloqueos</span>
          </button>
          <button
            onClick={onExportPDF}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Reporte PDF</span>
          </button>
          <button
            onClick={onExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">MRR Recurrente (USD)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-3 font-mono">
            ${metricas.mrr_actual.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="flex items-center text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{metricas.variacion_mrr_pct}%
            </span>
            <span className="text-slate-400">vs mes anterior ($2,200)</span>
          </div>
        </div>

        {/* Cooperativas Activas */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Cooperativas Activas</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3 font-mono">
            {metricas.cooperativas_activas}
            <span className="text-xs font-normal text-slate-400 ml-2">/ {metricas.total_cooperativas} total</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>+{metricas.cooperativas_nuevas_mes} nuevas este mes</span>
            <span className="text-sky-400 font-medium cursor-pointer hover:underline" onClick={() => onSelectTab('cooperativas')}>Ver todas →</span>
          </div>
        </div>

        {/* Unidades Totales Conectadas */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Unidades en Plataforma</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-3 font-mono">
            {metricas.unidades_activas}
            <span className="text-xs font-normal text-slate-400 ml-2">activas</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            <span>Tarificación dinámica calculada por unidad</span>
          </div>
        </div>

        {/* Cuentas Por Cobrar / Morosidad */}
        <div className="bg-slate-900/90 border border-rose-900/40 p-5 rounded-2xl shadow-lg bg-gradient-to-br from-slate-900 to-rose-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Por Cobrar / Mora</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 mt-3 font-mono">
            ${metricas.total_por_cobrar.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-300 mt-2 flex items-center justify-between">
            <span>{metricas.cooperativas_morosas} coop(s) en mora</span>
            {metricas.comprobantes_pendientes_revision > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {metricas.comprobantes_pendientes_revision} por revisar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Proyección & Top Cooperativas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Cooperativas por Flota y Facturación */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Top Cooperativas por Flota y Facturación Mensual</h3>
            </div>
            <button
              onClick={() => onSelectTab('cooperativas')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              Gestionar todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {metricas.top_cooperativas_por_unidades.map((item, idx) => {
              const susc = suscripciones.find(s => s.cooperativaId === item.cooperativaId);
              const maxUnits = Math.max(...metricas.top_cooperativas_por_unidades.map(u => u.unidades), 1);
              const pct = (item.unidades / maxUnits) * 100;

              return (
                <div
                  key={item.cooperativaId}
                  onClick={() => onSelectCoop(item.cooperativaId)}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center font-mono group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-200 text-xs group-hover:text-purple-300 transition-colors">
                          {item.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Plan {item.plan}</span>
                          <span>•</span>
                          <span>{item.unidades} unidades activas</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        ${item.monto_mensual.toFixed(2)} /mes
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {susc?.estado_suscripcion === 'activa' ? (
                          <span className="text-emerald-400 font-medium">Al día</span>
                        ) : susc?.estado_suscripcion === 'bloqueo_parcial' ? (
                          <span className="text-amber-400 font-medium">Bloqueo Parcial</span>
                        ) : (
                          <span className="text-rose-400 font-medium">{susc?.estado_suscripcion || 'Al día'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Proyección y Alertas de Cobranza */}
        <div className="space-y-4">
          {/* Proyección Trimestral */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Proyección Trimestral MRR</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Próx. Mes</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1 font-mono">
                  ${metricas.proyeccion_proximos_3_meses[0]?.toLocaleString('es-EC')}
                </div>
                <div className="text-[10px] text-emerald-400/80">+5% est.</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">En 2 Meses</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1 font-mono">
                  ${metricas.proyeccion_proximos_3_meses[1]?.toLocaleString('es-EC')}
                </div>
                <div className="text-[10px] text-emerald-400/80">+12% est.</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">En 3 Meses</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1 font-mono">
                  ${metricas.proyeccion_proximos_3_meses[2]?.toLocaleString('es-EC')}
                </div>
                <div className="text-[10px] text-emerald-400/80">+20% est.</div>
              </div>
            </div>
          </div>

          {/* Estado de Morosidad y Acciones Rápidas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Alertas de Suscripción ({coopsEnRiesgo.length})</h3>
              </div>
              <button
                onClick={() => onSelectTab('comprobantes')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Ver Recibos
              </button>
            </div>

            {coopsEnRiesgo.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-300 font-medium">
                ✅ Todas las cooperativas se encuentran al día con sus pagos.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {coopsEnRiesgo.map(susc => (
                  <div
                    key={susc.id}
                    onClick={() => onSelectCoop(susc.cooperativaId)}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{getCoopName(susc.cooperativaId)}</div>
                      <div className="text-[11px] text-slate-400">
                        Vence: {new Date(susc.fecha_vencimiento).toLocaleDateString('es-EC')} • {susc.dias_mora} días mora
                      </div>
                    </div>
                    <div>
                      {susc.estado_suscripcion === 'por_vencer' ? (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          Por Vencer
                        </span>
                      ) : susc.estado_suscripcion === 'bloqueo_parcial' ? (
                        <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                          Bloqueo Parcial
                        </span>
                      ) : susc.estado_suscripcion === 'bloqueada' ? (
                        <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                          Bloqueo Total
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                          Vencida
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
