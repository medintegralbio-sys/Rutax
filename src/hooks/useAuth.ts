import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { rutaxStore } from '../services/store';
import { Usuario } from '../types';

export function useAuth() {
  const [user, setUser] = useState<Usuario | null>(rutaxStore.getCurrentUser());
  const [device, setDevice] = useState(detectarDispositivo());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setDevice(detectarDispositivo());
    window.addEventListener('resize', handleResize);

    const unsubscribe = rutaxStore.subscribe(() => {
      const currentUser = rutaxStore.getCurrentUser();
      setUser(currentUser);

      // Redirigir automáticamente según rol si el usuario se acaba de loguear o cambió
      if (currentUser && location.pathname === '/login') {
        const rutaSegunRol: Record<string, string> = {
          'superadmin': '/superadmin',
          'admin_coop': '/admin',
          'despachador': `/base/${currentUser.base_asignada}`,
          'socio': '/socio',
          'chofer': currentUser.rol_secundario === 'socio' ? '/dueno-chofer' : '/chofer',
          'dueno_chofer': '/dueno-chofer',
          'cliente': '/cliente'
        };
        navigate(rutaSegunRol[currentUser.rol] || '/login', { replace: true });
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, [navigate, location.pathname]);

  return { user, device };
}

function detectarDispositivo() {
  const ancho = window.innerWidth;
  const esTablet = /iPad|Android.*Tablet/i.test(navigator.userAgent) 
                   || (ancho >= 768 && ancho <= 1279);
  const esMobile = ancho < 768 || /Mobile|iPhone|Android/i.test(navigator.userAgent);
  const esDesktop = ancho >= 1280 && !esTablet;
  
  return {
    tipo: esDesktop ? 'desktop' : esTablet ? 'tablet' : 'mobile',
    orientacion: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    ancho: window.innerWidth,
    alto: window.innerHeight
  };
}
