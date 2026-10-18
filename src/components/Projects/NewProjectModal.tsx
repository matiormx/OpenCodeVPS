import React, { useState } from 'react';
import { X, Cloud, GitBranch, FolderPlus, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { projectApi } from '../../services/projectApi';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (path: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [template, setTemplate] = useState<'cloudflare-worker' | 'github-clone' | 'blank'>('cloudflare-worker');
  const [name, setName] = useState('');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (template === 'github-clone' && !gitRepoUrl.trim()) {
      setError('Debes ingresar la URL del repositorio de GitHub.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await projectApi.createProject({
        name: name.trim(),
        template,
        gitRepoUrl: template === 'github-clone' ? gitRepoUrl.trim() : undefined,
      });

      onProjectCreated(res.path);
      onClose();
      setName('');
      setGitRepoUrl('');
    } catch (err: any) {
      setError(err.message || 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#1f1e1d] border border-[#34312c] rounded-2xl p-6 text-[#ecebe8] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2b27]">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Crear Nuevo Proyecto
            </h2>
            <p className="text-xs text-[#9c968f]">
              Elige cómo deseas iniciar tu proyecto en el servidor VPS
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Template Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Cloudflare Worker Option */}
            <div
              onClick={() => setTemplate('cloudflare-worker')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                template === 'cloudflare-worker'
                  ? 'bg-[#282420] border-[#d97757] text-white shadow-xs'
                  : 'bg-[#181716] border-[#2e2c28] hover:border-[#3d3a35] text-[#b8b3ac]'
              }`}
            >
              <div>
                <Cloud className={`w-5 h-5 mb-2 ${template === 'cloudflare-worker' ? 'text-[#d97757]' : 'text-[#77726b]'}`} />
                <span className="font-semibold text-xs block mb-1">Cloudflare Worker</span>
                <span className="text-[11px] text-[#8e8982] block leading-tight">
                  wrangler.toml listo para desplegar
                </span>
              </div>
            </div>

            {/* GitHub Clone Option */}
            <div
              onClick={() => setTemplate('github-clone')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                template === 'github-clone'
                  ? 'bg-[#282420] border-[#d97757] text-white shadow-xs'
                  : 'bg-[#181716] border-[#2e2c28] hover:border-[#3d3a35] text-[#b8b3ac]'
              }`}
            >
              <div>
                <GitBranch className={`w-5 h-5 mb-2 ${template === 'github-clone' ? 'text-[#d97757]' : 'text-[#77726b]'}`} />
                <span className="font-semibold text-xs block mb-1">Clonar de GitHub</span>
                <span className="text-[11px] text-[#8e8982] block leading-tight">
                  Descarga un repositorio existente
                </span>
              </div>
            </div>

            {/* Blank Project Option */}
            <div
              onClick={() => setTemplate('blank')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                template === 'blank'
                  ? 'bg-[#282420] border-[#d97757] text-white shadow-xs'
                  : 'bg-[#181716] border-[#2e2c28] hover:border-[#3d3a35] text-[#b8b3ac]'
              }`}
            >
              <div>
                <FolderPlus className={`w-5 h-5 mb-2 ${template === 'blank' ? 'text-[#d97757]' : 'text-[#77726b]'}`} />
                <span className="font-semibold text-xs block mb-1">En Blanco</span>
                <span className="text-[11px] text-[#8e8982] block leading-tight">
                  Directorio vacío con git inicializado
                </span>
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-[#b8b3ac] mb-1.5">
              Nombre del Proyecto / Carpeta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. api-autenticacion-worker"
              required
              className="w-full px-3.5 py-2.5 bg-[#171615] border border-[#383531] rounded-xl text-xs text-[#ecebe8] placeholder-[#6b6660] focus:outline-none focus:border-[#d97757]"
            />
          </div>

          {/* GitHub Repo URL if clone selected */}
          {template === 'github-clone' && (
            <div>
              <label className="block text-xs font-medium text-[#b8b3ac] mb-1.5">
                URL del Repositorio de GitHub
              </label>
              <input
                type="url"
                value={gitRepoUrl}
                onChange={(e) => setGitRepoUrl(e.target.value)}
                placeholder="https://github.com/usuario/nombre-del-repo.git"
                required
                className="w-full px-3.5 py-2.5 bg-[#171615] border border-[#383531] rounded-xl text-xs text-[#ecebe8] placeholder-[#6b6660] focus:outline-none focus:border-[#d97757]"
              />
            </div>
          )}

          {template === 'cloudflare-worker' && (
            <div className="p-3 bg-[#181716] border border-[#2e2c28] rounded-xl text-xs text-[#9c968f] space-y-1">
              <span className="text-[#ecebe8] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d97757]" />
                Incluido automáticamente:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#8e8982]">
                <li><code className="text-[#d97757]">wrangler.toml</code> preconfigurado</li>
                <li><code className="text-[#dedbd4]">src/index.ts</code> con handler TypeScript</li>
                <li>Comando de despliegue en un solo clic a Cloudflare</li>
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#292724] hover:bg-[#32302d] text-[#c2beb7] text-xs font-medium rounded-xl transition-colors cursor-pointer border border-[#383531]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#d97757] hover:bg-[#c66949] disabled:opacity-40 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando proyecto...</span>
                </>
              ) : (
                <>
                  <span>Crear y Abrir</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
