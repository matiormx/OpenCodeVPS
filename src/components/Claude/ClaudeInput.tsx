import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, Folder } from 'lucide-react';
import { ClaudeIcon } from './ClaudeIcon';

interface ClaudeInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  currentCwd: string;
}

export const ClaudeInput: React.FC<ClaudeInputProps> = ({
  onSend,
  disabled,
  currentCwd,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;

    onSend(text.trim() + '\n');
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const setPrompt = (content: string) => {
    setText(content);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const shortCwd = currentCwd.split('/').slice(-1)[0] || currentCwd;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-4">
      {/* Suggestion tags (Claude style) */}
      <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[11px] text-[#8e8982] font-medium whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#d97757]" />
          Sugerencias:
        </span>
        <button
          type="button"
          onClick={() => setPrompt('Crea un worker de Cloudflare con endpoints para procesar JSON')}
          className="px-2.5 py-1 bg-[#232220] hover:bg-[#2c2a27] text-[#c7c3bc] hover:text-white rounded-full text-[11px] whitespace-nowrap transition-colors border border-[#34312d] cursor-pointer"
        >
          Endpoint en Cloudflare
        </button>
        <button
          type="button"
          onClick={() => setPrompt('Verifica que el archivo wrangler.toml esté configurado correctamente')}
          className="px-2.5 py-1 bg-[#232220] hover:bg-[#2c2a27] text-[#c7c3bc] hover:text-white rounded-full text-[11px] whitespace-nowrap transition-colors border border-[#34312d] cursor-pointer"
        >
          Verificar wrangler.toml
        </button>
        <button
          type="button"
          onClick={() => setPrompt('Prepara los archivos modificados para hacer commit en GitHub')}
          className="px-2.5 py-1 bg-[#232220] hover:bg-[#2c2a27] text-[#c7c3bc] hover:text-white rounded-full text-[11px] whitespace-nowrap transition-colors border border-[#34312d] cursor-pointer"
        >
          Preparar para GitHub
        </button>
        <button
          type="button"
          onClick={() => setPrompt('git status')}
          className="px-2.5 py-1 bg-[#232220] hover:bg-[#2c2a27] text-[#c7c3bc] hover:text-white rounded-full text-[11px] font-mono whitespace-nowrap transition-colors border border-[#34312d] cursor-pointer"
        >
          git status
        </button>
      </div>

      {/* Main Claude-style input card */}
      <div className="bg-[#242321] border border-[#383530] focus-within:border-[#4d4943] rounded-2xl shadow-xl transition-all p-3 sm:p-3.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Escribe lo que quieres construir o modificar en el proyecto..."
          rows={1}
          className="w-full bg-transparent text-[#ecebe8] placeholder-[#7d7770] text-sm md:text-[15px] focus:outline-none resize-none max-h-48 leading-relaxed"
        />

        {/* Bottom bar of prompt card */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-[#2e2c28]">
          <div className="flex items-center gap-2">
            {/* Model indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1d1c1a] rounded-lg border border-[#302e2a] text-xs text-[#b8b3ac]">
              <ClaudeIcon size={14} />
              <span className="font-medium text-[11px]">OpenCode CLI</span>
            </div>

            {/* Folder badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#1d1c1a] rounded-lg border border-[#302e2a] text-xs text-[#8e8982]">
              <Folder className="w-3 h-3 text-[#d97757]" />
              <span className="font-mono text-[11px]">{shortCwd}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#706b64] hidden sm:flex items-center gap-1">
              <span>Shift+Enter para nueva línea</span>
            </span>

            {/* Send button (Claude terracotta) */}
            <button
              onClick={() => handleSubmit()}
              disabled={disabled || !text.trim()}
              className="w-8 h-8 flex items-center justify-center bg-[#d97757] hover:bg-[#c66949] disabled:opacity-30 disabled:hover:bg-[#d97757] text-white rounded-full transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
              title="Enviar mensaje"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
