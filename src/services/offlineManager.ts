import { offlineDb, OfflineAction, GpsPendiente, CacheItem } from './offlineDb';
import { rutaxStore } from './store';

class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: ((status: { isOnline: boolean; syncing: boolean; pendingActions: number; pendingGps: number }) => void)[] = [];
  private sequenceCounter: number = 1;
  private logs: string[] = [];
  private batteryLevel: number = 100;
  private batteryCharging: boolean = false;
  private batteryLowAlertTriggered: boolean = false;

  constructor() {
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
    
    // Initial load of config or seed demo data if empty
    this.initDemoDataAndListeners();
    this.startPeriodicHealthCheck();
    this.initBatteryMonitoring();
  }

  private addLog(message: string) {
    const timeStr = new Date().toLocaleTimeString();
    const entry = `[${timeStr}] ${message}`;
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
  }

  public getLogs(): string[] {
    return this.logs;
  }

  private async initDemoDataAndListeners() {
    try {
      const count = await offlineDb.offline_queue.count();
      if (count === 0) {
        // Seed demo actions as requested in Prompt 8
        await offlineDb.offline_queue.bulkAdd([
          {
            id: 'act-demo-1',
            tipo: 'sumar_pasajero',
            payload: { unidadId: 'u-101', rutaId: 'r-daule-1', incremento: 1 },
            cooperativaId: 'coop-daule',
            usuario_id: 'chofer-15',
            creado_en: Date.now() - 1000 * 60 * 8,
            intentos: 0,
            max_intentos: 5,
            estado: 'pendiente',
            error_ultimo: null,
            prioridad: 'normal',
            orden_local: 1,
            requiere_conflicto_check: false
          },
          {
            id: 'act-demo-2',
            tipo: 'cerrar_viaje',
            payload: { turnoId: 'turno-501', pasajerosTotal: 22 },
            cooperativaId: 'coop-daule',
            usuario_id: 'chofer-15',
            creado_en: Date.now() - 1000 * 60 * 5,
            intentos: 1,
            max_intentos: 5,
            estado: 'pendiente',
            error_ultimo: 'Timeout de red',
            prioridad: 'normal',
            orden_local: 2,
            requiere_conflicto_check: true
          },
          {
            id: 'act-demo-3',
            tipo: 'activar_sos',
            payload: { unidadId: 'u-122', motivo: 'Asistencia urgente requerida' },
            cooperativaId: 'coop-daule',
            usuario_id: 'chofer-22',
            creado_en: Date.now() - 1000 * 60 * 2,
            intentos: 0,
            max_intentos: 5,
            estado: 'pendiente',
            error_ultimo: null,
            prioridad: 'critica',
            orden_local: 3,
            requiere_conflicto_check: false
          }
        ]);

        // Seed GPS pendientes
        const gpsDemo = Array.from({ length: 18 }).map((_, i) => ({
          id: `gps-demo-${i + 1}`,
          unidadId: 'u-101',
          cooperativaId: 'coop-daule',
          lat: -2.122 + i * 0.001,
          lng: -79.895 - i * 0.001,
          velocidad: 35 + (i % 10),
          rumbo: 180,
          precision_metros: 8,
          timestamp_local: Date.now() - (18 - i) * 1000 * 20,
          timestamp_sync: null,
          estado: 'pendiente' as const,
          bateria_nivel: 72,
          despacho_id: 'desp-01'
        }));
        await offlineDb.gps_pendientes.bulkAdd(gpsDemo);

        // Seed config local
        await offlineDb.config_local.put({
          id: 'config_dispositivo',
          cooperativaId: 'coop-daule',
          usuario_id: 'chofer-15',
          rol: 'chofer',
          modo_offline_activo: !this.isOnline,
          ultimo_sync: Date.now() - 1000 * 60 * 12,
          puntos_gps_sin_enviar: 18,
          acciones_pendientes: 3,
          bateria_optimizada: false,
          ubicacion_actual: { lat: -2.122, lng: -79.895, timestamp: Date.now() },
          dispositivo_info: {
            modelo: 'Samsung Galaxy A14',
            os_version: 'Android 13',
            app_version: '1.2.3',
            tiene_lector_huella: true,
            tiene_face_id: false
          }
        });

        this.addLog('Datos demo inicializados en IndexedDB correctamente.');
      }
    } catch (e) {
      console.error('Error inicializando demo IndexedDB:', e);
    }
  }

  private handleConnectionChange(online: boolean) {
    this.isOnline = online;
    this.addLog(online ? 'Conexión a internet restablecida 🟢' : 'Señal de internet perdida 🟡');
    if (online) {
      this.forzarSincronizacion();
    }
    this.notifyListeners();
  }

  private startPeriodicHealthCheck() {
    setInterval(async () => {
      try {
        // Simple fetch or check
        const response = await fetch('/api/health', { method: 'GET', cache: 'no-cache' }).catch(() => null);
        const alive = response !== null && response.ok;
        if (alive !== this.isOnline) {
          this.handleConnectionChange(alive);
        }
      } catch {
        if (this.isOnline) {
          this.handleConnectionChange(false);
        }
      }
    }, 30000);
  }

  private async initBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        this.updateBatteryStatus(battery);
        battery.addEventListener('levelchange', () => this.updateBatteryStatus(battery));
        battery.addEventListener('chargingchange', () => this.updateBatteryStatus(battery));
      } catch (e) {
        console.warn('Battery API not fully supported', e);
      }
    }
  }

  private updateBatteryStatus(battery: any) {
    this.batteryLevel = Math.round(battery.level * 100);
    this.batteryCharging = battery.charging;

    if (this.batteryLevel <= 15 && !this.batteryLowAlertTriggered) {
      this.batteryLowAlertTriggered = true;
      this.addLog(`⚠️ Alerta batería baja: ${this.batteryLevel}%`);
    }
    if (this.batteryLevel > 20) {
      this.batteryLowAlertTriggered = false;
    }
  }

  public subscribe(listener: (status: { isOnline: boolean; syncing: boolean; pendingActions: number; pendingGps: number }) => void) {
    this.listeners.push(listener);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async notifyListeners() {
    const pendingActions = await offlineDb.offline_queue.where('estado').equals('pendiente').count();
    const pendingGps = await offlineDb.gps_pendientes.where('estado').equals('pendiente').count();
    const status = {
      isOnline: this.isOnline,
      syncing: this.syncInProgress,
      pendingActions,
      pendingGps
    };
    this.listeners.forEach(l => l(status));
  }

  // 1. Guardar acción offline
  public async guardarAccionOffline(
    tipo: OfflineAction['tipo'],
    payload: any,
    cooperativaId: string = 'coop-daule',
    usuario_id: string = 'chofer-15',
    prioridad: OfflineAction['prioridad'] = 'normal'
  ): Promise<string> {
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.sequenceCounter++;

    const nuevaAccion: OfflineAction = {
      id,
      tipo,
      payload,
      cooperativaId,
      usuario_id,
      creado_en: Date.now(),
      intentos: 0,
      max_intentos: 5,
      estado: 'pendiente',
      error_ultimo: null,
      prioridad: prioridad === 'critica' || tipo === 'activar_sos' || tipo === 'activar_antirrobo' ? 'critica' : prioridad,
      orden_local: this.sequenceCounter,
      requiere_conflicto_check: ['dar_salida', 'cerrar_viaje', 'marcar_reserva'].includes(tipo)
    };

    await offlineDb.offline_queue.add(nuevaAccion);
    this.addLog(`Acción guardada offline [${tipo}]: ${id}`);
    this.notifyListeners();

    // Si hay internet, intentar sincronizar de inmediato en background
    if (this.isOnline && !this.syncInProgress) {
      this.forzarSincronizacion();
    }

    return id;
  }

  // 4. Guardar GPS offline
  public async guardarGPSOffline(
    unidadId: string,
    cooperativaId: string,
    lat: number,
    lng: number,
    velocidad: number,
    rumbo: number,
    precision_metros: number,
    despacho_id: string | null = null
  ) {
    const id = `gps-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const punto: GpsPendiente = {
      id,
      unidadId,
      cooperativaId,
      lat,
      lng,
      velocidad,
      rumbo,
      precision_metros,
      timestamp_local: Date.now(),
      timestamp_sync: null,
      estado: 'pendiente',
      bateria_nivel: this.batteryLevel,
      despacho_id
    };

    await offlineDb.gps_pendientes.add(punto);
    this.notifyListeners();
  }

  // 8. Forzar sincronización manual o automática
  public async forzarSincronizacion(): Promise<{ syncedActions: number; syncedGps: number; conflicts: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { syncedActions: 0, syncedGps: 0, conflicts: 0 };
    }

    this.syncInProgress = true;
    this.notifyListeners();
    this.addLog('Iniciando sincronización con servidor...');

    let syncedActions = 0;
    let syncedGps = 0;
    let conflicts = 0;

    try {
      // 1. Procesar offline_queue en orden por orden_local y prioridad (críticas primero)
      const pendientes = await offlineDb.offline_queue
        .where('estado')
        .equals('pendiente')
        .sortBy('orden_local');

      for (const accion of pendientes) {
        await offlineDb.offline_queue.update(accion.id, { estado: 'sincronizando' });
        
        try {
          // Simular envío a Firestore / API backend con latencia de red
          await new Promise(resolve => setTimeout(resolve, 350));
          
          // Comprobar reglas de conflicto de negocio simuladas
          const esConflicto = accion.requiere_conflicto_check && Math.random() < 0.05; // 5% simulación de conflicto
          
          if (esConflicto) {
            conflicts++;
            await offlineDb.offline_queue.update(accion.id, {
              estado: 'fallido',
              error_ultimo: 'Conflicto detectado: La acción ya fue procesada por otro operador en la nube.'
            });
            this.addLog(`⚠️ Conflicto detectado en acción ${accion.tipo} (${accion.id})`);
          } else {
            // Éxito
            await offlineDb.offline_queue.update(accion.id, {
              estado: 'sincronizado'
            });
            syncedActions++;
            this.addLog(`✅ Acción sincronizada: ${accion.tipo}`);
            // Aplicar efecto en store de memoria si corresponde
            this.aplicarAccionEnStore(accion);
          }
        } catch (err: any) {
          const intentos = accion.intentos + 1;
          const estadoNuevo = intentos >= accion.max_intentos ? 'fallido' : 'pendiente';
          await offlineDb.offline_queue.update(accion.id, {
            intentos,
            estado: estadoNuevo,
            error_ultimo: err.message || 'Error de red'
          });
        }
      }

      // 2. Sincronizar GPS pendientes en lotes de 50
      const gpsPendientes = await offlineDb.gps_pendientes
        .where('estado')
        .equals('pendiente')
        .limit(50)
        .toArray();

      if (gpsPendientes.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular batch upload
        const ids = gpsPendientes.map(g => g.id);
        await offlineDb.gps_pendientes.where('id').anyOf(ids).modify({ estado: 'enviado', timestamp_sync: Date.now() });
        syncedGps = gpsPendientes.length;
        this.addLog(`🛰️ Lote GPS sincronizado: ${syncedGps} puntos.`);
      }

      // Actualizar config local último sync
      await offlineDb.config_local.update('config_dispositivo', {
        ultimo_sync: Date.now(),
        puntos_gps_sin_enviar: await offlineDb.gps_pendientes.where('estado').equals('pendiente').count(),
        acciones_pendientes: await offlineDb.offline_queue.where('estado').equals('pendiente').count()
      });

      this.addLog(`Sincronización completada. Acciones: ${syncedActions}, GPS: ${syncedGps}, Conflictos: ${conflicts}`);
    } catch (e) {
      this.addLog(`Error crítico durante sincronización: ${e}`);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }

    return { syncedActions, syncedGps, conflicts };
  }

  private aplicarAccionEnStore(accion: OfflineAction) {
    try {
      if (accion.tipo === 'dar_salida' && accion.payload?.turnoId) {
        rutaxStore.darSalidaTurno(accion.payload.turnoId);
      }
    } catch (e) {
      console.warn('No se pudo aplicar acción en store de memoria:', e);
    }
  }

  // 9. Algoritmo adaptativo de frecuencia GPS
  public decidirFrecuenciaGPS(
    estado: 'en_base' | 'en_ruta' | 'detenido' | 'emergencia' | 'antirrobo' | 'zona_riesgo',
    velocidad: number,
    tiempoDetenidoSeg: number = 0,
    zonaRiesgoActiva: boolean = false,
    modoAhorroManual: boolean = false
  ): number {
    if (modoAhorroManual || this.batteryLevel < 10) return 300000; // 5 min (crítico)
    if (this.batteryLevel < 20) return 120000; // 2 min (ahorro)
    if (estado === 'emergencia' || estado === 'antirrobo') return 3000; // 3 seg
    if (zonaRiesgoActiva || zona_Riesgo_Activa(estado)) return 10000; // 10 seg
    if (velocidad > 5) return 30000; // 30 seg en movimiento
    if (velocidad <= 5 && tiempoDetenidoSeg > 120) return 120000; // 2 min detenido
    if (estado === 'en_base') return 300000; // 5 min en base
    return 30000; // Default 30s
  }

  // 21. Obtener información de diagnóstico
  public async obtenerInfoDiagnostico() {
    const queueCount = await offlineDb.offline_queue.count();
    const pendingActions = await offlineDb.offline_queue.where('estado').equals('pendiente').count();
    const pendingGps = await offlineDb.gps_pendientes.where('estado').equals('pendiente').count();
    const cacheCount = await offlineDb.cache_datos.count();
    
    return {
      version: '1.2.3',
      build: '2026.09.16.001',
      cooperativa: 'Daule Express (ID: coop-daule)',
      usuario: 'chofer-15 / admin',
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      totalQueue: queueCount,
      pendingActions,
      pendingGps,
      cacheCount,
      bateria: `${this.batteryLevel}% ${this.batteryCharging ? '(Cargando ⚡)' : ''}`,
      logsCount: this.logs.length,
      deviceModel: 'Samsung Galaxy A14 (Emulado)',
      os: 'Android 13'
    };
  }

  // 23. Limpiar cache
  public async limpiarCache() {
    await offlineDb.cache_datos.clear();
    this.addLog('Caché de datos local limpiada por solicitud de usuario.');
  }

  // 24. Resetear IndexedDB (Factory reset)
  public async resetearIndexedDB() {
    await offlineDb.offline_queue.clear();
    await offlineDb.gps_pendientes.clear();
    await offlineDb.cache_datos.clear();
    await offlineDb.config_local.clear();
    this.addLog('⚠️ IndexedDB reseteada por completo (Factory Reset).');
    await this.initDemoDataAndListeners();
  }
}

function zona_Riesgo_Activa(estado: string): boolean {
  return estado === 'zona_riesgo';
}

export const offlineManager = new OfflineManager();
