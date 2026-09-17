const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const replacement = `      const [fsUsuarios, fsVehiculos, fsBases, fsCooperativas, fsTurnos, fsAlertas, fsVehiculosPendientes] = await Promise.all([
        fetchUsuariosFromFirestore(),
        fetchVehiculosFromFirestore(),
        fetchBasesFromFirestore(),
        fetchCooperativasFromFirestore(),
        import('./firebase').then(m => m.fetchTurnosFromFirestore ? m.fetchTurnosFromFirestore() : []),
        import('./firebase').then(m => m.fetchAlertasFromFirestore ? m.fetchAlertasFromFirestore() : []),
        import('./firebase').then(m => m.fetchVehiculosPendientesFromFirestore ? m.fetchVehiculosPendientesFromFirestore() : [])
      ]);

      if (fsCooperativas && fsCooperativas.length > 0) {
        this.cooperativas = fsCooperativas;
        saveStorage(STORAGE_KEYS.COOPERATIVAS, this.cooperativas);
      }
      
      if (fsBases && fsBases.length > 0) {
        this.bases = fsBases;
        saveStorage(STORAGE_KEYS.BASES, this.bases);
      }

      if (fsUsuarios && fsUsuarios.length > 0) {
        this.usuarios = fsUsuarios;
        saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
      }

      if (fsVehiculos && fsVehiculos.length > 0) {
        this.vehiculos = fsVehiculos;
        saveStorage(STORAGE_KEYS.VEHICULOS, this.vehiculos);
      }

      if (fsTurnos && fsTurnos.length > 0) {
        this.turnos = fsTurnos;
        saveStorage(STORAGE_KEYS.TURNOS, this.turnos);
      }

      if (fsAlertas && fsAlertas.length > 0) {
        this.alertasTracking = fsAlertas;
        saveStorage(STORAGE_KEYS.ALERTAS_TRACKING, this.alertasTracking);
      }

      if (fsVehiculosPendientes && fsVehiculosPendientes.length > 0) {
        this.vehiculosPendientes = fsVehiculosPendientes;
        saveStorage(STORAGE_KEYS.VEHICULOS_PENDIENTES, this.vehiculosPendientes);
      }`;

content = content.replace(/      const \[fsUsuarios[\s\S]*?saveStorage\(STORAGE_KEYS.VEHICULOS, this\.vehiculos\);\n      \}/, replacement);

fs.writeFileSync('src/services/store.ts', content);
