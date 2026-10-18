import React, { useState, useEffect } from 'react';
import { X, Folder, FolderGit2, Plus, RefreshCw, Check, Cloud, Package } from 'lucide-react';
import { ProjectFolder } from '../../types/project';
import { projectApi } from '../../services/projectApi';

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCwd: string;
  onSelectProject: (path: string) => void;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  isOpen,
  onClose,
  currentCwd,
  onSelectProject,
}) => {
  const [projects, setProjects] = useState<ProjectFolder[]>([]);
  const [baseDir, setBaseDir] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.getProjects();
      setProjects(data.projects);
      setBaseDir(data.baseDir);
    } catch (err: any) {
      setError(err.message || 'Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setIsCreating(true);
      const res = await projectApi.createProject({ name: newProjectName.trim() });
      setNewProjectName('');
      await loadProjects();
      onSelectProject(res.path);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear proyecto');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-md h-full bg-[#1f1e1d] border-l border-[#2e2c28] p-6 flex flex-col text-[#ecebe8] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2b27]">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#d97757]" />
            <h2 className="text-base font-semibold text-white">Proyectos y Directorios</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadProjects}
              className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
              title="Recargar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Base Dir Info */}
        <div className="py-3 text-xs text-[#9c968f] border-b border-[#2d2b27]">
          <span className="text-[#77726b]">Directorio raíz del VPS:</span>
          <span className="font-mono text-[11px] block mt-0.5 text-[#dedbd4] truncate">
            {baseDir || '...'}
          </span>
        </div>

        {/* Create Project Form */}
        <form onSubmit={handleCreateProject} className="py-4 border-b border-[#2d2b27]">
          <label className="block text-xs font-medium text-[#b8b3ac] mb-1.5">
            Crear nuevo proyecto en el servidor
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="ej. mi-worker-cloudflare"
              className="flex-1 px-3 py-2 bg-[#171615] border border-[#383531] rounded-xl text-xs text-[#ecebe8] placeholder-[#6b6660] focus:outline-none focus:border-[#d97757]"
            />
            <button
              type="submit"
              disabled={isCreating || !newProjectName.trim()}
              className="px-3.5 py-2 bg-[#d97757] hover:bg-[#c66949] disabled:opacity-40 text-white rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="my-3 p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Project List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {projects.length === 0 && !loading && (
            <div className="text-center py-8 text-[#77726b] text-xs">
              No hay subcarpetas en el directorio base. Crea tu primer proyecto arriba.
            </div>
          )}

          {projects.map((proj) => {
            const isCurrent = currentCwd === proj.path;
            return (
              <div
                key={proj.path}
                onClick={() => {
                  onSelectProject(proj.path);
                  onClose();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#292724] border-[#d97757]/70 text-white shadow-xs'
                    : 'bg-[#181716] border-[#2e2c28] hover:border-[#3d3a35] text-[#b8b3ac]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Folder className={`w-4 h-4 ${isCurrent ? 'text-[#d97757]' : 'text-[#77726b]'}`} />
                    <span className="font-medium text-xs font-mono text-[#ecebe8]">{proj.name}</span>
                  </div>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[11px] text-[#f0a68d] font-mono">
                      <Check className="w-3 h-3" />
                      Activo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[#77726b]">
                  {proj.isGitRepo && (
                    <span className="flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3 text-[#9c968f]" />
                      git
                    </span>
                  )}
                  {proj.hasPackageJson && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-[#9c968f]" />
                      npm
                    </span>
                  )}
                  {proj.hasWrangler && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Cloud className="w-3 h-3" />
                      cloudflare
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
