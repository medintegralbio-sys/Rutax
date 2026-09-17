import React, { useState } from 'react';
import { PlanSuscripcion } from '../../types';
import { rutaxStore } from '../../services/store';
import { 
  Building2, 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Upload,
  Image as ImageIcon,
  DollarSign,
  Car,
  AlertCircle
} from 'lucide-react';

interface Props {
  planes?: PlanSuscripcion[];
  onClose: () => void;
  onSubmit: (datos: {
    nombre: string;
    ruc: string;
    direccion: string;
    logo_url?: string;
    presidente_nombre: string;
    presidente_cedula: string;
    presidente_celular: string;
    presidente_email: string;
    plan_id?: string;
    unidades_estimadas?: number;
    rutas_iniciales?: Array<{ nombre: string; tarifa_plana: number }>;
  }) => void;
}

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=200&q=80'
];

export const ModalNuevaCooperativa: React.FC<Props> = ({ planes = [], onClose, onSubmit }) => {
  const availablePlanes = planes.length > 0 ? planes : (rutaxStore.planes || []);
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [logoUrl, setLogoUrl] = useState(PRESET_LOGOS[0]);
  const [presidenteNombre, setPresidenteNombre] = useState('');
  const [presidenteCedula, setPresidenteCedula] = useState('');
  const [presidenteCelular, setPresidenteCelular] = useState('09');
  const [presidenteEmail, setPresidenteEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(availablePlanes[0]?.id || 'plan_pro_unico');
  const [unidadesEstimadas, setUnidadesEstimadas] = useState<number>(10);
  const [rutaNombre] = useState('Ruta Troncal Principal');
  const [tarifaRuta] = useState<number>(0.50);

  const selectedPlan = availablePlanes.find(p => p.id === selectedPlanId) || availablePlanes[0];
  const precioUnitario = selectedPlan?.precio_por_unidad || 15;
  const montoMensualEstimado = Math.max(0, unidadesEstimadas * precioUnitario);

  // Manejador de subida de archivo para el Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !ruc.trim() || !presidenteNombre.trim()) return;

    onSubmit({
      nombre: nombre.trim(),
      ruc: ruc.trim(),
      direccion: direccion.trim() || 'Terminal Terrestre Central',
      logo_url: logoUrl,
      presidente_nombre: presidenteNombre.trim(),
      presidente_cedula: presidenteCedula.trim() || '0900000000',
      presidente_celular: presidenteCelular.trim() || '0990000000',
      presidente_email: presidenteEmail.trim() || `admin@${nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.ec`,
      plan_id: selectedPlanId,
      unidades_estimadas: Number(unidadesEstimadas) || 0,
      rutas_iniciales: [{ nombre: rutaNombre, tarifa_plana: tarifaRuta }]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Alta de Nueva Cooperativa de Transporte
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingresa los datos institucionales, logo corporativo y la directiva principal.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-200">
          {/* Datos Institucionales */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <Building2 className="w-4 h-4" /> 1. Datos Institucionales & Logo
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre de la Cooperativa / Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cooperativa Daule Express"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">RUC (13 dígitos) *</label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  placeholder="0992384729001"
                  value={ruc}
                  onChange={e => setRuc(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-300 font-semibold">Dirección Principal / Terminal</label>
                <input
                  type="text"
                  placeholder="Av. Principal y Terminal Terrestre"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Subida e Insignia del Logo */}
              <div className="sm:col-span-2 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <label className="text-slate-200 font-bold flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Logo de la Cooperativa
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview box */}
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-emerald-500/30 bg-slate-900 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-md">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Prev" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen (Logo)</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload} 
                          className="hidden" 
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">PNG, JPG, WEBP o SVG</span>
                    </div>

                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="O ingresa la URL de la imagen..."
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400">Predefinidos:</span>
                      {PRESET_LOGOS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrl(url)}
                          className={`w-6 h-6 rounded-md overflow-hidden border transition-all ${logoUrl === url ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-105' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos del Presidente / Admin */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <User className="w-4 h-4" /> 2. Directiva & Contacto Principal (Admin Coop)
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Nombre Completo del Presidente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ing. Carlos Mendoza"
                  value={presidenteNombre}
                  onChange={e => setPresidenteNombre(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Cédula de Identidad</label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={presidenteCedula}
                  onChange={e => setPresidenteCedula(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Celular WhatsApp (Cobranzas) *</label>
                <input
                  type="text"
                  required
                  placeholder="0994821102"
                  value={presidenteCelular}
                  onChange={e => setPresidenteCelular(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="presidente@cooperativa.ec"
                  value={presidenteEmail}
                  onChange={e => setPresidenteEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Selección del Plan de Pagos SaaS & Flota */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> 3. Plan de Suscripción & Pagos (Uso Integral)
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                100% Módulos Incluidos
              </span>
            </div>

            {/* Listado de Planes Disponibles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availablePlanes.map(p => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-white'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white">{p.nombre}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="mt-1 text-base font-extrabold text-emerald-400 font-mono">
                        ${p.precio_por_unidad} <span className="text-[10px] text-slate-400 font-normal">USD/ud/mes</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {p.caracteristicas?.[0] || 'Uso integral de la aplicación'}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 text-[9px] text-emerald-300 font-medium">
                      ✓ Despacho, Chofer & Admin
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Configuración de Flota Estimada y Simulación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-400" />
                  Unidades Estimadas Iniciales
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={unidadesEstimadas}
                  onChange={e => setUnidadesEstimadas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  La cooperativa registrará sus vehículos de forma autónoma desde su panel.
                </p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-center">
                <div className="text-[10px] text-slate-400">Total Mensual Estimado:</div>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  ${montoMensualEstimado.toFixed(2)} USD
                </div>
                <div className="text-[10px] text-slate-400">
                  ({unidadesEstimadas} unidades × ${precioUnitario} USD/ud en {selectedPlan?.nombre})
                </div>
              </div>
            </div>
          </div>

          {/* Información de Cobro Dinámico por Vehículo Ingresado */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Facturación Dinámica Basada en Unidades Ingresadas</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              La cooperativa se encarga de ingresar los vehículos. Las facturas mensuales se generarán 5 días antes de finalizar el mes con base en las unidades activas registradas a su nombre.
            </p>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar & Habilitar Cooperativa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
