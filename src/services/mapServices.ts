/**
 * RUTAX-SMART — Servicios de Mapas Abiertos y Algoritmos GPS
 * Leaflet 1.9+, OpenStreetMap, Nominatim, OSRM y Optimización de Batería Adaptativa
 */

import { Geocerca, GPSAdaptiveStatus, EstadoTrackingUnidad, TrackingPuntoHistorial } from '../types';

// Coordenadas fijas del corredor principal (Sauces 9 ↔ Parque Centenario, Guayaquil)
export const RUTA_CORREDOR_DEFAULT: [number, number][] = [
  [-2.1384, -79.8967], // Base A Sauces 9
  [-2.1435, -79.8990], // Pre-base Sauces (Gasolinera Primax)
  [-2.1492, -79.8960], // Av. Antonio Parra Velasco
  [-2.1550, -79.8935], // Av. Isidro Ayora (Mall del Sol / Aeropuerto)
  [-2.1620, -79.8920], // Intercambiador Juan Tanca Marengo
  [-2.1700, -79.8910], // Av. Plaza Dañín (San Marino / Policentro)
  [-2.1780, -79.8895], // Av. Pedro Menéndez Gilbert
  [-2.1840, -79.8890], // Túneles Cerro Santa Ana / Boyacá
  [-2.1895, -79.8890], // Parque Centenario (Base B Centro)
];

// Cálculo de distancia euclidiana esférica con fórmula Haversine (en metros)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Cálculo de rumbo en grados (0 a 360°)
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = toDeg(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

// Verificación de si un punto está dentro de una geocerca
export function isPointInsideGeocerca(point: { lat: number; lng: number }, geocerca: Geocerca): boolean {
  if (!geocerca.activa) return false;
  const dist = calculateDistanceMeters(point.lat, point.lng, geocerca.lat, geocerca.lng);
  return dist <= geocerca.radio_metros;
}

// Verificación de horario crítico para zonas de riesgo (ej: 20:00 a 04:00)
export function isRiskZoneInCriticalHours(geocerca: Geocerca, referenceDate: Date = new Date()): boolean {
  if (geocerca.tipo !== 'zona_riesgo' || !geocerca.config?.horario_inicio || !geocerca.config?.horario_fin) {
    return false;
  }

  const currentHour = referenceDate.getHours();
  const currentMinute = referenceDate.getMinutes();
  const currentTotalMin = currentHour * 60 + currentMinute;

  const [startH, startM] = geocerca.config.horario_inicio.split(':').map(Number);
  const [endH, endM] = geocerca.config.horario_fin.split(':').map(Number);
  const startTotalMin = startH * 60 + startM;
  const endTotalMin = endH * 60 + endM;

  if (startTotalMin > endTotalMin) {
    // Cruza la medianoche (ej: 20:00 a 04:00)
    return currentTotalMin >= startTotalMin || currentTotalMin <= endTotalMin;
  } else {
    return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
  }
}

// Cálculo de distancia mínima de un punto a una polilínea de ruta (para detección de desvíos)
export function getDistanceToPolylineMeters(point: { lat: number; lng: number }, routeCoords: [number, number][]): number {
  if (routeCoords.length === 0) return 0;
  let minDistance = Infinity;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const p1 = routeCoords[i];
    const p2 = routeCoords[i + 1];
    
    // Distancia al segmento aproximada usando múltiples puntos de prueba
    for (let t = 0; t <= 1; t += 0.25) {
      const latInterp = p1[0] + (p2[0] - p1[0]) * t;
      const lngInterp = p1[1] + (p2[1] - p1[1]) * t;
      const d = calculateDistanceMeters(point.lat, point.lng, latInterp, lngInterp);
      if (d < minDistance) minDistance = d;
    }
  }

  return minDistance;
}

/**
 * LÓGICA DE ENVÍO DE GPS (OPTIMIZACIÓN DE BATERÍA)
 * 
 * Reglas mandatorias del requerimiento:
 * ESTADO              | FRECUENCIA  | PRECISIÓN
 * --------------------|-------------|------------------
 * en_base (quieto)    | cada 5 min  | baja (50m)
 * en_ruta (moviendo)  | cada 30 seg | alta (10m)
 * en_ruta detenido    | cada 2 min  | media (20m)
 * desembarcando       | cada 1 min  | alta (10m)
 * emergencia / SOS    | cada 3 seg  | máxima (5m)
 * apagado / offline   | no envía    | -
 * 
 * Lógica adaptativa:
 * 1. Si velocidad < 5 km/h por 2 min continuos -> bajar frecuencia a cada 2 min
 * 2. Si velocidad > 5 km/h -> subir frecuencia a cada 30 seg
 * 3. Si batería celular < 20% -> modo ahorro (cada 2 min en ruta)
 * 4. Si entra a geocerca zona_riesgo en horario crítico -> forzar frecuencia máxima (cada 3 seg)
 * 5. Si no hay señal -> buffer local IndexedDB / localStorage y sincronizar al volver
 */
export function calculateAdaptiveGPSFrequency(params: {
  estado: EstadoTrackingUnidad;
  velocidadKmh: number;
  segundosDetenido: number; // segundos continuos con velocidad < 5 km/h
  bateriaPorcentaje: number; // 0 a 100
  enZonaRiesgoCritica: boolean;
}): GPSAdaptiveStatus {
  const { estado, velocidadKmh, segundosDetenido, bateriaPorcentaje, enZonaRiesgoCritica } = params;

  // 1. Prioridad Absoluta: Emergencia / SOS o Zona de Riesgo en Horario Crítico
  if (estado === 'emergencia' || enZonaRiesgoCritica) {
    return {
      intervaloSegundos: 3,
      precisionMetros: 5,
      modoAhorroBateria: false,
      forzadoPorZonaRiesgo: enZonaRiesgoCritica,
      motivo: estado === 'emergencia' 
        ? '🚨 MÁXIMA PRIORIDAD: Emergencia SOS activa (transmisión cada 3s)'
        : '⚠️ MÁXIMA PRIORIDAD: Zona de riesgo en horario crítico (transmisión forzada a 3s)',
      puntosEnBufferOffline: getOfflineBufferLength()
    };
  }

  // 2. Estado: En Base (Quieto esperando turno)
  if (estado === 'en_base') {
    return {
      intervaloSegundos: 300, // 5 minutos
      precisionMetros: 50,
      modoAhorroBateria: bateriaPorcentaje < 20,
      forzadoPorZonaRiesgo: false,
      motivo: 'Unidad estacionada en andén de base (transmisión cada 5 min para ahorro de energía)',
      puntosEnBufferOffline: getOfflineBufferLength()
    };
  }

  // 3. Estado: Desembarcando en Bahía
  if (estado === 'desembarcando') {
    return {
      intervaloSegundos: 60, // 1 minuto
      precisionMetros: 10,
      modoAhorroBateria: bateriaPorcentaje < 20,
      forzadoPorZonaRiesgo: false,
      motivo: 'Desembarcando pasajeros en bahía de llegada (transmisión cada 1 min)',
      puntosEnBufferOffline: getOfflineBufferLength()
    };
  }

  // 4. Estado: En Ruta (con adaptabilidad de velocidad y batería baja)
  if (estado === 'en_ruta') {
    // Si la batería es inferior al 20%, entra en modo ahorro forzado
    if (bateriaPorcentaje < 20) {
      return {
        intervaloSegundos: 120, // 2 minutos
        precisionMetros: 20,
        modoAhorroBateria: true,
        forzadoPorZonaRiesgo: false,
        motivo: `🔋 Modo ahorro activado: Batería baja (${bateriaPorcentaje}%), transmisión ajustada a cada 2 min`,
        puntosEnBufferOffline: getOfflineBufferLength()
      };
    }

    // Si está en ruta pero detenido (<5 km/h por >= 120s / 2 minutos continuos)
    if (velocidadKmh < 5 && segundosDetenido >= 120) {
      return {
        intervaloSegundos: 120, // 2 minutos
        precisionMetros: 20,
        modoAhorroBateria: false,
        forzadoPorZonaRiesgo: false,
        motivo: 'En ruta detenido (>2 min en trancón o semáforo): transmisión optimizada a cada 2 min',
        puntosEnBufferOffline: getOfflineBufferLength()
      };
    }

    // En ruta normal en movimiento (> 5 km/h)
    return {
      intervaloSegundos: 30, // 30 segundos
      precisionMetros: 10,
      modoAhorroBateria: false,
      forzadoPorZonaRiesgo: false,
      motivo: `Unidad en tránsito activo (${Math.round(velocidadKmh)} km/h): transmisión regular cada 30s con alta precisión`,
      puntosEnBufferOffline: getOfflineBufferLength()
    };
  }

  // Fallback seguro
  return {
    intervaloSegundos: 60,
    precisionMetros: 20,
    modoAhorroBateria: false,
    forzadoPorZonaRiesgo: false,
    motivo: 'Transmisión estándar regular',
    puntosEnBufferOffline: getOfflineBufferLength()
  };
}

// ════════════════════════════════════════════════════════════════
// BUFFER OFFLINE (INDEXEDDB / LOCALSTORAGE FALLBACK)
// ════════════════════════════════════════════════════════════════

const OFFLINE_STORAGE_KEY = 'rutax_offline_gps_buffer_v1';

export function savePointToOfflineBuffer(point: TrackingPuntoHistorial & { unidadId: string; cooperativaId: string }): void {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push(point);
    // Limitar buffer a un máximo de 500 puntos para evitar saturar almacenamiento local
    if (list.length > 500) list.shift();
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error guardando en buffer offline:', err);
  }
}

export function getOfflineBufferLength(): number {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
}

export function flushOfflineBuffer(): Array<TrackingPuntoHistorial & { unidadId: string; cooperativaId: string }> {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!raw) return [];
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
// SERVICIO DE RUTA OSRM PÚBLICO (GRATUITO, SIN GOOGLE MAPS)
// ════════════════════════════════════════════════════════════════

export async function fetchOSRMRouteGeometry(
  coordinates: [number, number][]
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number }> {
  if (coordinates.length < 2) {
    return { coordinates, distanceKm: 0, durationMin: 0 };
  }

  // Formato OSRM: lng,lat;lng,lat
  const coordString = coordinates.map(c => `${c[1]},${c[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM Status: ${res.status}`);

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      // OSRM devuelve [lng, lat] en GeoJSON, invertimos a [lat, lng] para Leaflet
      const leafletCoords: [number, number][] = route.geometry.coordinates.map(
        (pair: [number, number]) => [pair[1], pair[0]]
      );
      const distanceKm = Number((route.distance / 1000).toFixed(1));
      const durationMin = Math.round(route.duration / 60);
      return { coordinates: leafletCoords, distanceKm, durationMin };
    }
  } catch (err) {
    console.info('OSRM public no disponible en este momento, usando corredor precalculado:', err);
  }

  // Fallback al corredor precalculado realista Sauces - Centro
  let dist = 0;
  for (let i = 0; i < RUTA_CORREDOR_DEFAULT.length - 1; i++) {
    dist += calculateDistanceMeters(
      RUTA_CORREDOR_DEFAULT[i][0],
      RUTA_CORREDOR_DEFAULT[i][1],
      RUTA_CORREDOR_DEFAULT[i + 1][0],
      RUTA_CORREDOR_DEFAULT[i + 1][1]
    );
  }

  return {
    coordinates: RUTA_CORREDOR_DEFAULT,
    distanceKm: Number((dist / 1000).toFixed(1)),
    durationMin: 35
  };
}

// ════════════════════════════════════════════════════════════════
// SERVICIO DE GEOCODIFICACIÓN NOMINATIM (GRATUITO OPENSTREETMAP)
// ════════════════════════════════════════════════════════════════

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export async function searchAddressNominatim(query: string): Promise<NominatimResult[]> {
  if (!query.trim() || query.trim().length < 3) return [];

  // Bounding box preferencial para Guayaquil y alrededores de Ecuador
  const viewbox = '-80.10,-2.00,-79.80,-2.30';
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query + ', Guayaquil, Ecuador'
  )}&viewbox=${viewbox}&bounded=0&limit=5`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'es'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Nominatim error');
    const data: NominatimResult[] = await res.json();
    return data;
  } catch (err) {
    console.warn('Error buscando en Nominatim:', err);
    return [];
  }
}
