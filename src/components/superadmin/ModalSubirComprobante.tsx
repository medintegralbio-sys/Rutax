import React, { useState } from 'react';
import { 
  Receipt, 
  X, 
  Upload, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Building2, 
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface Props {
  cooperativaId: string;
  cooperativaNombre: string;
  montoSugerido: number;
  cuentaDestino: string;
  onClose: () => void;
  onSubmit: (datos: {
    monto: number;
    metodo: 'transferencia' | 'efectivo' | 'deposito';
    banco: 'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros';
    numero_operacion: string;
    fecha_operacion: string;
    cuenta_destino: string;
    comprobante_url: string;
    comprobante_nombre: string;
    periodo_desde: string;
    periodo_hasta: string;
    subido_por: string;
  }) => void;
}

export const ModalSubirComprobante: React.FC<Props> = ({
  cooperativaId,
  cooperativaNombre,
  montoSugerido,
  cuentaDestino,
  onClose,
  onSubmit
}) => {
  const [monto, setMonto] = useState<number>(montoSugerido || 150);
  const [metodo, setMetodo] = useState<'transferencia' | 'efectivo' | 'deposito'>('transferencia');
  const [banco, setBanco] = useState<'Pichincha' | 'Guayaquil' | 'Produbanco' | 'Otros'>('Pichincha');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [fechaOperacion, setFechaOperacion] = useState(new Date().toISOString().split('T')[0]);
  const [comprobanteUrl, setComprobanteUrl] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80');
  const [comprobanteNombre, setComprobanteNombre] = useState('voucher_deposito.jpg');
  const [subidoPor, setSubidoPor] = useState('Admin Cooperativa');

  // Fechas del periodo
  const hoy = new Date();
  const desde = hoy.toISOString().split('T')[0];
  const hastaDate = new Date();
  hastaDate.setDate(hastaDate.getDate() + 30);
  const hasta = hastaDate.toISOString().split('T')[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setComprobanteNombre(file.name);
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setComprobanteUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroOperacion.trim()) return;

    onSubmit({
      monto: Number(monto),
      metodo,
      banco,
      numero_operacion: numeroOperacion.trim(),
      fecha_operacion: fechaOperacion,
      cuenta_destino: cuentaDestino || 'Banco Pichincha Cta. Cte. #2100489104',
      comprobante_url: comprobanteUrl,
      comprobante_nombre: comprobanteNombre,
      periodo_desde: desde,
      periodo_hasta: hasta,
      subido_por: subidoPor
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              Subir Comprobante de Pago de Suscripción
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {cooperativaNombre}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-200">
          {/* Cuentas Receptores Info */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-[11px] text-slate-300">
            <span className="font-bold text-purple-300 block mb-1">Cuentas Oficiales RUTAX-SMART SaaS:</span>
            <div>• {cuentaDestino || 'Banco Pichincha Cta. Cte. #2100489104 (RUTAX SMART S.A.S - RUC 0993821094001)'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Monto Pagado ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={monto}
                onChange={e => setMonto(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Método de Pago</label>
              <select
                value={metodo}
                onChange={e => setMetodo(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="deposito">Depósito en Ventanilla / Corresponsal</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Banco Emisor / Canal *</label>
              <select
                value={banco}
                onChange={e => setBanco(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="Pichincha">Banco Pichincha / Mi Vecino</option>
                <option value="Guayaquil">Banco Guayaquil / Banco del Barrio</option>
                <option value="Produbanco">Produbanco</option>
                <option value="Otros">Otro Banco / Cooperativa / Caja</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold"># Comprobante / Operación *</label>
              <input
                type="text"
                required
                placeholder="Ej: 839201948"
                value={numeroOperacion}
                onChange={e => setNumeroOperacion(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Fecha de Transacción</label>
              <input
                type="date"
                value={fechaOperacion}
                onChange={e => setFechaOperacion(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Nombre de quien reporta</label>
              <input
                type="text"
                value={subidoPor}
                onChange={e => setSubidoPor(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          {/* Subir archivo de imagen/PDF */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Adjuntar Foto / Captura del Recibo:</span>
              <span className="text-[10px] text-slate-400 font-mono">{comprobanteNombre}</span>
            </label>

            <div className="border-2 border-dashed border-slate-800 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-950/60 relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <Upload className="w-6 h-6 text-purple-400" />
                <span className="text-xs font-medium text-slate-200">
                  Arrastra tu comprobante o haz clic para seleccionarlo
                </span>
                <span className="text-[10px] text-slate-500">JPG, PNG o PDF (máx. 5MB)</span>
              </div>
            </div>

            {comprobanteUrl && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Archivo preparado para conciliación</span>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enviar Comprobante a Revisión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
