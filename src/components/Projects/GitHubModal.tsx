import React, { useState, useEffect } from 'react';
import { X, GitBranch, GitCommit, GitPullRequest, RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, Loader2 } from 'lucide-react';
import { projectApi, GitStatusInfo } from '../../services/projectApi';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCwd: string;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  currentCwd,
}) => {
  const [gitStatus, setGitStatus] = useState<GitStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');

  const loadGitStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.getGitStatus();
      setGitStatus(data);
      if (data.remoteUrl) {
        setRemoteUrl(data.remoteUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener estado de Git');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGitStatus();
    }
  }, [isOpen, currentCwd]);

  if (!isOpen) return null;

  const handleInitGit = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await projectApi.runGitAction({ action: 'init' });
      setSuccessMsg('Repositorio Git inicializado.');
      await loadGitStatus();
    } catch (err: any) {
      setError(err.message || 'Error al inicializar Git');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRemote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl.trim()) return;

    setActionLoading(true);
    setError(null);
    try {
      await projectApi.runGitAction({
        action: 'set-remote',
        remoteUrl: remoteUrl.trim(),
      });
      setSuccessMsg('Repositorio remoto de GitHub vinculado.');
      await loadGitStatus();
    } catch (err: any) {
      setError(err.message || 'Error al configurar remoto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommitPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await projectApi.runGitAction({
        action: 'commit',
        commitMessage: commitMessage.trim() || 'Actualización con OpenCode',
      });
      setSuccessMsg(res.message || 'Cambios guardados en Git y enviados a GitHub.');
      setCommitMessage('');
      await loadGitStatus();
    } catch (err: any) {
      setError(err.message || 'Error al hacer commit/push');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#1f1e1d] border border-[#34312c] rounded-2xl p-6 text-[#ecebe8] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2b27]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#292724] border border-[#383531] rounded-xl text-white">
              <GitBranch className="w-5 h-5 text-[#d97757]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Conexión con GitHub
              </h2>
              <p className="text-xs text-[#9c968f]">
                Sincroniza y guarda tus cambios en un repositorio remoto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadGitStatus}
              className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
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

        {error && (
          <div className="my-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="my-3 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="py-4 space-y-4 text-xs">
          {gitStatus?.isGit ? (
            <>
              {/* Branch & Status */}
              <div className="p-3 bg-[#171615] border border-[#2e2c28] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8e8982]">Rama activa:</span>
                  <span className="font-mono text-white font-semibold flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-[#d97757]" />
                    {gitStatus.branch}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8e8982]">Cambios pendientes:</span>
                  <span className={`font-mono ${gitStatus.hasChanges ? 'text-amber-400 font-semibold' : 'text-[#8e8982]'}`}>
                    {gitStatus.hasChanges ? `${gitStatus.changedFilesCount} archivos modificados` : 'Al día (sin cambios)'}
                  </span>
                </div>

                {gitStatus.lastCommit && (
                  <div className="pt-2 border-t border-[#292724]">
                    <span className="text-[#77726b] block text-[11px] mb-0.5">Último commit:</span>
                    <span className="font-mono text-[11px] text-[#dedbd4] truncate block">
                      {gitStatus.lastCommit}
                    </span>
                  </div>
                )}
              </div>

              {/* Set Remote Form */}
              <form onSubmit={handleSetRemote} className="space-y-1.5">
                <label className="block text-xs font-medium text-[#b8b3ac]">
                  Repositorio Remoto de GitHub
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={remoteUrl}
                    onChange={(e) => setRemoteUrl(e.target.value)}
                    placeholder="https://github.com/usuario/mi-repositorio.git"
                    className="flex-1 px-3 py-2 bg-[#171615] border border-[#383531] rounded-xl text-xs text-[#ecebe8] placeholder-[#6b6660] focus:outline-none focus:border-[#d97757]"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !remoteUrl.trim()}
                    className="px-3.5 py-2 bg-[#292724] hover:bg-[#34312d] text-white rounded-xl text-xs font-medium cursor-pointer transition-colors border border-[#383531] whitespace-nowrap"
                  >
                    Vincular
                  </button>
                </div>
              </form>

              {/* Commit & Push Form */}
              <form onSubmit={handleCommitPush} className="p-3.5 bg-[#171615] border border-[#2e2c28] rounded-xl space-y-3">
                <span className="font-semibold text-white block">
                  Guardar y Enviar Cambios (Commit & Push)
                </span>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Mensaje del commit (ej. Implementar endpoint de auth)..."
                  className="w-full px-3 py-2 bg-[#1f1e1d] border border-[#383531] rounded-lg text-xs text-[#ecebe8] placeholder-[#6b6660] focus:outline-none focus:border-[#d97757]"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#d97757] hover:bg-[#c66949] disabled:opacity-40 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando en GitHub...</span>
                      </>
                    ) : (
                      <>
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>Commit y Push</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-6 text-center space-y-3">
              <GitBranch className="w-8 h-8 mx-auto text-[#77726b]" />
              <p className="text-xs text-[#9c968f]">
                Esta carpeta aún no tiene un repositorio Git inicializado.
              </p>
              <button
                onClick={handleInitGit}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#d97757] hover:bg-[#c66949] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                <span>Inicializar Repositorio Git</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#2d2b27] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#292724] hover:bg-[#32302d] text-[#c2beb7] text-xs font-medium rounded-xl transition-colors cursor-pointer border border-[#383531]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
