import React, { useState } from 'react';
import {
  Despacho,
  LiquidacionViaje,
  ConfiguracionFinancieraCoop,
  GastoTurno
} from '../types';
import { rutaxStore } from '../services/store';
import {
  calcularLiquidacionCarrera,
  formatUSD,
  generarTextoWhatsAppLiquidacion,
  CONFIG_FINANCIERA_DEFAULT
} from '../services/financialServices';
import {
  X,
  CheckCircle2,
  DollarSign,
  Users,
  Fuel,
  Receipt,
  Share2,
  AlertCircle,
  Building2,
  FileText,
  CreditCard,
  Banknote
} from 'lucide-react';

interface ModalCierreViajeProps {
  despacho: Despacho;
  onClose: () => void;
  onSuccess: (liquidacion: LiquidacionViaje) => void;
}

export const ModalCierreViaje: React.FC<ModalCierreViajeProps> = ({
  despacho,
  onClose,
  onSuccess
}) => {
  const currentCoop = rutaxStore.getCurrentCoop();
  const config = CONFIG_FINANCIERA_DEFAULT;
  const vehiculo = rutaxStore.getVehiculos().find(v => v.id === despacho.vehiculo_id);
  const chofer = rutaxStore.getUsuarios().find(u => u.uid === despacho.chofer_id);

  const [pasajerosRuta, setPasajerosRuta] = useState<number>(despacho.pasajeros_ruta || 0);
  const [pasajerosBase] = useState<number>(despacho.pasajeros_base || 0);
  const [tarifaUnitaria] = useState<number>(despacho.tarifa_plana || 0.50);

  // Formas de cobro
  const [montoDigital, setMontoDigital] = useState<number>(0); // DeUna/Transferencia
  
  // Gastos inmediatos de la carrera
  const [gastosDirectos, setGastosDirectos] = useState<number>(0);
  const [motivoGasto, setMotivoGasto] = useState<string>('');

  // Porcentaje Chofer
  const [porcentajeChofer] = useState<number>(config.porcentaje_comision_chofer_defecto);
  const [observaciones, setObservaciones] = useState<string>('');
  const [savedLiq, setSavedLiq] = useState<LiquidacionViaje | null>(null);

  // Cálculos reactivos
  const calculos = calcularLiquidacionCarrera({
    pasajerosBase,
    pasajerosRuta,
    tarifaUnitaria,
    gastosDirectos,
    config,
    porcentajeChofer
  });

  const totalRecaudado = calculos.recaudacionBruta;
  const montoEfectivo = Math.max(0, totalRecaudado - montoDigital);

  const handleConfirmarCierre = () => {
    const liquidacion: LiquidacionViaje = {
      id: 'liq-' + Date.now(),
      cooperativaId: currentCoop?.id || 'coop-daule',
      despacho_id: despacho.id,
      turno_id: despacho.turno_id,
      vehiculo_id: despacho.vehiculo_id,
      numero_unidad: vehiculo?.numero_unidad || '00',
      chofer_id: despacho.chofer_id,
      chofer_nombre: chofer?.nombre_completo || 'Chofer Asignado',
      socio_id: vehiculo?.socio_id || 'usr-socio',
      fecha: new Date().toISOString().split('T')[0],
      hora_cierre: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ruta_nombre: 'Sauces ↔ Centro',
      pasajeros_base: pasajerosBase,
      pasajeros_ruta: pasajerosRuta,
      pasajeros_totales: calculos.totalPasajeros,
      tarifa_unitaria: tarifaUnitaria,
      recaudacion_bruta: calculos.recaudacionBruta,
      monto_efectivo: montoEfectivo,
      monto_digital: montoDigital,
      cuota_administracion_coop: calculos.cuotaCoop,
      fondo_auxilio_social: calculos.fondoAuxilio,
      gastos_carrera: gastosDirectos,
      recaudacion_neta: calculos.recaudacionNeta,
      pago_chofer_estimado: calculos.gananciaChofer,
      rendimiento_socio_estimado: calculos.gananciaSocio,
      estado: 'liquidado',
      observaciones
    };

    // Si hubo gasto, registrarlo como gasto de turno
    if (gastosDirectos > 0) {
      const nuevoGasto: GastoTurno = {
        id: 'gst-' + Date.now(),
        cooperativaId: liquidacion.cooperativaId,
        vehiculo_id: liquidacion.vehiculo_id,
        chofer_id: liquidacion.chofer_id,
        tipo: 'peaje',
        descripcion: motivoGasto || 'Gasto directo en carrera',
        monto: gastosDirectos,
        fecha: liquidacion.fecha,
        hora: liquidacion.hora_cierre,
        aprobado_por_socio: true
      };
      rutaxStore.registrarGastoTurno(nuevoGasto);
    }

    rutaxStore.guardarLiquidacionViaje(liquidacion);
    rutaxStore.cerrarDespacho(despacho.id, {
      pasajeros_ruta: pasajerosRuta,
      pasajeros_totales: calculos.totalPasajeros,
      recaudacion_bruta: calculos.recaudacionBruta
    });

    setSavedLiq(liquidacion);
    onSuccess(liquidacion);
  };

  const handleShareWhatsApp = (liq: LiquidacionViaje) => {
    const text = generarTextoWhatsAppLiquidacion(liq);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100">
                {savedLiq ? 'Comprobante de Carrera' : 'Cierre de Carrera & Liquidación'}
              </h2>
              <p className="text-xs text-slate-400">
                Unidad #{vehiculo?.numero_unidad || '00'} • Placa {vehiculo?.placa || 'GBA-0000'}
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

        {!savedLiq ? (
          <>
            {/* Passenger Counts */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-4 h-4 text-sky-400" />
                  Pasajeros Subidos en Base:
                </span>
                <span className="font-mono text-base text-slate-100 font-bold">{pasajerosBase}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Pasajeros Recogidos en Ruta:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPasajerosRuta(Math.max(0, pasajerosRuta - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={pasajerosRuta}
                    onChange={(e) => setPasajerosRuta(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 h-7 bg-slate-900 border border-slate-700 text-center font-mono font-bold text-slate-100 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setPasajerosRuta(pasajerosRuta + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/60 text-slate-100">
                <span>Total Pasajeros Transportados:</span>
                <span className="font-mono text-emerald-400 text-base">{calculos.totalPasajeros} pas.</span>
              </div>
            </div>

            {/* Formas de Pago */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  Cobrado en Efectivo:
                </label>
                <div className="text-base font-mono font-bold text-slate-100">
                  {formatUSD(montoEfectivo)}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  Digital (DeUna/Transf):
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max={calculos.recaudacionBruta}
                  value={montoDigital === 0 ? '' : montoDigital}
                  placeholder="0.00"
                  onChange={(e) => setMontoDigital(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-sky-300 placeholder:text-slate-600 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Direct Expense */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-400" />
                Gastos Inmediatos en esta Vuelta (Peaje / Ponchera):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="Monto ($)"
                  value={gastosDirectos === 0 ? '' : gastosDirectos}
                  onChange={(e) => setGastosDirectos(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-amber-300 placeholder:text-slate-600"
                />
                <input
                  type="text"
                  placeholder="Motivo (ej: Peaje Daule)"
                  value={motivoGasto}
                  onChange={(e) => setMotivoGasto(e.target.value)}
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Breakdown Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Recaudación Bruta ({calculos.totalPasajeros} × {formatUSD(tarifaUnitaria)}):</span>
                <span className="font-mono font-bold text-slate-100">{formatUSD(calculos.recaudacionBruta)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cuota Operativa Cooperativa:</span>
                <span className="font-mono text-rose-400">-{formatUSD(calculos.cuotaCoop)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Aporte Fondo de Auxilio Social:</span>
                <span className="font-mono text-rose-400">-{formatUSD(calculos.fondoAuxilio)}</span>
              </div>
              {gastosDirectos > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Gastos de Carrera:</span>
                  <span className="font-mono text-amber-400">-{formatUSD(gastosDirectos)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-slate-200">
                <span>Rendimiento Neto Carrera:</span>
                <span className="font-mono text-emerald-400 text-sm">{formatUSD(calculos.recaudacionNeta)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Ganancia Chofer ({porcentajeChofer}%):</span>
                  <span className="font-mono font-bold text-slate-200">{formatUSD(calculos.gananciaChofer)}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Saldo Socio Dueño:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatUSD(calculos.gananciaSocio)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmarCierre}
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar & Guardar Liquidación</span>
            </button>
          </>
        ) : (
          /* Success Screen with WhatsApp share */
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-100">¡Carrera Liquidada con Éxito!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                La rendición ha sido contabilizada y sincronizada con el socio y la cooperativa.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Comprobante:</span>
                <span className="text-slate-200 font-bold">{savedLiq.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recaudación Bruta:</span>
                <span className="text-emerald-400 font-bold">{formatUSD(savedLiq.recaudacion_bruta)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Saldo para el Socio:</span>
                <span className="text-slate-100 font-bold">{formatUSD(savedLiq.rendimiento_socio_estimado)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(savedLiq)}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp al Socio</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
