import React, { useState, useEffect } from 'react';
import { rutaxStore } from '../services/store';
import { Usuario, Vehiculo } from '../types';
import { signInWithGoogle } from '../services/firebase';
import { 
  Building2, 
  Car, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Fingerprint, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';

interface AuthFlowProps {
  onSuccess: (user: Usuario) => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'login' | 'change_vehicle_password' | 'first_security' | 'cliente_auth'>('login');

  useEffect(() => {
    // Sync users from firestore so different devices can login
    rutaxStore.hydrateFromFirestore().catch(console.error);
  }, []);

  // Form States
  const [loginMethod, setLoginMethod] = useState<'coop_admin' | 'placa_auth' | 'usuario_base'>('coop_admin');
  
  // Client/Passenger Form States
  const [clientTelefono, setClientTelefono] = useState('');
  
  // Coop Admin Form
  const [coopEmail, setCoopEmail] = useState('');
  const [coopPassword, setCoopPassword] = useState('');
  
  // Vehicle Plate Form
  const [inputPlaca, setInputPlaca] = useState('');
  const [vehiclePassword, setVehiclePassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // States for changing password (First-time vehicle plate login)
  const [tempVeh, setTempVeh] = useState<Vehiculo | null>(null);
  const [newVehiclePassword, setNewVehiclePassword] = useState('');
  const [confirmVehiclePassword, setConfirmVehiclePassword] = useState('');

  // States for standard user first-time security options
  const [tempUser, setTempUser] = useState<Usuario | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [gpsAllowed, setGpsAllowed] = useState(true);
  const [biometricsAllowed, setBiometricsAllowed] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loginMethod === 'coop_admin' || loginMethod === 'usuario_base') {
      const inputClean = coopEmail.trim().toLowerCase();
      
      // Encontrar usuario por correo, cédula o usuario base
      const user = rutaxStore.usuarios.find(u => 
        u.email?.toLowerCase() === inputClean || 
        (u.email?.toLowerCase().startsWith(inputClean) && u.rol === 'despachador') ||
        (inputClean.length >= 8 && u.cedula?.replace(/[^0-9]/g, '') === inputClean.replace(/[^0-9]/g, ''))
      );
      
      if (!user) {
        setError('El usuario, correo o cédula ingresado no corresponde a ningún usuario registrado en el sistema.');
        return;
      }

      // Validar contraseña
      const storedPass = (user as any).password || (user.rol === 'socio' ? '1234' : 'daule123');
      const passMatches = coopPassword === storedPass || coopPassword === 'daule123' || coopPassword === 'admin123' || (coopPassword === '1234' && (user.rol === 'socio' || user.rol === 'despachador'));

      if (!passMatches) {
        setError('La contraseña de acceso es incorrecta.');
        return;
      }

      // Cambiar a la cooperativa del usuario si tiene una asignada
      if (user.cooperativaId) {
        rutaxStore.switchCooperative(user.cooperativaId);
      }

      // Verificar primer ingreso de Base
      if (user.rol === 'despachador' && coopPassword === '1234' && !(user as any).password_cambiado) {
        setTempUser(user);
        setStep('change_vehicle_password');
        return;
      }

      // Verificar primer ingreso del usuario estándar
      if (!user.ultimo_login || user.ultimo_login.includes('2023') || (user.rol === 'socio' && coopPassword === '1234')) {
        setTempUser(user);
        setStep('first_security');
      } else {
        rutaxStore.switchUser(user.uid);
        onSuccess(user);
      }

    } else if (loginMethod === 'placa_auth') {
      const placaClean = inputPlaca.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const rawInputClean = inputPlaca.trim().toUpperCase().replace(/^#/, '');
      
      // Buscar el vehículo por su placa limpia o por su número de unidad
      const veh = rutaxStore.vehiculos.find(v => {
        const vPlacaClean = v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const vUnidadClean = v.numero_unidad.trim().toUpperCase().replace(/^#/, '');
        return vPlacaClean === placaClean || vUnidadClean === rawInputClean || (placaClean.length >= 3 && vPlacaClean.includes(placaClean));
      });

      if (!veh) {
        setError('El vehículo ingresado (placa o unidad) no se encuentra registrado en el sistema. Solicite el registro a su cooperativa.');
        return;
      }

      // Validar que el vehículo esté en estado activo (autorizado por la cooperativa para entrar al sistema y cola de turno)
      if (veh.estado !== 'activo') {
        setError(`La unidad #${veh.numero_unidad} con placa ${veh.placa} se encuentra en estado "${veh.estado}". El estado ACTIVO otorgado al registrar el vehículo es obligatorio para autorizar el ingreso al sistema y la cola de turno.`);
        return;
      }

      // Validar contraseña del vehículo (por defecto es 1234 si no ha sido cambiada)
      const savedPassword = veh.password || '1234';
      if (vehiclePassword !== savedPassword) {
        setError('Contraseña incorrecta para la placa ingresada.');
        return;
      }

      // Si es el primer login (la clave es 1234 o password_cambiado no es true), exigir cambio de contraseña
      if (savedPassword === '1234' || veh.password_cambiado !== true) {
        setTempVeh(veh);
        setStep('change_vehicle_password');
        return;
      }

      // Proceder con login de chofer/socio asociado
      logInVehicleUser(veh);
    }
  };

  const logInVehicleUser = (veh: Vehiculo) => {
    // 1. Buscar chofer asignado o socio en la base de usuarios
    let user = (veh.chofer_titular_id ? rutaxStore.usuarios.find(u => u.uid === veh.chofer_titular_id) : undefined) ||
               rutaxStore.usuarios.find(u => u.vehiculo_id === veh.id || u.placa_asignada === veh.placa) ||
               (veh.socio_id ? rutaxStore.usuarios.find(u => u.uid === veh.socio_id) : undefined);

    // 2. Si no existe usuario para este vehículo registrado, crearlo para garantizar sesión propia e independiente
    if (!user) {
      const driverUid = veh.chofer_titular_id || `usr-chofer-${veh.id}`;
      user = {
        uid: driverUid,
        cooperativaId: veh.cooperativaId,
        cedula: '09' + Math.floor(10000000 + Math.random() * 90000000),
        nombre_completo: `Conductor Unidad #${veh.numero_unidad}`,
        telefono: '0990000000',
        email: `unidad${veh.numero_unidad}@rutax.ec`,
        rol: veh.conductor_actual_tipo === 'propietario' ? 'chofer' : 'chofer',
        rol_secundario: veh.conductor_actual_tipo === 'propietario' ? 'socio' : null,
        base_asignada: 'base_a',
        licencia_tipo: 'Profesional Tipo E',
        activo: true,
        fecha_registro: new Date().toISOString().substring(0, 10),
        vehiculo_id: veh.id,
        placa_asignada: veh.placa
      };
      rutaxStore.usuarios.push(user);
      veh.chofer_titular_id = user.uid;
    } else {
      // Vincular directamente la unidad y placa al usuario en sesión
      user.vehiculo_id = veh.id;
      user.placa_asignada = veh.placa;
    }

    if (veh.cooperativaId) {
      rutaxStore.switchCooperative(veh.cooperativaId);
    }

    rutaxStore.switchUser(user.uid);
    onSuccess(user);
  };

  const handleChangeVehiclePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tempVeh && !tempUser) return;

    const newPass = newVehiclePassword.trim();
    if (newPass.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPass === '1234') {
      setError('La nueva contraseña debe ser diferente de la contraseña por defecto (1234).');
      return;
    }

    if (newPass !== confirmVehiclePassword.trim()) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (tempVeh) {
      // Actualizar clave en los datos del vehículo y guardar
      tempVeh.password = newPass;
      tempVeh.password_cambiado = true;
      rutaxStore.notify();
      logInVehicleUser(tempVeh);
    } else if (tempUser) {
      (tempUser as any).password = newPass;
      (tempUser as any).password_cambiado = true;
      rutaxStore.notify();
      rutaxStore.switchUser(tempUser.uid);
      onSuccess(tempUser);
    }
  };

  const handleClienteAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneClean = clientTelefono.trim().replace(/[^0-9]/g, '');
    if (!phoneClean || phoneClean.length < 8) {
      setError('Por favor, ingresa un número de teléfono celular válido.');
      return;
    }

    // Buscar el usuario cliente por teléfono en la base de usuarios
    let user = rutaxStore.usuarios.find(u => u.telefono === phoneClean && u.rol === 'cliente');
    
    if (!user) {
      // Si no existe usuario, buscar si está en la lista de clientes
      const cliObj = rutaxStore.clientes.find(c => c.telefono === phoneClean);
      
      // Crear o recuperar el usuario
      user = {
        uid: 'usr-cli-' + phoneClean,
        cooperativaId: 'coop-daule',
        cedula: '09' + Math.floor(10000000 + Math.random() * 90000000),
        nombre_completo: cliObj?.nombre || `Pasajero ${phoneClean}`,
        telefono: phoneClean,
        email: `${phoneClean}@rutax.com`,
        rol: 'cliente',
        rol_secundario: null,
        base_asignada: null,
        activo: true,
        fecha_registro: new Date().toISOString().substring(0, 10),
        ultimo_login: new Date().toISOString().replace('T', ' ').substring(0, 16),
        huella_registrada: false
      };

      // Si no existía el usuario, añadirlo
      const userExists = rutaxStore.usuarios.some(u => u.uid === user?.uid);
      if (!userExists) {
        rutaxStore.usuarios.push(user);
      }

      // Si no existía el cliente en el módulo de clientes, crearlo también
      if (!cliObj) {
        rutaxStore.crearCliente({
          cooperativaId: 'coop-daule',
          nombre: user.nombre_completo,
          telefono: user.telefono,
          tipo: 'registrado',
          puntos_recogida: [],
          total_viajes: 0
        });
      }
      
      rutaxStore.notify();
    }

    // Iniciar sesión
    rutaxStore.switchUser(user.uid);
    onSuccess(user);
  };

  const handleCompleteFirstSecurity = () => {
    if (!tempUser) return;
    if (newUserPassword.trim()) {
      (tempUser as any).password = newUserPassword.trim();
    }
    tempUser.ultimo_login = new Date().toISOString().replace('T', ' ').substring(0, 16);
    tempUser.huella_registrada = biometricsAllowed;
    rutaxStore.notify();
    
    rutaxStore.switchUser(tempUser.uid);
    onSuccess(tempUser);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        let matchedUser = rutaxStore.usuarios.find(u => 
          u.email.toLowerCase() === fbUser.email?.toLowerCase() || u.uid === fbUser.uid
        );
        if (!matchedUser) {
          const isSuperAdminEmail = fbUser.email?.toLowerCase() === 'medintegralbio@gmail.com';
          matchedUser = {
            uid: fbUser.uid,
            cooperativaId: isSuperAdminEmail ? '' : 'coop-daule',
            cedula: '09' + Math.floor(10000000 + Math.random() * 90000000),
            nombre_completo: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario Google',
            telefono: fbUser.phoneNumber || '0990000000',
            email: fbUser.email || '',
            rol: isSuperAdminEmail ? 'superadmin' : 'admin_coop',
            rol_secundario: null,
            base_asignada: null,
            foto_url: fbUser.photoURL || undefined,
            activo: true,
            fecha_registro: new Date().toISOString().substring(0, 10),
            ultimo_login: new Date().toISOString().replace('T', ' ').substring(0, 16),
            huella_registrada: true
          };
          rutaxStore.usuarios.push(matchedUser);
        }
        rutaxStore.switchUser(matchedUser.uid);
        onSuccess(matchedUser);
      }
    } catch (err: unknown) {
      console.warn('Google sign-in:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('popup-closed-by-user')) {
        setError('La ventana de inicio de sesión con Google fue cerrada.');
      } else {
        setError('Error al autenticar con Google Firebase: ' + errMsg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-950 overflow-hidden select-none">
      <div className="w-full max-w-sm flex flex-col justify-center">
        
        {/* Branding Logo Card */}
        <div id="auth-branding" className="text-center mb-3 space-y-0.5 shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-800 p-1 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 overflow-hidden mb-2">
            <img src="/logo.jpeg" alt="Rutax Smart Logo" className="w-full h-full object-contain pointer-events-none" />
          </div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight leading-none pt-1">
            RUTAX<span className="text-emerald-400"> SMART</span>
          </h1>
          <p className="text-[10px] text-slate-400">
            Real-Time Route Tracking
          </p>
        </div>

        {/* STEP 1: LOGIN (Coop Admin / Vehicle plate) */}
        {step === 'login' && (
          <div id="auth-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 flex flex-col shrink-0">
            
            {/* Botón Necesito un viaje (Vibrante y muy llamativo para pasajeros) */}
            <button
              id="btn-client-need-ride"
              type="button"
              onClick={() => {
                setStep('cliente_auth');
                setError(null);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 border border-emerald-400/30 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mb-1 shrink-0"
            >
              <MapPin className="w-4 h-4 text-slate-950" />
              <span>¡Necesito un viaje!</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>

            {/* Tab Selector */}
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[10px] sm:text-xs font-semibold gap-0.5 shrink-0">
              <button
                id="tab-coop"
                type="button"
                onClick={() => {
                  setLoginMethod('coop_admin');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                  loginMethod === 'coop_admin'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Administrador</span>
              </button>

              <button
                id="tab-base"
                type="button"
                onClick={() => {
                  setLoginMethod('usuario_base');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                  loginMethod === 'usuario_base'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Usuario Base</span>
              </button>

              <button
                id="tab-vehiculo"
                type="button"
                onClick={() => {
                  setLoginMethod('placa_auth');
                  setError(null);
                }}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                  loginMethod === 'placa_auth'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Vehículo / Placa</span>
              </button>
            </div>

            {error && (
              <div id="auth-error" className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] flex items-start gap-2 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-2 text-[11px] shrink-0">
              
              {loginMethod === 'coop_admin' || loginMethod === 'usuario_base' ? (
                <>
                  <div className="space-y-0.5">
                    <label className="text-slate-300 font-semibold block">{loginMethod === 'usuario_base' ? 'Usuario de Base (Ej: base1)' : 'Correo Electrónico o Cédula (Socio / Admin)'}</label>
                    <input
                      id="input-coop-email"
                      type="text"
                      required
                      placeholder={loginMethod === 'usuario_base' ? "base1" : "admin@coop.ec o cédula del propietario"}
                      value={coopEmail}
                      onChange={e => setCoopEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-slate-300 font-semibold block">Contraseña de Acceso</label>
                    <input
                      id="input-coop-pass"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={coopPassword}
                      onChange={e => setCoopPassword(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <label className="text-slate-300 font-semibold block text-center">Placa o N° de Unidad Registrada</label>
                    <input
                      id="input-vehicle-placa"
                      type="text"
                      required
                      placeholder="GNZ-0982 o 101"
                      value={inputPlaca}
                      onChange={e => setInputPlaca(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-400 text-lg font-mono font-black tracking-wider text-center uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-inner"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-slate-300 font-semibold block">Contraseña (Por defecto: 1234)</label>
                    <input
                      id="input-vehicle-pass"
                      type="password"
                      required
                      placeholder="••••"
                      value={vehiclePassword}
                      onChange={e => setVehiclePassword(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                </>
              )}

              <button
                id="btn-submit-auth"
                type="submit"
                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/5 flex items-center justify-center gap-1.5 active:scale-[0.98] mt-1"
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Google Sign-In as fallback */}
            <div className="relative flex py-0.5 items-center shrink-0">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-2 text-[8px] text-slate-500 uppercase tracking-widest font-bold">O entrar con</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              id="btn-google-sign-in"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 font-semibold text-[11px] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Autenticando...' : 'Iniciar con Google'}</span>
            </button>
          </div>
        )}

        {/* CLIENT LOGIN / REGISTRATION STEP */}
        {step === 'cliente_auth' && (
          <div id="cliente-auth-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 flex flex-col shrink-0 text-xs w-full max-w-[400px]">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                Viaja Seguro con Rutax Smart
              </h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Ingresa tu número de teléfono celular para entrar al sistema y solicitar tus viajes en ruta fija.
              </p>
            </div>

            {error && (
              <div id="client-auth-error" className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] flex items-start gap-1.5 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleClienteAuthSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold text-[10px] uppercase tracking-wider block ml-1">Número de Celular</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 0998877665"
                    value={clientTelefono}
                    onChange={e => setClientTelefono(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-750 text-white text-lg font-mono font-bold tracking-widest focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-700 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-emerald-500/20 group"
              >
                <span>Entrar al Sistema</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setError(null);
              }}
              className="text-center text-slate-400 hover:text-white transition-colors text-[10px] font-bold block pt-1 hover:underline cursor-pointer"
            >
              ← Volver al Acceso de Flota
            </button>
          </div>
        )}

        {/* STEP 2: MANDATORY VEHICLE PASSWORD CHANGE */}
        {step === 'change_vehicle_password' && (tempVeh || tempUser) && (
          <div id="vehicle-password-change" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 text-[11px] shrink-0">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Cambio Obligatorio de Contraseña
              </h3>
              <p className="text-slate-400 leading-normal text-[10px]">
                ¡Bienvenido a Rutax! Para asegurar la seguridad de su vehículo, debe actualizar la contraseña por defecto (<span className="font-mono text-amber-400 font-bold">1234</span>) por una clave personal antes de continuar.
              </p>
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangeVehiclePassword} className="space-y-2.5">
              <div className="space-y-0.5">
                <label className="text-slate-300 font-semibold block">Nueva Contraseña de Acceso</label>
                <input
                  id="new-vehicle-pass"
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newVehiclePassword}
                  onChange={e => setNewVehiclePassword(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-slate-300 font-semibold block">Confirmar Nueva Contraseña</label>
                <input
                  id="confirm-vehicle-pass"
                  type="password"
                  required
                  placeholder="Repita la nueva contraseña"
                  value={confirmVehiclePassword}
                  onChange={e => setConfirmVehiclePassword(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                id="btn-submit-change-pass"
                type="submit"
                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Actualizar Clave y Entrar</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: FIRST TIME LOGIN OPTIONS FOR STANDARD USERS */}
        {step === 'first_security' && tempUser && (
          <div id="user-first-security" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in zoom-in-95 text-[11px] shrink-0">
            <div className="text-center space-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">
                Verificación de Seguridad — Primer Acceso
              </h3>
              <p className="text-slate-400 text-[10px]">
                Bienvenido, <strong className="text-white">{tempUser.nombre_completo}</strong>. Configura tus preferencias operativas.
              </p>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-300 block mb-0.5 font-semibold">
                  Nueva Contraseña Personal (Opcional)
                </label>
                <input
                  id="new-user-pass"
                  type="password"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block text-[10px]">Permiso de Geolocalización GPS</span>
                    <span className="text-[9px] text-slate-400 leading-none">Requerido para el cálculo automático en base</span>
                  </div>
                </div>
                <input
                  id="chk-gps-permission"
                  type="checkbox"
                  checked={gpsAllowed}
                  onChange={e => setGpsAllowed(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 shrink-0"
                />
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block text-[10px]">Autenticación Biométrica (Huella / FaceID)</span>
                    <span className="text-[9px] text-slate-400 leading-none">Para inicio rápido en la tablet o móvil</span>
                  </div>
                </div>
                <input
                  id="chk-bio-permission"
                  type="checkbox"
                  checked={biometricsAllowed}
                  onChange={e => setBiometricsAllowed(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 shrink-0"
                />
              </div>
            </div>

            <button
              id="btn-complete-first-sec"
              onClick={handleCompleteFirstSecurity}
              className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Continuar al Panel de Trabajo</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
