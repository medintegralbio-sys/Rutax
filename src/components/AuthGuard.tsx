import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle special case for 'dueno_chofer' which is represented in the app as rol='chofer' and rol_secundario='socio'
  const isDuenoChofer = user.rol === 'chofer' && user.rol_secundario === 'socio';
  const effectiveRole = isDuenoChofer ? 'dueno_chofer' : user.rol;

  if (!allowedRoles.includes(effectiveRole)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 text-2xl font-bold">!</div>
        <h1 className="text-xl font-bold text-white mb-2">Acceso Denegado</h1>
        <p className="text-slate-400 mb-6">No tienes permiso para ver esta interfaz.</p>
        <button 
          onClick={() => {
            const rutaSegunRol: Record<string, string> = {
              'superadmin': '/superadmin',
              'admin_coop': '/admin',
              'despachador': `/base/${user.base_asignada}`,
              'socio': '/socio',
              'chofer': isDuenoChofer ? '/dueno-chofer' : '/chofer',
              'dueno_chofer': '/dueno-chofer',
              'cliente': '/cliente'
            };
            window.location.href = rutaSegunRol[effectiveRole] || '/login';
          }}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl"
        >
          Volver a mi Interfaz
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
