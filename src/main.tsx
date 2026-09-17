import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe global overrides for sandboxed iframe environments
if (typeof window !== 'undefined') {
  window.alert = (msg) => {
    console.log("[SAFE INTERCEPTED ALERT]:", msg);
    // Create beautiful floating toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] bg-slate-900 border border-slate-750 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top duration-350 max-w-[90vw] text-[11px] font-bold border-l-4 border-l-emerald-500';
    toast.innerHTML = `
      <span style="color: #10b981; font-size: 14px;">✓</span>
      <span>${msg}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.className += ' animate-out fade-out slide-out-to-top duration-300';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  window.confirm = (msg) => {
    console.log("[SAFE INTERCEPTED CONFIRM]:", msg);
    // Always auto-confirm to guarantee fluent flows in sandbox without locking
    return true;
  };

  window.prompt = (msg, defaultValue) => {
    console.log("[SAFE INTERCEPTED PROMPT]:", msg);
    // Sensible fallbacks for common prompt patterns
    if (msg?.toLowerCase().includes('motivo')) {
      return 'Cancelación programada / Tránsito habitual';
    }
    if (msg?.toLowerCase().includes('nombre')) {
      return 'Punto de Parada #' + Math.floor(100 + Math.random() * 900);
    }
    return defaultValue || '';
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
