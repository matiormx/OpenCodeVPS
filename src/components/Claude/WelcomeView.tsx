import React from 'react';
import { ClaudeIcon } from './ClaudeIcon';
import { Cloud, GitBranch, Rocket, Terminal, Plus } from 'lucide-react';

interface WelcomeViewProps {
  onSelectPrompt: (prompt: string) => void;
  onOpenNewProject: () => void;
  onOpenDeployCloudflare: () => void;
  onOpenGitHub: () => void;
  onOpenTerminal: () => void;
  currentCwd: string;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onSelectPrompt,
  onOpenNewProject,
  onOpenDeployCloudflare,
  onOpenGitHub,
  onOpenTerminal,
  currentCwd,
}) => {
  const shortCwd = currentCwd.split('/').slice(-1)[0] || currentCwd;

  const quickStarters = [
    {
      title: 'Crear Cloudflare Worker',
      desc: 'Crea un nuevo proyecto con wrangler.toml y TypeScript listo para desplegar.',
      icon: Cloud,
      action: onOpenNewProject,
    },
    {
      title: 'Conectar con GitHub',
      desc: 'Clona un repositorio remoto o guarda tus commits en GitHub.',
      icon: GitBranch,
      action: onOpenGitHub,
    },
    {
      title: 'Desplegar a Cloudflare',
      desc: 'Ejecuta wrangler deploy y publica tu worker en la nube en un solo clic.',
      icon: Rocket,
      action: onOpenDeployCloudflare,
    },
    {
      title: 'Terminal en Vivo',
      desc: 'Abre la consola PTY para ver la salida del servidor y ejecutar comandos.',
      icon: Terminal,
      action: onOpenTerminal,
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-2xl mx-auto select-none">
      <div className="mb-6 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-[#252320] border border-[#383530] flex items-center justify-center mb-4 shadow-sm">
          <ClaudeIcon size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
          ¿Qué quieres construir o desplegar hoy?
        </h1>
        <p className="text-xs sm:text-sm text-[#9c968f] max-w-md leading-relaxed">
          Crea proyectos, sincronízalos con GitHub o despliégalos directamente como Cloudflare Workers sin necesidad de SSH.
        </p>
      </div>

      {/* Quick starter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left mb-6">
        {quickStarters.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={item.action}
              className="p-4 bg-[#201f1d] hover:bg-[#282624] rounded-xl border border-[#2f2d29] hover:border-[#3d3a35] transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-[#d97757] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-[#ecebe8] group-hover:text-white">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-[#8e8982] leading-normal">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-[#706b64]">
        Carpeta actual: <span className="font-mono text-[#dedbd4]">{shortCwd}</span>
      </div>
    </div>
  );
};
