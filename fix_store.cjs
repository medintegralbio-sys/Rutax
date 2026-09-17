const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const replacement = `    this.enviarNotificacionConductores({
      cooperativaId: coopId,
      titulo: '⚠️ ALERTA EN RUTA',
      mensaje: \`El conductor \${chofer?.nombre_completo} (Unidad \${vehiculo?.numero_unidad}) reporta: \${mapText[subtipo] || subtipo}.\`,
      prioridad: 'critica',
      para: 'todos',
      unidad_destino_id: null,
      requiere_confirmacion: true,
      leer_en_voz_alta: true,
      de: {
        usuario_id: choferId,
        rol: 'chofer',
        nombre: chofer?.nombre_completo || 'Conductor'
      }
    });`;

content = content.replace(/    this\.enviarNotificacionConductores\(\{[\s\S]*?enviado_por_nombre:[^\n]*\n    \}\);/, replacement);
fs.writeFileSync('src/services/store.ts', content);
