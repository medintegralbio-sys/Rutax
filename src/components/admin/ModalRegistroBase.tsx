import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Base, PreBaseConfig } from '../../types';
import {
  Building2,
  MapPin,
  Locate,
  Navigation,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Compass,
  Layers,
  X,
  Plus,
  Car,
  Shield,
  Info
} from 'lucide-react';

interface ModalRegistroBaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (baseData: {
    numero_base?: string;
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
    capacidad_max: number;
    radio_geocerca: number;
    tiene_prebase: boolean;
    prebase?: PreBaseConfig;
  }) => void;
  editingBase?: Base | null;
}

interface SearchResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_LAT = -2.1400;
const DEFAULT_LNG = -79.8950;

export const ModalRegistroBase: React.FC<ModalRegistroBaseProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBase
}) => {
  // Form state
  const [numeroBase, setNumeroBase] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [capacidadMax, setCapacidadMax] = useState<number>(4);
  const [radioGeocerca, setRadioGeocerca] = useState<number>(150);

  // Prebase state
  const [tienePrebase, setTienePrebase] = useState<boolean>(true);
  const [prebaseNombre, setPrebaseNombre] = useState('Pre-Base de Espera');
  const [prebaseLat, setPrebaseLat] = useState<number>(DEFAULT_LAT - 0.004);
  const [prebaseLng, setPrebaseLng] = useState<number>(DEFAULT_LNG - 0.003);
  const [prebaseCapacidad, setPrebaseCapacidad] = useState<number>(15);
  const [prebaseRadio, setPrebaseRadio] = useState<number>(200);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // GPS real-time acquisition state
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Tab for location picking mode in modal: Base principal vs Pre-base
  const [activePinTarget, setActivePinTarget] = useState<'base' | 'prebase'>('base');

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseMarkerRef = useRef<L.Marker | null>(null);
  const baseCircleRef = useRef<L.Circle | null>(null);
  const prebaseMarkerRef = useRef<L.Marker | null>(null);
  const prebaseCircleRef = useRef<L.Circle | null>(null);

  // Initialize or update fields when editingBase changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (editingBase) {
      setNumeroBase(editingBase.numero_base || '');
      setNombre(editingBase.nombre || '');
      setDireccion(editingBase.direccion || '');
      const bLat = editingBase.lat ?? editingBase.latitud ?? DEFAULT_LAT;
      const bLng = editingBase.lng ?? editingBase.longitud ?? DEFAULT_LNG;
      setLat(bLat);
      setLng(bLng);
      setCapacidadMax(editingBase.capacidad_max || editingBase.capacidad_base || 4);
      setRadioGeocerca(editingBase.radio_geocerca || 150);

      const hasPre = !!editingBase.tiene_prebase;
      setTienePrebase(hasPre);
      if (editingBase.prebase) {
        setPrebaseNombre(editingBase.prebase.nombre || 'Pre-Base');
        setPrebaseLat(editingBase.prebase.lat || bLat - 0.004);
        setPrebaseLng(editingBase.prebase.lng || bLng - 0.003);
        setPrebaseCapacidad(editingBase.prebase.capacidad_max || 15);
        setPrebaseRadio(editingBase.prebase.radio_geocerca || 200);
      } else {
        setPrebaseNombre('Pre-Base de Espera');
        setPrebaseLat(bLat - 0.004);
        setPrebaseLng(bLng - 0.003);
        setPrebaseCapacidad(15);
        setPrebaseRadio(200);
      }
    } else {
      // New base defaults
      setNumeroBase('');
      setNombre('');
      setDireccion('');
      setLat(DEFAULT_LAT);
      setLng(DEFAULT_LNG);
      setCapacidadMax(4);
      setRadioGeocerca(150);
      setTienePrebase(true);
      setPrebaseNombre('Pre-Base de Espera');
      setPrebaseLat(DEFAULT_LAT - 0.004);
      setPrebaseLng(DEFAULT_LNG - 0.003);
      setPrebaseCapacidad(15);
      setPrebaseRadio(200);
    }

    setGpsFeedback(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setActivePinTarget('base');
  }, [isOpen, editingBase]);

  // Leaflet Map Initialization & Lifecycle
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        baseMarkerRef.current = null;
        baseCircleRef.current = null;
        prebaseMarkerRef.current = null;
        prebaseCircleRef.current = null;
      }
      return;
    }

    // Small timeout to ensure DOM container is rendered
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const initialTargetLat = lat || DEFAULT_LAT;
        const initialTargetLng = lng || DEFAULT_LNG;

        const map = L.map(mapContainerRef.current, {
          center: [initialTargetLat, initialTargetLng],
          zoom: 15,
          zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Custom icon for Main Base (Emerald)
        const baseIcon = L.divIcon({
          className: 'custom-base-icon',
          html: `
            <div style="
              background: #059669;
              color: white;
              width: 38px;
              height: 38px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: grab;
            ">
              <div style="transform: rotate(45deg); font-weight: 900; font-size: 13px;">🏢</div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38]
        });

        // Custom icon for Pre-base (Amber)
        const prebaseIcon = L.divIcon({
          className: 'custom-prebase-icon',
          html: `
            <div style="
              background: #d97706;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: grab;
            ">
              <div style="transform: rotate(45deg); font-weight: 900; font-size: 11px;">🅿️</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        // Main Base Marker
        const baseMarker = L.marker([initialTargetLat, initialTargetLng], {
          icon: baseIcon,
          draggable: true
        }).addTo(map);

        // Main Base Geofence Circle
        const baseCircle = L.circle([initialTargetLat, initialTargetLng], {
          radius: radioGeocerca,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 4'
        }).addTo(map);

        baseMarker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
          baseCircle.setLatLng(pos);
          reverseGeocode(newLat, newLng);
        });

        baseMarkerRef.current = baseMarker;
        baseCircleRef.current = baseCircle;

        // Pre-base Marker & Circle if enabled
        if (tienePrebase) {
          const pMarker = L.marker([prebaseLat, prebaseLng], {
            icon: prebaseIcon,
            draggable: true
          }).addTo(map);

          const pCircle = L.circle([prebaseLat, prebaseLng], {
            radius: prebaseRadio,
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.14,
            weight: 2,
            dashArray: '3, 3'
          }).addTo(map);

          pMarker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            const newLat = Number(pos.lat.toFixed(6));
            const newLng = Number(pos.lng.toFixed(6));
            setPrebaseLat(newLat);
            setPrebaseLng(newLng);
            pCircle.setLatLng(pos);
          });

          prebaseMarkerRef.current = pMarker;
          prebaseCircleRef.current = pCircle;
        }

        // Map Click: Move marker for currently active target
        map.on('click', (e: L.LeafletMouseEvent) => {
          const clickedLat = Number(e.latlng.lat.toFixed(6));
          const clickedLng = Number(e.latlng.lng.toFixed(6));

          if (activePinTarget === 'base' && baseMarkerRef.current && baseCircleRef.current) {
            baseMarkerRef.current.setLatLng(e.latlng);
            baseCircleRef.current.setLatLng(e.latlng);
            setLat(clickedLat);
            setLng(clickedLng);
            reverseGeocode(clickedLat, clickedLng);
          } else if (activePinTarget === 'prebase' && prebaseMarkerRef.current && prebaseCircleRef.current) {
            prebaseMarkerRef.current.setLatLng(e.latlng);
            prebaseCircleRef.current.setLatLng(e.latlng);
            setPrebaseLat(clickedLat);
            setPrebaseLng(clickedLng);
          }
        });

        mapInstanceRef.current = map;
      } else {
        // Invalidate size in case modal layout shifted
        mapInstanceRef.current.invalidateSize();
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Sync Base Marker & Circle when lat, lng, or radioGeocerca change
  useEffect(() => {
    if (mapInstanceRef.current && baseMarkerRef.current && baseCircleRef.current) {
      const currentPos = baseMarkerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        baseMarkerRef.current.setLatLng([lat, lng]);
        baseCircleRef.current.setLatLng([lat, lng]);
      }
      baseCircleRef.current.setRadius(radioGeocerca);
    }
  }, [lat, lng, radioGeocerca]);

  // Sync Prebase Marker & Circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tienePrebase) {
      if (!prebaseMarkerRef.current) {
        const prebaseIcon = L.divIcon({
          className: 'custom-prebase-icon',
          html: `
            <div style="
              background: #d97706;
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: grab;
            ">
              <div style="transform: rotate(45deg); font-weight: 900; font-size: 11px;">🅿️</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const pMarker = L.marker([prebaseLat, prebaseLng], {
          icon: prebaseIcon,
          draggable: true
        }).addTo(mapInstanceRef.current);

        const pCircle = L.circle([prebaseLat, prebaseLng], {
          radius: prebaseRadio,
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.14,
          weight: 2,
          dashArray: '3, 3'
        }).addTo(mapInstanceRef.current);

        pMarker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          setPrebaseLat(newLat);
          setPrebaseLng(newLng);
          pCircle.setLatLng(pos);
        });

        prebaseMarkerRef.current = pMarker;
        prebaseCircleRef.current = pCircle;
      } else {
        prebaseMarkerRef.current.setLatLng([prebaseLat, prebaseLng]);
        if (prebaseCircleRef.current) {
          prebaseCircleRef.current.setLatLng([prebaseLat, prebaseLng]);
          prebaseCircleRef.current.setRadius(prebaseRadio);
        }
      }
    } else {
      if (prebaseMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(prebaseMarkerRef.current);
        prebaseMarkerRef.current = null;
      }
      if (prebaseCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(prebaseCircleRef.current);
        prebaseCircleRef.current = null;
      }
    }
  }, [tienePrebase, prebaseLat, prebaseLng, prebaseRadio]);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const shortAddress = [
            addr.road || addr.street,
            addr.suburb || addr.neighbourhood || addr.city_district,
            addr.city || addr.town || addr.county
          ].filter(Boolean).join(', ');

          if (shortAddress && !direccion) {
            setDireccion(shortAddress);
          }
        }
      }
    } catch {
      // Non-blocking reverse geocoding fallback
    }
  };

  // Real-time GPS location acquisition handler
  const handleGetRealtimeGPS = () => {
    if (!navigator.geolocation) {
      setGpsFeedback({
        type: 'error',
        message: 'La geolocalización GPS no es soportada por este navegador o dispositivo.'
      });
      return;
    }

    setIsGettingGPS(true);
    setGpsFeedback({
      type: 'info',
      message: 'Capturando coordenadas satelitales en tiempo real...'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gpsLat = Number(position.coords.latitude.toFixed(6));
        const gpsLng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy || 10);

        if (activePinTarget === 'base') {
          setLat(gpsLat);
          setLng(gpsLng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([gpsLat, gpsLng], 17, { animate: true, duration: 1.2 });
          }
          reverseGeocode(gpsLat, gpsLng);
          setGpsFeedback({
            type: 'success',
            message: `✓ Ubicación GPS en tiempo real obtenida (${gpsLat}, ${gpsLng}) con precisión de ±${accuracy}m.`
          });
        } else {
          setPrebaseLat(gpsLat);
          setPrebaseLng(gpsLng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([gpsLat, gpsLng], 17, { animate: true, duration: 1.2 });
          }
          setGpsFeedback({
            type: 'success',
            message: `✓ Ubicación GPS asignada a la Pre-Base (${gpsLat}, ${gpsLng}).`
          });
        }

        setIsGettingGPS(false);
      },
      (error) => {
        setIsGettingGPS(false);
        let errorMsg = 'No se pudo obtener la señal GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso de ubicación denegado en el navegador. Por favor habilita el acceso GPS o ubica el punto manualmente en el mapa.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'La señal de ubicación GPS no está disponible en este momento.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'El tiempo de espera para obtener el GPS expiró.';
        }
        setGpsFeedback({
          type: 'error',
          message: errorMsg
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // Search places / addresses on the map
  const handleSearchPlaces = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    setGpsFeedback(null);

    try {
      const encoded = encodeURIComponent(searchQuery.trim());
      // Filter primarily for Ecuador results
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=ec&limit=6&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search dropdown
  const handleSelectSearchResult = (result: SearchResult) => {
    const sLat = Number(parseFloat(result.lat).toFixed(6));
    const sLng = Number(parseFloat(result.lon).toFixed(6));

    if (activePinTarget === 'base') {
      setLat(sLat);
      setLng(sLng);
      // If address is empty or generic, use clean title from display_name
      const cleanAddr = result.display_name.split(',').slice(0, 3).join(',').trim();
      if (!direccion || direccion.trim() === '') {
        setDireccion(cleanAddr);
      }
      if (!nombre || nombre.trim() === '') {
        const suggestedName = `Base ${result.display_name.split(',')[0].trim()}`;
        setNombre(suggestedName);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([sLat, sLng], 17, { animate: true, duration: 1.2 });
      }
      setGpsFeedback({
        type: 'success',
        message: `✓ Base ubicada en: "${result.display_name.split(',')[0]}"`
      });
    } else {
      setPrebaseLat(sLat);
      setPrebaseLng(sLng);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([sLat, sLng], 17, { animate: true, duration: 1.2 });
      }
      setGpsFeedback({
        type: 'success',
        message: `✓ Pre-Base ubicada en: "${result.display_name.split(',')[0]}"`
      });
    }

    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Center map on currently set Base coordinates
  const handleCenterOnBase = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true });
    }
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      numero_base: numeroBase.trim(),
      nombre: nombre.trim(),
      direccion: direccion.trim() || 'Sector terminal georreferenciado',
      lat: Number(lat),
      lng: Number(lng),
      capacidad_max: Number(capacidadMax),
      radio_geocerca: Number(radioGeocerca),
      tiene_prebase: tienePrebase,
      prebase: tienePrebase ? {
        nombre: prebaseNombre.trim() || 'Pre-Base de Espera',
        lat: Number(prebaseLat),
        lng: Number(prebaseLng),
        radio_geocerca: Number(prebaseRadio),
        capacidad_max: Number(prebaseCapacidad),
        distancia_a_base: 800
      } : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-4xl w-full my-auto text-slate-100 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-100 flex items-center gap-2">
                {editingBase ? 'Editar Base de Transporte' : 'Registrar Nueva Base Operativa'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubica el andén mediante GPS en tiempo real o búscalo directamente en el mapa satelital.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5 custom-scrollbar">
          
          {/* Map Location Picker Section with Search and GPS Buttons */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Geoposicionamiento Satelital Interactivo
                </span>
              </div>

              {/* Target pin selector: Base Principal vs Pre-base */}
              {tienePrebase && (
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePinTarget('base')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      activePinTarget === 'base'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🏢 Base Principal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePinTarget('prebase')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                      activePinTarget === 'prebase'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🅿️ Pre-Base</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action Tools Bar (GPS in real-time + Search in Map) */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              
              {/* Button: Real-time GPS Location */}
              <button
                type="button"
                onClick={handleGetRealtimeGPS}
                disabled={isGettingGPS}
                className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer"
                title="Capturar ubicación actual de tu dispositivo móvil o navegador"
              >
                {isGettingGPS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Conectando GPS...</span>
                  </>
                ) : (
                  <>
                    <Locate className="w-4 h-4 text-slate-950 animate-pulse" />
                    <span>Tomar Ubicación en Tiempo Real (GPS)</span>
                  </>
                )}
              </button>

              {/* Search Bar on Map */}
              <div className="relative flex-1">
                <form onSubmit={handleSearchPlaces} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar punto, terminal, calle o sector en Ecuador..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSearchResults(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-20 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sky-400 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buscar'}
                  </button>
                </form>

                {/* Autocomplete / Search results dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                    <div className="p-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-semibold px-3">
                      <span>Resultados de búsqueda ({searchResults.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowSearchResults(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕ Cerrar
                      </button>
                    </div>
                    {searchResults.map((res) => (
                      <button
                        key={res.place_id}
                        type="button"
                        onClick={() => handleSelectSearchResult(res)}
                        className="w-full text-left p-2.5 hover:bg-emerald-500/10 hover:border-l-4 hover:border-emerald-500 text-xs border-b border-slate-800/60 transition-all flex items-start gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-200">{res.display_name.split(',')[0]}</p>
                          <p className="text-[10px] text-slate-400 truncate">{res.display_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* GPS Feedback Notice */}
            {gpsFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
                  gpsFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : gpsFeedback.type === 'error'
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {gpsFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : gpsFeedback.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-sky-400" />
                  )}
                  <span>{gpsFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsFeedback(null)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Interactive Leaflet Map Container */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-md">
              <div
                ref={mapContainerRef}
                style={{ height: '300px', width: '100%' }}
                className="z-10"
              />

              {/* Floating Helper Legend inside Map */}
              <div className="absolute top-2 left-2 z-400 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  🏢 Base ({radioGeocerca}m)
                </span>
                {tienePrebase && (
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    🅿️ Pre-Base ({prebaseRadio}m)
                  </span>
                )}
              </div>

              {/* Center Map shortcut */}
              <button
                type="button"
                onClick={handleCenterOnBase}
                className="absolute bottom-3 left-3 z-400 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Centrar en Base</span>
              </button>

              <div className="absolute bottom-3 right-12 z-400 bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 px-2 py-1 rounded text-[10px] text-slate-400 pointer-events-none">
                📍 Arrastra el marcador o haz clic en el mapa
              </div>
            </div>

            {/* Visual Coordinates Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  GPS Base Principal:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              </div>

              {tienePrebase && (
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    GPS Pre-Base:
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {prebaseLat.toFixed(6)}, {prebaseLng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields: General Info */}
          <form id="base-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Número de Base <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 3 (Generará usuario base3)"
                    value={numeroBase}
                    onChange={(e) => setNumeroBase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Nombre de la Base <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Base Terminal Sauces 9"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Dirección o Referencia Vial <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Antonio Parra Velasco y Sauces 9"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Operational Parameters: Capacity and Geofence Radius */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                  Capacidad Andenes
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={40}
                    required
                    value={capacidadMax}
                    onChange={(e) => setCapacidadMax(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400 text-[11px]">unid.</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                  Radio Geocerca
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={30}
                    max={600}
                    step={10}
                    required
                    value={radioGeocerca}
                    onChange={(e) => setRadioGeocerca(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400 text-[11px]">mts</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                  Latitud Exacta
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                  Longitud Exacta
                </label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Pre-Base Toggle & Configuration */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🅿️</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">Pre-Base Satelital de Espera (FIFO)</h4>
                    <p className="text-[11px] text-slate-400">
                      Bolsón exterior de estacionamiento para unidades cuando los andenes principales estén llenos.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tienePrebase}
                    onChange={(e) => setTienePrebase(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {tienePrebase && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
                  <div>
                    <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                      Nombre Pre-Base
                    </label>
                    <input
                      type="text"
                      value={prebaseNombre}
                      onChange={(e) => setPrebaseNombre(e.target.value)}
                      placeholder="Ej: Pre-Base Sauces Espera"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                      Capacidad Bolsón Pre-Base
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={prebaseCapacidad}
                        onChange={(e) => setPrebaseCapacidad(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <span className="text-slate-400 text-[11px]">unid.</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                      Radio Geocerca Pre-Base
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={50}
                        max={800}
                        step={10}
                        value={prebaseRadio}
                        onChange={(e) => setPrebaseRadio(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                      />
                      <span className="text-slate-400 text-[11px]">mts</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2 shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>Al guardar, las geocercas se activan inmediatamente en el monitoreo satelital.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="base-form"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingBase ? 'Guardar Cambios de Base' : 'Registrar Base Operativa'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
