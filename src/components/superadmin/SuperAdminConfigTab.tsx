import React, { useState } from 'react';
import { ConfiguracionSuperAdmin } from '../../types';
import { 
  Settings, 
  Save, 
  Clock, 
  CreditCard, 
  MessageSquare, 
  ShieldAlert, 
  Building, 
  Phone, 
  Mail, 
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Props {
  config: ConfiguracionSuperAdmin;
  onGuardarConfig: (config: Partial<ConfiguracionSuperAdmin>) => void;
}

export const SuperAdminConfigTab: React.FC<Props> = ({ config, onGuardarConfig }) => {
  const [formData, setFormData] = useState<ConfiguracionSuperAdmin>({ ...config });
  const [guardado, setGuardado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardarConfig(formData);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            Parámetros Globales de Cobranza & Mensajería WhatsApp
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuración de umbrales del protocolo de bloqueo progresivo y datos bancarios oficiales.
          </p>
        </div>

        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 self-start sm:self-auto"
        >
          {guardado ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{guardado ? 'Configuración Guardada' : 'Guardar Parámetros'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloqueo Progresivo Thresholds */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Escala de Bloqueo Progresivo Automático</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="text-slate-300 font-semibold">Bloqueo Automático Activo:</label>
              <input
                type="checkbox"
                checked={formData.bloqueo_automatico_activo}
                onChange={e => setFormData({ ...formData, bloqueo_automatico_activo: e.target.checked })}
                className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Días de Gracia Iniciales tras Vencimiento (Día 0):</label>
              <input
                type="number"
                min={0}
                max={15}
                value={formData.dias_gracia_inicial}
                onChange={e => setFormData({ ...formData, dias_gracia_inicial: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <p className="text-[11px] text-slate-400">Plazo inicial con servicio 100% activo antes de iniciar restricciones.</p>
            </div>

            <div className="space-y-1">
              <label className="text-amber-400 font-semibold block">Umbral Bloqueo Parcial (Día +3):</label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.dias_para_bloqueo_parcial}
                onChange={e => setFormData({ ...formData, dias_para_bloqueo_parcial: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <p className="text-[11px] text-slate-400">Suspende el despacho de turnos en tabletas. El GPS y tracking siguen activos.</p>
            </div>

            <div className="space-y-1">
              <label className="text-rose-400 font-semibold block">Umbral Bloqueo Total (Día +5):</label>
              <input
                type="number"
                min={1}
                max={60}
                value={formData.dias_para_bloqueo_total}
                onChange={e => setFormData({ ...formData, dias_para_bloqueo_total: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <p className="text-[11px] text-slate-400">Suspende todo acceso operativo excepto el login del Admin Coop para subir recibos.</p>
            </div>
          </div>
        </div>

        {/* Cuentas Bancarias de Recaudación */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Cuentas Bancarias Oficiales para Cobranza</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Cuenta Principal (Aparece en WhatsApp):</label>
              <input
                type="text"
                value={formData.cuenta_banco_principal}
                onChange={e => setFormData({ ...formData, cuenta_banco_principal: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Cuenta Secundaria / Alternativa:</label>
              <input
                type="text"
                value={formData.cuenta_banco_secundaria}
                onChange={e => setFormData({ ...formData, cuenta_banco_secundaria: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Teléfono de Soporte WhatsApp:</label>
              <input
                type="text"
                value={formData.telefono_contacto_cobranza}
                onChange={e => setFormData({ ...formData, telefono_contacto_cobranza: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Email de Facturación Electrónica:</label>
              <input
                type="email"
                value={formData.email_notificaciones_cobranza}
                onChange={e => setFormData({ ...formData, email_notificaciones_cobranza: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Plantillas de WhatsApp (Ancho completo) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Plantillas de Notificación WhatsApp Automatizadas</h3>
            </div>
            <div className="text-[11px] text-slate-400">
              Variables disponibles: <code className="text-purple-400">{'{presidente}'}</code>, <code className="text-purple-400">{'{nombre}'}</code>, <code className="text-purple-400">{'{monto}'}</code>, <code className="text-purple-400">{'{fecha_venc}'}</code>, <code className="text-purple-400">{'{cuenta}'}</code>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-amber-400 font-bold block">1. Plantilla Por Vencer (3 días antes):</label>
              <textarea
                rows={4}
                value={formData.plantilla_por_vencer}
                onChange={e => setFormData({ ...formData, plantilla_por_vencer: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-orange-400 font-bold block">2. Plantilla Vencida (Día 0):</label>
              <textarea
                rows={4}
                value={formData.plantilla_vencida}
                onChange={e => setFormData({ ...formData, plantilla_vencida: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-rose-400 font-bold block">3. Plantilla Bloqueo Parcial Despacho (Día +3):</label>
              <textarea
                rows={4}
                value={formData.plantilla_bloqueo_parcial}
                onChange={e => setFormData({ ...formData, plantilla_bloqueo_parcial: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-red-500 font-bold block">4. Plantilla Bloqueo Total (Día +5):</label>
              <textarea
                rows={4}
                value={formData.plantilla_bloqueo_total}
                onChange={e => setFormData({ ...formData, plantilla_bloqueo_total: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
