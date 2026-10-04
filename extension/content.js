// content.js - Interface flutuante e ponte de comunicação
(function initMeshyContentScript() {
  const capturedGLBs = [];
  let lastCaptured = null;
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
      setLog(`🎉 Salvo: ${glb.filename} (${glb.sizeKB} KB)`);
    }
  });

  function createFloatingUI() {
    if (document.getElementById("meshy-downloader-panel")) return;

    const panel = document.createElement("div");
    panel.id = "meshy-downloader-panel";
    panel.innerHTML = `
      <div id="mdp-header">
        <span class="mdp-title">⚡ Meshy 3D Studio PRO</span>
        <span id="mdp-status-badge" class="mdp-badge">${isDiscover ? "Discover" : "Workspace"}</span>
      </div>
      <div id="mdp-body">
        <div id="mdp-info">Modelos capturados: <strong id="mdp-count">0</strong></div>
        <div id="mdp-active-name" style="font-size: 11px; color: #a1a1aa; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${isDiscover ? "Abra qualquer modelo da comunidade" : "Abra qualquer modelo para capturar"}
        </div>
        
        <div class="mdp-buttons">
          <button id="mdp-btn-upscale" class="mdp-btn btn-blue" title="Aumenta texturas para 4096x4096px">🎨 Upscale Texturas 4K</button>
          <button id="mdp-btn-games" class="mdp-btn btn-purple" title="Reduz para ~25k polígonos para Roblox, Unity e Godot">🎮 Otimizar p/ Jogos (Low-Poly)</button>
          <button id="mdp-btn-repair" class="mdp-btn btn-green" title="Fecha buracos e gera STL 100% Watertight">🖨️ Reparar p/ 3D Print (STL)</button>
          <button id="mdp-btn-split" class="mdp-btn btn-orange" title="Separa o modelo em partes geométricas soltas">🧩 Dividir Peças (Split)</button>
          <button id="mdp-btn-scan" class="mdp-btn btn-outline">🔍 Varrer Modelos Visíveis</button>
        </div>
        
        <div id="mdp-log" style="font-size: 11px; color: #a3e635; margin-top: 8px; line-height: 1.3;">
          Aguardando modelo renderizar...
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #meshy-downloader-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: #18181b;
        border: 1px solid #27272a;
        box-shadow: 0 12px 30px rgba(0,0,0,0.7);
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #f4f4f5;
        z-index: 999999;
        overflow: hidden;
      }
      #mdp-header {
        background: #27272a;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 13px;
      }
      .mdp-title {
        color: #d9f99d;
      }
      .mdp-badge {
        font-size: 10px;
        background: #166534;
        color: #bbf7d0;
        padding: 2px 7px;
        border-radius: 999px;
        font-weight: bold;
      }
      #mdp-body {
        padding: 12px 14px;
      }
      #mdp-info {
        font-size: 12px;
        margin-bottom: 3px;
      }
      .mdp-buttons {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 6px;
      }
      .mdp-btn {
        border: none;
        padding: 7px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: 0.15s;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .btn-blue {
        background: #2563eb;
        color: #fff;
      }
      .btn-blue:hover {
        background: #3b82f6;
      }
      .btn-purple {
        background: #7c3aed;
        color: #fff;
      }
      .btn-purple:hover {
        background: #8b5cf6;
      }
      .btn-green {
        background: #15803d;
        color: #fff;
      }
      .btn-green:hover {
        background: #16a34a;
      }
      .btn-orange {
        background: #ea580c;
        color: #fff;
      }
      .btn-orange:hover {
        background: #f97316;
      }
      .btn-outline {
        background: transparent;
        border: 1px solid #3f3f46;
        color: #a1a1aa;
      }
      .btn-outline:hover {
        background: #27272a;
        color: #fff;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // Endpoint helper
    function callServer(endpoint, payload, startMsg) {
      if (!lastCaptured) {
        setLog("⚠️ Capture um modelo primeiro (abra qualquer modelo na tela).");
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
            setLog(`✨ ${res.message || 'Operação concluída com sucesso!'}`);
          } else {
            setLog(`ℹ️ ${res.message || 'Aviso da operação.'}`);
          }
        })
        .catch(e => setLog("Erro no servidor: " + e.message));
    }

    // 1. Upscale 4K
    document.getElementById("mdp-btn-upscale").addEventListener("click", () => {
      callServer("/upscale_4k", {}, `🎨 Aplicando Upscale 4K em ${lastCaptured?.filename || ''}...`);
    });

    // 2. Otimizar para Jogos (Low-Poly)
    document.getElementById("mdp-btn-games").addEventListener("click", () => {
      callServer("/optimize_games", { target_faces: 25000 }, `🎮 Reduzindo para Low-Poly (25k faces)...`);
    });

    // 3. Reparar para Impressão 3D (STL)
    document.getElementById("mdp-btn-repair").addEventListener("click", () => {
      callServer("/repair_print", {}, `🖨️ Reparando geometria e gerando STL estanque...`);
    });

    // 4. Dividir Peças (Split)
    document.getElementById("mdp-btn-split").addEventListener("click", () => {
      callServer("/split_parts", {}, `🧩 Separando peças geométricas soltas...`);
    });

    // 5. Varrer Modelos Visíveis (Discover & Workspace)
    document.getElementById("mdp-btn-scan").addEventListener("click", () => {
      setLog("🔍 Varrendo recursos carregados...");
      try {
        const resources = performance.getEntriesByType("resource");
        const models = resources.filter(r => r.name.includes("assets.meshy.ai") && !r.name.includes(".json"));
        setLog(`Encontrados ${models.length} recursos de modelos na página.`);
      } catch (e) {
        setLog("Erro: " + e.message);
      }
    });
  }

  function updateFloatingPanel() {
    const countEl = document.getElementById("mdp-count");
    const nameEl = document.getElementById("mdp-active-name");
    if (countEl) countEl.textContent = capturedGLBs.length;
    if (nameEl && lastCaptured) {
      nameEl.textContent = `Ativo: ${lastCaptured.filename}`;
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
