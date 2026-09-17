export interface DeviceInfo {
  tipo: 'desktop' | 'tablet' | 'mobile';
  orientacion: 'landscape' | 'portrait';
  ancho: number;
  alto: number;
}

export function detectarDispositivo(): DeviceInfo {
  const ancho = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const alto = typeof window !== 'undefined' ? window.innerHeight : 800;
  const esTablet = /iPad|Android.*Tablet/i.test(navigator.userAgent || '') 
                   && ancho >= 768 && ancho <= 1279;
  const esMobile = ancho < 768 || /Mobile|iPhone|Android/i.test(navigator.userAgent || '');
  const esDesktop = ancho >= 1280 && !esTablet;
  
  return {
    tipo: esDesktop ? 'desktop' : esTablet ? 'tablet' : 'mobile',
    orientacion: ancho > alto ? 'landscape' : 'portrait',
    ancho,
    alto
  };
}
