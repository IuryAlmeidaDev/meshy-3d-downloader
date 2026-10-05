// content.js - Interface flutuante Studio PRO (Bolder + Impeccable Polish Edition)
(function initMeshyContentScript() {
  const capturedGLBs = [];
  let lastCaptured = null;
  let isMinimized = false;
  let isProcessing = false;
  let engineOnline = false;
  let selectedLodTarget = 5000; // Padrão otimizado para Roblox Studio
  let showHistoryDrawer = false;
  let showEngineDrawer = false;

  const isDiscover = window.location.href.includes("/discover");

  function sendLog(level, message, data = null) {
    try {
      chrome.runtime.sendMessage({ action: "log", level, message, data });
    } catch (_) {}
  }

  // Recebe mensagens do page_inject.js (logs e modelos descriptografados)
  window.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "MESHY_LOG") {
      const { level, message, data } = event.data.payload || {};
      sendLog(level, message, data);
    }

    if (event.data.type === "MESHY_GLB_READY") {
      const glb = event.data.payload;
      const exists = capturedGLBs.find(g => g.filename === glb.filename);
      if (!exists) {
        capturedGLBs.push(glb);
      }
      lastCaptured = glb;
      flashPulseDot();
      updateFloatingPanel();
      setLog(`Modelo decodificado (${glb.sizeKB} KB): ${glb.filename}`);
    }
  });

  // Ícones Vetoriais SVG Inline de Alta Precisão (Sem Emojis)
  const icons = {
    download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upscale: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    games: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    stl: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    split: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    minimize: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    expand: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    server: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
    history: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  function flashPulseDot() {
    const dot = document.querySelector(".mdp-pulse-dot");
    if (!dot) return;
    dot.classList.add("is-active");
    setTimeout(() => {
      if (!isProcessing) dot.classList.remove("is-active");
    }, 2500);
  }

  function checkEngineLiveness(showLogFeedback = false) {
    try {
      chrome.runtime.sendMessage({ action: "check_engine" }, (res) => {
        engineOnline = !!(res && res.online);
        renderEngineStatus();
        if (showLogFeedback) {
          setLog(engineOnline ? "Motor Python 3D conectado e operacional!" : "Motor Python offline. Inicie o servidor local.");
        }
      });
    } catch (_) {
      engineOnline = false;
      renderEngineStatus();
    }
  }

  function renderEngineStatus() {
    const statusBtn = document.getElementById("mdp-engine-status");
    const toolsGrid = document.querySelector(".mdp-tools-grid");
    if (!statusBtn) return;

    if (engineOnline) {
      statusBtn.className = "mdp-engine-pill online";
      statusBtn.innerHTML = `<span class="mdp-engine-dot"></span><span>ENGINE: ONLINE</span>`;
      statusBtn.title = "Motor local Python ativo na porta 9999. Clique para detalhes.";
      if (toolsGrid) toolsGrid.classList.remove("engine-offline");
    } else {
      statusBtn.className = "mdp-engine-pill offline";
      statusBtn.innerHTML = `<span class="mdp-engine-dot"></span><span>ENGINE: OFFLINE</span>`;
      statusBtn.title = "Servidor local desconectado. Clique para ver instruções de inicialização.";
      if (toolsGrid) toolsGrid.classList.add("engine-offline");
    }
  }

  function createFloatingUI() {
    if (document.getElementById("meshy-downloader-panel")) return;

    const panel = document.createElement("div");
    panel.id = "meshy-downloader-panel";

    // Recupera posição salva no localStorage
    try {
      const savedPos = JSON.parse(localStorage.getItem("mdp_hud_position"));
      if (savedPos && savedPos.left && savedPos.top) {
        panel.style.left = `${savedPos.left}px`;
        panel.style.top = `${savedPos.top}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }
    } catch (_) {}

    panel.innerHTML = `
      <!-- Header HUD com Suporte a Drag -->
      <div id="mdp-header">
        <div class="mdp-header-left">
          <span class="mdp-pulse-dot" title="Status de Interceptação"></span>
          <span class="mdp-title">MESHY STUDIO PRO</span>
          <span class="mdp-badge">${isDiscover ? "DISCOVER" : "WORKSPACE"}</span>
        </div>
        <div class="mdp-header-right">
          <button id="mdp-engine-status" class="mdp-engine-pill offline" title="Verificar status do servidor">
            <span class="mdp-engine-dot"></span><span>ENGINE: ...</span>
          </button>
          <button id="mdp-btn-toggle" class="mdp-icon-btn" title="Minimizar / Expandir (Esc)">${icons.minimize}</button>
        </div>
      </div>

      <!-- Gaveta de Instruções do Motor Local (P0 Helper) -->
      <div id="mdp-engine-drawer" class="mdp-drawer hidden">
        <div class="mdp-drawer-header">
          <span>MOTOR PYTHON LOCAL (PORTA 9999)</span>
          <button id="mdp-btn-close-engine-drawer" class="mdp-icon-btn">${icons.close}</button>
        </div>
        <p class="mdp-drawer-desc">
          O processamento 3D roda no seu hardware com máxima velocidade e privacidade.
        </p>
        <div class="mdp-code-box">
          <code>python meshy-server\\logger_server.py</code>
          <button id="mdp-btn-copy-command" class="mdp-copy-btn" title="Copiar comando">
            ${icons.copy} <span>Copiar</span>
          </button>
        </div>
        <div class="mdp-drawer-actions">
          <button id="mdp-btn-test-connection" class="mdp-secondary-btn">Testar Conexão Agora</button>
        </div>
      </div>

      <!-- Gaveta de Histórico de Modelos Capturados (P2 Asset History) -->
      <div id="mdp-history-drawer" class="mdp-drawer hidden">
        <div class="mdp-drawer-header">
          <span>HISTÓRICO DE ASSETS CAPTURADOS</span>
          <button id="mdp-btn-close-history-drawer" class="mdp-icon-btn">${icons.close}</button>
        </div>
        <div id="mdp-history-list" class="mdp-history-list">
          <div class="mdp-empty-history">Nenhum modelo capturado ainda. Navegue ou gere no Meshy.</div>
        </div>
      </div>

      <!-- Corpo Principal -->
      <div id="mdp-body">
        <!-- Telemetria do Modelo Ativo -->
        <div class="mdp-telemetry-box">
          <div class="mdp-telemetry-row">
            <span class="mdp-telemetry-label">ASSET ATIVO</span>
            <button id="mdp-count-pill" class="mdp-pill" title="Clique para abrir o histórico de modelos">
              ${icons.history} <span>0 CAPTURADOS</span>
            </button>
          </div>
          <div id="mdp-active-name" class="mdp-asset-name">
            ${isDiscover ? "Selecione um modelo no feed público" : "Abra ou gere um modelo para decodificar"}
          </div>
        </div>

        <!-- Ação Âncora Principal (Download Manual) -->
        <button id="mdp-btn-manual-download" class="mdp-main-action disabled" disabled title="Atalho: Alt + D">
          <span class="mdp-btn-icon">${icons.download}</span>
          <span id="mdp-main-action-text">AGUARDANDO MODELO NA TELA</span>
        </button>

        <!-- Toggle de Automação -->
        <label class="mdp-switch-row">
          <input type="checkbox" id="mdp-auto-dl-toggle" class="mdp-checkbox">
          <span class="mdp-switch-text">Auto-download ao navegar no feed</span>
        </label>

        <!-- Divisor Tático de Ferramentas Studio -->
        <div class="mdp-divider">
          <span>PROCESSAMENTO LOCAL</span>
        </div>

        <!-- Presets de Decimação Paramétrica (P3) -->
        <div class="mdp-lod-bar">
          <span class="mdp-lod-title">ALVO LOD:</span>
          <div class="mdp-lod-chips">
            <button class="mdp-lod-chip active" data-faces="5000" title="Ideal para Roblox Studio">Roblox 5k</button>
            <button class="mdp-lod-chip" data-faces="20000" title="Equilíbrio para Unity e Godot">Unity 20k</button>
            <button class="mdp-lod-chip" data-faces="50000" title="Alta fidelidade geométrica">Hi-Fi 50k</button>
          </div>
        </div>

        <!-- Grid de Ferramentas Studio -->
        <div class="mdp-tools-grid">
          <button id="mdp-btn-upscale" class="mdp-tool-btn" title="Super-resolução Lanczos para 4096x4096px (Alt+1)">
            <span class="mdp-tool-icon">${icons.upscale}</span>
            <span class="mdp-tool-label">Upscale 4K</span>
          </button>
          <button id="mdp-btn-games" class="mdp-tool-btn" title="Quadric Decimation para o alvo selecionado (Alt+2)">
            <span class="mdp-tool-icon">${icons.games}</span>
            <span class="mdp-tool-label">Low-Poly LOD</span>
          </button>
          <button id="mdp-btn-repair" class="mdp-tool-btn" title="Reparo de malha estanque Watertight STL (Alt+3)">
            <span class="mdp-tool-icon">${icons.stl}</span>
            <span class="mdp-tool-label">STL 3D Print</span>
          </button>
          <button id="mdp-btn-split" class="mdp-tool-btn" title="Separação de ilhas geométricas desconectadas (Alt+4)">
            <span class="mdp-tool-icon">${icons.split}</span>
            <span class="mdp-tool-label">Split Mesh</span>
          </button>
        </div>

        <!-- Barra de Progresso e Estado Assíncrono (P1) -->
        <div id="mdp-progress-box" class="mdp-progress-box hidden">
          <div class="mdp-progress-header">
            <span id="mdp-progress-label">Processando...</span>
            <span id="mdp-progress-percent">0%</span>
          </div>
          <div class="mdp-progress-track">
            <div id="mdp-progress-bar" class="mdp-progress-bar"></div>
          </div>
        </div>

        <!-- Card de Entrega do Resultado (P1 Output Delivery) -->
        <div id="mdp-result-card" class="mdp-result-card hidden">
          <div class="mdp-result-header">
            <span class="mdp-result-badge">${icons.check} CONCLUÍDO</span>
            <button id="mdp-btn-close-result" class="mdp-icon-btn">${icons.close}</button>
          </div>
          <div id="mdp-result-details" class="mdp-result-details">Arquivo gerado com sucesso.</div>
          <button id="mdp-btn-download-result" class="mdp-result-download-btn">
            ${icons.download} <span>Baixar Arquivo Gerado</span>
          </button>
        </div>

        <!-- Terminal de Status em Tempo Real -->
        <div class="mdp-terminal">
          <span class="mdp-terminal-prompt">&gt;</span>
          <span id="mdp-log" class="mdp-terminal-text">Pronto. Sistema em espera.</span>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #meshy-downloader-panel,
      #meshy-downloader-panel * {
        box-sizing: border-box !important;
      }
      #meshy-downloader-panel {
        position: fixed;
        bottom: 22px;
        right: 22px;
        width: 336px;
        background: rgba(13, 14, 18, 0.96);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(0, 0, 0, 0.6);
        border-radius: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        color: #f4f4f5;
        z-index: 999999;
        overflow: hidden;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, box-shadow 0.2s ease;
      }
      #meshy-downloader-panel ::selection {
        background: rgba(163, 230, 53, 0.35);
        color: #bef264;
      }
      #meshy-downloader-panel button:focus-visible {
        outline: 2px solid #a3e635;
        outline-offset: 1px;
      }
      .mdp-pill, .mdp-progress-percent, .mdp-terminal, .mdp-history-meta {
        font-variant-numeric: tabular-nums;
      }
      .mdp-history-list::-webkit-scrollbar {
        width: 4px;
      }
      .mdp-history-list::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 4px;
      }
      .mdp-history-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 4px;
      }
      .mdp-history-list::-webkit-scrollbar-thumb:hover {
        background: #a3e635;
      }
      #meshy-downloader-panel.minimized {
        width: auto !important;
        min-width: 175px !important;
        border-radius: 14px !important;
      }
      #meshy-downloader-panel.minimized #mdp-body,
      #meshy-downloader-panel.minimized #mdp-engine-drawer,
      #meshy-downloader-panel.minimized #mdp-history-drawer {
        display: none !important;
      }
      #meshy-downloader-panel.minimized #mdp-header {
        padding: 7px 12px !important;
        border-bottom: none !important;
      }
      #meshy-downloader-panel.minimized .mdp-badge,
      #meshy-downloader-panel.minimized .mdp-engine-pill {
        display: none !important;
      }
      #mdp-header {
        background: rgba(22, 23, 29, 0.95);
        padding: 9px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        user-select: none;
        cursor: grab;
        width: 100%;
      }
      #mdp-header:active {
        cursor: grabbing;
      }
      .mdp-header-left {
        display: flex;
        align-items: center;
        gap: 7px;
        flex-shrink: 0;
      }
      .mdp-header-right {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .mdp-pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #a3e635;
        box-shadow: 0 0 0 1.5px rgba(163, 230, 53, 0.4);
        display: inline-block;
        flex-shrink: 0;
      }
      .mdp-pulse-dot.is-active {
        animation: mdp-pulse 1.2s infinite ease-in-out;
      }
      @keyframes mdp-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(0.85); }
      }
      .mdp-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #ffffff;
        white-space: nowrap !important;
        flex-shrink: 0;
      }
      .mdp-badge {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        background: rgba(163, 230, 53, 0.15);
        color: #bef264;
        border: 1px solid rgba(163, 230, 53, 0.3);
        padding: 1px 6px;
        border-radius: 4px;
        white-space: nowrap !important;
        flex-shrink: 0;
      }
      .mdp-engine-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.03em;
        padding: 2px 7px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        white-space: nowrap !important;
        flex-shrink: 0;
      }
      .mdp-engine-pill.online {
        color: #bef264;
        background: rgba(163, 230, 53, 0.12);
        border-color: rgba(163, 230, 53, 0.25);
      }
      .mdp-engine-pill.offline {
        color: #fcd34d;
        background: rgba(245, 158, 11, 0.15);
        border-color: rgba(245, 158, 11, 0.35);
      }
      .mdp-engine-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
      }
      .mdp-icon-btn {
        background: transparent;
        border: none;
        color: #a1a1aa;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
        flex-shrink: 0;
      }
      .mdp-icon-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }
      .mdp-drawer {
        background: rgba(18, 19, 24, 0.98);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 14px;
        animation: mdp-slide-down 0.18s ease-out;
      }
      .mdp-drawer.hidden {
        display: none !important;
      }
      @keyframes mdp-slide-down {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .mdp-drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #d4d4d8;
        margin-bottom: 8px;
      }
      .mdp-drawer-desc {
        font-size: 11px;
        color: #a1a1aa;
        line-height: 1.4;
        margin: 0 0 10px 0;
      }
      .mdp-code-box {
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 10px;
      }
      .mdp-code-box code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        color: #bef264;
        user-select: all;
      }
      .mdp-copy-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #f4f4f5;
        border-radius: 4px;
        padding: 3px 7px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .mdp-copy-btn:hover {
        background: rgba(255, 255, 255, 0.18);
      }
      .mdp-secondary-btn {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f4f4f5;
        border-radius: 6px;
        padding: 7px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }
      .mdp-secondary-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      .mdp-history-list {
        max-height: 180px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .mdp-history-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 6px;
        padding: 7px 9px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
      }
      .mdp-history-item.active {
        border-color: rgba(163, 230, 53, 0.4);
        background: rgba(163, 230, 53, 0.06);
      }
      .mdp-history-info {
        flex: 1;
        min-width: 0;
      }
      .mdp-history-name {
        font-size: 11px;
        font-weight: 600;
        color: #f4f4f5;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mdp-history-meta {
        font-size: 11px;
        color: #a1a1aa;
      }
      .mdp-history-actions {
        display: flex;
        gap: 4px;
      }
      .mdp-sm-btn {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        color: #e4e4e7;
        font-size: 11px;
        font-weight: 600;
        border-radius: 4px;
        padding: 3px 6px;
        cursor: pointer;
      }
      .mdp-sm-btn:hover {
        background: #a3e635;
        color: #09090b;
      }
      .mdp-empty-history {
        font-size: 11px;
        color: #71717a;
        text-align: center;
        padding: 10px 0;
      }
      #mdp-body {
        padding: 12px 14px 14px 14px;
      }
      .mdp-telemetry-box {
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 10px;
      }
      .mdp-telemetry-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .mdp-telemetry-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #a1a1aa;
      }
      .mdp-pill {
        background: transparent;
        border: 1px solid rgba(163, 230, 53, 0.3);
        border-radius: 12px;
        padding: 2px 7px;
        font-size: 11px;
        font-weight: 700;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #a3e635;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .mdp-pill:hover {
        background: rgba(163, 230, 53, 0.12);
      }
      .mdp-asset-name {
        font-size: 12px;
        font-weight: 500;
        color: #e4e4e7;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mdp-main-action {
        width: 100%;
        background: #a3e635;
        color: #09090b;
        border: none;
        border-radius: 8px;
        padding: 11px 14px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.04em;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
        box-shadow: 0 4px 14px rgba(163, 230, 53, 0.25);
      }
      .mdp-main-action:hover:not(.disabled) {
        background: #bef264;
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(163, 230, 53, 0.35);
      }
      .mdp-main-action:active:not(.disabled) {
        transform: translateY(0);
      }
      .mdp-main-action.disabled {
        background: #27272a;
        color: #71717a;
        box-shadow: none;
        cursor: not-allowed;
      }
      .mdp-switch-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        cursor: pointer;
        user-select: none;
      }
      .mdp-checkbox {
        accent-color: #a3e635;
        cursor: pointer;
        width: 14px;
        height: 14px;
      }
      .mdp-switch-text {
        font-size: 11px;
        color: #a1a1aa;
        font-weight: 500;
      }
      .mdp-divider {
        display: flex;
        align-items: center;
        margin: 12px 0 8px 0;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #a1a1aa;
      }
      .mdp-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin-left: 8px;
      }
      .mdp-lod-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 7px;
      }
      .mdp-lod-title {
        font-size: 11px;
        font-weight: 700;
        color: #a1a1aa;
        letter-spacing: 0.04em;
      }
      .mdp-lod-chips {
        display: flex;
        gap: 4px;
      }
      .mdp-lod-chip {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #a1a1aa;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .mdp-lod-chip:hover {
        color: #f4f4f5;
        border-color: rgba(255, 255, 255, 0.25);
      }
      .mdp-lod-chip.active {
        background: rgba(163, 230, 53, 0.15);
        border-color: #a3e635;
        color: #bef264;
      }
      .mdp-tools-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .mdp-tools-grid.engine-offline .mdp-tool-btn {
        opacity: 0.55;
        cursor: pointer;
      }
      .mdp-tool-btn {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 7px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        gap: 7px;
        color: #f4f4f5;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        text-align: left;
      }
      .mdp-tool-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.22);
        color: #ffffff;
      }
      .mdp-tool-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .mdp-tool-btn:active:not(:disabled) {
        transform: scale(0.98);
      }
      .mdp-tool-icon {
        color: #a1a1aa;
        display: flex;
        align-items: center;
      }
      .mdp-tool-btn:hover:not(:disabled) .mdp-tool-icon {
        color: #a3e635;
      }
      .mdp-tool-label {
        font-size: 12px;
        white-space: nowrap;
      }
      .mdp-progress-box {
        margin-top: 10px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(163, 230, 53, 0.3);
        border-radius: 7px;
        padding: 8px 10px;
      }
      .mdp-progress-box.hidden {
        display: none !important;
      }
      .mdp-progress-header {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 600;
        color: #d4d4d8;
        margin-bottom: 5px;
      }
      .mdp-progress-track {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        overflow: hidden;
      }
      .mdp-progress-bar {
        height: 100%;
        width: 100%;
        transform-origin: left;
        transform: scaleX(0);
        background: linear-gradient(90deg, #a3e635, #38bdf8);
        border-radius: 3px;
        transition: transform 0.3s ease;
      }
      .mdp-result-card {
        margin-top: 10px;
        background: rgba(163, 230, 53, 0.08);
        border: 1px solid rgba(163, 230, 53, 0.35);
        border-radius: 8px;
        padding: 9px 11px;
      }
      .mdp-result-card.hidden {
        display: none !important;
      }
      .mdp-result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      .mdp-result-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.05em;
        color: #bef264;
      }
      .mdp-result-details {
        font-size: 11px;
        color: #e4e4e7;
        margin-bottom: 8px;
        word-break: break-all;
      }
      .mdp-result-download-btn {
        width: 100%;
        background: #a3e635;
        border: none;
        color: #09090b;
        border-radius: 6px;
        padding: 8px;
        font-size: 11px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .mdp-result-download-btn:hover {
        background: #bef264;
      }
      .mdp-terminal {
        margin-top: 10px;
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;
        padding: 6px 9px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
      }
      .mdp-terminal-prompt {
        color: #a3e635;
        font-weight: bold;
      }
      .mdp-terminal-text {
        color: #d4d4d8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // ─── 1. Suporte a Drag & Drop do Painel HUD ─────────────────────────────
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const header = document.getElementById("mdp-header");
    header.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;

      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      const rect = panel.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      panel.style.left = `${initialLeft}px`;
      panel.style.top = `${initialTop}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      const maxLeft = window.innerWidth - panel.offsetWidth - 10;
      const maxTop = window.innerHeight - panel.offsetHeight - 10;
      newLeft = Math.max(10, Math.min(newLeft, maxLeft));
      newTop = Math.max(10, Math.min(newTop, maxTop));

      panel.style.left = `${newLeft}px`;
      panel.style.top = `${newTop}px`;
    }

    function onMouseUp() {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      try {
        const rect = panel.getBoundingClientRect();
        localStorage.setItem("mdp_hud_position", JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) }));
      } catch (_) {}
    }

    // ─── 2. Toggle Minimizar / Expandir & Atalho Esc ─────────────────────────
    const toggleBtn = document.getElementById("mdp-btn-toggle");
    function toggleMinimize() {
      isMinimized = !isMinimized;
      panel.classList.toggle("minimized", isMinimized);
      toggleBtn.innerHTML = isMinimized ? icons.expand : icons.minimize;
      toggleBtn.title = isMinimized ? "Expandir" : "Minimizar";
    }
    toggleBtn.addEventListener("click", toggleMinimize);

    window.addEventListener("keydown", (e) => {
      // Atalho Alt + M para minimizar/expandir (evita conflito com o Esc da viewport 3D)
      if (e.altKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        toggleMinimize();
      }
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        manualDownloadActive();
      }
      if (e.altKey && e.key === "1") triggerUpscale();
      if (e.altKey && e.key === "2") triggerLowPoly();
      if (e.altKey && e.key === "3") triggerRepair();
      if (e.altKey && e.key === "4") triggerSplit();
    });

    // ─── 3. Gavetas de Motor e Histórico ─────────────────────────────────────
    const engineStatusBtn = document.getElementById("mdp-engine-status");
    const engineDrawer = document.getElementById("mdp-engine-drawer");
    const closeEngineDrawerBtn = document.getElementById("mdp-btn-close-engine-drawer");

    function toggleEngineDrawer(forceOpen = null) {
      showEngineDrawer = forceOpen !== null ? forceOpen : !showEngineDrawer;
      engineDrawer.classList.toggle("hidden", !showEngineDrawer);
      if (showEngineDrawer) {
        historyDrawer.classList.add("hidden");
        showHistoryDrawer = false;
      }
    }
    engineStatusBtn.addEventListener("click", () => toggleEngineDrawer());
    closeEngineDrawerBtn.addEventListener("click", () => toggleEngineDrawer(false));

    document.getElementById("mdp-btn-copy-command").addEventListener("click", () => {
      navigator.clipboard.writeText("python meshy-server\\logger_server.py");
      setLog("Comando copiado para a área de transferência!");
    });

    document.getElementById("mdp-btn-test-connection").addEventListener("click", () => {
      setLog("Verificando conexão com o motor...");
      checkEngineLiveness(true);
    });

    const countPill = document.getElementById("mdp-count-pill");
    const historyDrawer = document.getElementById("mdp-history-drawer");
    const closeHistoryDrawerBtn = document.getElementById("mdp-btn-close-history-drawer");

    function toggleHistoryDrawer(forceOpen = null) {
      showHistoryDrawer = forceOpen !== null ? forceOpen : !showHistoryDrawer;
      historyDrawer.classList.toggle("hidden", !showHistoryDrawer);
      if (showHistoryDrawer) {
        engineDrawer.classList.add("hidden");
        showEngineDrawer = false;
        renderHistoryList();
      }
    }
    countPill.addEventListener("click", () => toggleHistoryDrawer());
    closeHistoryDrawerBtn.addEventListener("click", () => toggleHistoryDrawer(false));

    function renderHistoryList() {
      const container = document.getElementById("mdp-history-list");
      if (!capturedGLBs.length) {
        container.innerHTML = `<div class="mdp-empty-history">Nenhum modelo capturado ainda.</div>`;
        return;
      }
      container.innerHTML = capturedGLBs.slice().reverse().map(item => {
        const isActive = lastCaptured && lastCaptured.filename === item.filename;
        return `
          <div class="mdp-history-item ${isActive ? "active" : ""}">
            <div class="mdp-history-info">
              <div class="mdp-history-name" title="${item.filename}">${item.filename}</div>
              <div class="mdp-history-meta">${item.sizeKB} KB ${isActive ? "• (ATIVO)" : ""}</div>
            </div>
            <div class="mdp-history-actions">
              ${!isActive ? `<button class="mdp-sm-btn btn-make-active" data-fn="${item.filename}">Ativar</button>` : ""}
              <button class="mdp-sm-btn btn-dl-item" data-fn="${item.filename}">Baixar</button>
            </div>
          </div>
        `;
      }).join("");

      container.querySelectorAll(".btn-make-active").forEach(b => {
        b.addEventListener("click", () => {
          const fn = b.dataset.fn;
          const found = capturedGLBs.find(g => g.filename === fn);
          if (found) {
            lastCaptured = found;
            window.postMessage({ type: "MESHY_SET_ACTIVE_ASSET", payload: { filename: fn } }, "*");
            updateFloatingPanel();
            renderHistoryList();
            setLog(`Ativo alterado para: ${fn}`);
          }
        });
      });

      container.querySelectorAll(".btn-dl-item").forEach(b => {
        b.addEventListener("click", () => {
          const fn = b.dataset.fn;
          setLog(`Baixando: ${fn}...`);
          window.postMessage({ type: "MESHY_TRIGGER_DOWNLOAD", payload: { filename: fn } }, "*");
        });
      });
    }

    // ─── 4. Ação Principal de Download ────────────────────────────────────────
    function manualDownloadActive() {
      if (!lastCaptured) {
        setLog("Abra um modelo no visualizador 3D primeiro.");
        return;
      }
      setLog(`Iniciando download: ${lastCaptured.filename}...`);
      window.postMessage({ type: "MESHY_TRIGGER_DOWNLOAD", payload: { filename: lastCaptured.filename } }, "*");
    }
    document.getElementById("mdp-btn-manual-download").addEventListener("click", manualDownloadActive);

    // Toggle de Automação
    const autoDlToggle = document.getElementById("mdp-auto-dl-toggle");
    autoDlToggle.addEventListener("change", (e) => {
      const active = e.target.checked;
      window.postMessage({ type: "MESHY_SET_AUTODOWNLOAD", payload: active }, "*");
      setLog(active ? "Auto-download ativo ao navegar no feed." : "Modo manual ativo (baixe via botão).");
    });

    // ─── 5. Presets de LOD Paramétrico (P3) ───────────────────────────────────
    document.querySelectorAll(".mdp-lod-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".mdp-lod-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedLodTarget = parseInt(chip.dataset.faces, 10);
        setLog(`Alvo de decimação definido para ${selectedLodTarget.toLocaleString()} faces.`);
      });
    });

    // ─── 6. Execução de Ferramentas com Progresso e Entrega (P0 & P1) ──────────
    const progressBox = document.getElementById("mdp-progress-box");
    const progressLabel = document.getElementById("mdp-progress-label");
    const progressPercent = document.getElementById("mdp-progress-percent");
    const progressBar = document.getElementById("mdp-progress-bar");
    const resultCard = document.getElementById("mdp-result-card");
    const resultDetails = document.getElementById("mdp-result-details");
    const downloadResultBtn = document.getElementById("mdp-btn-download-result");
    let currentResultData = null;

    document.getElementById("mdp-btn-close-result").addEventListener("click", () => {
      resultCard.classList.add("hidden");
    });

    downloadResultBtn.addEventListener("click", () => {
      if (currentResultData && currentResultData.filename) {
        chrome.runtime.sendMessage({
          action: "download_processed",
          filename: currentResultData.filename,
          url: currentResultData.download_url
        });
        setLog(`Download disparado: ${currentResultData.filename}`);
      }
    });

    function setToolsDisabled(disabled) {
      isProcessing = disabled;
      document.querySelectorAll(".mdp-tool-btn").forEach(btn => btn.disabled = disabled);
      const dot = document.querySelector(".mdp-pulse-dot");
      if (dot) dot.classList.toggle("is-active", disabled);
    }

    function runAsyncStudioTask(endpoint, payload, taskName) {
      if (!lastCaptured) {
        setLog("Selecione um modelo no visualizador primeiro.");
        return;
      }
      if (!engineOnline) {
        setLog("Motor Python offline. Abra as instruções no botão ENGINE.");
        toggleEngineDrawer(true);
        return;
      }
      if (isProcessing) {
        setLog("Aguarde a conclusão da operação atual.");
        return;
      }

      setToolsDisabled(true);
      resultCard.classList.add("hidden");
      progressBox.classList.remove("hidden");
      progressLabel.textContent = taskName;
      progressPercent.textContent = "15%";
      progressBar.style.transform = "scaleX(0.15)";
      setLog(`Iniciando ${taskName}...`);

      let progressSim = 15;
      const progressTimer = setInterval(() => {
        if (progressSim < 88) {
          progressSim += Math.floor(Math.random() * 8) + 4;
          progressPercent.textContent = `${progressSim}%`;
          progressBar.style.transform = `scaleX(${progressSim / 100})`;
        }
      }, 500);

      fetch(`http://localhost:9999${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: lastCaptured.filename, ...payload })
      })
        .then(r => r.json())
        .then(res => {
          clearInterval(progressTimer);
          progressPercent.textContent = "100%";
          progressBar.style.transform = "scaleX(1)";

          setTimeout(() => {
            progressBox.classList.add("hidden");
            setToolsDisabled(false);

            if (res.status === "success") {
              currentResultData = res;
              setLog(res.message || "Operação concluída com sucesso!");
              
              // Exibe card de entrega do arquivo gerado
              resultCard.classList.remove("hidden");
              const sizeTxt = res.size_mb ? ` (${res.size_mb} MB)` : "";
              resultDetails.textContent = `${res.filename || "Arquivo gerado"}${sizeTxt} salvo na pasta Downloads.`;

              // Dispara download automático do resultado gerado
              if (res.filename) {
                chrome.runtime.sendMessage({
                  action: "download_processed",
                  filename: res.filename,
                  url: res.download_url
                });
              }
            } else {
              setLog(res.message || "Aviso do processamento.");
            }
          }, 300);
        })
        .catch(err => {
          clearInterval(progressTimer);
          progressBox.classList.add("hidden");
          setToolsDisabled(false);
          setLog("Erro no motor local: " + err.message);
          checkEngineLiveness();
        });
    }

    function triggerUpscale() {
      runAsyncStudioTask("/upscale_4k", {}, "Upscaling de Texturas para 4K (Lanczos)");
    }
    function triggerLowPoly() {
      runAsyncStudioTask("/optimize_games", { target_faces: selectedLodTarget }, `Decimação Low-Poly (${selectedLodTarget.toLocaleString()} faces)`);
    }
    function triggerRepair() {
      runAsyncStudioTask("/repair_print", {}, "Reparo Watertight e Geração de STL");
    }
    function triggerSplit() {
      runAsyncStudioTask("/split_parts", {}, "Divisão de Ilhas Geométricas");
    }

    document.getElementById("mdp-btn-upscale").addEventListener("click", triggerUpscale);
    document.getElementById("mdp-btn-games").addEventListener("click", triggerLowPoly);
    document.getElementById("mdp-btn-repair").addEventListener("click", triggerRepair);
    document.getElementById("mdp-btn-split").addEventListener("click", triggerSplit);

    // Heartbeat periódico do motor (a cada 4 segundos)
    checkEngineLiveness();
    setInterval(checkEngineLiveness, 4000);
  }

  function updateFloatingPanel() {
    const countPill = document.querySelector("#mdp-count-pill span");
    const nameEl = document.getElementById("mdp-active-name");
    const dlBtn = document.getElementById("mdp-btn-manual-download");
    const dlText = document.getElementById("mdp-main-action-text");

    if (countPill) {
      countPill.textContent = `${capturedGLBs.length} CAPTURADO${capturedGLBs.length === 1 ? "" : "S"}`;
    }
    if (nameEl && lastCaptured) {
      nameEl.textContent = lastCaptured.filename;
      nameEl.title = lastCaptured.filename;
    }
    if (dlBtn && lastCaptured) {
      dlBtn.classList.remove("disabled");
      dlBtn.disabled = false;
      if (dlText) {
        dlText.textContent = `BAIXAR MODELO GLB (${lastCaptured.sizeKB} KB)`;
      }
    }
  }

  function setLog(msg) {
    const el = document.getElementById("mdp-log");
    if (el) el.textContent = msg;
  }

  if (document.body) {
    createFloatingUI();
  } else {
    document.addEventListener("DOMContentLoaded", createFloatingUI);
  }
})();
