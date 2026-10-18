# OpenCode Web UI — Arquitectura y Plan de Implementación

Plataforma web full-stack responsive (mobile-first y desktop) que actúa como puente interactivo y seguro hacia el proceso de `@opencode/cli` en el servidor VPS, permitiendo ejecutar directivas, visualizar planes, diffs de código y autorizaciones en tiempo real sin necesidad de cliente SSH.

---

## Decisiones Críticas Confirmadas

> [!IMPORTANT]
> Decisiones técnicas confirmadas en la Fase de Descubrimiento:

- **Manejo de Concurrencia y PTY**: Sesión interactiva única compartida. Todos los clientes autenticados (móvil, tablet, escritorio) se suscriben al mismo proceso PTY vivo con sincronización de búfer circular para reconexiones instantáneas.
- **Gestión de Directorio de Trabajo**: Directorio base configurable (`WORKSPACE_DIR`) con explorador/selector de proyectos y carpetas en tiempo real vía API.
- **Modalidad de Interfaz de Usuario**: Interfaz híbrida adaptada a móviles (Mobile-First) con panel conversacional tipo chat, visor de terminal en tiempo real con resaltado ANSI, visualizador de diffs y barra de atajos táctiles (Ctrl+C, Enter, Yes/No, Esc).
- **Esquema de Seguridad**: Contraseña maestra configurada en el servidor, autenticación vía JSON Web Token (JWT) con persistencia en cliente y validación estricta en el handshake de WebSocket y rutas de API.

---

## 1. Topología del Flujo de WebSockets y PTY

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cliente Web (Móvil / Desktop)                  │
│                                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌──────────────┐   │
│   │ Chat / Directivas   │   │ Terminal View     │   │ Diff Viewer  │   │
│   └──────────┬──────────┘   └─────────┬─────────┘   └───────┬──────┘   │
│              │                        │                     │          │
│              └──────────────┬─────────┴─────────────────────┘          │
│                             │                                          │
│                   WebSocket Client (JWT Auth)                          │
└─────────────────────────────┼──────────────────────────────────────────┘
                              │
                    ws:// / wss:// handshake (?token=JWT)
                              │
┌─────────────────────────────▼──────────────────────────────────────────┐
│                   Servidor Backend (Node.js Express + ws)              │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │ Express REST API      │             │ WebSocket Server           │  │
│  │ - POST /api/auth/login│             │ - Auth Middleware          │  │
│  │ - GET  /api/projects  │             │ - Client Broadcaster       │  │
│  │ - POST /api/cwd       │             │ - Circular Output Buffer   │  │
│  └───────────────────────┘             └─────────────┬──────────────┘  │
│                                                      │                 │
│                                            JSON Protocol / Raw Stream  │
│                                                      │                 │
│  ┌───────────────────────────────────────────────────▼──────────────┐  │
│  │              PTY Bridge Controller (`node-pty` / child_pty)       │  │
│  │  - Spawn `opencode` en `$CWD` actual                              │  │
│  │  - STDIN write (comandos, respuestas Y/N, Ctrl+C)                 │  │
│  │  - STDOUT/STDERR stream con parser de eventos y planes            │  │
│  │  - Detección de estados (esperando confirmación, procesando, fin) │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
                Pseudo-Terminal I/O (stdin/stdout)
                               │
┌──────────────────────────────▼─────────────────────────────────────────┐
│              Proceso del Sistema: `@opencode/cli`                      │
│   Entorno: Node v22 en Ubuntu 24.04 LTS con Wrangler & Cloudflare API  │
└────────────────────────────────────────────────────────────────────────┘
```

### Protocolo de Mensajería WebSocket

1. **Cliente -> Servidor**:
   - `{ type: "input", data: "revisa el archivo index.ts y corrige tipos\n" }`
   - `{ type: "resize", cols: 80, rows: 24 }`
   - `{ type: "signal", signal: "SIGINT" }` (Ctrl+C)
   - `{ type: "confirm", action: "yes" | "no" }`
   - `{ type: "set_cwd", path: "/home/user/projects/app" }`
2. **Servidor -> Cliente**:
   - `{ type: "output", data: "...", timestamp: 1718000000 }`
   - `{ type: "plan_detected", plan: "...", diffs: [...] }`
   - `{ type: "status", state: "idle" | "running" | "waiting_confirmation", cwd: "..." }`
   - `{ type: "clients_count", count: 2 }`
   - `{ type: "history", buffer: "..." }` (enviado al conectar)

---

## 2. Pila Tecnológica y Dependencias npm

### Backend & PTY Bridge:
- `express`: Servidor HTTP y enrutamiento de API REST.
- `ws` (`@types/ws`): Servidor WebSocket de alta velocidad para streaming de terminal bidireccional.
- `node-pty` (con fallback de `child_process.spawn` interactivo con PTY emulation): Instanciación de pseudo-terminal real en Linux para preservar colores ANSI, control de cursores y señales POSIX.
- `jsonwebtoken` (`@types/jsonwebtoken`): Firma y verificación de tokens de sesión con clave maestra.
- `dotenv`: Gestión de variables de entorno (`MASTER_PASSWORD`, `JWT_SECRET`, `BASE_WORKSPACE_DIR`, `PORT`).

### Frontend:
- `react` 19 & `react-dom`: Componentes de interfaz de usuario reactivos.
- `lucide-react`: Iconografía técnica y de control (Terminal, Send, Play, Pause, Folder, Check, X, Key, Smartphone).
- `ansi-to-react` / conversor ANSI ligero: Renderizado seguro y estilizado de secuencias ANSI de color en la terminal web.
- `motion`: Animaciones fluidas de micro-interacciones (cajón de terminal móvil, transiciones de confirmación).
- Tailwind CSS v4: Estilizado responsive Mobile-First, adaptado para uso táctil y paleta dark slate para entornos de desarrollo.

---

## 3. Arquitectura del Proyecto (Estructura de Directorios)

```
├── .env.example              # MASTER_PASSWORD, JWT_SECRET, BASE_WORKSPACE_DIR
├── server.ts                 # Servidor Full-Stack Node.js (Express + WebSocket + PTY)
├── src/
│   ├── main.tsx              # Punto de entrada de React
│   ├── App.tsx               # Enrutador de estado (Login / Workspace UI)
│   ├── index.css             # Tailwind CSS y reglas de viewport móvil
│   ├── types/
│   │   ├── auth.ts           # Interfaces de autenticación y token
│   │   ├── terminal.ts       # Protocolos de mensajes WS y estado PTY
│   │   └── project.ts        # Árbol de carpetas y proyectos
│   ├── services/
│   │   ├── authService.ts    # Manejo de JWT en localStorage / headers
│   │   ├── socketClient.ts   # Cliente WebSocket con auto-reconexión y cola
│   │   └── projectApi.ts     # Endpoints REST para explorar proyectos y carpetas
│   └── components/
│       ├── Auth/
│       │   └── LoginModal.tsx           # Acceso seguro con contraseña maestra
│       ├── Navigation/
│       │   ├── TopBar.tsx               # Estado de conexión, CWD y botón de proyectos
│       │   └── ProjectDrawer.tsx        # Explorador lateral de proyectos del VPS
│       ├── Chat/
│       │   ├── ChatPromptInput.tsx      # Barra de directivas optimizada para móvil
│       │   ├── DirectiveHistory.tsx     # Tarjetas de directivas enviadas y estados
│       │   └── ApprovalBar.tsx          # Botonera fija de confirmación (Escribir archivos Y/N)
│       ├── Terminal/
│       │   ├── TerminalViewer.tsx       # Visor con buffer ANSI, auto-scroll y búsqueda
│       │   └── MobileKeyboardBar.tsx    # Atajos táctiles móviles (Ctrl+C, Enter, Esc, ↑, ↓)
│       └── Diff/
│           └── PlanDiffModal.tsx        # Visualizador de diffs antes de confirmar cambios
└── package.json
```

---

## 4. Hitos Modulares de Ejecución (Fase de Codificación)

### Hito 1: Servidor Base, Autenticación y APIs REST
- Configuración de dependencias (`ws`, `jsonwebtoken`, types).
- Creación de `server.ts` con Express sirviendo la app compilada y API REST:
  - `POST /api/auth/login`: Validación de contraseña maestra y emisión de JWT.
  - `GET /api/projects`: Listado de directorios dentro de `BASE_WORKSPACE_DIR`.
  - `GET /api/system/status`: Comprobación de estado de OpenCode CLI en el VPS.
- Middleware de verificación de JWT para rutas protegidas y upgrade de WebSocket.

### Hito 2: Puente PTY y Servidor WebSocket
- Implementación de `PtyManager`:
  - Instanciación de terminal interactiva (`opencode` o shell configurable).
  - Búfer circular en memoria para conservar los últimos 5000 bytes/líneas.
  - Sincronización en vivo hacia todos los sockets conectados.
  - Manejo de señales (`SIGINT`, redimensionamiento de filas/columnas).
  - Parser heurístico para detectar estados ("esperando aprobación Y/N", "plan listo").

### Hito 3: Frontend Híbrido Mobile-First y Controles
- Pantalla de inicio de sesión con feedback inmediato y almacenamiento seguro del token.
- Cabecera con indicador de estado WebSocket en vivo y selector de proyectos.
- Panel principal con visualización dividida / pestañas móviles:
  - **Modo Chat**: Enviar directivas directas a OpenCode con formato limpio.
  - **Modo Terminal**: Registro en tiempo real con soporte de secuencias ANSI y colores.
  - **Barra de confirmación**: Botones prominentes para autorizar la escritura de archivos ("Confirmar Plan", "Rechazar").
  - **Barra táctil móvil**: Teclas rápidas para control en teclado virtual de smartphones.

---

## 5. Medidas de Seguridad y Resiliencia en VPS

1. **Protección contra ataques de fuerza bruta**: Límite de intentos en el endpoint `/api/auth/login`.
2. **Sanitización de rutas**: El explorador de carpetas está confinado al directorio base configurado para impedir `path traversal` (`../`).
3. **Reconexión silenciosa**: El cliente WebSocket implementa backoff exponencial y recupera el búfer del PTY automáticamente si se cambia de red móvil (WiFi a 4G/5G).
4. **Manejo de señales de desconexión**: El proceso de OpenCode sigue ejecutándose en el servidor aunque el navegador se cierre temporalmente.
