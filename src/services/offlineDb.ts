import Dexie, { Table } from 'dexie';

export interface OfflineAction {
  id: string;
  tipo: 
    | 'crear_turno' 
    | 'dar_salida' 
    | 'sumar_pasajero' 
    | 'cerrar_viaje' 
    | 'activar_sos' 
    | 'activar_antirrobo' 
    | 'marcar_recogida' 
    | 'crear_reserva' 
    | 'marcar_entrega';
  payload: any;
  cooperativaId: string;
  usuario_id: string;
  creado_en: number; // timestamp local
  intentos: number;
  max_intentos: number;
  estado: 'pendiente' | 'sincronizando' | 'sincronizado' | 'fallido';
  error_ultimo: string | null;
  prioridad: 'normal' | 'alta' | 'critica';
  orden_local: number;
  requiere_conflicto_check: boolean;
}

export interface GpsPendiente {
  id: string;
  unidadId: string;
  cooperativaId: string;
  lat: number;
  lng: number;
  velocidad: number;
  rumbo: number;
  precision_metros: number;
  timestamp_local: number;
  timestamp_sync: number | null;
  estado: 'pendiente' | 'enviado';
  bateria_nivel: number;
  despacho_id: string | null;
}

export interface CacheItem {
  id: string; // ej: 'cache_cooperativa_{cooperativaId}'
  tipo: 'cooperativa' | 'bases' | 'vehiculos' | 'turnos_activos' | 'pasajeros_frecuentes' | 'rutas' | 'zonas_riesgo';
  data: any;
  ultima_actualizacion: number;
  version: number;
  expira_en_min: number;
}

export interface ConfigLocal {
  id: string; // 'config_dispositivo'
  cooperativaId: string;
  usuario_id: string;
  rol: string;
  modo_offline_activo: boolean;
  ultimo_sync: number;
  puntos_gps_sin_enviar: number;
  acciones_pendientes: number;
  bateria_optimizada: boolean;
  ubicacion_actual: { lat: number; lng: number; timestamp: number } | null;
  dispositivo_info: {
    modelo: string;
    os_version: string;
    app_version: string;
    tiene_lector_huella: boolean;
    tiene_face_id: boolean;
  };
}

export class RutaxOfflineDatabase extends Dexie {
  offline_queue!: Table<OfflineAction, string>;
  gps_pendientes!: Table<GpsPendiente, string>;
  cache_datos!: Table<CacheItem, string>;
  config_local!: Table<ConfigLocal, string>;

  constructor() {
    super('RutaxSmartOfflineDB');
    this.version(1).stores({
      offline_queue: 'id, estado, prioridad, cooperativaId, creado_en, orden_local',
      gps_pendientes: 'id, estado, unidadId, cooperativaId, timestamp_local',
      cache_datos: 'id, tipo, ultima_actualizacion',
      config_local: 'id'
    });
  }
}

export const offlineDb = new RutaxOfflineDatabase();
