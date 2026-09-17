const fs = require('fs');
let content = fs.readFileSync('src/services/store.ts', 'utf8');

const hydrateMethod = `
  public async hydrateFromFirestore(): Promise<void> {
    try {
      const { fetchUsuariosFromFirestore, fetchVehiculosFromFirestore, fetchBasesFromFirestore, fetchCooperativasFromFirestore } = await import('./firebase');
      
      const [fsUsuarios, fsVehiculos, fsBases, fsCooperativas] = await Promise.all([
        fetchUsuariosFromFirestore(),
        fetchVehiculosFromFirestore(),
        fetchBasesFromFirestore(),
        fetchCooperativasFromFirestore()
      ]);

      if (fsCooperativas && fsCooperativas.length > 0) {
        // Merge keeping local if needed? No, just overwrite with cloud
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

      this.notify();
    } catch (e) {
      console.error('Error hydrating store from firestore:', e);
    }
  }

  public async syncAllToFirestore`;

content = content.replace("  public async syncAllToFirestore", hydrateMethod);

fs.writeFileSync('src/services/store.ts', content);
