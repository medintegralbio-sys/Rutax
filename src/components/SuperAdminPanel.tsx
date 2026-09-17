import React, { useState, useEffect } from 'react';
import { rutaxStore } from '../services/store';
import { 
  Building2, 
  TrendingUp, 
  Receipt, 
  Package, 
  Settings, 
  Shield, 
  Clock, 
  X, 
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { SuperAdminDashboardTab } from './superadmin/SuperAdminDashboardTab';
import { SuperAdminCooperativasTab } from './superadmin/SuperAdminCooperativasTab';
import { SuperAdminComprobantesTab } from './superadmin/SuperAdminComprobantesTab';
import { SuperAdminPlanesTab } from './superadmin/SuperAdminPlanesTab';
import { SuperAdminConfigTab } from './superadmin/SuperAdminConfigTab';
import { SuperAdminLogsTab } from './superadmin/SuperAdminLogsTab';
import { ModalNuevaCooperativa } from './superadmin/ModalNuevaCooperativa';
import { ModalGestionSuscripcion } from './superadmin/ModalGestionSuscripcion';
import { ModalSubirComprobante } from './superadmin/ModalSubirComprobante';

type SuperAdminTab = 'dashboard' | 'cooperativas' | 'comprobantes' | 'planes' | 'configuracion' | 'logs';

export const SuperAdminPanel: React.FC = () => {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('dashboard');
  const [showProgressiveBanner, setShowProgressiveBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [modalNuevaCoop, setModalNuevaCoop] = useState(false);
  const [modalGestionCoopId, setModalGestionCoopId] = useState<string | null>(null);
  const [modalSubirComp, setModalSubirComp] = useState(false);

  useEffect(() => {
    const unsub = rutaxStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Data from store
  const cooperativas = rutaxStore.cooperativas;
  const suscripciones = rutaxStore.suscripciones;
  const comprobantes = rutaxStore.comprobantesPago;
  const planes = rutaxStore.planes;
  const metricas = rutaxStore.metricasGlobales;
  const logs = rutaxStore.logsSuperAdmin;
  const config = rutaxStore.configSuperAdmin;

  // Handlers
  const handleEjecutarBloqueo = () => {
    rutaxStore.ejecutarBloqueoProgresivo(true);
    showToast('Cron de Bloqueo Progresivo ejecutado exitosamente.');
  };

  const handleLogout = () => {
    rutaxStore.logout();
    window.location.href = '/login';
  };

  const handleExportPDF = () => {
    rutaxStore.generarReporteMensual();
    showToast('Generando y descargando Reporte Financiero PDF...');
  };

  const handleExportExcel = () => {
    rutaxStore.exportarDatosExcel();
    showToast('Exportando Base de Suscripciones a CSV / Excel...');
  };

  const handleCrearCooperativa = (datos: any) => {
    const res = rutaxStore.crearCooperativa(datos);
    setModalNuevaCoop(false);
    showToast(`Cooperativa "${res.coop.nombre}" creada y suscrita en Plan ${res.suscripcion.plan_id.toUpperCase()}.`);
  };

  const handleRevisarComprobante = (comprobanteId: string, decision: 'aprobado' | 'rechazado', motivo?: string) => {
    rutaxStore.revisarComprobante(comprobanteId, decision, motivo);
    if (decision === 'aprobado') {
      showToast('✅ Comprobante aprobado: +30 días de servicio activados y despacho habilitado.');
    } else {
      showToast('❌ Comprobante rechazado. Notificación registrada.');
    }
  };

  const handleEnviarWhatsApp = (coopId: string, tipo: any) => {
    const mensaje = rutaxStore.enviarRecordatorio(coopId, tipo);
    const coop = cooperativas.find(c => c.id === coopId);
    if (coop) {
      const phoneClean = coop.presidente_celular.replace(/^0/, '');
      const url = `https://wa.me/593${phoneClean}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
      showToast(`Recordatorio generado para ${coop.nombre}`);
    }
  };

  // Selected Coop for modal
  const selectedCoop = modalGestionCoopId ? cooperativas.find(c => c.id === modalGestionCoopId) : null;
  const selectedSuscripcion = modalGestionCoopId ? suscripciones.find(s => s.cooperativaId === modalGestionCoopId) : null;
  const selectedHistorial = modalGestionCoopId ? rutaxStore.obtenerHistorialPagos(modalGestionCoopId) : [];

  const pendientesCount = comprobantes.filter(c => c.estado === 'pendiente_revision').length;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                Módulo SuperAdmin SaaS Multi-Cooperativa
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Facturación automatizada, catálogo de planes por unidad, conciliación de pagos y control de bloqueo progresivo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProgressiveBanner(!showProgressiveBanner)}
            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Protocolo de Bloqueo</span>
          </button>
          <button
            onClick={handleLogout}
            className="h-10 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/20 border border-rose-400/30 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
          <button
            onClick={() => setModalNuevaCoop(true)}
            className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cooperativa</span>
          </button>
        </div>
      </div>

      {/* Protocolo de Bloqueo Progresivo Banner */}
      {showProgressiveBanner && (
        <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative animate-in fade-in space-y-3">
          <button
            onClick={() => setShowProgressiveBanner(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Reglas de Oro del Bloqueo Progresivo por Falta de Pago:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-emerald-400 font-bold mb-1">Día 0 (Vencimiento)</div>
              <p className="text-slate-300">Servicio activo al 100%. Se envía recordatorio automatizado por WhatsApp al presidente con datos de depósito.</p>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-500/30">
              <div className="text-amber-400 font-bold mb-1">Día +3 (Bloqueo Parcial)</div>
              <p className="text-slate-300">Se desactiva la opción de despacho en la tableta de base. El rastreo satelital GPS sigue 100% activo.</p>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-rose-500/30">
              <div className="text-rose-400 font-bold mb-1">Día +5 (Bloqueo Total)</div>
              <p className="text-slate-300">Acceso revocado a choferes, socios y tablets. Único acceso permitido: portal del presidente para subir voucher.</p>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-red-900/50">
              <div className="text-red-400 font-bold mb-1">Día +30 (Cancelación)</div>
              <p className="text-slate-300">Pasa a estado inactivo definitivo con descarga de histórico y cierre de base de datos de flota.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'dashboard'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard SaaS & MRR</span>
        </button>

        <button
          onClick={() => setActiveTab('cooperativas')}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'cooperativas'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cooperativas ({cooperativas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comprobantes')}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'comprobantes'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Comprobantes de Pago</span>
          {pendientesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] ml-1">
              {pendientesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('planes')}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'planes'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catálogo de Planes</span>
        </button>

        <button
          onClick={() => setActiveTab('configuracion')}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'configuracion'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración & Cuentas</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`h-10 px-4 rounded-xl flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Auditoría SuperAdmin</span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'dashboard' && (
        <SuperAdminDashboardTab
          metricas={metricas}
          suscripciones={suscripciones}
          cooperativas={cooperativas}
          planes={planes}
          onSelectTab={setActiveTab}
          onSelectCoop={id => setModalGestionCoopId(id)}
          onEjecutarBloqueo={handleEjecutarBloqueo}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      )}

      {activeTab === 'cooperativas' && (
        <SuperAdminCooperativasTab
          cooperativas={cooperativas}
          suscripciones={suscripciones}
          planes={planes}
          onSelectCoop={id => setModalGestionCoopId(id)}
          onOpenNuevaCoop={() => setModalNuevaCoop(true)}
          onOpenGestion={id => setModalGestionCoopId(id)}
          onEnviarWhatsApp={handleEnviarWhatsApp}
        />
      )}

      {activeTab === 'comprobantes' && (
        <SuperAdminComprobantesTab
          comprobantes={comprobantes}
          cooperativas={cooperativas}
          suscripciones={suscripciones}
          onRevisar={handleRevisarComprobante}
          onOpenSubirComprobanteManual={() => setModalSubirComp(true)}
        />
      )}

      {activeTab === 'planes' && (
        <SuperAdminPlanesTab
          planes={planes}
        />
      )}

      {activeTab === 'configuracion' && (
        <SuperAdminConfigTab
          config={config}
          onGuardarConfig={c => {
            rutaxStore.editarConfiguracionGlobal(c);
            showToast('Parámetros globales de cobros y cuentas bancarias actualizados.');
          }}
        />
      )}

      {activeTab === 'logs' && (
        <SuperAdminLogsTab
          logs={logs}
          cooperativas={cooperativas}
        />
      )}

      {/* Modal: Nueva Cooperativa */}
      {modalNuevaCoop && (
        <ModalNuevaCooperativa
          planes={planes}
          onClose={() => setModalNuevaCoop(false)}
          onSubmit={handleCrearCooperativa}
        />
      )}

      {/* Modal: Gestión Detallada de Cooperativa */}
      {selectedCoop && selectedSuscripcion && (
        <ModalGestionSuscripcion
          cooperativa={selectedCoop}
          suscripcion={selectedSuscripcion}
          planes={planes}
          historialPagos={selectedHistorial}
          onClose={() => setModalGestionCoopId(null)}
          onExtenderGracia={dias => {
            rutaxStore.extenderSuscripcion(selectedCoop.id, dias);
            showToast(`+${dias} días de prórroga aplicados.`);
          }}
          onBloquear={(tipo, motivo) => {
            rutaxStore.bloquearCooperativa(selectedCoop.id, tipo, motivo);
            showToast(`Bloqueo ${tipo.toUpperCase()} aplicado.`);
          }}
          onDesbloquear={() => {
            rutaxStore.desbloquearCooperativa(selectedCoop.id);
            showToast(`Cooperativa reactivada a estado 100% ACTIVO.`);
          }}
          onCambiarPlan={nuevoPlan => {
            rutaxStore.cambiarPlan(selectedCoop.id, nuevoPlan);
            showToast(`Plan actualizado a ${nuevoPlan.toUpperCase()}.`);
          }}
          onOtorgarDescuento={(pct, motivo) => {
            rutaxStore.otorgarDescuento(selectedCoop.id, pct, motivo);
            showToast(`Descuento del ${pct}% aplicado.`);
          }}
          onEnviarWhatsApp={tipo => handleEnviarWhatsApp(selectedCoop.id, tipo)}
          onSubirPagoManual={(monto, ref, banco) => {
            rutaxStore.subirComprobante(selectedCoop.id, {
              monto,
              metodo: 'transferencia',
              banco,
              numero_operacion: ref,
              fecha_operacion: new Date().toISOString().split('T')[0],
              cuenta_destino: config.cuenta_banco_principal,
              comprobante_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
              comprobante_nombre: `manual_${Date.now()}.jpg`,
              periodo_desde: new Date().toISOString().split('T')[0],
              periodo_hasta: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
              subido_por: 'SuperAdmin'
            });
            // Auto aprobar
            const comp = rutaxStore.comprobantesPago[0];
            if (comp) {
              rutaxStore.revisarComprobante(comp.id, 'aprobado');
            }
            showToast(`Pago de $${monto} registrado y servicio renovado +30 días.`);
          }}
        />
      )}

      {/* Modal: Subir Comprobante General */}
      {modalSubirComp && (
        <ModalSubirComprobante
          cooperativaId={cooperativas[0]?.id || 'coop-daule'}
          cooperativaNombre={cooperativas[0]?.nombre || 'Cooperativa'}
          montoSugerido={150}
          cuentaDestino={config.cuenta_banco_principal}
          onClose={() => setModalSubirComp(false)}
          onSubmit={datos => {
            rutaxStore.subirComprobante(cooperativas[0]?.id || 'coop-daule', datos);
            setModalSubirComp(false);
            showToast('Comprobante subido a la bandeja de revisión.');
          }}
        />
      )}
    </div>
  );
};
