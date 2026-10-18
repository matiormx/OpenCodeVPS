import React, { useEffect, useState } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import { SystemInfo } from '../../types/project';
import { projectApi } from '../../services/projectApi';
import { ClaudeIcon } from '../Claude/ClaudeIcon';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const loadInfo = async () => {
    setLoading(true);
    const data = await projectApi.getSystemInfo();
    setInfo(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0 min';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#1f1e1d] border border-[#34312c] rounded-2xl p-6 text-[#ecebe8] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2b27]">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-[#282624] rounded-lg">
              <ClaudeIcon size={18} />
            </div>
            <h2 className="text-base font-semibold text-white">Estado del Servidor VPS</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadInfo}
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

        {info ? (
          <div className="py-4 space-y-4 text-xs">
            {/* Installed Tools Status */}
            <div>
              <span className="text-[#9c968f] font-medium block mb-2">Herramientas del Sistema:</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#171615] border border-[#2e2c28] rounded-xl flex items-start gap-2">
                  {info.opencodeInstalled ? (
                    <CheckCircle2 className="w-4 h-4 text-[#d97757] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block text-[#ecebe8]">@opencode/cli</span>
                    <span className="text-[11px] font-mono text-[#8e8982]">
                      {info.opencodeInstalled ? (info.opencodeVersion || 'Instalado') : 'Terminal bash'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#171615] border border-[#2e2c28] rounded-xl flex items-start gap-2">
                  {info.wranglerInstalled ? (
                    <CheckCircle2 className="w-4 h-4 text-[#d97757] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#77726b] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block text-[#ecebe8]">Wrangler CLI</span>
                    <span className="text-[11px] font-mono text-[#8e8982]">
                      {info.wranglerInstalled ? (info.wranglerVersion || 'Instalado') : 'No detectado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Runtime & Server Parameters */}
            <div className="p-3 bg-[#171615] border border-[#2e2c28] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#9c968f] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#77726b]" />
                  Entorno Node.js
                </span>
                <span className="font-mono text-[#ecebe8]">{info.nodeVersion}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#9c968f]">Plataforma VPS</span>
                <span className="font-mono text-[#ecebe8]">{info.platform}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#9c968f]">Tiempo de Actividad</span>
                <span className="font-mono tabular-nums text-[#ecebe8]">{formatUptime(info.uptime)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#9c968f]">Sesiones WebSocket Conectadas</span>
                <span className="font-mono tabular-nums text-[#d97757] font-semibold">
                  {info.activeClients}
                </span>
              </div>
            </div>

            {/* Path info */}
            <div className="p-3 bg-[#171615] border border-[#2e2c28] rounded-xl">
              <span className="text-[#9c968f] flex items-center gap-1.5 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-[#77726b]" />
                Directorio Base de Trabajo
              </span>
              <span className="font-mono text-[11px] text-[#b8b3ac] block break-all">
                {info.baseWorkspaceDir}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[#77726b] text-xs">
            Cargando telemetría del servidor...
          </div>
        )}

        <div className="pt-4 border-t border-[#2d2b27] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#292724] hover:bg-[#32302d] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer border border-[#383531]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
