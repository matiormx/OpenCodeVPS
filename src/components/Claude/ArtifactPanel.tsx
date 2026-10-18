import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Terminal,
  FileCode2,
  FolderGit2,
  Copy,
  Check,
  RotateCw,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ansiToHtml } from '../../utils/ansi';

interface ArtifactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'terminal' | 'diff' | 'files';
  setActiveTab: (tab: 'terminal' | 'diff' | 'files') => void;
  terminalOutput: string;
  diffText: string;
  planText: string;
  currentCwd: string;
  onClearTerminal: () => void;
  onRestartProcess: () => void;
  onConfirmPrompt: () => void;
  onRejectPrompt: () => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  terminalOutput,
  diffText,
  planText,
  currentCwd,
  onClearTerminal,
  onRestartProcess,
  onConfirmPrompt,
  onRejectPrompt,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const text = activeTab === 'terminal' ? terminalOutput.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') : diffText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const renderedTerminal = ansiToHtml(terminalOutput);
  const diffLines = (diffText || '').split('\n');

  return (
    <div
      className={`bg-[#1a1918] border-l border-[#2e2c28] flex flex-col transition-all z-30 ${
        isFullscreen
          ? 'fixed inset-0 z-50'
          : 'w-full lg:w-[48%] h-full'
      }`}
    >
      {/* Top bar of Artifact (Claude style) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#21201e] border-b border-[#2e2c28] text-xs text-[#b8b3ac] select-none">
        {/* Artifact title and tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#171615] rounded-lg border border-[#2e2c28]">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-[#2b2926] text-white shadow-xs'
                  : 'text-[#8e8982] hover:text-[#ecebe8]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#d97757]" />
              <span>Terminal PTY</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'diff'
                  ? 'bg-[#2b2926] text-white shadow-xs'
                  : 'text-[#8e8982] hover:text-[#ecebe8]'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diffs & Plan</span>
            </button>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 text-[#8e8982] hover:text-white hover:bg-[#2b2926] rounded-md transition-colors cursor-pointer"
            title="Copiar contenido"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {activeTab === 'terminal' && (
            <>
              <button
                onClick={onRestartProcess}
                className="p-1.5 text-[#8e8982] hover:text-white hover:bg-[#2b2926] rounded-md transition-colors cursor-pointer"
                title="Reiniciar proceso"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearTerminal}
                className="p-1.5 text-[#8e8982] hover:text-red-400 hover:bg-[#2b2926] rounded-md transition-colors cursor-pointer"
                title="Limpiar terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-[#8e8982] hover:text-white hover:bg-[#2b2926] rounded-md transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8e8982] hover:text-white hover:bg-[#2b2926] rounded-md transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Artifact Content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[#ecebe8]">
        {activeTab === 'terminal' && (
          <div
            className="leading-relaxed whitespace-pre-wrap break-all select-text selection:bg-[#d97757]/40 selection:text-white"
            dangerouslySetInnerHTML={{ __html: renderedTerminal || '<span style="color:#77726b">// Terminal iniciado en ' + currentCwd + '</span>' }}
          />
        )}

        {activeTab === 'diff' && (
          <div className="space-y-3">
            {planText && (
              <div className="p-3 bg-[#242220] border border-[#34312c] rounded-xl font-sans text-xs text-[#dedbd4]">
                <span className="font-semibold text-white block mb-1">
                  Plan Propuesto por OpenCode:
                </span>
                <p className="leading-relaxed">{planText}</p>
              </div>
            )}

            {diffLines.length === 0 || !diffText ? (
              <div className="py-12 text-center text-[#706b64]">
                <FileCode2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#9c968f]" />
                <p className="font-sans text-xs">No hay diffs de código pendientes.</p>
                <p className="font-sans text-[11px] text-[#5c5751] mt-1">
                  Cuando OpenCode genere modificaciones en archivos, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 bg-[#141312] p-3 rounded-xl border border-[#292724]">
                {diffLines.map((line, idx) => {
                  let lineClass = 'text-[#c7c3bc]';
                  let bgClass = '';
                  if (line.startsWith('+') && !line.startsWith('+++')) {
                    lineClass = 'text-emerald-400';
                    bgClass = 'bg-emerald-950/20';
                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                    lineClass = 'text-red-400';
                    bgClass = 'bg-red-950/20';
                  } else if (line.startsWith('@@')) {
                    lineClass = 'text-cyan-400 font-semibold';
                    bgClass = 'bg-cyan-950/20';
                  } else if (line.startsWith('diff --git')) {
                    lineClass = 'text-amber-300 font-medium';
                  }

                  return (
                    <div key={idx} className={`px-2 py-0.5 rounded ${bgClass} ${lineClass}`}>
                      {line || ' '}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirmation actions if diffs exist */}
            {diffText && (
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={onRejectPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262422] hover:bg-[#302e2a] text-[#c2beb7] text-xs font-sans font-medium rounded-lg transition-colors border border-[#383531] cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rechazar</span>
                </button>
                <button
                  onClick={onConfirmPrompt}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d97757] hover:bg-[#c66949] text-white text-xs font-sans font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar y Escribir (Y)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
