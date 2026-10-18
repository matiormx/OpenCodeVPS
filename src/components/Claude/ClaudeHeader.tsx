import React from 'react';
import {
  PanelLeft,
  Terminal,
  FolderGit2,
  Server,
  LogOut,
  Rocket,
  GitBranch,
} from 'lucide-react';
import { ClaudeIcon } from './ClaudeIcon';

interface ClaudeHeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleArtifact: () => void;
  isArtifactOpen: boolean;
  currentCwd: string;
  onOpenProjects: () => void;
  onOpenSystemInfo: () => void;
  onOpenDeployCloudflare: () => void;
  onOpenGitHub: () => void;
  onLogout: () => void;
  isConnected: boolean;
  taskTitle: string;
}

export const ClaudeHeader: React.FC<ClaudeHeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onToggleArtifact,
  isArtifactOpen,
  currentCwd,
  onOpenProjects,
  onOpenSystemInfo,
  onOpenDeployCloudflare,
  onOpenGitHub,
  onLogout,
  isConnected,
  taskTitle,
}) => {
  const shortCwd = currentCwd.split('/').slice(-1)[0] || currentCwd;

  return (
    <header className="h-13 bg-[#1c1b1a] border-b border-[#2d2b27] px-3 sm:px-4 flex items-center justify-between text-[#ecebe8] select-none shrink-0 z-20">
      {/* Left: Sidebar toggle & Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
          title={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <ClaudeIcon size={16} />
          <span className="font-medium text-xs sm:text-sm text-white truncate max-w-[130px] sm:max-w-xs">
            {taskTitle || 'Proyecto'}
          </span>
        </div>

        {/* Folder badge */}
        <button
          onClick={onOpenProjects}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#242321] hover:bg-[#2e2c29] text-[#b8b3ac] rounded-lg border border-[#34312d] text-xs font-mono transition-colors cursor-pointer"
          title={`Directorio activo: ${currentCwd}`}
        >
          <FolderGit2 className="w-3.5 h-3.5 text-[#d97757]" />
          <span className="max-w-[120px] truncate">{shortCwd}</span>
        </button>
      </div>

      {/* Right: Cloudflare Deploy, GitHub, Artifact Toggle, System, Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* GitHub Button */}
        <button
          onClick={onOpenGitHub}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#34312d] bg-[#242321] hover:bg-[#2d2b27] text-xs font-medium text-[#b8b3ac] hover:text-white transition-all cursor-pointer"
          title="Sincronizar y conectar con GitHub"
        >
          <GitBranch className="w-3.5 h-3.5 text-[#d97757]" />
          <span className="hidden sm:inline">GitHub</span>
        </button>

        {/* Deploy to Cloudflare Button */}
        <button
          onClick={onOpenDeployCloudflare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d97757] hover:bg-[#c66949] text-white text-xs font-medium transition-all cursor-pointer shadow-xs"
          title="Desplegar proyecto a Cloudflare Workers"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Desplegar Worker</span>
        </button>

        {/* Artifact Toggle Button (Terminal & Diffs) */}
        <button
          onClick={onToggleArtifact}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            isArtifactOpen
              ? 'bg-[#d97757]/15 border-[#d97757]/60 text-[#f0a68d]'
              : 'bg-[#242321] hover:bg-[#2d2b27] border-[#34312d] text-[#b8b3ac] hover:text-white'
          }`}
          title="Abrir terminal en vivo y visor de diffs"
        >
          <Terminal className="w-3.5 h-3.5 text-[#d97757]" />
          <span className="hidden md:inline">Terminal</span>
        </button>

        <button
          onClick={onOpenSystemInfo}
          className="p-1.5 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-lg transition-colors cursor-pointer"
          title="Telemetría y Estado VPS"
        >
          <Server className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 pl-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            title={isConnected ? 'Conectado a OpenCode PTY' : 'Reconectando al VPS'}
          />
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 text-[#9c968f] hover:text-red-400 hover:bg-[#282624] rounded-lg transition-colors cursor-pointer ml-1"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
