/**
 * RUTAX-SMART — Componente de Mapa Interactivo Leaflet 1.9+
 * Tiles: OpenStreetMap por defecto (gratis ilimitado)
 * Monitoreo GPS en Vivo, Geocercas, Zonas de Riesgo, Corredor de Ruta y Reproductor de Historial
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { rutaxStore } from '../services/store';
import {
  Base,
  ParadaSugerida,
  Vehiculo,
  Geocerca,
  TrackingLive,
  AlertaTracking,
  TrackingHistorial,
  PuntoRecogidaFrecuente
} from '../types';
import {
  Locate,
  Maximize2,
  Navigation,
  Layers,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Zap,
  BatteryCharging,
  Gauge,
  Users,
  Compass,
  Search,
  Home,
  Car,
  X,
  ChevronRight,
  Bus
} from 'lucide-react';
import { RUTA_CORREDOR_DEFAULT, isRiskZoneInCriticalHours } from '../services/mapServices';

interface RutaxMapProps {
  bases?: Base[];
  paradas?: ParadaSugerida[];
  vehiculos?: Vehiculo[];
  geocercas?: Geocerca[];
  trackingLive?: TrackingLive[];
  alertasTracking?: AlertaTracking[];
  selectedHistorial?: TrackingHistorial | null;
  highlightVehiculoId?: string | null;
  puntosCalor?: PuntoRecogidaFrecuente[];
  onMapClick?: (lat: number, lng: number) => void;
  onSelectVehicle?: (unidadId: string) => void;
  onClose?: () => void;
  selectionMode?: 'base' | 'prebase' | 'bahia' | 'parada' | 'geocerca' | null;
  height?: string;
  showFleetLive?: boolean;
  showGeocercas?: boolean;
  showCorridor?: boolean;
  showSearch?: boolean;
  showMapSelector?: boolean;
  showGeocercaLabels?: boolean;
  showBaseLabels?: boolean;
  showHeatLabels?: boolean;
  tileProvider?: 'osm' | 'dark' | 'light';
}

const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};

const TILE_ATTRIBUTIONS = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  dark: '&copy; OpenStreetMap &copy; CARTO',
  light: '&copy; OpenStreetMap &copy; CARTO'
};

export const RutaxMap: React.FC<RutaxMapProps> = ({
  bases = [],
  paradas = [],
  vehiculos = [],
  geocercas = [],
  trackingLive = [],
  alertasTracking = [],
  selectedHistorial = null,
  highlightVehiculoId = null,
  puntosCalor = [],
  onMapClick,
  onSelectVehicle,
  selectionMode = null,
  height = '480px',
  showFleetLive = true,
  showGeocercas = true,
  showCorridor = true,
  showSearch = true,
  showMapSelector = false, // Hidden by default as requested
  showGeocercaLabels = false, // Hidden by default as requested
  showBaseLabels = false, // Hidden by default as requested
  showHeatLabels = false, // Hidden by default as requested
  onClose,
  tileProvider: initialTileProvider = 'osm'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const historyLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentTileProvider, setCurrentTileProvider] = useState<'osm' | 'dark' | 'light'>(initialTileProvider);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playbackTimerRef = useRef<number | null>(null);

  // Estados para el buscador de vehículos en el mapa
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Listado de vehículos activos en vivo (SOLO cuando el chofer inicia sesión y se pone en línea en la aplicación, filtrados por la cooperativa del usuario)
  const currentUser = rutaxStore.getCurrentUser();
  const coopFilter = currentUser?.rol === 'chofer' || currentUser?.rol === 'socio' || currentUser?.rol === 'admin_coop' ? currentUser.cooperativaId : rutaxStore.currentCoopId;
  const liveVehicles = trackingLive.filter(v => !coopFilter || v.cooperativaId === coopFilter);

  // Filtrar vehículos para el buscador
  const filteredVehiclesForSearch = searchQuery.trim() === ''
    ? []
    : liveVehicles.filter(v => 
        (v.numero_unidad && v.numero_unidad.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.placa && v.placa.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.chofer_nombre && v.chofer_nombre.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Manejar selección de vehículo desde el buscador
  const handleSelectVehicleFromSearch = (v: typeof liveVehicles[0]) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([v.lat, v.lng], 16, { animate: true });
      if (onSelectVehicle) {
        onSelectVehicle(v.unidadId);
      }
    }
  };

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centro inicial: Guayaquil corredor Sauces - Centro
      const map = L.map(mapContainerRef.current, {
        center: [-2.164, -79.893],
        zoom: 13,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile por defecto OpenStreetMap
      const tile = L.tileLayer(TILE_URLS[currentTileProvider], {
        attribution: TILE_ATTRIBUTIONS[currentTileProvider],
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tile;
      layerGroupRef.current = L.layerGroup().addTo(map);
      historyLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        }
      });
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Recalcular tamaño de Leaflet cuando el contenedor cambia de dimensiones o pasa a pantalla completa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [height]);

  // Cambiar proveedor de mapa de OpenStreetMap a modo oscuro / claro
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newTile = L.tileLayer(TILE_URLS[currentTileProvider], {
        attribution: TILE_ATTRIBUTIONS[currentTileProvider],
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTile;
    }
  }, [currentTileProvider]);

  // Actualizar capas principales (Bases, Geocercas, Paradas, Corredor, Vehículos GPS en vivo)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Dibujar Corredor Principal OSRM / Ruta precalculada
    if (showCorridor && RUTA_CORREDOR_DEFAULT.length > 1) {
      const corridorPoints: L.LatLngExpression[] = RUTA_CORREDOR_DEFAULT;

      // Búfer del corredor (tolerancia de 500m)
      L.polyline(corridorPoints, {
        color: '#0284c7',
        weight: 12,
        opacity: 0.18,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroup);

      // Trazo principal de la vía
      L.polyline(corridorPoints, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 6'
      }).addTo(layerGroup);
    }

    // 2. Renderizar Geocercas Oficiales
    if (showGeocercas) {
      geocercas.forEach(geo => {
        if (!geo.activa) return;

        let strokeColor = '#10b981'; // base_real
        let fillColor = '#10b981';
        let dashStyle = '5, 5';
        let iconLabel = '📍';

        if (geo.tipo === 'prebase') {
          strokeColor = '#f59e0b';
          fillColor = '#f59e0b';
          iconLabel = '🅿️';
        } else if (geo.tipo === 'bahia_desembarque') {
          strokeColor = '#0284c7';
          fillColor = '#0284c7';
          iconLabel = '🏁';
        } else if (geo.tipo === 'zona_riesgo') {
          const isCritical = isRiskZoneInCriticalHours(geo);
          strokeColor = isCritical ? '#dc2626' : '#ea580c';
          fillColor = strokeColor;
          dashStyle = '3, 4';
          iconLabel = '⚠️';
        }

        // Círculo de geocerca
        L.circle([geo.lat, geo.lng], {
          radius: geo.radio_metros,
          color: strokeColor,
          fillColor,
          fillOpacity: geo.tipo === 'zona_riesgo' ? 0.22 : 0.12,
          weight: 2,
          dashArray: dashStyle
        }).addTo(layerGroup);

        // Marcador central con icono (solo si showGeocercaLabels es true)
        if (showGeocercaLabels) {
          const geoIconHtml = `
            <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <div class="px-2 py-1 rounded-md text-[10px] font-bold shadow-md flex items-center gap-1 border"
                   style="background: #0f172a; color: ${strokeColor}; border-color: ${strokeColor}">
                <span>${iconLabel}</span>
                <span class="max-w-[120px] truncate">${geo.nombre}</span>
              </div>
            </div>
          `;

          const geoIcon = L.divIcon({
            html: geoIconHtml,
            className: 'custom-geocerca-label',
            iconSize: [0, 0]
          });

          const geoMarker = L.marker([geo.lat, geo.lng], { icon: geoIcon }).addTo(layerGroup);
          geoMarker.bindPopup(`
            <div class="p-2 text-slate-900 font-sans text-xs">
              <div class="font-bold text-sm flex items-center gap-1.5" style="color: ${strokeColor}">
                <span>${iconLabel}</span>
                <span>${geo.nombre}</span>
              </div>
              <div class="mt-1 text-[11px] text-slate-600">
                <div><strong>Tipo:</strong> ${geo.tipo.replace('_', ' ').toUpperCase()}</div>
                <div><strong>Radio:</strong> ${geo.radio_metros} metros</div>
                ${geo.config?.horario_inicio ? `<div><strong>Horario de Alerta:</strong> ${geo.config.horario_inicio} a ${geo.config.horario_fin}</div>` : ''}
                ${geo.config?.descripcion ? `<div class="mt-1 text-slate-500 italic">${geo.config.descripcion}</div>` : ''}
              </div>
            </div>
          `);
        }
      });
    }

    // 3. Renderizar Bases Registradas (con forma de Casa)
    bases.forEach(base => {
      const baseIconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -top-1 w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
          <div class="w-9 h-9 rounded-xl bg-slate-900 border-2 border-emerald-400 flex items-center justify-center shadow-lg text-emerald-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>
      `;
      const baseIcon = L.divIcon({
        html: baseIconHtml,
        className: 'custom-map-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([base.lat, base.lng], { icon: baseIcon })
        .addTo(layerGroup)
        .bindPopup(`
          <div class="p-2 text-slate-900 font-sans text-xs">
            <div class="font-bold text-sm text-emerald-700 flex items-center gap-1">
              <span>🏠 ${base.nombre}</span>
            </div>
            <p class="text-slate-600 mt-1">${base.direccion}</p>
            <div class="mt-2 grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded">
              <div><strong>Geocerca:</strong> ${base.radio_geocerca}m</div>
              <div><strong>Tipo:</strong> Base Matriz</div>
            </div>
          </div>
        `);
    });

    // 3.1 Renderizar Mapa de Calor (Puntos de Recogida Frecuentes)
    if (puntosCalor && puntosCalor.length > 0) {
      puntosCalor.forEach(pt => {
        // Intensidad de calor según volumen de recogidas
        const count = pt.total_recogidas || 1;
        const heatColor = count > 30 ? '#ef4444' : count > 15 ? '#f59e0b' : '#3b82f6';
        const heatRadius = Math.min(180, Math.max(40, pt.radio + count * 2));

        // Círculo concéntrico de gradiente de calor
        L.circle([pt.lat, pt.lng], {
          radius: heatRadius,
          color: heatColor,
          fillColor: heatColor,
          fillOpacity: count > 30 ? 0.35 : 0.22,
          weight: 2,
          dashArray: '2, 4'
        }).addTo(layerGroup);

        if (showHeatLabels) {
          const heatIconHtml = `
            <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
              <div class="px-2 py-1 rounded-lg text-[10px] font-black shadow-xl flex items-center gap-1 border-2 transition-transform hover:scale-110"
                   style="background: #090d16; color: ${heatColor}; border-color: ${heatColor}">
                <span>🔥</span>
                <span>${count}</span>
              </div>
            </div>
          `;

          const heatIcon = L.divIcon({
            html: heatIconHtml,
            className: 'custom-heat-label',
            iconSize: [0, 0]
          });

          const heatMarker = L.marker([pt.lat, pt.lng], { icon: heatIcon }).addTo(layerGroup);
          heatMarker.bindPopup(`
            <div class="p-2.5 text-slate-900 font-sans text-xs min-w-[200px]">
              <div class="font-black text-sm flex items-center gap-1.5" style="color: ${heatColor}">
                <span>🔥 ${pt.nombre}</span>
              </div>
              <div class="mt-1.5 space-y-1 text-[11px] text-slate-700">
                <div><strong>Total Recogidas:</strong> <span class="font-bold text-amber-600">${count} viajes</span></div>
                <div><strong>Radio de Cobertura:</strong> ${pt.radio} metros</div>
                <div><strong>Pasajeros Registrados:</strong> ${pt.pasajeros_que_usan?.length || 0} clientes</div>
                <div><strong>Última Recogida:</strong> ${new Date(pt.ultima_recogida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          `);
        }
      });
    }

    // 4. Renderizar Paradas Sugeridas
    paradas.forEach((p, idx) => {
      const paradaIconHtml = `
        <div class="w-6 h-6 rounded-full bg-slate-900 border border-emerald-400 flex items-center justify-center text-emerald-400 font-bold text-[10px] shadow">
          ${p.orden || idx + 1}
        </div>
      `;
      const paradaIcon = L.divIcon({
        html: paradaIconHtml,
        className: 'custom-map-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([p.lat, p.lng], { icon: paradaIcon })
        .addTo(layerGroup)
        .bindPopup(`
          <div class="p-1.5 text-slate-900 font-sans text-xs">
            <span class="font-bold">📍 Parada #${p.orden}: ${p.nombre}</span>
            <div class="text-[10px] text-slate-500">Parada referencial sugerida</div>
          </div>
        `);
    });

    // 5. Renderizar Vehículos GPS en Vivo
    if (showFleetLive) {
      // Usar trackingLive prioritario, complementando con vehiculos si no hay reporte directo (definido a nivel de componente)
      const liveList = liveVehicles;

      liveList.forEach(trk => {
        const isHighlighted = highlightVehiculoId === trk.unidadId;
        const speed = Math.round(trk.velocidad);
        const isEmergency = trk.estado === 'emergencia';
        const isSpeeding = speed > 70;
        const isDeviated = trk.desviado_de_ruta;
        const isLowBattery = trk.bateria_chofer < 20;

        let statusColor = '#38bdf8'; // en_ruta (sky)
        let statusBadge = 'En ruta';
        if (trk.estado === 'en_base') {
          statusColor = '#10b981';
          statusBadge = 'En base';
        } else if (trk.estado === 'desembarcando') {
          statusColor = '#f59e0b';
          statusBadge = 'Desembarcando';
        } else if (isEmergency) {
          statusColor = '#ef4444'; // Rojo fuerte
          statusBadge = 'SOS CRÍTICO';
        } else if (isSpeeding || isDeviated) {
          statusColor = '#f59e0b'; // Amber para advertencias
          statusBadge = isSpeeding ? 'Exceso Vel.' : 'Desviado';
        }

        // Marcador moderno con forma de pequeño vehículo (micro-bus SVG)
        const rotation = trk.rumbo || 0;
        const markerHtml = `
          <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2" id="map-vehicle-${trk.unidadId}">
            ${isEmergency ? `
              <div class="absolute -inset-4 rounded-full bg-rose-600/60 animate-ping"></div>
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white animate-bounce whitespace-nowrap z-20">
                🚨 SOS EN VIVO 🚨
              </div>
            ` : isSpeeding ? `
              <div class="absolute -inset-2 rounded-2xl bg-amber-500/40 animate-ping"></div>
            ` : ''}
            <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-2xl border-2 transition-transform duration-300 hover:scale-115 ${
              isHighlighted ? 'scale-110 ring-4 ring-emerald-400/40' : ''
            } ${isEmergency ? 'animate-pulse' : ''}" style="background: #090d16; border-color: ${statusColor};">
              <div class="w-4 h-4 flex items-center justify-center transition-transform" style="transform: rotate(${rotation}deg);" title="Rumbo: ${rotation}°">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" fill="${statusColor}" fill-opacity="0.2"/>
                  <path d="M14 2H6a2 2 0 0 0-2 2v7h12V4a2 2 0 0 0-2-2z"/>
                  <circle cx="7.5" cy="16.5" r="1.5" fill="${statusColor}"/>
                  <circle cx="16.5" cy="16.5" r="1.5" fill="${statusColor}"/>
                </svg>
              </div>
              <span class="text-[11px] font-mono font-black tracking-tight" style="color: ${statusColor};">
                #${trk.numero_unidad || trk.unidadId.replace('veh-', '')}
              </span>
              <span class="text-xs font-mono font-black text-slate-950 bg-amber-400 border border-slate-900 px-1.5 py-0.5 rounded shadow uppercase tracking-wider">
                ${trk.placa || 'PLACA'}
              </span>
              <span class="text-[10px] font-mono text-slate-300 bg-slate-800/90 px-1 rounded">
                ${speed}k
              </span>
            </div>
            ${isLowBattery ? `
              <span class="absolute -top-1.5 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-slate-900 flex items-center justify-center text-[7px] text-white">⚡</span>
            ` : ''}
          </div>
        `;

        const carIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-vehicle-marker',
          iconSize: [0, 0]
        });

        const marker = L.marker([trk.lat, trk.lng], { icon: carIcon }).addTo(layerGroup);

        marker.on('click', () => {
          if (onSelectVehicle) onSelectVehicle(trk.unidadId);
        });

        marker.bindPopup(`
          <div class="p-2 text-slate-900 font-sans text-xs min-w-[200px]">
            <div class="flex items-center justify-between border-b pb-1.5 mb-1.5">
              <strong class="text-sm font-black flex items-center gap-1">
                <span>🚍 Unidad #${trk.numero_unidad || trk.unidadId}</span>
              </strong>
              <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white" style="background: ${statusColor}">
                ${statusBadge}
              </span>
            </div>

            <!-- Placa de vehículo destacada y agrandada -->
            <div class="my-2 p-2 bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-lg text-center font-mono font-black text-lg md:text-xl tracking-widest shadow-md uppercase">
              🚘 ${trk.placa || 'PLACA'}
            </div>

            <div class="space-y-1 text-[11px] text-slate-700">
              <div class="flex justify-between">
                <span class="text-slate-500">Conductor:</span>
                <span class="font-semibold">${trk.chofer_nombre || 'No asignado'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Velocidad:</span>
                <span class="font-mono font-bold ${isSpeeding ? 'text-rose-600' : 'text-slate-900'}">${speed} km/h</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Pasajeros a bordo:</span>
                <span class="font-mono font-bold text-sky-700">${trk.pasajeros || 0} pax</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Batería móvil:</span>
                <span class="font-mono ${isLowBattery ? 'text-amber-600 font-bold' : 'text-slate-900'}">${trk.bateria_chofer}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Precisión GPS:</span>
                <span class="font-mono text-slate-600">±${trk.precision_gps || 5} m</span>
              </div>
              ${trk.en_zona_riesgo ? `
                <div class="p-1 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold flex items-center gap-1 mt-1">
                  <span>⚠️ En ${trk.zona_riesgo_nombre || 'Zona de Riesgo'}</span>
                </div>
              ` : ''}
              ${isDeviated ? `
                <div class="p-1 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold flex items-center gap-1 mt-1">
                  <span>⚠️ Desviado del corredor oficial</span>
                </div>
              ` : ''}
            </div>
          </div>
        `);
      });
    }

    // Auto-centrar en vehículo seleccionado si existe
    if (highlightVehiculoId) {
      const trk = liveVehicles.find(t => t.unidadId === highlightVehiculoId);
      if (trk && map) {
        map.setView([trk.lat, trk.lng], 16, { animate: true });
      }
    }

    // 6. Renderizar Puntos de Alertas en Ruta (Alertas Amarillas)
    const alertasRuta = rutaxStore.alertasSeguridad.filter(a => a.tipo === 'alerta_amarilla' && a.estado === 'activa');
    alertasRuta.forEach(alerta => {
      if (!coopFilter || alerta.cooperativaId === coopFilter) {
        const alertHtml = `
          <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2" style="z-index: 1000;">
            <div class="absolute -inset-4 rounded-full bg-red-600/40 animate-ping"></div>
            <div class="w-5 h-5 bg-red-600 border-2 border-white rounded-full shadow-lg shadow-red-600/50 flex items-center justify-center animate-bounce relative z-10">
              <span class="text-white text-[10px] font-black">!</span>
            </div>
            <div class="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
              Alerta en ruta
            </div>
          </div>
        `;
        const alertIcon = L.divIcon({
          html: alertHtml,
          className: 'custom-alert-marker',
          iconSize: [0, 0]
        });
        L.marker([alerta.lat, alerta.lng], { icon: alertIcon }).addTo(layerGroup)
          .bindPopup(`
            <div class="p-2 text-slate-900 font-sans text-xs">
              <strong class="text-red-600 font-black">⚠️ ALERTA EN RUTA</strong>
              <div class="mt-1">${alerta.motivo_detalle}</div>
              <div class="text-[10px] text-slate-500 mt-1">Por: ${alerta.choferNombre} (Unidad ${alerta.unidadNumero})</div>
            </div>
          `);
      }
    });

  }, [bases, paradas, vehiculos, geocercas, trackingLive, highlightVehiculoId, showFleetLive, showGeocercas, showCorridor, liveVehicles, rutaxStore.alertasSeguridad.length]);

  // Manejador para reproducción de Historial de Trayecto (Playback)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const historyLayer = historyLayerGroupRef.current;
    if (!map || !historyLayer) return;

    historyLayer.clearLayers();

    if (!selectedHistorial || !selectedHistorial.puntos || selectedHistorial.puntos.length === 0) {
      return;
    }

    const puntos = selectedHistorial.puntos;
    const latlngs: L.LatLngExpression[] = puntos.map(p => [p.lat, p.lng]);

    // 1. Trazado completo del recorrido en color violeta/fucsia
    L.polyline(latlngs, {
      color: '#8b5cf6',
      weight: 4,
      opacity: 0.85
    }).addTo(historyLayer);

    // Marcador de inicio (bandera verde)
    const startPoint = puntos[0];
    const startIcon = L.divIcon({
      html: '<div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">🚩</div>',
      className: 'custom-history-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
      .addTo(historyLayer)
      .bindPopup(`<strong class="text-xs">Inicio Despacho: ${new Date(startPoint.timestamp).toLocaleTimeString()}</strong>`);

    // Marcador de fin (bandera ajedrezada)
    const endPoint = puntos[puntos.length - 1];
    const endIcon = L.divIcon({
      html: '<div class="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white">🏁</div>',
      className: 'custom-history-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([endPoint.lat, endPoint.lng], { icon: endIcon })
      .addTo(historyLayer)
      .bindPopup(`<strong class="text-xs">Llegada a Destino: ${new Date(endPoint.timestamp).toLocaleTimeString()}</strong>`);

    // 2. Marcador activo de reproducción (playback)
    const safeIndex = Math.min(playbackIndex, puntos.length - 1);
    const activePoint = puntos[safeIndex];

    const playbackIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="absolute -inset-2 rounded-full bg-fuchsia-500/40 animate-ping"></div>
          <div class="px-2 py-1 rounded-xl bg-fuchsia-600 text-white text-[11px] font-mono font-bold shadow-2xl border-2 border-white flex items-center gap-1">
            <span>🏎️</span>
            <span>${activePoint.velocidad} km/h</span>
          </div>
        </div>
      `,
      className: 'custom-playback-marker',
      iconSize: [0, 0]
    });

    L.marker([activePoint.lat, activePoint.lng], { icon: playbackIcon }).addTo(historyLayer);

    // Ajustar zoom para abarcar todo el recorrido
    map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
  }, [selectedHistorial, playbackIndex]);

  // Loop de reproducción de historial
  useEffect(() => {
    if (isPlaying && selectedHistorial && selectedHistorial.puntos.length > 0) {
      playbackTimerRef.current = window.setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= selectedHistorial.puntos.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, selectedHistorial]);

  const fitAllMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: L.LatLngExpression[] = [];
    bases.forEach(b => points.push([b.lat, b.lng]));
    paradas.forEach(p => points.push([p.lat, p.lng]));
    geocercas.forEach(g => points.push([g.lat, g.lng]));
    trackingLive.forEach(t => points.push([t.lat, t.lng]));

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  };

  const centerOnBase = (baseId: string) => {
    const base = bases.find(b => b.id === baseId);
    if (base && mapInstanceRef.current) {
      mapInstanceRef.current.setView([base.lat, base.lng], 15, { animate: true });
    }
  };

  return (
    <div 
      className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col w-full h-full"
      style={{ height: height }}
    >
      {/* Top Banner if selectionMode is active */}
      {selectionMode && (
        <div className="absolute top-3 left-3 right-3 z-500 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <Locate className="w-4 h-4 animate-spin text-white" />
            <span>Haz clic en el mapa para marcar las coordenadas de la {selectionMode}.</span>
          </div>
          <span className="bg-slate-900/60 px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider font-mono font-bold">
            {selectionMode}
          </span>
        </div>
      )}

      {/* Close Button (Top-Left) - Independent of search bar */}
      {onClose && (
        <div className="absolute top-3 left-3 z-500">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90"
            title="Cerrar Mapa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Buscador de Vehículos en el Mapa (Top-Left) */}
      {showSearch && (
        <div className={`absolute top-3 ${onClose ? 'left-14' : 'left-3'} z-400 flex flex-col gap-2 w-72 max-w-[calc(100vw-32px)]`}>
          <div className="relative bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300">
            <div className="flex items-center px-3 py-2.5 gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar unidad (Número, placa, chofer)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Delay blur to allow clicking list items
                  setTimeout(() => setIsSearchFocused(false), 250);
                }}
                className="bg-transparent border-none text-slate-100 text-xs w-full focus:outline-none placeholder-slate-400 font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Resultados de Búsqueda */}
            {isSearchFocused && filteredVehiclesForSearch.length > 0 && (
              <div className="max-h-56 overflow-y-auto border-t border-slate-800/80 divide-y divide-slate-800/60 bg-slate-950/98 select-none">
                {filteredVehiclesForSearch.map(v => {
                  const isEngBase = v.estado === 'en_base';
                  return (
                    <div
                      key={v.unidadId}
                      onMouseDown={(e) => {
                        // Prevent blur from closing before selection triggers
                        e.preventDefault();
                      }}
                      onClick={() => handleSelectVehicleFromSearch(v)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-900/80 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-emerald-400 group-hover:text-amber-400 transition-colors">
                            🚍 Unidad #{v.numero_unidad}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0 uppercase font-black">
                            {v.placa}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate mt-1">
                          👤 Conductor: {v.chofer_nombre}
                        </span>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                          isEngBase 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {isEngBase ? 'En base' : `${Math.round(v.velocidad)} km/h`}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono mt-1">
                          🔋 {v.bateria_chofer}% batt
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isSearchFocused && searchQuery.trim() !== '' && filteredVehiclesForSearch.length === 0 && (
              <div className="px-3.5 py-2.5 text-center text-slate-400 text-[11px] italic border-t border-slate-800/80 bg-slate-950/98">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-400 flex flex-col gap-2">
        <button
          onClick={fitAllMarkers}
          title="Ver toda la flota"
          className="w-9 h-9 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Historial Playback Toolbar if active */}
      {selectedHistorial && selectedHistorial.puntos && selectedHistorial.puntos.length > 0 && (
        <div className="absolute top-[72px] left-3 z-400 bg-slate-900/95 backdrop-blur-md border border-purple-500/40 p-3 rounded-2xl shadow-2xl text-xs max-w-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
              <strong className="text-purple-300">Reproducción de Recorrido</strong>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Unidad #{selectedHistorial.numero_unidad} ({selectedHistorial.fecha})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setPlaybackIndex(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Reiniciar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={0}
              max={selectedHistorial.puntos.length - 1}
              value={playbackIndex}
              onChange={e => {
                setIsPlaying(false);
                setPlaybackIndex(Number(e.target.value));
              }}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            <span className="text-[10px] font-mono text-slate-300 whitespace-nowrap">
              {playbackIndex + 1}/{selectedHistorial.puntos.length}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
            <div>Distancia: <span className="font-semibold text-slate-200">{selectedHistorial.distancia_total_km} km</span></div>
            <div>Duración: <span className="font-semibold text-slate-200">{selectedHistorial.duracion_min} min</span></div>
            <div>Vel. Máx: <span className="font-semibold text-slate-200">{selectedHistorial.velocidad_max} km/h</span></div>
          </div>
        </div>
      )}

      {/* Bottom Live Legend */}
      <div className="absolute bottom-3 left-3 z-400 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl flex items-center flex-wrap gap-3 text-[11px] text-slate-300 shadow-xl max-w-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          <span>Corredor Sauces ↔ Centro</span>
        </div>
      </div>

      <div ref={mapContainerRef} style={{ height: height === '100%' ? '100%' : height, width: '100%' }} className="z-10 flex-1 min-h-0 w-full" />
    </div>
  );
};
