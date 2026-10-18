import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, ShieldCheck, Cloud, Server } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      title: 'Paso 1: Clonar el repositorio en tu VPS',
      desc: 'Conéctate una última vez por SSH a tu servidor Ubuntu 24.04 y descarga el proyecto:',
      code: 'git clone <URL_DE_TU_REPOSITORIO_GITHUB>\ncd <NOMBRE_DE_LA_CARPETA>',
    },
    {
      title: 'Paso 2: Instalar dependencias y compilar',
      desc: 'Instala los paquetes necesarios y compila la interfaz para producción:',
      code: 'npm install\nnpm run build',
    },
    {
      title: 'Paso 3: Iniciar el servidor en segundo plano con PM2',
      desc: 'Para que el servidor se mantenga siempre activo aunque cierres la terminal:',
      code: 'npm install -g pm2\npm2 start "npm start" --name "opencode-web"\npm2 save\npm2 startup',
    },
    {
      title: 'Paso 4 (Recomendado): Acceso seguro con Cloudflare Tunnel',
      desc: 'Para tener HTTPS gratis y dominio propio sin exponer la IP de tu VPS ni abrir puertos:',
      code: 'cloudflared tunnel --url http://localhost:3000',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[#1f1e1d] border border-[#34312c] rounded-2xl p-6 text-[#ecebe8] shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2d2b27]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#292724] border border-[#383531] rounded-xl text-[#d97757]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Guía de Instalación en tu Servidor VPS
              </h2>
              <p className="text-xs text-[#9c968f]">
                Cómo clonar y ejecutar este panel directamente en tu VPS Ubuntu 24.04
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

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {steps.map((step, idx) => (
            <div key={idx} className="p-3.5 bg-[#171615] border border-[#2e2c28] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">
                  {step.title}
                </span>
                <button
                  onClick={() => copyCode(step.code, idx)}
                  className="flex items-center gap-1 text-[11px] text-[#b8b3ac] hover:text-white px-2 py-1 bg-[#242321] rounded-lg border border-[#33302c] transition-colors cursor-pointer"
                >
                  {copiedStep === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#9c968f]" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[#8e8982] text-[11px] leading-relaxed">
                {step.desc}
              </p>

              <pre className="p-2.5 bg-[#121110] border border-[#262422] rounded-lg font-mono text-[11px] text-[#c7c3bc] overflow-x-auto whitespace-pre-wrap select-all">
                {step.code}
              </pre>
            </div>
          ))}

          {/* Cloudflare Tunnel Note */}
          <div className="p-3 bg-[#242220] border border-[#383531] rounded-xl flex items-start gap-2.5 text-[11px] text-[#b8b3ac] leading-relaxed">
            <Cloud className="w-4 h-4 text-[#d97757] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">
                Ventaja con Cloudflare Tunnel:
              </span>
              Como ya tienes configurado Cloudflare en tu VPS, puedes usar un túnel para acceder desde tu móvil con una URL como <code className="text-[#d97757]">https://opencode.tudominio.com</code> con certificado SSL automático y sin exponer la IP pública de tu VPS.
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#2d2b27] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#d97757] hover:bg-[#c66949] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
