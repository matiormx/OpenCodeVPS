export interface ProjectFolder {
  name: string;
  path: string;
  isGitRepo: boolean;
  hasPackageJson: boolean;
  hasWrangler: boolean;
  lastModified?: string;
}

export interface SystemInfo {
  opencodeInstalled: boolean;
  opencodeVersion?: string;
  wranglerInstalled: boolean;
  wranglerVersion?: string;
  nodeVersion: string;
  platform: string;
  uptime: number;
  baseWorkspaceDir: string;
  currentCwd: string;
  activeClients: number;
  mode: 'real-pty' | 'emulated';
}
