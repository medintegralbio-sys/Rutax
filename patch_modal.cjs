const fs = require('fs');
const content = fs.readFileSync('src/components/admin/ModalRegistroBase.tsx', 'utf8');

const replacement = `            <div className="grid grid-cols-1 gap-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Número de Base <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 3 (Generará usuario base3)"
                    value={numeroBase}
                    onChange={(e) => setNumeroBase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Nombre de la Base <span className="text-rose-400">*</span>`;

const updated = content.replace(/            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">\n              <div>\n                <label className="text-slate-300 font-bold block mb-1">\n                  Nombre de la Base <span className="text-rose-400">\*<\/span>/, replacement);
fs.writeFileSync('src/components/admin/ModalRegistroBase.tsx', updated);
