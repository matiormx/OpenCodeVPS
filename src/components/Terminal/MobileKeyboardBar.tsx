import React from 'react';
import { CornerDownLeft, Ban, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

interface MobileKeyboardBarProps {
  onSendSpecial: (key: string) => void;
  onClear: () => void;
  onSendSignal: (signal: 'SIGINT') => void;
}

export const MobileKeyboardBar: React.FC<MobileKeyboardBarProps> = ({
  onSendSpecial,
  onClear,
  onSendSignal,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1c1b1a] border-t border-[#2d2b27] overflow-x-auto no-scrollbar select-none text-xs">
      <button
        type="button"
        onClick={() => onSendSignal('SIGINT')}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#2a1d1d] hover:bg-[#382222] active:scale-95 text-red-300 border border-red-900/60 rounded-lg font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
        title="Enviar SIGINT (Ctrl+C)"
      >
        <Ban className="w-3 h-3 text-red-400" />
        <span>Ctrl+C</span>
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('y\n')}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#d97757]/20 hover:bg-[#d97757]/30 active:scale-95 text-[#f0a68d] border border-[#d97757]/50 rounded-lg font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        <Check className="w-3 h-3 text-[#d97757]" />
        <span>Yes (Y)</span>
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('n\n')}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#262422] hover:bg-[#302e2a] active:scale-95 text-[#c2beb7] border border-[#34312d] rounded-lg font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        <X className="w-3 h-3 text-[#77726b]" />
        <span>No (N)</span>
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('\n')}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#262422] hover:bg-[#302e2a] active:scale-95 text-[#c2beb7] border border-[#34312d] rounded-lg font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        <CornerDownLeft className="w-3 h-3 text-[#77726b]" />
        <span>Enter</span>
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('\t')}
        className="px-2.5 py-1.5 bg-[#262422] hover:bg-[#302e2a] active:scale-95 text-[#c2beb7] border border-[#34312d] rounded-lg font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        Tab
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('\x1b')}
        className="px-2.5 py-1.5 bg-[#262422] hover:bg-[#302e2a] active:scale-95 text-[#c2beb7] border border-[#34312d] rounded-lg font-mono font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        Esc
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('\x1b[A')}
        className="p-1.5 bg-[#262422] hover:bg-[#302e2a] active:scale-95 text-[#c2beb7] border border-[#34312d] rounded-lg transition-all cursor-pointer shrink-0"
        title="Historial Anterior (↑)"
      >
        <ArrowUp className="w-3.5 h-3.5 text-[#77726b]" />
      </button>

      <button
        type="button"
        onClick={() => onSendSpecial('\x1b[B')}
        className="p-1.5 bg-[#262422] hover:bg-[#302e2a] active:scale-95 text-[#c2beb7] border border-[#34312d] rounded-lg transition-all cursor-pointer shrink-0"
        title="Historial Siguiente (↓)"
      >
        <ArrowDown className="w-3.5 h-3.5 text-[#77726b]" />
      </button>

      <button
        type="button"
        onClick={onClear}
        className="px-2.5 py-1.5 text-[#8e8982] hover:text-[#ecebe8] active:scale-95 font-mono text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0"
      >
        Limpiar
      </button>
    </div>
  );
};
