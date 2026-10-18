import React from 'react';
import {
  Plus,
  MessageSquare,
  FolderGit2,
  Server,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  Trash2,
  Rocket,
  GitBranch,
} from 'lucide-react';
import { ClaudeIcon } from './ClaudeIcon';
import { ProcessStatus } from '../../types/terminal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenNewProject: () => void;
  onOpenDeployCloudflare: () => void;
  onOpenGitHub: () => void;
  onOpenDeployGuide: () => void;
  recentTasks: Array<{ id: string; title: string; timestamp: number }>;
  currentTaskId: string | null;
  onSelectTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  currentCwd: string;
  onOpenProjects: () => void;
  onOpenSystemInfo: () => void;
  onLogout: () => void;
  isConnected: boolean;
  status: ProcessStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onOpenNewProject,
  onOpenDeployCloudflare,
  onOpenGitHub,
  onOpenDeployGuide,
  recentTasks,
  currentTaskId,
  onSelectTask,
  onDeleteTask,
  currentCwd,
  onOpenProjects,
  onOpenSystemInfo,
  onLogout,
  isConnected,
  status,
}) => {
  const shortCwd = currentCwd.split('/').slice(-1)[0] || currentCwd;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#1f1e1d] text-[#ecebe8] border-r border-[#2d2b27] flex flex-col transition-transform duration-200 ease-in-out shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0'
        }`}
      >
        {/* Top Header: Brand & Close */}
        <div className="p-3.5 border-b border-[#2d2b27] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#2a2826] rounded-lg">
              <ClaudeIcon size={18} />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">
                OpenCode
              </span>
              <span className="text-[10px] text-[#9c968f] block -mt-0.5">
                Proyectos & Cloudflare
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#9c968f] hover:text-white hover:bg-[#282624] rounded-md transition-colors cursor-pointer"
            title="Ocultar barra lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-3 space-y-2">
          {/* Create Project Button */}
          <button
            onClick={onOpenNewProject}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#282624] hover:bg-[#32302d] text-[#ecebe8] hover:text-white rounded-xl border border-[#383531] text-xs font-medium transition-all shadow-xs cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#d97757] group-hover:scale-110 transition-transform" />
              <span>Nuevo Proyecto / Chat</span>
            </span>
            <span className="text-[10px] font-mono text-[#8a857e] bg-[#1f1e1d] px-1.5 py-0.5 rounded border border-[#2d2b27]">
              +
            </span>
          </button>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onOpenDeployCloudflare}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#22201e] hover:bg-[#2b2926] text-[#b8b3ac] hover:text-white rounded-lg border border-[#2e2c28] text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Desplegar</span>
            </button>

            <button
              onClick={onOpenGitHub}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#22201e] hover:bg-[#2b2926] text-[#b8b3ac] hover:text-white rounded-lg border border-[#2e2c28] text-[11px] font-medium transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#d97757]" />
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* Project Selector (Claude Workspace style) */}
        <div className="px-3 pb-2">
          <div
            onClick={onOpenProjects}
            className="p-2.5 bg-[#191817] hover:bg-[#262422] rounded-xl border border-[#2d2b27] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-[#9c968f] flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-[#d97757]" />
                Directorio Activo
              </span>
              <ChevronRight className="w-3 h-3 text-[#6f6a64] group-hover:text-white transition-colors" />
            </div>
            <div className="font-mono text-xs text-[#ecebe8] truncate">
              {shortCwd}
            </div>
          </div>
        </div>

        {/* Recents list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-medium text-[#827d76] px-2 py-1">
            Historial de Conversaciones
          </div>

          {recentTasks.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-[#6e6963]">
              No hay chats recientes. Inicia un nuevo proyecto arriba.
            </div>
          ) : (
            recentTasks.map((task) => {
              const isSelected = currentTaskId === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#2d2b27] text-white font-medium'
                      : 'text-[#c2beb7] hover:bg-[#282624] hover:text-[#ecebe8]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#9c968f]" />
                    <span className="truncate">{task.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#827d76] hover:text-red-400 rounded transition-opacity"
                    title="Eliminar de historial"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User / VPS Status Footer */}
        <div className="p-3 border-t border-[#2d2b27] bg-[#1b1a19] space-y-2">
          {/* Live indicator */}
          <div className="flex items-center justify-between text-xs text-[#9c968f] px-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="text-[11px]">
                {isConnected ? 'VPS Ubuntu 24.04' : 'Desconectado'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#77726b]">
              {status}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenSystemInfo}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#b8b3ac] hover:text-white hover:bg-[#282624] rounded-md transition-colors cursor-pointer"
                title="Telemetría"
              >
                <Server className="w-3.5 h-3.5 text-[#9c968f]" />
                <span>Telemetría</span>
              </button>

              <button
                onClick={onOpenDeployGuide}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#d97757] hover:bg-[#282624] rounded-md transition-colors cursor-pointer font-medium"
                title="Guía de instalación en tu servidor VPS"
              >
                <span>Instalar en VPS</span>
              </button>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-[#9c968f] hover:text-red-400 hover:bg-[#282624] rounded-md transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
