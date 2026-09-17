const fs = require('fs');
const content = fs.readFileSync('src/services/store.ts', 'utf8');

const replacement = `  public updateBase(baseId: string, patch: Partial<Base>): boolean {
    const base = this.bases.find(b => b.id === baseId);
    if (!base) return false;

    Object.assign(base, patch);
    saveStorage(STORAGE_KEYS.BASES, this.bases);
    
    // Update or create base user
    if (patch.numero_base) {
      let baseUser = this.usuarios.find(u => u.base_asignada === baseId && u.rol === 'despachador');
      const baseUsername = \`base\${patch.numero_base}\`;
      const newEmail = \`\${baseUsername}@\${base.cooperativaId.replace('coop-', '')}.com\`;
      
      if (baseUser) {
        baseUser.email = newEmail;
        saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
      } else {
        this.usuarios.push({
          uid: \`usr-base-\${Date.now()}\`,
          cooperativaId: base.cooperativaId,
          nombre_completo: \`Administrador \${base.nombre}\`,
          email: newEmail,
          telefono: '0990000000',
          rol: 'despachador',
          base_asignada: base.id,
          password: '1234',
          password_cambiado: false,
          activo: true,
          fecha_registro: new Date().toISOString().split('T')[0]
        });
        saveStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
      }
    }

    this.addAuditLog('EDITAR_BASE', \`Base actualizada: \${base.nombre}\`);
    this.notify();
    return true;
  }`;

const updated = content.replace(/  public updateBase\(baseId: string, patch: Partial<Base>\): boolean {[\s\S]*?return true;\n  }/, replacement);
fs.writeFileSync('src/services/store.ts', updated);
