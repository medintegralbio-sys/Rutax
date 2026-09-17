/**
 * RUTAX-SMART — Integración Firebase (Firestore & Authentication)
 * Conexión resiliente, manejo estricto de errores ABAC y sincronización en tiempo real
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Cooperativa, 
  Usuario, 
  Vehiculo, 
  VehiculoPendiente, 
  Base, 
  Turno, 
  LogAuditoria,
  Despacho,
  SolicitudPasajeroRuta,
  LogAuditoriaTurno,
  TrackingHistorial,
  Geocerca,
  AlertaTracking,
  TrackingLive,
  Liquidacion,
  EntregaDia,
  CierreDiario,
  ConfiguracionLiquidacion,
  DisputaLiquidacion
} from '../types';

// 1. Inicialización de Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Tipos de Operación y Estructura Canónica de Error
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  if (errMsg.includes('offline') || errMsg.includes('Could not reach Cloud Firestore backend') || errMsg.includes('unavailable')) {
    console.warn(`[Firestore Offline Mode] (${operationType} en ${path}):`, errMsg);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// 3. Validación de conexión al iniciar con timeout resiliente de 3 segundos
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('the client is offline - connection timeout')), 10000)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
    console.info('Conexión con Firebase Firestore verificada con éxito.');
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('offline') || errMsg.includes('Could not reach Cloud Firestore backend') || errMsg.includes('timeout') || errMsg.includes('unavailable')) {
      console.warn('Firebase Firestore iniciando en modo local / sin conexión persistente.');
    } else {
      console.info('Inicialización Firebase Firestore lista (modo offline):', errMsg);
    }
    return false;
  }
}

// Ejecución de prueba de arranque inmediata
testFirestoreConnection();

// 4. Servicio de Autenticación con Google
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

// 5. Sanitizador de Datos para Firestore (Elimina campos undefined)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data as unknown as T;
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

// 6. Funciones de sincronización Firestore con manejo de errores estricto
export async function syncCooperativaToFirestore(coop: Cooperativa): Promise<void> {
  const path = `cooperativas/${coop.id}`;
  try {
    await setDoc(doc(db, 'cooperativas', coop.id), sanitizeForFirestore(coop), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncUsuarioToFirestore(usuario: Usuario): Promise<void> {
  const path = `usuarios/${usuario.uid}`;
  try {
    await setDoc(doc(db, 'usuarios', usuario.uid), sanitizeForFirestore(usuario), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncVehiculoToFirestore(vehiculo: Vehiculo): Promise<void> {
  const path = `vehiculos/${vehiculo.id}`;
  try {
    await setDoc(doc(db, 'vehiculos', vehiculo.id), sanitizeForFirestore(vehiculo), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncVehiculoPendienteToFirestore(sol: VehiculoPendiente): Promise<void> {
  const path = `vehiculos_pendientes/${sol.id}`;
  try {
    await setDoc(doc(db, 'vehiculos_pendientes', sol.id), sanitizeForFirestore(sol), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncBaseToFirestore(base: Base): Promise<void> {
  const path = `bases/${base.id}`;
  try {
    await setDoc(doc(db, 'bases', base.id), sanitizeForFirestore(base), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncTurnoToFirestore(turno: Turno): Promise<void> {
  const path = `turnos/${turno.id}`;
  try {
    await setDoc(doc(db, 'turnos', turno.id), sanitizeForFirestore(turno), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTurnoFromFirestore(turnoId: string): Promise<void> {
  const path = `turnos/${turnoId}`;
  try {
    await deleteDoc(doc(db, 'turnos', turnoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addAuditLogInFirestore(log: LogAuditoria): Promise<void> {
  const path = `logs_auditoria/${log.id}`;
  try {
    await setDoc(doc(db, 'logs_auditoria', log.id), sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncDespachoToFirestore(despacho: Despacho): Promise<void> {
  const path = `despachos/${despacho.id}`;
  try {
    await setDoc(doc(db, 'despachos', despacho.id), sanitizeForFirestore(despacho), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSolicitudPasajeroToFirestore(solicitud: SolicitudPasajeroRuta): Promise<void> {
  const path = `solicitudes_pasajero_ruta/${solicitud.id}`;
  try {
    await setDoc(doc(db, 'solicitudes_pasajero_ruta', solicitud.id), sanitizeForFirestore(solicitud), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSolicitudPasajeroFromFirestore(solicitudId: string): Promise<void> {
  const path = `solicitudes_pasajero_ruta/${solicitudId}`;
  try {
    await deleteDoc(doc(db, 'solicitudes_pasajero_ruta', solicitudId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncLogAuditoriaTurnoToFirestore(log: LogAuditoriaTurno): Promise<void> {
  const path = `logs_auditoria_turnos/${log.id}`;
  try {
    await setDoc(doc(db, 'logs_auditoria_turnos', log.id), sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ════════════════════════════════════════════════════════════════
// MÓDULO DE TRACKING GPS (FIRESTORE & REALTIME DB)
// ════════════════════════════════════════════════════════════════

export async function syncTrackingHistorialToFirestore(historial: TrackingHistorial): Promise<void> {
  const path = `tracking_historial/${historial.id}`;
  try {
    await setDoc(doc(db, 'tracking_historial', historial.id), sanitizeForFirestore(historial), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncGeocercaToFirestore(geocerca: Geocerca): Promise<void> {
  const path = `geocercas/${geocerca.id}`;
  try {
    await setDoc(doc(db, 'geocercas', geocerca.id), sanitizeForFirestore(geocerca), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGeocercaFromFirestore(geocercaId: string): Promise<void> {
  const path = `geocercas/${geocercaId}`;
  try {
    await deleteDoc(doc(db, 'geocercas', geocercaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAlertaTrackingToFirestore(alerta: AlertaTracking): Promise<void> {
  const path = `alertas_tracking/${alerta.id}`;
  try {
    await setDoc(doc(db, 'alertas_tracking', alerta.id), sanitizeForFirestore(alerta), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function attendAlertaTrackingInFirestore(alertaId: string, atendidaPor: string): Promise<void> {
  const path = `alertas_tracking/${alertaId}`;
  try {
    await updateDoc(doc(db, 'alertas_tracking', alertaId), {
      atendida: true,
      atendida_por: atendidaPor
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ════════════════════════════════════════════════════════════════
// MÓDULO DE LIQUIDACIÓN Y FINANZAS (FIRESTORE)
// ════════════════════════════════════════════════════════════════

export async function syncLiquidacionToFirestore(liquidacion: Liquidacion): Promise<void> {
  const path = `liquidaciones/${liquidacion.id}`;
  try {
    await setDoc(doc(db, 'liquidaciones', liquidacion.id), sanitizeForFirestore(liquidacion), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncEntregaDiaToFirestore(entrega: EntregaDia): Promise<void> {
  const path = `entregas_dia/${entrega.id}`;
  try {
    await setDoc(doc(db, 'entregas_dia', entrega.id), sanitizeForFirestore(entrega), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCierreDiarioToFirestore(cierre: CierreDiario): Promise<void> {
  const path = `cierres_diarios/${cierre.id}`;
  try {
    await setDoc(doc(db, 'cierres_diarios', cierre.id), sanitizeForFirestore(cierre), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncConfiguracionLiquidacionToFirestore(config: ConfiguracionLiquidacion): Promise<void> {
  const docId = (config as any).id || config.cooperativaId;
  const path = `configuracion_liquidacion/${docId}`;
  try {
    await setDoc(doc(db, 'configuracion_liquidacion', docId), sanitizeForFirestore(config), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDisputaToFirestore(disputa: DisputaLiquidacion): Promise<void> {
  const path = `disputas_liquidacion/${disputa.id}`;
  try {
    await setDoc(doc(db, 'disputas_liquidacion', disputa.id), sanitizeForFirestore(disputa), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resolveDisputaInFirestore(
  disputaId: string,
  resolucion: string,
  resueltaPor: string,
  ajusteMonto?: number
): Promise<void> {
  const path = `disputas_liquidacion/${disputaId}`;
  try {
    await updateDoc(doc(db, 'disputas_liquidacion', disputaId), {
      estado: 'resuelta',
      resolucion,
      resuelta_por: resueltaPor,
      ajuste_monto: ajusteMonto || 0,
      timestamp_cierre: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCooperativaFromFirestore(cooperativaId: string): Promise<void> {
  const path = `cooperativas/${cooperativaId}`;
  try {
    await deleteDoc(doc(db, 'cooperativas', cooperativaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


export async function fetchUsuariosFromFirestore(): Promise<Usuario[]> {
  try {
    const qs = await getDocs(collection(db, 'usuarios'));
    return qs.docs.map(d => d.data() as Usuario);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return [];
  }
}

export async function fetchVehiculosFromFirestore(): Promise<Vehiculo[]> {
  try {
    const qs = await getDocs(collection(db, 'vehiculos'));
    return qs.docs.map(d => d.data() as Vehiculo);
  } catch (error) {
    console.error('Error fetching vehiculos:', error);
    return [];
  }
}

export async function fetchBasesFromFirestore(): Promise<Base[]> {
  try {
    const qs = await getDocs(collection(db, 'bases'));
    return qs.docs.map(d => d.data() as Base);
  } catch (error) {
    console.error('Error fetching bases:', error);
    return [];
  }
}

export async function fetchCooperativasFromFirestore(): Promise<Cooperativa[]> {
  try {
    const qs = await getDocs(collection(db, 'cooperativas'));
    return qs.docs.map(d => d.data() as Cooperativa);
  } catch (error) {
    console.error('Error fetching cooperativas:', error);
    return [];
  }
}

export async function fetchTurnosFromFirestore(): Promise<Turno[]> {
  try {
    const qs = await getDocs(collection(db, 'turnos'));
    return qs.docs.map(d => d.data() as Turno);
  } catch (error) {
    console.error('Error fetching turnos:', error);
    return [];
  }
}

export async function fetchAlertasFromFirestore(): Promise<AlertaTracking[]> {
  try {
    const qs = await getDocs(collection(db, 'alertas_tracking'));
    return qs.docs.map(d => d.data() as AlertaTracking);
  } catch (error) {
    console.error('Error fetching alertas_tracking:', error);
    return [];
  }
}

export async function fetchVehiculosPendientesFromFirestore(): Promise<VehiculoPendiente[]> {
  try {
    const qs = await getDocs(collection(db, 'vehiculos_pendientes'));
    return qs.docs.map(d => d.data() as VehiculoPendiente);
  } catch (error) {
    console.error('Error fetching vehiculos_pendientes:', error);
    return [];
  }
}
