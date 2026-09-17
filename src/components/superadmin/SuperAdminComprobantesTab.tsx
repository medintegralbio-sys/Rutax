import React, { useState } from 'react';
import { ComprobantePago, Cooperativa, SuscripcionCooperativa } from '../../types';
import { rutaxStore } from '../../services/store';
import { 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock, 
  Building2, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  ExternalLink,
  Search, 
  Filter, 
  AlertCircle, 
  FileCheck, 
  X,
  Car,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info
} from 'lucide-react';

interface Props {
  comprobantes: ComprobantePago[];
  cooperativas: Cooperativa[];
  suscripciones: SuscripcionCooperativa[];
  onRevisar: (comprobanteId: string, decision: 'aprobado' | 'rechazado', motivo?: string) => void;
  onOpenSubirComprobanteManual?: () => void;
}

export const SuperAdminComprobantesTab: React.FC<Props> = ({
  comprobantes,
  cooperativas,
  suscripciones,
  onRevisar,
  onOpenSubirComprobanteManual
}) => {
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewComprobante, setPreviewComprobante] = useState<ComprobantePago | null>(null);
  const [rejectModal, setRejectModal] = useState<ComprobantePago | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('Comprobante ilegible o no coincide con cuenta bancaria receptora');
  const [expandedVehiculosId, setExpandedVehiculosId] = useState<string | null>(null);
  const [generandoAuto, setGenerandoAuto] = useState(false);
  const [msgGeneracion, setMsgGeneracion] = useState<string | null>(null);

  const getCoop = (coopId: string) => cooperativas.find(c => c.id === coopId);

  const handleEjecutarGeneracionAnticipada = () => {
    setGenerandoAuto(true);
    try {
      const res = rutaxStore.generarComprobantesMensualesCincoDiasAntes(true);
      setMsgGeneracion(`✅ Proceso ejecutado: ${res.generados} facturas generadas por un total de $${res.totalFacturado} USD para ${res.coopsActualizadas} cooperativas con base en sus vehículos registrados.`);
      setTimeout(() => setMsgGeneracion(null), 6000);
    } catch (err: any) {
      setMsgGeneracion(`Error al generar comprobantes: ${err.message}`);
    } finally {
      setGenerandoAuto(false);
    }
  };

  const filtrados = comprobantes.filter(c => {
    const coop = getCoop(c.cooperativaId);
    const matchSearch = 
      c.numero_operacion.includes(searchTerm) ||
      c.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coop?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filterEstado === 'todos' ? true : c.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const handleAprobar = (c: ComprobantePago) => {
    onRevisar(c.id, 'aprobado');
    if (previewComprobante?.id === c.id) setPreviewComprobante(null);
  };

  const handleConfirmarRechazo = () => {
    if (!rejectModal) return;
    onRevisar(rejectModal.id, 'rechazado', motivoRechazo);
    setRejectModal(null);
    if (previewComprobante?.id === rejectModal.id) setPreviewComprobante(null);
  };

  const pendientesCount = comprobantes.filter(c => c.estado === 'pendiente_revision').length;

  return (
    <div className="space-y-5">
      {/* Protocolo de Facturación 5 Días Antes de Fin de Mes Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-100">
              Facturación Anticipada Automática (5 Días Antes de Fin de Mes)
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              Activo
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            El sistema genera automáticamente el comprobante de cobro <strong>5 días antes de terminar el mes</strong> computando todas las unidades registradas e ingresadas por la cooperativa. La cooperativa dispone de los <strong>primeros 6 días del mes</strong> para registrar el pago antes de que opere el bloqueo automático.
          </p>
          {msgGeneracion && (
            <div className="text-xs text-emerald-300 font-semibold bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl animate-in fade-in">
              {msgGeneracion}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={handleEjecutarGeneracionAnticipada}
            disabled={generandoAuto}
            className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generandoAuto ? 'animate-spin' : ''}`} />
            <span>Generar Comprobantes Mes (5 Días Antes)</span>
          </button>
        </div>
      </div>

      {/* Header and Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-400" />
            Bandeja de Comprobantes de Pago & Conciliación ({comprobantes.length})
            {pendientesCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                {pendientesCount} Pendientes
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aprobación en un clic: renueva la suscripción por 30 días adicionales y desbloquea el servicio automáticamente.
          </p>
        </div>

        {onOpenSubirComprobanteManual && (
          <button
            onClick={onOpenSubirComprobanteManual}
            className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Registrar Pago Manual</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por # operación, banco o cooperativa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="todos">Todos los Comprobantes</option>
            <option value="pendiente_revision">🟡 Pendientes de Revisión ({pendientesCount})</option>
            <option value="aprobado">🟢 Aprobados</option>
            <option value="rechazado">🔴 Rechazados</option>
          </select>
        </div>
      </div>

      {/* Grid of Receipts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
            No hay comprobantes para mostrar en esta vista.
          </div>
        ) : (
          filtrados.map(c => {
            const coop = getCoop(c.cooperativaId);
            const vehiculosCoop = rutaxStore.vehiculos.filter(v => v.cooperativaId === c.cooperativaId && v.estado !== 'inactivo');
            const unidadesDetalle = c.unidades_detalle && c.unidades_detalle.length > 0 
              ? c.unidades_detalle 
              : vehiculosCoop.map(v => {
                  const socioUser = rutaxStore.usuarios.find(u => u.uid === v.socio_id);
                  return {
                    id: v.id,
                    numero_unidad: v.numero_unidad,
                    placa: v.placa,
                    marca_modelo: v.modelo || 'Hino GH',
                    fecha_ingreso: v.fecha_registro || 'Registrado por cooperativa',
                    socio: socioUser?.nombre_completo || 'Socio Cooperativa'
                  };
                });

            const isVehiculosExpanded = expandedVehiculosId === c.id;

            return (
              <div
                key={c.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between ${
                  c.estado === 'pendiente_revision'
                    ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 to-amber-950/10'
                    : c.estado === 'aprobado'
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                <div>
                  {/* Top Card Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{coop?.nombre || c.cooperativaId}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Subido: {new Date(c.fecha_subida).toLocaleString('es-EC')}
                      </div>
                    </div>

                    <div>
                      {c.estado === 'pendiente_revision' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      ) : c.estado === 'aprobado' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <XCircle className="w-3 h-3" /> Rechazado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Receipt Details Box */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monto Facturado:</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        ${c.monto.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Banco / Canal:</span>
                      <span className="text-slate-200 font-semibold">{c.banco} ({c.metodo})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400"># Operación / Factura:</span>
                      <span className="font-mono font-bold text-sky-400">{c.numero_operacion}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fecha de Emisión:</span>
                      <span className="text-slate-300 font-mono">{c.fecha_operacion}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Periodo Cubierto:</span>
                      <span className="text-purple-300 font-mono">{c.periodo_desde} al {c.periodo_hasta}</span>
                    </div>

                    {/* Unidades Ingresadas por la Cooperativa */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setExpandedVehiculosId(isVehiculosExpanded ? null : c.id)}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-sky-400" />
                          <span>Unidades ingresadas por la coop:</span>
                          <strong className="text-emerald-400 font-mono">({unidadesDetalle.length})</strong>
                        </div>
                        {isVehiculosExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isVehiculosExpanded && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {unidadesDetalle.length === 0 ? (
                            <div className="text-[10px] text-slate-500 py-1 italic">
                              No hay vehículos ingresados aún por esta cooperativa.
                            </div>
                          ) : (
                            unidadesDetalle.map((u, uIdx) => (
                              <div key={uIdx} className="p-1.5 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sky-400 font-mono">#{u.numero_unidad}</span>
                                  <span className="text-slate-400 font-mono">{u.placa}</span>
                                  <span className="text-slate-300">({u.marca_modelo || 'Hino'})</span>
                                </div>
                                <span className="text-emerald-400 font-mono font-semibold">$15.00/mes</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {c.motivo_rechazo && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] mt-1">
                        <strong>Motivo Rechazo:</strong> {c.motivo_rechazo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setPreviewComprobante(c)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ver Recibo / Voucher</span>
                  </button>

                  {c.estado === 'pendiente_revision' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAprobar(c)}
                        className="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprobar (+30d)</span>
                      </button>
                      <button
                        onClick={() => setRejectModal(c)}
                        className="h-10 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Preview Comprobante */}
      {previewComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  Comprobante #{previewComprobante.id} • {getCoop(previewComprobante.cooperativaId)?.nombre}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {previewComprobante.banco} • Op: {previewComprobante.numero_operacion} • ${previewComprobante.monto} USD
                </p>
              </div>
              <button
                onClick={() => setPreviewComprobante(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[450px]">
                <img
                  src={previewComprobante.comprobante_url}
                  alt="Voucher de depósito"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[420px] object-contain rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Cuenta Receptora:</span>
                  <span className="text-slate-200 font-mono font-semibold">{previewComprobante.cuenta_destino}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Subido por:</span>
                  <span className="text-slate-200">{previewComprobante.subido_por}</span>
                </div>
              </div>
            </div>

            {previewComprobante.estado === 'pendiente_revision' && (
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
                <button
                  onClick={() => setRejectModal(previewComprobante)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button
                  onClick={() => handleAprobar(previewComprobante)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aprobar Pago (+30 días)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Rechazo con Motivo */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Rechazar Comprobante de Pago
              </h3>
              <button onClick={() => setRejectModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Indique el motivo por el cual se rechaza el comprobante. El administrador de la cooperativa recibirá este mensaje para corregir el envío:
            </p>

            <textarea
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              placeholder="Ej: Número de operación no encontrado en estado de cuenta bancario..."
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazo}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
