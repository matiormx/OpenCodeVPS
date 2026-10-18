import React, { useState } from 'react';
import { X, Cloud, Rocket, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { projectApi } from '../../services/projectApi';

interface DeployCloudflareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCwd: string;
  onViewTerminal: () => void;
}

export const DeployCloudflareModal: React.FC<DeployCloudflareModalProps> = ({
  isOpen,
  onClose,
  currentCwd,
  onViewTerminal,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerUrl, setWorkerUrl] = useState<string | null>(null);
  const [outputLog, setOutputLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const projectName = currentCwd.split('/').slice(-1)[0] || 'worker';

  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    setWorkerUrl(null);
    setOutputLog(null);

    try {
      const res = await projectApi.deployCloudflare(currentCwd);
      if (res.success) {
        setWorkerUrl(res.workerUrl || null);
        setOutputLog(res.output || 'Despliegue finalizado exitosamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error durante el despliegue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#1f1e1d] border border-[#34312c] rounded-2xl p-6 text-[#ecebe8] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2b27]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#292724] border border-[#383531] rounded-xl text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Desplegar a Cloudflare Workers
              </h2>
              <p className="text-xs text-[#9c968f]">
                Publica tu código en la red global de Cloudflare con Wrangler
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Target project */}
          <div className="p-3 bg-[#171615] border border-[#2e2c28] rounded-xl space-y-1">
            <span className="text-[#8e8982] block">Proyecto a desplegar:</span>
            <span className="font-mono text-xs font-semibold text-white block">
              {projectName}
            </span>
            <span className="font-mono text-[11px] text-[#706b64] block truncate">
              {currentCwd}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {workerUrl && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Tu Worker está en vivo en Cloudflare!</span>
              </div>
              <div className="flex items-center justify-between bg-[#151413] p-2.5 rounded-lg border border-[#2d2b27]">
                <span className="font-mono text-[11px] text-[#ecebe8] truncate max-w-xs">
                  {workerUrl}
                </span>
                <a
                  href={workerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-[#d97757] hover:underline"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {outputLog && !workerUrl && (
            <div className="p-3 bg-[#141312] border border-[#292724] rounded-xl font-mono text-[11px] text-[#c7c3bc] max-h-36 overflow-y-auto whitespace-pre-wrap">
              {outputLog}
            </div>
          )}

          <div className="p-3 bg-[#181716] border border-[#2e2c28] rounded-xl text-[#9c968f] text-[11px] leading-relaxed">
            Se ejecutará <code className="text-[#d97757] font-mono">wrangler deploy</code> utilizando las credenciales de Cloudflare configuradas en las variables de entorno de tu servidor VPS.
          </div>
        </div>

        <div className="pt-4 border-t border-[#2d2b27] flex items-center justify-between">
          <button
            onClick={() => {
              onViewTerminal();
              onClose();
            }}
            className="text-xs text-[#9c968f] hover:text-white transition-colors cursor-pointer"
          >
            Ver terminal en vivo
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#292724] hover:bg-[#32302d] text-[#c2beb7] text-xs font-medium rounded-xl transition-colors cursor-pointer border border-[#383531]"
            >
              Cerrar
            </button>

            <button
              onClick={handleDeploy}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#d97757] hover:bg-[#c66949] disabled:opacity-40 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Desplegando en Cloudflare...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Desplegar Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
