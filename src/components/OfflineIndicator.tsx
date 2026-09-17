import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { rutaxStore } from '../services/store';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Intentar vaciar el buffer offline de pings GPS al recuperar conectividad
      try {
        const res = await rutaxStore.flushOfflineTrackingBufferToFirestore();
        if (res.flushedCount > 0) {
          setSyncNotice(`Conectividad restablecida: ${res.flushedCount} pings GPS sincronizados con Firestore`);
          setTimeout(() => setSyncNotice(null), 5000);
        }
      } catch (err) {
        console.warn('Error al vaciar búfer offline:', err);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncNotice(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (syncNotice) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-2xl border border-emerald-400 animate-fade-in">
        <CheckCircle2 className="w-4 h-4 text-slate-950" />
        <span>{syncNotice}</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-2xl border border-amber-400">
      <WifiOff className="w-4 h-4 animate-pulse text-slate-950" />
      <span>Modo Offline activo — Pings GPS guardándose en búfer local para sincronizar con Firestore</span>
    </div>
  );
};
