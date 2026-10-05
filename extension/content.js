// content.js - Interface flutuante e ponte de comunicação (Bolder Studio Edition)
(function initMeshyContentScript() {
  const capturedGLBs = [];
  let lastCaptured = null;
  let isMinimized = false;
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
      capturedGLBs.push(glb);
      lastCaptured = glb;
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
    scan: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    minimize: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    expand: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
  };

  function createFloatingUI() {
    if (document.getElementById("meshy-downloader-panel")) return;

    const panel = document.createElement("div");
    panel.id = "meshy-downloader-panel";
    panel.innerHTML = `
      <!-- Header HUD -->
      <div id="mdp-header">
        <div class="mdp-header-left">
          <span class="mdp-pulse-dot"></span>
          <span class="mdp-title">MESHY STUDIO</span>
          <span class="mdp-badge">${isDiscover ? "DISCOVER" : "WORKSPACE"}</span>
        </div>
        <button id="mdp-btn-toggle" class="mdp-icon-btn" title="Minimizar / Expandir">${icons.minimize}</button>
      </div>

      <!-- Corpo Principal -->
      <div id="mdp-body">
        <!-- Telemetria do Modelo Ativo -->
        <div class="mdp-telemetry-box">
          <div class="mdp-telemetry-row">
            <span class="mdp-telemetry-label">ASSET ATIVO</span>
            <span id="mdp-count-pill" class="mdp-pill">0 CAPTURADOS</span>
          </div>
          <div id="mdp-active-name" class="mdp-asset-name">
            ${isDiscover ? "Selecione um modelo no feed público" : "Abra ou gere um modelo para decodificar"}
          </div>
        </div>

        <!-- Ação Âncora Principal (Download) -->
        <button id="mdp-btn-manual-download" class="mdp-main-action disabled" disabled>
          <span class="mdp-btn-icon">${icons.download}</span>
          <span id="mdp-main-action-text">AGUARDANDO MODELO NA TELA</span>
        </button>

        <!-- Toggle de Automação -->
        <label class="mdp-switch-row">
          <input type="checkbox" id="mdp-auto-dl-toggle" class="mdp-checkbox">
          <span class="mdp-switch-text">Auto-download ao navegar</span>
        </label>

        <!-- Divisor Tático -->
        <div class="mdp-divider">
          <span>PROCESSAMENTO LOCAL</span>
        </div>

        <!-- Grid de Ferramentas Studio -->
        <div class="mdp-tools-grid">
          <button id="mdp-btn-upscale" class="mdp-tool-btn" title="Super-resolução Lanczos para 4096x4096px">
            <span class="mdp-tool-icon">${icons.upscale}</span>
            <span class="mdp-tool-label">Upscale 4K</span>
          </button>
          <button id="mdp-btn-games" class="mdp-tool-btn" title="Otimização Quadric Decimation para ~25k faces (Roblox/Unity)">
            <span class="mdp-tool-icon">${icons.games}</span>
            <span class="mdp-tool-label">Low-Poly LOD</span>
          </button>
          <button id="mdp-btn-repair" class="mdp-tool-btn" title="Reparo de malha estanque (Watertight STL)">
            <span class="mdp-tool-icon">${icons.stl}</span>
            <span class="mdp-tool-label">STL 3D Print</span>
          </button>
          <button id="mdp-btn-split" class="mdp-tool-btn" title="Separação de ilhas geométricas isoladas">
            <span class="mdp-tool-icon">${icons.split}</span>
            <span class="mdp-tool-label">Split Mesh</span>
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
      #meshy-downloader-panel {
        position: fixed;
        bottom: 22px;
        right: 22px;
        width: 310px;
        background: rgba(13, 14, 18, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 0, 0, 0.5);
        border-radius: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        color: #f4f4f5;
        z-index: 999999;
        overflow: hidden;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      }
      #meshy-downloader-panel.minimized #mdp-body {
        display: none;
      }
      #mdp-header {
        background: rgba(22, 23, 29, 0.9);
        padding: 11px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        user-select: none;
      }
      .mdp-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mdp-pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #a3e635;
        box-shadow: 0 0 10px #a3e635;
        animation: mdp-pulse 2s infinite ease-in-out;
      }
      @keyframes mdp-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(0.85); }
      }
      .mdp-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #fff;
      }
      .mdp-badge {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.05em;
        background: rgba(163, 230, 53, 0.15);
        color: #bef264;
        border: 1px solid rgba(163, 230, 53, 0.3);
        padding: 1px 6px;
        border-radius: 4px;
      }
      .mdp-icon-btn {
        background: transparent;
        border: none;
        color: #71717a;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
      }
      .mdp-icon-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }
      #mdp-body {
        padding: 14px;
      }
      .mdp-telemetry-box {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
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
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #71717a;
      }
      .mdp-pill {
        font-size: 9px;
        font-weight: 700;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #a3e635;
      }
      .mdp-asset-name {
        font-size: 11px;
        font-weight: 500;
        color: #d4d4d8;
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
        font-size: 11px;
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
        width: 13px;
        height: 13px;
      }
      .mdp-switch-text {
        font-size: 10px;
        color: #a1a1aa;
        font-weight: 500;
      }
      .mdp-divider {
        display: flex;
        align-items: center;
        margin: 12px 0 8px 0;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #52525b;
      }
      .mdp-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin-left: 8px;
      }
      .mdp-tools-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      .mdp-tool-btn {
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 7px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        gap: 7px;
        color: #e4e4e7;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        text-align: left;
      }
      .mdp-tool-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .mdp-tool-btn:active {
        transform: scale(0.98);
      }
      .mdp-tool-icon {
        color: #a1a1aa;
        display: flex;
        align-items: center;
      }
      .mdp-tool-btn:hover .mdp-tool-icon {
        color: #a3e635;
      }
      .mdp-tool-label {
        font-size: 10px;
        white-space: nowrap;
      }
      .mdp-terminal {
        margin-top: 10px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 6px 9px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 10px;
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

    // Toggle Minimizar / Expandir
    const toggleBtn = document.getElementById("mdp-btn-toggle");
    toggleBtn.addEventListener("click", () => {
      isMinimized = !isMinimized;
      panel.classList.toggle("minimized", isMinimized);
      toggleBtn.innerHTML = isMinimized ? icons.expand : icons.minimize;
      toggleBtn.title = isMinimized ? "Expandir" : "Minimizar";
    });

    // Ação Principal: Download Manual sob demanda
    const manualDlBtn = document.getElementById("mdp-btn-manual-download");
    manualDlBtn.addEventListener("click", () => {
      if (!lastCaptured) {
        setLog("Abra um modelo no visualizador 3D primeiro.");
        return;
      }
      setLog(`Iniciando download: ${lastCaptured.filename}...`);
      window.postMessage({ type: "MESHY_TRIGGER_DOWNLOAD" }, "*");
    });

    // Checkbox de Auto-Download
    const autoDlToggle = document.getElementById("mdp-auto-dl-toggle");
    autoDlToggle.addEventListener("change", (e) => {
      const active = e.target.checked;
      window.postMessage({ type: "MESHY_SET_AUTODOWNLOAD", payload: active }, "*");
      setLog(active ? "Auto-download ativo ao abrir modelos." : "Modo manual ativo (baixe via botão).");
    });

    // Helper de chamadas seguras para o servidor local
    function callServer(endpoint, payload, startMsg) {
      if (!lastCaptured) {
        setLog("Selecione um modelo no visualizador primeiro.");
        return;
      }
      setLog(startMsg);
      fetch(`http://localhost:9999${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: lastCaptured.filename, ...payload })
      })
        .then(r => r.json())
        .then(res => {
          if (res.status === "success") {
            setLog(res.message || "Operação concluída com sucesso!");
          } else {
            setLog(res.message || "Aviso da operação.");
          }
        })
        .catch(e => setLog("Erro no servidor local: " + e.message));
    }

    // Ferramentas Studio (Bolder pass)
    document.getElementById("mdp-btn-upscale").addEventListener("click", () => {
      callServer("/upscale_4k", {}, "Processando Upscale 4K de texturas...");
    });

    document.getElementById("mdp-btn-games").addEventListener("click", () => {
      callServer("/optimize_games", { target_faces: 25000 }, "Calculando decimação Low-Poly (25k faces)...");
    });

    document.getElementById("mdp-btn-repair").addEventListener("click", () => {
      callServer("/repair_print", {}, "Reparando malha e gerando STL estanque...");
    });

    document.getElementById("mdp-btn-split").addEventListener("click", () => {
      callServer("/split_parts", {}, "Analisando ilhas de malha desconectadas...");
    });
  }

  function updateFloatingPanel() {
    const countPill = document.getElementById("mdp-count-pill");
    const nameEl = document.getElementById("mdp-active-name");
    const dlBtn = document.getElementById("mdp-btn-manual-download");
    const dlText = document.getElementById("mdp-main-action-text");

    if (countPill) {
      countPill.textContent = `${capturedGLBs.length} CAPTURADO${capturedGLBs.length === 1 ? "" : "S"}`;
    }
    if (nameEl && lastCaptured) {
      nameEl.textContent = lastCaptured.filename;
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
