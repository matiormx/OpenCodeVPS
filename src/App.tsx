import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from './services/authService';
import { socketClient } from './services/socketClient';
import { projectApi } from './services/projectApi';
import { ProcessStatus, DirectiveMessage } from './types/terminal';
import { LoginModal } from './components/Auth/LoginModal';
import { Sidebar } from './components/Claude/Sidebar';
import { ClaudeHeader } from './components/Claude/ClaudeHeader';
import { ClaudeInput } from './components/Claude/ClaudeInput';
import { WelcomeView } from './components/Claude/WelcomeView';
import { MessageItem } from './components/Claude/MessageItem';
import { ArtifactPanel } from './components/Claude/ArtifactPanel';
import { MobileKeyboardBar } from './components/Terminal/MobileKeyboardBar';
import { ProjectDrawer } from './components/Navigation/ProjectDrawer';
import { SystemStatusModal } from './components/System/SystemStatusModal';
import { NewProjectModal } from './components/Projects/NewProjectModal';
import { DeployCloudflareModal } from './components/Projects/DeployCloudflareModal';
import { GitHubModal } from './components/Projects/GitHubModal';
import { DeployGuideModal } from './components/System/DeployGuideModal';

interface TaskSession {
  id: string;
  title: string;
  timestamp: number;
  messages: DirectiveMessage[];
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentCwd, setCurrentCwd] = useState<string>('/workspace');
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [clientsCount, setClientsCount] = useState<number>(1);
  const [terminalOutput, setTerminalOutput] = useState<string>('');

  // UI States (Claude layout)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [artifactTab, setArtifactTab] = useState<'terminal' | 'diff' | 'files'>('terminal');

  // Modals
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isDeployCloudflareOpen, setIsDeployCloudflareOpen] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);

  // Diffs & Prompts
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [planSummary, setPlanSummary] = useState<string>('');
  const [diffText, setDiffText] = useState<string>('');

  // Tasks & Messages
  const [tasks, setTasks] = useState<TaskSession[]>(() => {
    const saved = localStorage.getItem('opencode_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(() => {
    return tasks.length > 0 ? tasks[0].id : null;
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('opencode_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const currentTask = tasks.find((t) => t.id === currentTaskId);
  const currentMessages = currentTask ? currentTask.messages : [];

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [currentMessages]);

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      socketClient.connect();

      const unsubConn = socketClient.onConnection((conn) => {
        setIsConnected(conn);
      });

      const unsubHistory = socketClient.onHistory((buf, cwd, st, count) => {
        setTerminalOutput(buf);
        if (cwd) setCurrentCwd(cwd);
        if (st) setStatus(st);
        if (count) setClientsCount(count);
      });

      const unsubOutput = socketClient.onOutput((data) => {
        setTerminalOutput((prev) => prev + data);

        // Detect diffs
        if (data.includes('diff --git') || (data.includes('--- ') && data.includes('+++ '))) {
          setDiffText((prev) => prev + '\n' + data);
          setIsArtifactOpen(true);
          setArtifactTab('diff');
        }

        // Update assistant response if executing
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== currentTaskId) return t;
            const msgs = [...t.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === 'assistant' && last.status === 'pending') {
              last.content = (last.content + data).slice(-2000); // keep recent
            }
            return { ...t, messages: msgs };
          })
        );
      });

      const unsubStatus = socketClient.onStatus((st, cwd) => {
        setStatus(st);
        if (cwd) setCurrentCwd(cwd);
        if (st === 'idle') {
          // Mark last assistant message as completed
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id !== currentTaskId) return t;
              const msgs = [...t.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.role === 'assistant' && last.status === 'pending') {
                last.status = 'completed';
              }
              return { ...t, messages: msgs };
            })
          );
        }
      });

      const unsubPrompt = socketClient.onPrompt((question) => {
        setPendingPrompt(question);
        // Attach confirmation prompt to current message
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== currentTaskId) return t;
            const msgs = [...t.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === 'assistant') {
              last.confirmationPrompt = {
                text: question,
                actionYes: 'Aprobar cambios (Y)',
                actionNo: 'Rechazar (N)',
              };
            }
            return { ...t, messages: msgs };
          })
        );
      });

      const unsubCount = socketClient.onClientsCount((count) => {
        setClientsCount(count);
      });

      return () => {
        unsubConn();
        unsubHistory();
        unsubOutput();
        unsubStatus();
        unsubPrompt();
        unsubCount();
        socketClient.disconnect();
      };
    }
  }, [isAuthenticated, currentTaskId]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.removeToken();
    socketClient.disconnect();
    setIsAuthenticated(false);
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newTask: TaskSession = {
      id: newId,
      title: 'Nuevo Proyecto',
      timestamp: Date.now(),
      messages: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    setCurrentTaskId(newId);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (currentTaskId === id) {
      const remaining = tasks.filter((t) => t.id !== id);
      setCurrentTaskId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleSendPrompt = useCallback(
    (text: string) => {
      let targetTaskId = currentTaskId;
      let isNew = false;

      if (!targetTaskId) {
        targetTaskId = Date.now().toString();
        isNew = true;
      }

      const userMsg: DirectiveMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: DirectiveMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Procesando en el servidor...',
        timestamp: Date.now() + 1,
        status: 'pending',
      };

      // Set clean title from first words
      const titleCandidate = text.trim().slice(0, 36) + (text.length > 36 ? '...' : '');

      if (isNew) {
        const newTask: TaskSession = {
          id: targetTaskId,
          title: titleCandidate,
          timestamp: Date.now(),
          messages: [userMsg, assistantMsg],
        };
        setTasks((prev) => [newTask, ...prev]);
        setCurrentTaskId(targetTaskId);
      } else {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === targetTaskId) {
              const updatedTitle = t.messages.length === 0 ? titleCandidate : t.title;
              return {
                ...t,
                title: updatedTitle,
                messages: [...t.messages, userMsg, assistantMsg],
              };
            }
            return t;
          })
        );
      }

      socketClient.sendInput(text);
    },
    [currentTaskId]
  );

  const handleConfirmPrompt = useCallback(() => {
    socketClient.sendInput('y\n');
    setPendingPrompt(null);
  }, []);

  const handleRejectPrompt = useCallback(() => {
    socketClient.sendInput('n\n');
    setPendingPrompt(null);
  }, []);

  const handleSendSpecialKey = useCallback((key: string) => {
    socketClient.sendInput(key);
  }, []);

  const handleSendSignal = useCallback((signal: 'SIGINT') => {
    socketClient.sendSignal(signal);
  }, []);

  const handleClearTerminal = useCallback(() => {
    socketClient.clear();
    setTerminalOutput('');
  }, []);

  const handleRestartProcess = useCallback(() => {
    socketClient.restart();
  }, []);

  const handleSelectProject = async (path: string) => {
    try {
      await projectApi.changeCwd(path);
      setCurrentCwd(path);
      socketClient.setCwd(path);
    } catch (err: any) {
      console.error('Error al cambiar proyecto:', err);
    }
  };

  const handleProjectCreated = (newPath: string) => {
    setCurrentCwd(newPath);
    socketClient.setCwd(newPath);
    handleNewChat();
  };

  if (!isAuthenticated) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#181716] text-[#ecebe8] font-sans overflow-hidden">
      {/* Claude Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onOpenDeployCloudflare={() => setIsDeployCloudflareOpen(true)}
        onOpenGitHub={() => setIsGitHubOpen(true)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
        recentTasks={tasks.map((t) => ({ id: t.id, title: t.title, timestamp: t.timestamp }))}
        currentTaskId={currentTaskId}
        onSelectTask={(id) => setCurrentTaskId(id)}
        onDeleteTask={handleDeleteTask}
        currentCwd={currentCwd}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
        onLogout={handleLogout}
        isConnected={isConnected}
        status={status}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <ClaudeHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onToggleArtifact={() => setIsArtifactOpen(!isArtifactOpen)}
          isArtifactOpen={isArtifactOpen}
          currentCwd={currentCwd}
          onOpenProjects={() => setIsProjectsOpen(true)}
          onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
          onOpenDeployCloudflare={() => setIsDeployCloudflareOpen(true)}
          onOpenGitHub={() => setIsGitHubOpen(true)}
          onLogout={handleLogout}
          isConnected={isConnected}
          taskTitle={currentTask?.title || 'OpenCode Console'}
        />

        {/* Content Split: Conversation Canvas + Artifact Panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Conversation Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full bg-[#181716] overflow-hidden">
            {/* Messages Scroll Area */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-4">
              {currentMessages.length === 0 ? (
                <WelcomeView
                  onSelectPrompt={(prompt) => handleSendPrompt(prompt + '\n')}
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                  onOpenDeployCloudflare={() => setIsDeployCloudflareOpen(true)}
                  onOpenGitHub={() => setIsGitHubOpen(true)}
                  onOpenTerminal={() => {
                    setIsArtifactOpen(true);
                    setArtifactTab('terminal');
                  }}
                  currentCwd={currentCwd}
                />
              ) : (
                currentMessages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onConfirmPrompt={handleConfirmPrompt}
                    onRejectPrompt={handleRejectPrompt}
                    onOpenArtifact={(tab) => {
                      setIsArtifactOpen(true);
                      setArtifactTab(tab);
                    }}
                  />
                ))
              )}
            </div>

            {/* Prompt Input Box (Claude style) */}
            <ClaudeInput
              onSend={handleSendPrompt}
              disabled={!isConnected}
              currentCwd={currentCwd}
            />

            {/* Mobile Keyboard Bar */}
            <div className="md:hidden">
              <MobileKeyboardBar
                onSendSpecial={handleSendSpecialKey}
                onClear={handleClearTerminal}
                onSendSignal={handleSendSignal}
              />
            </div>
          </div>

          {/* Claude Artifact Side-Panel (Terminal / Diffs / Plans) */}
          <ArtifactPanel
            isOpen={isArtifactOpen}
            onClose={() => setIsArtifactOpen(false)}
            activeTab={artifactTab}
            setActiveTab={setArtifactTab}
            terminalOutput={terminalOutput}
            diffText={diffText}
            planText={planSummary}
            currentCwd={currentCwd}
            onClearTerminal={handleClearTerminal}
            onRestartProcess={handleRestartProcess}
            onConfirmPrompt={handleConfirmPrompt}
            onRejectPrompt={handleRejectPrompt}
          />
        </div>
      </div>

      {/* New Project Wizard Modal (Cloudflare Worker / GitHub / Blank) */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Cloudflare 1-Click Deploy Modal */}
      <DeployCloudflareModal
        isOpen={isDeployCloudflareOpen}
        onClose={() => setIsDeployCloudflareOpen(false)}
        currentCwd={currentCwd}
        onViewTerminal={() => {
          setIsArtifactOpen(true);
          setArtifactTab('terminal');
        }}
      />

      {/* GitHub Sync Modal */}
      <GitHubModal
        isOpen={isGitHubOpen}
        onClose={() => setIsGitHubOpen(false)}
        currentCwd={currentCwd}
      />

      {/* VPS Deploy Guide Modal */}
      <DeployGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />

      {/* Project Selector Drawer */}
      <ProjectDrawer
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentCwd={currentCwd}
        onSelectProject={handleSelectProject}
      />

      {/* VPS Telemetry Modal */}
      <SystemStatusModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  );
}
