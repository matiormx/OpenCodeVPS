import React, { useState } from 'react';
import { KeyRound, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { ClaudeIcon } from '../Claude/ClaudeIcon';

interface LoginModalProps {
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    const res = await authService.login(password.trim());
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.message || 'Contraseña incorrecta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs px-4">
      <div className="w-full max-w-md bg-[#1f1e1d] border border-[#34312c] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#ecebe8]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#292724] border border-[#3a3732] rounded-xl text-[#d97757]">
            <ClaudeIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">OpenCode</h1>
            <p className="text-xs text-[#9c968f]">Acceso a la consola del servidor VPS</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#b8b3ac] mb-6 leading-relaxed">
          Introduce la contraseña maestra configurada en el servidor para inicializar tu sesión de OpenCode.
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#b8b3ac] mb-1.5">
              Contraseña Maestra
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[#77726b]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave maestra..."
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-[#171615] border border-[#383531] rounded-xl text-sm text-[#ecebe8] placeholder-[#6b6660] focus:outline-none focus:border-[#d97757] transition-colors"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-[#7d7871]">
              <span>Por defecto: <code className="text-[#b8b3ac] font-mono">opencode-secure-admin</code></span>
              <button
                type="button"
                onClick={() => setPassword('opencode-secure-admin')}
                className="text-[#d97757] hover:underline cursor-pointer"
              >
                Autocompletar
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#d97757] hover:bg-[#c66949] disabled:opacity-40 disabled:hover:bg-[#d97757] text-white font-medium text-sm rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#2e2c28] flex items-center justify-between text-xs text-[#7d7871]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Autenticación JWT</span>
          </div>
          <span className="font-mono text-[11px]">Ubuntu 24.04 LTS</span>
        </div>
      </div>
    </div>
  );
};
