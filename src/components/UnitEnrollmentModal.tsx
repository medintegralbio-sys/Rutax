import React, { useState } from 'react';
import { rutaxStore } from '../services/store';
import { Vehiculo, Usuario, TipoVehiculo, ConductorActualTipo } from '../types';
import { 
  X, 
  Car, 
  FileSpreadsheet, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  Upload, 
  Key, 
  AlertCircle,
  Copy,
  Printer,
  Camera,
  Image as ImageIcon,
  Check
} from 'lucide-react';

interface UnitEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnitEnrollmentModal: React.FC<UnitEnrollmentModalProps> = ({
  isOpen,
  onClose
}) => {
  const [tab, setTab] = useState<'manual' | 'excel'>('manual');

  // Manual Form State
  const [numUnidad, setNumUnidad] = useState('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('Toyota Hiace Minibus');
  const [anio, setAnio] = useState(2026);
  const [color, setColor] = useState('Blanco Oficial');
  const [capacidad, setCapacidad] = useState<number>(15);
  const [tipoVehiculo, setTipoVehiculo] = useState<TipoVehiculo>('minibus');
  const [fotoVehiculo, setFotoVehiculo] = useState('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80');

  // Conductor titular
  const [choferNombre, setChoferNombre] = useState('');
  const [choferCedula, setChoferCedula] = useState('');
  const [choferTelefono, setChoferTelefono] = useState('');
  const [choferLicencia, setChoferLicencia] = useState('E');
  const [fotoChofer, setFotoChofer] = useState('');
  const [usarFotoVehiculoComoPerfil, setUsarFotoVehiculoComoPerfil] = useState(true);

  // Manejo de carga de archivos (fotos)
  const handleUploadFotoVehiculo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFotoVehiculo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadFotoChofer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFotoChofer(reader.result);
          setUsarFotoVehiculoComoPerfil(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Socio propietario
  const [socioNombre, setSocioNombre] = useState('');
  const [socioCedula, setSocioCedula] = useState('');
  const [socioTelefono, setSocioTelefono] = useState('');
  const [emergencia1, setEmergencia1] = useState('');
  const [tipoSangre, setTipoSangre] = useState('O+');

  // Switch ¿Quién maneja hoy?
  const [quienManejaHoy, setQuienManejaHoy] = useState<ConductorActualTipo>('chofer_titular');
  const [motivoPropietario, setMotivoPropietario] = useState('Conduce propietario por permiso de chofer');

  // Excel Bulk State
  const [excelText, setExcelText] = useState(
    `Unidad	Placa	Modelo	Capacidad	Chofer_Nombre	Chofer_Cedula	Chofer_Celular	Socio_Nombre	Socio_Cedula
1055	GTR-8890	Toyota Yaris	4	Marcos Suárez	0923412345	0991122334	Luis Morales	0912233445
1056	GBA-1122	Kia Soluto	4	Jorge Intriago	0934523456	0982233445	Luis Morales	0912233445
1057	GTR-8890	Chevrolet Sail	4	Repetido Error	0945634567	0973344556	Elena Ruiz	0923344556`
  );

  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [generatedCredentials, setGeneratedCredentials] = useState<any[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  // Validación de placa única (1 placa = 1 unidad) con comparación limpia y segura
  const validatePlacaUnique = (p: string) => {
    const cleanInput = p.replace(/[^A-Z0-9]/g, '').toUpperCase();
    return !rutaxStore.vehiculos.some(
      v => v.placa.replace(/[^A-Z0-9]/g, '').toUpperCase() === cleanInput
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    let cleanPlaca = placa.trim().toUpperCase();
    // Auto-formatear placa de AAA0000 a AAA-0000 para consistencia
    if (/^[A-Z]{3}\d{4}$/.test(cleanPlaca)) {
      cleanPlaca = `${cleanPlaca.substring(0, 3)}-${cleanPlaca.substring(3)}`;
    }

    if (!cleanPlaca || cleanPlaca.replace(/[^A-Z0-9]/g, '').length < 6) {
      setFeedbackMsg({ ok: false, msg: 'La placa debe tener un formato válido (Ej: GXY-1234).' });
      return;
    }

    if (!validatePlacaUnique(cleanPlaca)) {
      const displayPlaca = cleanPlaca.replace('-', '');
      setFeedbackMsg({ 
        ok: false, 
        msg: `Regla de Negocio: La placa ${displayPlaca} ya existe en el sistema (1 placa = 1 unidad).` 
      });
      return;
    }

    if (choferCedula.trim().length !== 10) {
      setFeedbackMsg({ ok: false, msg: 'La cédula del conductor debe tener exactamente 10 dígitos ecuatorianos.' });
      return;
    }

    const currentCoop = rutaxStore.getCurrentCoop();
    const coopId = currentCoop?.id || 'coop-daule';

    // 1. Crear o asociar socio
    const socioId = `usr-socio-${socioCedula || Date.now()}`;
    const nuevoSocio: Usuario = {
      uid: socioId,
      cooperativaId: coopId,
      cedula: socioCedula || '09' + Math.floor(10000000 + Math.random() * 90000000),
      nombre_completo: socioNombre || 'Socio Propietario',
      telefono: socioTelefono || '0990000000',
      email: `${socioCedula || 'socio'}@rutax.ec`,
      rol: 'socio',
      rol_secundario: null,
      base_asignada: null,
      activo: true,
      fecha_registro: new Date().toISOString().substring(0, 10),
      telefonos_emergencia: { t1: emergencia1 || '0991112233' },
      tipo_sangre: tipoSangre
    };
    rutaxStore.usuarios.push(nuevoSocio);

    // 2. Crear o asociar chofer
    const choferId = `usr-chofer-${choferCedula}`;
    const fotoFinalChofer = usarFotoVehiculoComoPerfil
      ? (fotoVehiculo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80')
      : (fotoChofer || fotoVehiculo || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80');

    const nuevoChofer: Usuario = {
      uid: choferId,
      cooperativaId: coopId,
      cedula: choferCedula,
      nombre_completo: choferNombre || 'Chofer Titular',
      telefono: choferTelefono || '0990000000',
      email: `${choferCedula}@rutax.ec`,
      rol: 'chofer',
      rol_secundario: null,
      base_asignada: 'base_a',
      licencia_tipo: choferLicencia,
      foto_url: fotoFinalChofer,
      activo: true,
      fecha_registro: new Date().toISOString().substring(0, 10)
    };
    rutaxStore.usuarios.push(nuevoChofer);

    // 3. Crear vehículo
    const targetVehId = `veh-${numUnidad || Date.now()}`;
    nuevoSocio.vehiculo_id = targetVehId;
    nuevoSocio.placa_asignada = cleanPlaca;
    nuevoChofer.vehiculo_id = targetVehId;
    nuevoChofer.placa_asignada = cleanPlaca;

    const nuevoVeh: Vehiculo = {
      id: targetVehId,
      cooperativaId: coopId,
      numero_unidad: numUnidad || String(1000 + rutaxStore.vehiculos.length + 1),
      placa: cleanPlaca,
      modelo,
      anio,
      color,
      capacidad,
      tipo_vehiculo: tipoVehiculo,
      foto_vehiculo_url: fotoVehiculo,
      socio_id: socioId,
      chofer_titular_id: choferId,
      conductor_actual_tipo: quienManejaHoy,
      estado: 'activo',
      documentos: {
        matricula_vigencia: '2027-04-30',
        soat_vigencia: '2027-02-15',
        revision_tecnica_vigencia: '2027-03-20'
      },
      km_actual: 15000,
      fecha_registro: new Date().toISOString().substring(0, 10),
      ubicacion_actual: {
        lat: -2.1384,
        lng: -79.8967,
        velocidad_kmh: 0,
        rumbo: 0,
        ultima_actualizacion: 'Estacionado en Base A'
      },
      password: '1234',
      password_cambiado: false
    };

    if (!rutaxStore.vehiculos.some(v => v.id === nuevoVeh.id)) {
      rutaxStore.vehiculos.push(nuevoVeh);
    } else {
      rutaxStore.vehiculos = rutaxStore.vehiculos.map(v => v.id === nuevoVeh.id ? nuevoVeh : v);
    }

    // Generar proforma automática ($15)
    rutaxStore.crearProformaParaVehiculos(coopId, [{
      id: nuevoVeh.id,
      numero_unidad: nuevoVeh.numero_unidad,
      placa: cleanPlaca
    }]);

    // Bitácora obligatoria si maneja propietario
    if (quienManejaHoy === 'propietario') {
      rutaxStore.addAuditLog(
        'ASIGNACION_CONDUCTOR_PROPIETARIO',
        `Unidad #${nuevoVeh.numero_unidad} registrada con Propietario al volante (${socioNombre}). Motivo: ${motivoPropietario}`
      );
    } else {
      rutaxStore.addAuditLog(
        'REGISTRO_VEHICULO_MANUAL',
        `Unidad #${nuevoVeh.numero_unidad} (${cleanPlaca}) registrada con éxito. Chofer: ${choferNombre}. Socio: ${socioNombre}.`
      );
    }

    setFeedbackMsg({
      ok: true,
      msg: `¡Unidad #${nuevoVeh.numero_unidad} (${cleanPlaca}) inscrita y activada con éxito!`
    });

    rutaxStore.notify();
  };

  // Procesar y Validar Carga Masiva por Excel
  const handleValidateExcel = () => {
    const lines = excelText.trim().split('\n');
    if (lines.length < 2) return;

    const results: any[] = [];
    const existingPlatesNormalized = new Set(rutaxStore.vehiculos.map(v => v.placa.replace(/[^A-Z0-9]/g, '').toUpperCase()));
    const existingUnits = new Set(rutaxStore.vehiculos.map(v => v.numero_unidad));
    const processedPlatesNormalized = new Set<string>();

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t').map(s => s.trim());
      if (parts.length < 4) continue;

      const [uNum, pPlaca, pMod, pCap, chNom, chCed, chTel, soNom, soCed] = parts;
      let cleanPlaca = pPlaca.toUpperCase();
      // Auto-formatear placa de AAA0000 a AAA-0000 para consistencia
      if (/^[A-Z]{3}\d{4}$/.test(cleanPlaca)) {
        cleanPlaca = `${cleanPlaca.substring(0, 3)}-${cleanPlaca.substring(3)}`;
      }
      const normPlaca = cleanPlaca.replace(/[^A-Z0-9]/g, '');
      const errors: string[] = [];

      // Validar placa única
      if (existingPlatesNormalized.has(normPlaca)) {
        const displayPlaca = cleanPlaca.replace('-', '');
        errors.push(`Regla de Negocio: La placa ${displayPlaca} ya existe en el sistema (1 placa = 1 unidad).`);
      }
      if (processedPlatesNormalized.has(normPlaca)) {
        errors.push(`Placa ${cleanPlaca} repetida dentro del mismo archivo.`);
      }
      processedPlatesNormalized.add(normPlaca);

      // Validar número de unidad
      if (existingUnits.has(uNum)) {
        errors.push(`Unidad #${uNum} ya existe en la cooperativa.`);
      }

      // Validar cédula chofer
      if (chCed && chCed.length !== 10) {
        errors.push(`Cédula chofer "${chCed}" inválida (debe tener 10 dígitos).`);
      }

      results.push({
        row: i,
        unidad: uNum,
        placa: cleanPlaca,
        modelo: pMod,
        capacidad: parseInt(pCap) || 4,
        chofer_nombre: chNom || 'Chofer Asignado',
        chofer_cedula: chCed || '0900000000',
        chofer_telefono: chTel || '0990000000',
        socio_nombre: soNom || 'Socio Propietario',
        socio_cedula: soCed || '0900000000',
        ok: errors.length === 0,
        errors
      });
    }

    setValidationResults(results);
  };

  const handleExecuteBulkEnroll = () => {
    const validRows = validationResults.filter(r => r.ok);
    if (validRows.length === 0) return;

    const coopId = rutaxStore.getCurrentCoop()?.id || 'coop-daule';
    const credentials: any[] = [];

    validRows.forEach(row => {
      const socioId = `usr-s-${row.socio_cedula}`;
      const choferId = `usr-c-${row.chofer_cedula}`;

      // Crear socio si no existe
      if (!rutaxStore.usuarios.some(u => u.uid === socioId)) {
        rutaxStore.usuarios.push({
          uid: socioId,
          cooperativaId: coopId,
          cedula: row.socio_cedula,
          nombre_completo: row.socio_nombre,
          telefono: '0990000000',
          email: `${row.socio_cedula}@rutax.ec`,
          rol: 'socio',
          rol_secundario: null,
          base_asignada: null,
          activo: true,
          fecha_registro: new Date().toISOString().substring(0, 10)
        });
      }

      // Crear chofer
      const tempPass = `Rutax${Math.floor(100 + Math.random() * 900)}*`;
      if (!rutaxStore.usuarios.some(u => u.uid === choferId)) {
        rutaxStore.usuarios.push({
          uid: choferId,
          cooperativaId: coopId,
          cedula: row.chofer_cedula,
          nombre_completo: row.chofer_nombre,
          telefono: row.chofer_telefono,
          email: `${row.chofer_cedula}@rutax.ec`,
          rol: 'chofer',
          rol_secundario: null,
          base_asignada: 'base_a',
          licencia_tipo: 'E',
          activo: true,
          fecha_registro: new Date().toISOString().substring(0, 10)
        });

        credentials.push({
          unidad: row.unidad,
          conductor: row.chofer_nombre,
          usuario: `${row.chofer_cedula}@rutax.ec`,
          clave: tempPass
        });
      }

      // Crear vehículo
      const targetId = `veh-${row.unidad}`;
      const socioObj = rutaxStore.usuarios.find(u => u.uid === socioId);
      if (socioObj) {
        socioObj.vehiculo_id = targetId;
        socioObj.placa_asignada = row.placa;
      }
      const choferObj = rutaxStore.usuarios.find(u => u.uid === choferId);
      if (choferObj) {
        choferObj.vehiculo_id = targetId;
        choferObj.placa_asignada = row.placa;
      }

      const nuevoVeh: Vehiculo = {
        id: targetId,
        cooperativaId: coopId,
        numero_unidad: row.unidad,
        placa: row.placa,
        modelo: row.modelo,
        anio: 2023,
        color: 'Blanco Ruta',
        capacidad: row.capacidad,
        tipo_vehiculo: 'sedan',
        foto_vehiculo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
        socio_id: socioId,
        chofer_titular_id: choferId,
        conductor_actual_tipo: 'chofer_titular',
        estado: 'activo',
        documentos: {
          matricula_vigencia: '2027-12-31',
          soat_vigencia: '2027-12-31',
          revision_tecnica_vigencia: '2027-10-31'
        },
        km_actual: 20000,
        fecha_registro: new Date().toISOString().substring(0, 10),
        ubicacion_actual: {
          lat: -2.1384,
          lng: -79.8967,
          velocidad_kmh: 0,
          rumbo: 0,
          ultima_actualizacion: 'En Base Sauces'
        },
        password: '1234',
        password_cambiado: false
      };

      if (!rutaxStore.vehiculos.some(v => v.id === targetId)) {
        rutaxStore.vehiculos.push(nuevoVeh);
      } else {
        rutaxStore.vehiculos = rutaxStore.vehiculos.map(v => v.id === targetId ? nuevoVeh : v);
      }
    });

    // Generar proforma automática para todos los vehículos nuevos cargados por masivo
    if (validRows.length > 0) {
      rutaxStore.crearProformaParaVehiculos(coopId, validRows.map(r => ({
        id: `veh-${r.unidad}`,
        numero_unidad: r.unidad,
        placa: r.placa
      })));
    }

    rutaxStore.addAuditLog(
      'CARGA_MASIVA_EXCEL',
      `Carga masiva ejecutada con éxito: ${validRows.length} unidades activadas simultáneamente con credenciales generadas.`
    );

    setGeneratedCredentials(credentials);
    rutaxStore.notify();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-100 animate-in zoom-in-95 max-h-[96vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-none">
                Inscripción de Unidades a la Cooperativa
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Módulo 4: Registro individual o importación masiva por Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 mb-3 shrink-0">
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Opción A: Registro Manual (Uno a Uno)</span>
          </button>

          <button
            onClick={() => setTab('excel')}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'excel'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Opción B: Carga Masiva por Excel</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className={`p-2 rounded-lg border text-[11px] mb-3 flex items-center gap-2 shrink-0 ${
            feedbackMsg.ok
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {feedbackMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            <span>{feedbackMsg.msg}</span>
          </div>
        )}

        {/* OPCIÓN A: REGISTRO MANUAL */}
        {tab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex-1 flex flex-col justify-between min-h-0 text-[11px]">
            {/* Scrollable Form Body organized in Side-by-Side Columns */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
              {/* Left Column: Vehicle Data & Relevo Switch */}
              <div className="space-y-2.5">
                {/* 1. Datos del Vehículo */}
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <span>1. Datos del Vehículo</span>
                    <span className="text-[9px] text-slate-400 lowercase">(1 placa = 1 unidad)</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Unidad *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 1023"
                        value={numUnidad}
                        onChange={e => setNumUnidad(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Placa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: GXY-1234"
                        value={placa}
                        onChange={e => setPlaca(e.target.value.toUpperCase())}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Modelo y Marca</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Toyota Hiace"
                        value={modelo}
                        onChange={e => setModelo(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Capacidad</label>
                      <select
                        value={capacidad}
                        onChange={e => setCapacidad(parseInt(e.target.value))}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value={4}>4 pax (Sedan)</option>
                        <option value={6}>6 pax</option>
                        <option value={11}>11 pax (Furgón)</option>
                        <option value={15}>15 pax (Minibus)</option>
                        <option value={32}>32 pax (Buseta)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Tipo</label>
                      <select
                        value={tipoVehiculo}
                        onChange={e => setTipoVehiculo(e.target.value as TipoVehiculo)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white capitalize text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="sedan">Sedan</option>
                        <option value="camioneta">Camioneta</option>
                        <option value="minibus">Minibus</option>
                        <option value="bus">Bus</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-0.5">Color Oficial</label>
                      <input
                        type="text"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Foto del Vehículo */}
                    <div className="col-span-full pt-2 border-t border-slate-800/80">
                      <label className="text-slate-300 block mb-1 text-[11px] font-semibold flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        Foto del Vehículo (Unidad)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-sm">
                          <img 
                            src={fotoVehiculo} 
                            alt="Vehículo" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all">
                              <Camera className="w-3 h-3" />
                              <span>Subir Foto</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleUploadFotoVehiculo} 
                                className="hidden" 
                              />
                            </label>
                            <span className="text-[10px] text-slate-500">O pegar URL:</span>
                          </div>
                          <input
                            type="text"
                            value={fotoVehiculo}
                            onChange={e => setFotoVehiculo(e.target.value)}
                            placeholder="https://..."
                            className="w-full h-7 px-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Switch: ¿Quién Maneja Hoy? */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-100 text-[11px] flex items-center gap-1 shrink-0">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ¿Quién maneja hoy?
                      </span>
                      <p className="text-[9px] text-slate-400 leading-tight">
                        Define la foto en la app móvil y en el turno.
                      </p>
                    </div>

                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuienManejaHoy('chofer_titular')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          quienManejaHoy === 'chofer_titular'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Chofer
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuienManejaHoy('propietario')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          quienManejaHoy === 'propietario'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Propietario
                      </button>
                    </div>
                  </div>

                  {quienManejaHoy === 'propietario' && (
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                      <label className="text-slate-400 block text-[9px] font-semibold">
                        Motivo obligatorio de relevo:
                      </label>
                      <input
                        type="text"
                        required
                        value={motivoPropietario}
                        onChange={e => setMotivoPropietario(e.target.value)}
                        placeholder="Ej: Chofer con descanso médico"
                        className="w-full h-7 px-2 rounded bg-slate-950 border border-slate-700 text-[10px] text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Driver Data & Owner Data */}
              <div className="space-y-2.5">
                {/* 3. Datos del Chofer Titular */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[10px]">
                    2. Datos del Chofer Titular
                  </h4>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juan Pérez Quinde"
                      value={choferNombre}
                      onChange={e => setChoferNombre(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Cédula (10 d) *</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="0956789012"
                        value={choferCedula}
                        onChange={e => setChoferCedula(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Celular (09...)</label>
                      <input
                        type="text"
                        placeholder="0996789012"
                        value={choferTelefono}
                        onChange={e => setChoferTelefono(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Foto de Perfil del Conductor */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 block text-[11px] font-semibold flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-sky-400" />
                        Foto de Perfil del Conductor
                      </label>
                    </div>

                    {/* Switch: Incluir foto del vehículo como foto de perfil del conductor */}
                    <div 
                      onClick={() => setUsarFotoVehiculoComoPerfil(!usarFotoVehiculoComoPerfil)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        usarFotoVehiculoComoPerfil 
                          ? 'bg-sky-500/10 border-sky-500/40 text-sky-200' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          usarFotoVehiculoComoPerfil ? 'bg-sky-500 border-sky-400 text-slate-950' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {usarFotoVehiculoComoPerfil && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-medium">
                          Usar foto del vehículo como foto de perfil del conductor
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800">
                        {usarFotoVehiculoComoPerfil ? 'Sincronizado' : 'Personalizada'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-sky-400 bg-slate-900 shrink-0 shadow-md">
                        <img 
                          src={usarFotoVehiculoComoPerfil ? fotoVehiculo : (fotoChofer || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80')} 
                          alt="Foto Conductor" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      {!usarFotoVehiculoComoPerfil ? (
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all">
                              <Camera className="w-3 h-3" />
                              <span>Subir Foto Conductor</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleUploadFotoChofer} 
                                className="hidden" 
                              />
                            </label>
                            <span className="text-[10px] text-slate-500">O URL:</span>
                          </div>
                          <input
                            type="text"
                            value={fotoChofer}
                            onChange={e => setFotoChofer(e.target.value)}
                            placeholder="https://..."
                            className="w-full h-7 px-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] focus:outline-none focus:border-sky-500 font-mono"
                          />
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          <span className="text-sky-300 font-semibold block">Foto del vehículo asignada al perfil</span>
                          La imagen del vehículo aparecerá como identificación del chofer.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Datos del Socio Propietario */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    3. Datos del Socio Propietario
                  </h4>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Nombre de Socio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Don Manuel Holguín"
                      value={socioNombre}
                      onChange={e => setSocioNombre(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Cédula Socio</label>
                      <input
                        type="text"
                        placeholder="0945678901"
                        value={socioCedula}
                        onChange={e => setSocioCedula(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Tipo de Sangre</label>
                      <select
                        value={tipoSangre}
                        onChange={e => setTipoSangre(e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="O+">O Positivo (O+)</option>
                        <option value="O-">O Negativo (O-)</option>
                        <option value="A+">A Positivo (A+)</option>
                        <option value="B+">B Positivo (B+)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inscribir Button */}
            <button
              type="submit"
              className="w-full h-9 mt-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Inscribir y Activar Unidad en la Cooperativa</span>
            </button>
          </form>
        )}

        {/* OPCIÓN B: CARGA MASIVA POR EXCEL */}
        {tab === 'excel' && (
          <div className="flex-1 flex flex-col justify-between min-h-0 text-[11px] space-y-3">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-200">
                  Formato de Columnas para Carga Masiva (Tabulado o Excel CSV)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">
                  Validación Fila por Fila
                </span>
              </div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Copia y pega desde tu Excel o edita la caja de texto directamente. Las placas repetidas o con cédulas erróneas se marcarán en rojo automáticamente.
              </p>
            </div>

            <textarea
              rows={4}
              value={excelText}
              onChange={e => setExcelText(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-[10px] text-slate-200 leading-normal focus:outline-none focus:border-emerald-500 shrink-0"
            />

            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleValidateExcel}
                className="flex-1 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] transition-all border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Analizar y Validar Excel</span>
              </button>

              {validationResults.length > 0 && (
                <button
                  onClick={handleExecuteBulkEnroll}
                  disabled={validationResults.filter(r => r.ok).length === 0}
                  className="flex-1 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-[10px] transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>2. Crear {validationResults.filter(r => r.ok).length} Unidades Validadas</span>
                </button>
              )}
            </div>

            {/* Scrollable Results Pane inside the viewport */}
            <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
              {validationResults.length > 0 && (
                <div className="flex-1 min-h-[80px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 flex flex-col">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-bold flex items-center justify-between shrink-0">
                    <span>Resultados del Análisis:</span>
                    <span className="text-emerald-400">
                      {validationResults.filter(r => r.ok).length} OK • {validationResults.filter(r => !r.ok).length} Error
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800 text-[10px]">
                    {validationResults.map((r) => (
                      <div
                        key={`val-${r.row}`}
                        className={`p-2 flex items-center justify-between gap-2.5 ${
                          r.ok ? 'bg-slate-950' : 'bg-rose-950/30'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-slate-200">Unidad #{r.unidad}</span> ({r.placa} - {r.modelo})
                          <div className="text-slate-400 text-[9px] mt-0.5">
                            Chofer: {r.chofer_nombre} ({r.chofer_cedula}) • Socio: {r.socio_nombre}
                          </div>
                        </div>

                        {r.ok ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[9px] shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Válido
                          </span>
                        ) : (
                          <div className="text-rose-400 text-right shrink-0">
                            <span className="font-bold flex items-center gap-1 justify-end text-[9px]">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                            <span className="text-[9px] block leading-tight">{r.errors.join(' ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Credentials Download/Print */}
              {generatedCredentials.length > 0 && (
                <div className="border border-emerald-500/30 rounded-xl bg-slate-950/90 p-2.5 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-400 text-[10px] flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" />
                      Credenciales Temporales para Choferes
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[9px]"
                    >
                      <Printer className="w-3 h-3" /> Imprimir
                    </button>
                  </div>
                  <div className="space-y-1 max-h-20 overflow-y-auto pr-0.5">
                    {generatedCredentials.map((c) => (
                      <div key={c.usuario} className="p-1.5 bg-slate-900 rounded text-[9px] font-mono flex items-center justify-between text-slate-200 leading-tight">
                        <span>Unidad #{c.unidad} ({c.conductor})</span>
                        <span className="text-emerald-400">User: {c.usuario} | Pass: {c.clave}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
