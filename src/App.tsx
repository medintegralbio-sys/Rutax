import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { rutaxStore } from './services/store';
import { TabletDespacho } from './components/TabletDespacho';
import { DashboardSocio } from './components/DashboardSocio';
import { AppChofer } from './components/AppChofer';
import { DuenoChoferView } from './components/DuenoChoferView';
import { AuthFlow } from './components/AuthFlow';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthGuard } from './components/AuthGuard';
import { useAuth } from './hooks/useAuth';
import { LayoutSuperAdmin } from './components/layouts/LayoutSuperAdmin';
import { LayoutAdminCoop } from './components/layouts/LayoutAdminCoop';
import { AppCliente } from './components/AppCliente';

function LoginRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (user && location.pathname === '/login') {
      const isDuenoChofer = user.rol === 'chofer' && user.rol_secundario === 'socio';
      const effectiveRole = isDuenoChofer ? 'dueno_chofer' : user.rol;
      
      const rutaSegunRol: Record<string, string> = {
        'superadmin': '/superadmin',
        'admin_coop': '/admin',
        'despachador': `/base/${user.base_asignada}`,
        'socio': '/socio',
        'chofer': '/chofer',
        'dueno_chofer': '/dueno-chofer',
        'cliente': '/cliente'
      };
      navigate(rutaSegunRol[effectiveRole] || '/login', { replace: true });
    }
  }, [user, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      <AuthFlow onSuccess={() => {}} />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        
        {/* SUPERADMIN - Responsive */}
        <Route path="/superadmin/*" element={
          <AuthGuard allowedRoles={['superadmin']}>
            <LayoutSuperAdmin />
            <OfflineIndicator />
          </AuthGuard>
        } />
        
        {/* ADMIN COOP - Responsive */}
        <Route path="/admin/*" element={
          <AuthGuard allowedRoles={['admin_coop']}>
            <LayoutAdminCoop />
            <OfflineIndicator />
          </AuthGuard>
        } />
        
        {/* DESPACHADOR - Responsive */}
        <Route path="/base/:baseId" element={
          <AuthGuard allowedRoles={['despachador']}>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
              <main className="flex-1 w-full mx-auto">
                <TabletDespachoWrapper />
              </main>
              <OfflineIndicator />
            </div>
          </AuthGuard>
        } />
        
        {/* SOCIO - Responsive */}
        <Route path="/socio/*" element={
          <AuthGuard allowedRoles={['socio']}>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
              <main className="flex-1 w-full mx-auto p-4">
                <DashboardSocio currentUser={rutaxStore.getCurrentUser()} />
              </main>
              <OfflineIndicator />
            </div>
          </AuthGuard>
        } />
        
        {/* CHOFER - Responsive */}
        <Route path="/chofer/*" element={
          <AuthGuard allowedRoles={['chofer']}>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
              <main className="flex-1 w-full mx-auto p-4">
                <AppChofer currentUser={rutaxStore.getCurrentUser()} />
              </main>
              <OfflineIndicator />
            </div>
          </AuthGuard>
        } />
        
        {/* DUEÑO-CHOFER - Responsive */}
        <Route path="/dueno-chofer/*" element={
          <AuthGuard allowedRoles={['dueno_chofer']}>
            <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
              <main className="flex-1 w-full mx-auto p-4">
                <DuenoChoferView currentUser={rutaxStore.getCurrentUser()} />
              </main>
              <OfflineIndicator />
            </div>
          </AuthGuard>
        } />
        
        {/* CLIENTE / PASAJERO - Móvil & Web */}
        <Route path="/cliente/*" element={
          <AuthGuard allowedRoles={['cliente']}>
            <AppCliente currentUser={rutaxStore.getCurrentUser()} />
            <OfflineIndicator />
          </AuthGuard>
        } />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper to validate baseId for despachador
function TabletDespachoWrapper() {
  const { baseId } = useParams();
  const currentUser = rutaxStore.getCurrentUser();
  
  if (baseId !== currentUser?.base_asignada) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 text-2xl font-bold">!</div>
        <h1 className="text-xl font-bold text-white mb-2">Acceso Denegado a Base</h1>
        <p className="text-slate-400 mb-6">No tienes permiso para ver o gestionar la base: {baseId}</p>
        <button 
          onClick={() => {
            window.location.href = `/base/${currentUser?.base_asignada}`;
          }}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl"
        >
          Volver a Mi Base Asignada
        </button>
      </div>
    );
  }
  
  return (
    <>
      <TabletDespacho currentUser={currentUser} />
    </>
  );
}
