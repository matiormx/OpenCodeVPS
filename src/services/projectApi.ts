import { authService } from './authService';
import { ProjectFolder, SystemInfo } from '../types/project';

export interface GitStatusInfo {
  isGit: boolean;
  branch?: string;
  hasChanges?: boolean;
  changedFilesCount?: number;
  remoteUrl?: string;
  lastCommit?: string;
  changedFiles?: string[];
  error?: string;
}

export const projectApi = {
  async getSystemInfo(): Promise<SystemInfo | null> {
    try {
      const res = await fetch('/api/system/info', {
        headers: authService.getAuthHeader(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getProjects(): Promise<{ baseDir: string; currentCwd: string; projects: ProjectFolder[] }> {
    const res = await fetch('/api/projects', {
      headers: authService.getAuthHeader(),
    });
    if (!res.ok) throw new Error('Error al obtener lista de proyectos');
    return await res.json();
  },

  async createProject(params: {
    name: string;
    template?: 'blank' | 'cloudflare-worker' | 'github-clone';
    gitRepoUrl?: string;
  }): Promise<{ success: boolean; path: string; name: string }> {
    const res = await fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo crear el proyecto');
    }
    return await res.json();
  },

  async changeCwd(newPath: string): Promise<{ success: boolean; cwd: string }> {
    const res = await fetch('/api/cwd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify({ newPath }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al cambiar directorio');
    }
    return await res.json();
  },

  async deployCloudflare(path?: string): Promise<{ success: boolean; workerUrl?: string; output?: string }> {
    const res = await fetch('/api/projects/deploy-cloudflare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error durante el despliegue en Cloudflare');
    }
    return await res.json();
  },

  async getGitStatus(): Promise<GitStatusInfo> {
    const res = await fetch('/api/projects/git-status', {
      headers: authService.getAuthHeader(),
    });
    if (!res.ok) throw new Error('Error al consultar estado de Git');
    return await res.json();
  },

  async runGitAction(params: {
    action: 'init' | 'set-remote' | 'commit' | 'push';
    commitMessage?: string;
    remoteUrl?: string;
  }): Promise<{ success: boolean; message?: string; output?: string }> {
    const res = await fetch('/api/projects/git-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al ejecutar acción de Git');
    }
    return await res.json();
  },
};
