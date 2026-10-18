import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { spawn, ChildProcessWithoutNullStreams, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'opencode-secure-admin';
const JWT_SECRET = process.env.JWT_SECRET || 'opencode-secret-jwt-key-2026';
const OPENCODE_CMD = process.env.OPENCODE_CMD || 'opencode';

// Default base workspace directory
let BASE_WORKSPACE_DIR = process.env.BASE_WORKSPACE_DIR
  ? path.resolve(process.env.BASE_WORKSPACE_DIR)
  : path.resolve(process.cwd(), 'workspace');

if (!fs.existsSync(BASE_WORKSPACE_DIR)) {
  try {
    fs.mkdirSync(BASE_WORKSPACE_DIR, { recursive: true });
  } catch {
    BASE_WORKSPACE_DIR = process.cwd();
  }
}

let currentCwd = BASE_WORKSPACE_DIR;

const app = express();
app.use(express.json());

// In-memory terminal buffer (circular 64KB)
const MAX_BUFFER_SIZE = 64 * 1024;
let terminalBuffer = '';

function appendToBuffer(chunk: string) {
  terminalBuffer += chunk;
  if (terminalBuffer.length > MAX_BUFFER_SIZE) {
    terminalBuffer = terminalBuffer.slice(terminalBuffer.length - MAX_BUFFER_SIZE);
  }
}

// Check installed system tools
function checkToolAvailability(cmd: string): { installed: boolean; version?: string } {
  try {
    const output = execSync(`${cmd} --version 2>/dev/null`, { encoding: 'utf-8', timeout: 2000 }).trim();
    return { installed: true, version: output };
  } catch {
    return { installed: false };
  }
}

// PTY / Process Management
interface PTYSession {
  process: ChildProcessWithoutNullStreams | null;
  status: 'idle' | 'running' | 'waiting_confirmation' | 'error';
  lastInputTime: number;
}

const ptySession: PTYSession = {
  process: null,
  status: 'idle',
  lastInputTime: Date.now(),
};

// Connected authenticated WebSocket clients
const authenticatedClients = new Set<WebSocket>();

function broadcast(msg: object) {
  const payload = JSON.stringify(msg);
  for (const client of authenticatedClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    }
  }
}

function broadcastClientsCount() {
  broadcast({
    type: 'clients_count',
    count: authenticatedClients.size,
  });
}

// Detect interactive prompts like "[y/N]" or "Confirm to write"
function analyzeOutputForPrompts(text: string) {
  const lower = text.toLowerCase();
  const confirmationPatterns = [
    /\[y\/n\]/i,
    /\(y\/n\)/i,
    /are you sure/i,
    /do you want to continue/i,
    /confirm changes/i,
    /apply (this|these) (changes|diff|plan)/i,
    /overwrite existing/i,
    /proceed\?/i,
  ];

  const matched = confirmationPatterns.some((pattern) => pattern.test(text));
  if (matched) {
    ptySession.status = 'waiting_confirmation';
    broadcast({
      type: 'prompt_detected',
      question: text.slice(-200).trim(),
      defaultAction: lower.includes('[y/n]') || lower.includes('(y/n)') ? 'yes' : 'yes',
    });
    broadcast({
      type: 'status',
      status: 'waiting_confirmation',
      cwd: currentCwd,
      pid: ptySession.process?.pid,
    });
  }
}

// Detect code diffs or proposed plans in terminal output
function analyzeOutputForPlans(text: string) {
  if (text.includes('--- ') && text.includes('+++ ') && text.includes('@@')) {
    // Diff found
    broadcast({
      type: 'plan_detected',
      plan: 'Cambios de código detectados en los archivos.',
    });
  }
}

// Spawn process (either opencode CLI, or interactive bash shell as fallback)
function startOrRestartProcess(command: string = OPENCODE_CMD, args: string[] = []) {
  if (ptySession.process) {
    try {
      ptySession.process.kill('SIGTERM');
    } catch {
      // ignore
    }
    ptySession.process = null;
  }

  const opencodeCheck = checkToolAvailability(command);
  const effectiveCmd = opencodeCheck.installed ? command : '/bin/bash';
  const effectiveArgs = opencodeCheck.installed ? args : ['-i'];

  const spawnEnv = {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    FORCE_COLOR: '3',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
  };

  try {
    const proc = spawn(effectiveCmd, effectiveArgs, {
      cwd: currentCwd,
      env: spawnEnv,
      shell: false,
    });

    ptySession.process = proc;
    ptySession.status = 'idle';

    const startMsg = `\r\n\x1b[1;36m[OpenCode Console]\x1b[0m Iniciando ${effectiveCmd} en \x1b[33m${currentCwd}\x1b[0m (PID: ${proc.pid})\r\n`;
    appendToBuffer(startMsg);
    broadcast({
      type: 'output',
      data: startMsg,
      timestamp: Date.now(),
    });

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString('utf-8');
      appendToBuffer(text);
      analyzeOutputForPrompts(text);
      analyzeOutputForPlans(text);
      broadcast({
        type: 'output',
        data: text,
        timestamp: Date.now(),
      });
    });

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString('utf-8');
      appendToBuffer(text);
      analyzeOutputForPrompts(text);
      broadcast({
        type: 'output',
        data: text,
        timestamp: Date.now(),
      });
    });

    proc.on('close', (code) => {
      const closeMsg = `\r\n\x1b[1;33m[OpenCode Console]\x1b[0m Proceso finalizado con código: ${code}\r\n`;
      appendToBuffer(closeMsg);
      ptySession.status = 'idle';
      ptySession.process = null;
      broadcast({
        type: 'output',
        data: closeMsg,
        timestamp: Date.now(),
      });
      broadcast({
        type: 'status',
        status: 'idle',
        cwd: currentCwd,
      });
    });

    proc.on('error', (err) => {
      const errMsg = `\r\n\x1b[1;31m[OpenCode Console Error]\x1b[0m ${err.message}\r\n`;
      appendToBuffer(errMsg);
      ptySession.status = 'error';
      broadcast({
        type: 'output',
        data: errMsg,
        timestamp: Date.now(),
      });
      broadcast({
        type: 'status',
        status: 'error',
        cwd: currentCwd,
      });
    });

    broadcast({
      type: 'status',
      status: 'idle',
      cwd: currentCwd,
      pid: proc.pid,
    });
  } catch (err: unknown) {
    const error = err as Error;
    const msg = `\r\n\x1b[1;31m[OpenCode Fallback]\x1b[0m No se pudo iniciar el proceso: ${error.message}\r\n`;
    appendToBuffer(msg);
    broadcast({ type: 'output', data: msg, timestamp: Date.now() });
  }
}

// HTTP API Routes

// Login with Master Password
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== MASTER_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: 'Contraseña maestra inválida.',
    });
  }

  const token = jwt.sign(
    { role: 'admin', user: 'opencode-operator' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    token,
    message: 'Autenticación exitosa',
    expiresIn: '7d',
  });
});

// Verify Token
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

// JWT Verification Middleware for protected APIs
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Se requiere token.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// System Information
app.get('/api/system/info', requireAuth, (_req, res) => {
  const opencodeInfo = checkToolAvailability(OPENCODE_CMD);
  const wranglerInfo = checkToolAvailability('wrangler');

  res.json({
    opencodeInstalled: opencodeInfo.installed,
    opencodeVersion: opencodeInfo.version,
    wranglerInstalled: wranglerInfo.installed,
    wranglerVersion: wranglerInfo.version,
    nodeVersion: process.version,
    platform: `${process.platform} (${process.arch})`,
    uptime: Math.floor(process.uptime()),
    baseWorkspaceDir: BASE_WORKSPACE_DIR,
    currentCwd,
    activeClients: authenticatedClients.size,
    mode: opencodeInfo.installed ? 'real-pty' : 'emulated',
  });
});

// List Projects in Workspace
app.get('/api/projects', requireAuth, (_req, res) => {
  try {
    if (!fs.existsSync(BASE_WORKSPACE_DIR)) {
      return res.json({ projects: [], baseDir: BASE_WORKSPACE_DIR });
    }

    const entries = fs.readdirSync(BASE_WORKSPACE_DIR, { withFileTypes: true });
    const projects = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const fullPath = path.join(BASE_WORKSPACE_DIR, entry.name);
        const isGitRepo = fs.existsSync(path.join(fullPath, '.git'));
        const hasPackageJson = fs.existsSync(path.join(fullPath, 'package.json'));
        const hasWrangler =
          fs.existsSync(path.join(fullPath, 'wrangler.toml')) ||
          fs.existsSync(path.join(fullPath, 'wrangler.json'));

        let lastModified: string | undefined;
        try {
          const stats = fs.statSync(fullPath);
          lastModified = stats.mtime.toISOString();
        } catch {
          // ignore
        }

        return {
          name: entry.name,
          path: fullPath,
          isGitRepo,
          hasPackageJson,
          hasWrangler,
          lastModified,
        };
      });

    return res.json({
      baseDir: BASE_WORKSPACE_DIR,
      currentCwd,
      projects,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create new Project Folder (with template or git clone support)
app.post('/api/projects/create', requireAuth, (req, res) => {
  const { name, template = 'blank', gitRepoUrl } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Nombre de proyecto requerido.' });
  }

  // Prevent directory traversal
  const sanitized = path.basename(name.trim().replace(/[^a-zA-Z0-9_-]/g, '-'));
  const targetPath = path.join(BASE_WORKSPACE_DIR, sanitized);

  try {
    if (template === 'github-clone' && gitRepoUrl) {
      if (fs.existsSync(targetPath)) {
        return res.status(400).json({ error: 'El directorio de destino ya existe.' });
      }
      execSync(`git clone ${gitRepoUrl} ${targetPath}`, { encoding: 'utf-8', timeout: 30000 });
    } else {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      if (template === 'cloudflare-worker') {
        const srcDir = path.join(targetPath, 'src');
        if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

        const wranglerToml = `name = "${sanitized}"\nmain = "src/index.ts"\ncompatibility_date = "2024-04-05"\n`;
        fs.writeFileSync(path.join(targetPath, 'wrangler.toml'), wranglerToml);

        const workerTs = `export default {\n  async fetch(request: Request, env: any, ctx: any): Promise<Response> {\n    return new Response(JSON.stringify({\n      message: "¡Cloudflare Worker desplegado exitosamente con OpenCode!",\n      project: "${sanitized}",\n      timestamp: new Date().toISOString()\n    }), {\n      headers: { "content-type": "application/json" }\n    });\n  }\n};\n`;
        fs.writeFileSync(path.join(srcDir, 'index.ts'), workerTs);

        const pkgJson = `{\n  "name": "${sanitized}",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "wrangler dev",\n    "deploy": "wrangler deploy"\n  }\n}\n`;
        fs.writeFileSync(path.join(targetPath, 'package.json'), pkgJson);

        try {
          execSync(`git init`, { cwd: targetPath, timeout: 5000 });
        } catch {
          // ignore
        }
      } else {
        try {
          execSync(`git init`, { cwd: targetPath, timeout: 5000 });
        } catch {
          // ignore
        }
      }
    }

    currentCwd = targetPath;
    startOrRestartProcess();

    return res.json({ success: true, path: targetPath, name: sanitized });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Deploy directly to Cloudflare Worker
app.post('/api/projects/deploy-cloudflare', requireAuth, (req, res) => {
  const targetDir = req.body.path ? path.resolve(req.body.path) : currentCwd;
  const wranglerExists =
    fs.existsSync(path.join(targetDir, 'wrangler.toml')) ||
    fs.existsSync(path.join(targetDir, 'wrangler.json'));

  const logHeader = `\r\n\x1b[1;35m[Cloudflare Deploy]\x1b[0m Iniciando despliegue de Cloudflare Worker en \x1b[33m${targetDir}\x1b[0m...\r\n`;
  appendToBuffer(logHeader);
  broadcast({ type: 'output', data: logHeader, timestamp: Date.now() });

  try {
    // If wrangler.toml doesn't exist, create a default one for the folder
    if (!wranglerExists) {
      const folderName = path.basename(targetDir);
      const defaultWrangler = `name = "${folderName}"\nmain = "src/index.ts"\ncompatibility_date = "2024-04-05"\n`;
      fs.writeFileSync(path.join(targetDir, 'wrangler.toml'), defaultWrangler);
    }

    const output = execSync('npx wrangler deploy', {
      cwd: targetDir,
      encoding: 'utf-8',
      env: { ...process.env, FORCE_COLOR: '1' },
      timeout: 60000,
    });

    appendToBuffer(output);
    broadcast({ type: 'output', data: output, timestamp: Date.now() });

    // Extract deployed URL (e.g., https://...workers.dev)
    const match = output.match(/https:\/\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.workers\.dev/i);
    const workerUrl = match ? match[0] : null;

    const successMsg = `\r\n\x1b[1;32m[Cloudflare Success]\x1b[0m ¡Despliegue completado! ${workerUrl ? `URL: \x1b[1;36m${workerUrl}\x1b[0m` : ''}\r\n`;
    appendToBuffer(successMsg);
    broadcast({ type: 'output', data: successMsg, timestamp: Date.now() });

    return res.json({
      success: true,
      workerUrl,
      output,
    });
  } catch (err: any) {
    const errorMsg = `\r\n\x1b[1;31m[Cloudflare Error]\x1b[0m ${err.stderr || err.message}\r\n`;
    appendToBuffer(errorMsg);
    broadcast({ type: 'output', data: errorMsg, timestamp: Date.now() });
    return res.status(500).json({ error: err.stderr || err.message });
  }
});

// Git Status for Active Project
app.get('/api/projects/git-status', requireAuth, (req, res) => {
  const targetDir = currentCwd;
  const isGit = fs.existsSync(path.join(targetDir, '.git'));
  if (!isGit) {
    return res.json({ isGit: false });
  }

  try {
    const branch = execSync('git branch --show-current 2>/dev/null || echo "main"', {
      cwd: targetDir,
      encoding: 'utf-8',
    }).trim();

    const statusOutput = execSync('git status --porcelain 2>/dev/null || true', {
      cwd: targetDir,
      encoding: 'utf-8',
    }).trim();

    let remoteUrl = '';
    try {
      remoteUrl = execSync('git remote get-url origin 2>/dev/null || true', {
        cwd: targetDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      // ignore
    }

    let lastCommit = '';
    try {
      lastCommit = execSync('git log -1 --oneline 2>/dev/null || true', {
        cwd: targetDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      // ignore
    }

    const changedFiles = statusOutput ? statusOutput.split('\n').filter(Boolean) : [];

    return res.json({
      isGit: true,
      branch: branch || 'main',
      hasChanges: changedFiles.length > 0,
      changedFilesCount: changedFiles.length,
      remoteUrl,
      lastCommit,
      changedFiles: changedFiles.slice(0, 15),
    });
  } catch (err: any) {
    return res.json({ isGit: true, error: err.message });
  }
});

// Git Actions (commit, push, remote)
app.post('/api/projects/git-action', requireAuth, (req, res) => {
  const { action, commitMessage, remoteUrl } = req.body;
  const targetDir = currentCwd;

  try {
    if (action === 'init') {
      execSync('git init', { cwd: targetDir });
      return res.json({ success: true, message: 'Repositorio Git inicializado.' });
    }

    if (action === 'set-remote' && remoteUrl) {
      try {
        execSync(`git remote remove origin 2>/dev/null || true`, { cwd: targetDir });
        execSync(`git remote add origin ${remoteUrl.trim()}`, { cwd: targetDir });
      } catch {
        execSync(`git remote set-url origin ${remoteUrl.trim()}`, { cwd: targetDir });
      }
      return res.json({ success: true, message: 'Remoto de GitHub configurado.' });
    }

    if (action === 'commit') {
      const msg = commitMessage?.trim() || 'Actualización con OpenCode';
      execSync('git add -A', { cwd: targetDir });
      execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: targetDir });
      try {
        execSync('git push -u origin HEAD', { cwd: targetDir, timeout: 20000 });
      } catch {
        // push might fail if no upstream or credentials needed, but commit succeeded
      }
      return res.json({ success: true, message: 'Cambios guardados en Git y enviados.' });
    }

    if (action === 'push') {
      const output = execSync('git push -u origin HEAD', { cwd: targetDir, encoding: 'utf-8', timeout: 20000 });
      return res.json({ success: true, output });
    }

    return res.status(400).json({ error: 'Acción no reconocida.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.stderr || err.message });
  }
});

// Change Current Directory
app.post('/api/cwd', requireAuth, (req, res) => {
  const { newPath } = req.body;
  if (!newPath || typeof newPath !== 'string') {
    return res.status(400).json({ error: 'Ruta no especificada.' });
  }

  const resolved = path.resolve(newPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return res.status(400).json({ error: 'La ruta no existe o no es un directorio.' });
  }

  currentCwd = resolved;
  startOrRestartProcess();

  return res.json({
    success: true,
    cwd: currentCwd,
  });
});

// HTTP & WebSocket Server Setup
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade with token auth
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocket) => {
  authenticatedClients.add(ws);
  broadcastClientsCount();

  // Send initial history, state, and status
  ws.send(
    JSON.stringify({
      type: 'history',
      buffer: terminalBuffer,
      cwd: currentCwd,
      status: ptySession.status,
      clientsCount: authenticatedClients.size,
    })
  );

  ws.on('message', (message: string) => {
    try {
      const msg = JSON.parse(message.toString());

      if (msg.type === 'input') {
        const inputStr = msg.data;
        if (ptySession.process && ptySession.process.stdin.writable) {
          ptySession.status = 'running';
          ptySession.lastInputTime = Date.now();
          ptySession.process.stdin.write(inputStr);
          broadcast({
            type: 'status',
            status: 'running',
            cwd: currentCwd,
            pid: ptySession.process.pid,
          });
        } else {
          // Restart process if it wasn't running
          startOrRestartProcess();
          setTimeout(() => {
            if (ptySession.process && ptySession.process.stdin.writable) {
              ptySession.process.stdin.write(inputStr);
            }
          }, 300);
        }
      } else if (msg.type === 'signal') {
        if (ptySession.process) {
          if (msg.signal === 'SIGINT') {
            // Write Ctrl+C to stdin or send signal
            ptySession.process.stdin.write('\x03');
            try {
              ptySession.process.kill('SIGINT');
            } catch {
              // ignore
            }
          } else if (msg.signal === 'SIGTERM') {
            ptySession.process.kill('SIGTERM');
          }
        }
      } else if (msg.type === 'clear') {
        terminalBuffer = '';
        broadcast({ type: 'cleared' });
      } else if (msg.type === 'restart') {
        startOrRestartProcess();
      } else if (msg.type === 'set_cwd' && msg.path) {
        if (fs.existsSync(msg.path)) {
          currentCwd = path.resolve(msg.path);
          startOrRestartProcess();
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    authenticatedClients.delete(ws);
    broadcastClientsCount();
  });

  ws.on('error', () => {
    authenticatedClients.delete(ws);
    broadcastClientsCount();
  });
});

// Start initial process
startOrRestartProcess();

// Serve Vite in development or static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OpenCode Web Server listening on port ${PORT}`);
    console.log(`Base Workspace: ${BASE_WORKSPACE_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});
