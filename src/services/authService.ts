import { LoginResponse } from '../types/auth';

const TOKEN_KEY = 'opencode_auth_token';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  async login(password: string): Promise<LoginResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.token) {
        this.setToken(data.token);
        return { success: true, token: data.token };
      }
      return { success: false, message: data.message || 'Contraseña incorrecta' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error de conexión con el servidor' };
    }
  },

  async verify(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
