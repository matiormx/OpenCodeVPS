import React, { useState } from 'react';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { ClaudeIcon } from './ClaudeIcon';
import { DirectiveMessage } from '../../types/terminal';
import { ansiToHtml } from '../../utils/ansi';

interface MessageItemProps {
  message: DirectiveMessage;
  onConfirmPrompt?: () => void;
  onRejectPrompt?: () => void;
  onOpenArtifact?: (tab: 'terminal' | 'diff') => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onConfirmPrompt,
  onRejectPrompt,
  onOpenArtifact,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <div className="flex justify-end my-4 px-2 sm:px-4">
        <div className="max-w-2xl bg-[#2a2825] border border-[#3b3833] text-[#ecebe8] rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs">
          <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <div className="text-[10px] text-[#8e8982] text-right mt-1 font-mono">
            {timeStr}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 my-5 px-2 sm:px-4 max-w-3xl mx-auto">
      {/* Claude Avatar */}
      <div className="w-7 h-7 rounded-lg bg-[#272522] border border-[#383530] flex items-center justify-center shrink-0 mt-0.5">
        <ClaudeIcon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 text-xs text-[#9c968f]">
          <span className="font-medium text-[#ecebe8] text-xs">OpenCode</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#706b64]">{timeStr}</span>
            <button
              onClick={handleCopy}
              className="p-1 hover:text-white rounded hover:bg-[#282624] transition-colors cursor-pointer"
              title="Copiar texto"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Thinking Accordion (Claude 3.7 style) */}
        {message.status === 'pending' && (
          <div className="mb-3 rounded-xl border border-[#34312c] bg-[#1d1c1a] overflow-hidden text-xs">
            <button
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[#b0aba3] hover:text-white transition-colors cursor-pointer select-none"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <ClaudeIcon size={12} className="animate-spin text-[#d97757]" />
                <span>Ejecutando en el terminal PTY...</span>
              </span>
              {isThinkingOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#736e67]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#736e67]" />
              )}
            </button>

            {isThinkingOpen && (
              <div
                className="p-3 bg-[#171615] border-t border-[#2e2c28] font-mono text-[11px] leading-relaxed text-[#c7c3bc] max-h-48 overflow-y-auto whitespace-pre-wrap select-text"
                dangerouslySetInnerHTML={{ __html: ansiToHtml(message.content) }}
              />
            )}
          </div>
        )}

        {/* Response Body */}
        <div className="text-sm md:text-[15px] leading-relaxed text-[#dedbd4] space-y-2 whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Confirmation prompt callout (Claude style action banner) */}
        {message.confirmationPrompt && (
          <div className="mt-4 p-4 rounded-xl border border-[#d97757]/40 bg-[#25211f] text-slate-100 shadow-sm">
            <div className="flex items-start gap-2.5 mb-3">
              <ClaudeIcon size={18} className="text-[#d97757] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[#f0a68d] block">
                  OpenCode requiere tu autorización para continuar
                </span>
                <span className="text-xs text-[#d1ccc4] font-mono block mt-0.5">
                  {message.confirmationPrompt.text}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onConfirmPrompt}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d97757] hover:bg-[#c66949] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{message.confirmationPrompt.actionYes || 'Aprobar cambios (Y)'}</span>
              </button>

              <button
                onClick={onRejectPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2825] hover:bg-[#34312d] text-[#c2beb7] text-xs font-medium rounded-lg transition-colors border border-[#3b3833] cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-[#8e8982]" />
                <span>{message.confirmationPrompt.actionNo || 'Rechazar (N)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Artifact card teaser (Claude style) */}
        {onOpenArtifact && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onOpenArtifact('terminal')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#201f1d] hover:bg-[#282624] text-[#b8b3ac] hover:text-white rounded-lg border border-[#33302c] text-xs font-mono transition-colors cursor-pointer"
            >
              <Terminal className="w-3 h-3 text-[#d97757]" />
              <span>Ver salida en Terminal Artifact</span>
              <ExternalLink className="w-3 h-3 text-[#706b64]" />
            </button>

            <button
              onClick={() => onOpenArtifact('diff')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#201f1d] hover:bg-[#282624] text-[#b8b3ac] hover:text-white rounded-lg border border-[#33302c] text-xs font-mono transition-colors cursor-pointer"
            >
              <FileCode2 className="w-3 h-3 text-[#4ade80]" />
              <span>Planes & Diffs</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
