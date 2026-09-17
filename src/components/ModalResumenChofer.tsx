import React, { useState } from 'react';
import {
  Usuario,
  Vehiculo,
  LiquidacionViaje,
  GastoTurno,
  ArqueoTurnoChofer
} from '../types';
import { rutaxStore } from '../services/store';
import {
  formatUSD,
  generarTextoWhatsAppArqueo,
  CONFIG_FINANCIERA_DEFAULT
} from '../services/financialServices';
import {
  X,
  Receipt,
  Fuel,
  DollarSign,
  Users,
  CheckCircle2,
  Share2,
  Plus,
  Trash2,
  Building2,
  CreditCard,
  Banknote,
  ShieldCheck,
  QrCode
} from 'lucide-react';

interface ModalResumenChoferProps {
  currentUser: Usuario;
  vehiculo: Vehiculo | null;
  onClose: () => void;
}

export const ModalResumenChofer: React.FC<ModalResumenChoferProps> = ({
  currentUser,
  vehiculo,
  onClose
}) => {
  const hoyStr = new Date().toISOString().split('T')[0];
  
  // Obtener liquidaciones de hoy para este chofer y vehículo
  const liquidaciones = rutaxStore.getLiquidacionesViajes().filter(
    l => l.chofer_id === currentUser.uid && l.fecha === hoyStr
  );

  // Gastos registrados hoy
  const [gastos, setGastos] = useState<GastoTurno[]>(() => 
    rutaxStore.getGastosTurno().filter(g => g.chofer_id === currentUser.uid && g.fecha === hoyStr)
  );

  // Estado para nuevo gasto
  const [showAddGasto, setShowAddGasto] = useState(false);
  const [tipoGasto, setTipoGasto] = useState<GastoTurno['tipo']>('combustible');
  const [descGasto, setDescGasto] = useState('');
  const [montoGasto, setMontoGasto] = useState('');

  // Estado de arqueo guardado
  const [arqueoGuardado, setArqueoGuardado] = useState<ArqueoTurnoChofer | null>(null);

  // Totales acumulados
  const totalCarreras = liquidaciones.length;
  const totalPasajeros = liquidaciones.reduce((sum, l) => sum + l.pasajeros_totales, 0);
  const totalRecaudacionBruta = liquidaciones.reduce((sum, l) => sum + l.recaudacion_bruta, 0);
  const totalEfectivo = liquidaciones.reduce((sum, l) => sum + l.monto_efectivo, 0);
  const totalDigital = liquidaciones.reduce((sum, l) => sum + l.monto_digital, 0);
  const totalCuotasCoop = liquidaciones.reduce((sum, l) => sum + l.cuota_administracion_coop, 0);
  const totalFondoAuxilio = liquidaciones.reduce((sum, l) => sum + l.fondo_auxilio_social, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  // Comisión Chofer acumulada (30% por defecto o según liquidaciones)
  const comisionChofer = liquidaciones.reduce((sum, l) => sum + l.pago_chofer_estimado, 0);

  // Saldo Neto en Efectivo que debe entregar físicamente al socio
  // (Total Efectivo recaudado - Gastos pagados de su bolsillo - Cuotas coop en efectivo - Comisión chofer retenida en efectivo)
  const saldoNetoEntregarSocio = Math.max(0, totalEfectivo - totalGastos - comisionChofer);

  const handleAgregarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoGasto);
    if (isNaN(monto) || monto <= 0) return;

    const nuevoGasto: GastoTurno = {
      id: 'gst-' + Date.now(),
      cooperativaId: currentUser.cooperativaId,
      vehiculo_id: vehiculo?.id || 'veh-1',
      chofer_id: currentUser.uid,
      tipo: tipoGasto,
      descripcion: descGasto || `Gasto de ${tipoGasto}`,
      monto,
      fecha: hoyStr,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      aprobado_por_socio: true
    };

    rutaxStore.registrarGastoTurno(nuevoGasto);
    setGastos(prev => [...prev, nuevoGasto]);
    setDescGasto('');
    setMontoGasto('');
    setShowAddGasto(false);
  };

  const handleEliminarGasto = (gastoId: string) => {
    rutaxStore.eliminarGastoTurno(gastoId);
    setGastos(prev => prev.filter(g => g.id !== gastoId));
  };

  const handleGenerarArqueo = () => {
    const arqueo: ArqueoTurnoChofer = {
      id: 'arq-' + Date.now(),
      cooperativaId: currentUser.cooperativaId,
      chofer_id: currentUser.uid,
      chofer_nombre: currentUser.nombre_completo,
      vehiculo_id: vehiculo?.id || 'veh-1',
      numero_unidad: vehiculo?.numero_unidad || '00',
      socio_id: vehiculo?.socio_id || 'usr-socio',
      fecha: hoyStr,
      hora_inicio: '06:00',
      hora_cierre: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total_carreras: totalCarreras,
      total_pasajeros: totalPasajeros,
      recaudacion_bruta: totalRecaudacionBruta,
      total_efectivo: totalEfectivo,
      total_digital: totalDigital,
      gastos,
      total_gastos: totalGastos,
      total_cuotas_coop: totalCuotasCoop,
      total_fondo_auxilio: totalFondoAuxilio,
      comision_chofer: comisionChofer,
      saldo_neto_entregar_socio: saldoNetoEntregarSocio,
      estado_entrega: 'pendiente',
      firma_digital_o_codigo: 'RX-' + Math.floor(1000 + Math.random() * 9000),
      notas: `Arqueo cerrado por chofer ${currentUser.nombre_completo}`
    };

    rutaxStore.guardarArqueoTurno(arqueo);
    setArqueoGuardado(arqueo);
  };

  const handleShareWhatsApp = (arq: ArqueoTurnoChofer) => {
    const text = generarTextoWhatsAppArqueo(arq);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100">Arqueo & Rendición Diaria</h2>
              <p className="text-xs text-slate-400">
                Chofer: {currentUser.nombre_completo} • Unidad #{vehiculo?.numero_unidad || '00'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!arqueoGuardado ? (
          <>
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">Vueltas Hoy</span>
                <span className="text-lg font-black text-slate-100 font-mono">{totalCarreras}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">Pasajeros</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{totalPasajeros}</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold block">Recaudado</span>
                <span className="text-lg font-black text-sky-400 font-mono">{formatUSD(totalRecaudacionBruta)}</span>
              </div>
            </div>

            {/* Cash Breakdown */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  Efectivo Físico Recaudado:
                </span>
                <span className="font-mono font-bold text-slate-100">{formatUSD(totalEfectivo)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  Pagos Digitales (DeUna/Transf):
                </span>
                <span className="font-mono font-bold text-sky-300">{formatUSD(totalDigital)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Aportes Coop ({totalCarreras} carreras):</span>
                <span className="font-mono text-rose-400">-{formatUSD(totalCuotasCoop + totalFondoAuxilio)}</span>
              </div>
            </div>

            {/* Expenses List & Add Gasto Form */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  Gastos de Ruta / Combustible ({formatUSD(totalGastos)})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddGasto(!showAddGasto)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddGasto ? 'Cancelar' : 'Agregar Gasto'}</span>
                </button>
              </div>

              {showAddGasto && (
                <form onSubmit={handleAgregarGasto} className="bg-slate-900 p-3 rounded-xl border border-slate-700/80 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={tipoGasto}
                      onChange={(e) => setTipoGasto(e.target.value as GastoTurno['tipo'])}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="combustible">⛽ Combustible</option>
                      <option value="peaje">🛣️ Peaje</option>
                      <option value="lavado">🚿 Lavado de Auto</option>
                      <option value="llanta_pinchada">🛞 Ponchera / Llanta</option>
                      <option value="alimentacion">🍲 Alimentación</option>
                      <option value="otro">📦 Otro</option>
                    </select>

                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      required
                      placeholder="Monto ($)"
                      value={montoGasto}
                      onChange={(e) => setMontoGasto(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-amber-300"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Descripción o comprobante (ej: Gasolinera Sauces)"
                    value={descGasto}
                    onChange={(e) => setDescGasto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  />

                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Guardar Comprobante de Gasto
                  </button>
                </form>
              )}

              {gastos.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-1">
                  Sin gastos registrados en este turno.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {gastos.map(g => (
                    <div key={g.id} className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-xl text-xs border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-200">{g.descripcion}</span>
                        <span className="text-[10px] text-slate-500 block">{g.hora} • {g.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">-{formatUSD(g.monto)}</span>
                        <button
                          type="button"
                          onClick={() => handleEliminarGasto(g.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Cuadre Box */}
            <div className="bg-slate-950 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Tu Ganancia Chofer (Comisión estimada):</span>
                <span className="font-mono font-bold text-sky-400 text-sm">+{formatUSD(comisionChofer)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Menos Gastos Cubiertos:</span>
                <span className="font-mono text-amber-400">-{formatUSD(totalGastos)}</span>
              </div>
              
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Efectivo a Entregar al Socio:</span>
                  <span className="text-[10px] text-slate-400">Dinero en mano que debes liquidar</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {formatUSD(saldoNetoEntregarSocio)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleGenerarArqueo}
              disabled={totalCarreras === 0}
              className={`w-full h-12 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                totalCarreras > 0
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar Cuadre & Generar Código de Arqueo</span>
            </button>
          </>
        ) : (
          /* Arqueo Confirmation & Handover Screen */
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100">¡Arqueo de Turno Consolidado!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Muestra este código al socio dueño o envíale el comprobante digital por WhatsApp.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono text-left">
              <div className="flex justify-between text-slate-400">
                <span>Código de Entrega:</span>
                <span className="text-emerald-400 font-bold text-sm">{arqueoGuardado.firma_digital_o_codigo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Carreras:</span>
                <span className="text-slate-200">{arqueoGuardado.total_carreras} vueltas</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Efectivo a Entregar al Socio:</span>
                <span className="text-emerald-400 font-bold text-sm">{formatUSD(arqueoGuardado.saldo_neto_entregar_socio)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tu Comisión Retenida:</span>
                <span className="text-sky-400 font-bold">{formatUSD(arqueoGuardado.comision_chofer)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(arqueoGuardado)}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Arqueo por WhatsApp al Socio</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cerrar Arqueo
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
