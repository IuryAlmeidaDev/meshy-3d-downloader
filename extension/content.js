// content.js - Interface flutuante e ponte de comunicação
(function initMeshyContentScript() {
  const capturedGLBs = [];
  let lastCaptured = null;

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
        <span class="mdp-title">⚡ Meshy 3D Descriptografador</span>
        <span id="mdp-status-badge" class="mdp-badge">Pronto</span>
      </div>
      <div id="mdp-body">
        <div id="mdp-info">Modelos capturados: <strong id="mdp-count">0</strong></div>
        <div id="mdp-active-name" style="font-size: 11px; color: #a1a1aa; margin-bottom: 8px;">
          Clique em qualquer modelo na galeria para capturar
        </div>
        <div class="mdp-buttons">
          <button id="mdp-btn-info" class="mdp-btn primary">✅ Captura Automática Ativa</button>
          <button id="mdp-btn-upscale" class="mdp-btn action">🎨 Upscale Texturas para 4K</button>
          <button id="mdp-btn-stl" class="mdp-btn secondary">🖨️ Converter para STL (3D Print)</button>
        </div>
        <div id="mdp-log" style="font-size: 11px; color: #a3e635; margin-top: 8px;">
          Aguardando modelo renderizar...
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #meshy-downloader-panel {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 290px;
        background: #18181b;
        border: 1px solid #27272a;
        box-shadow: 0 10px 25px rgba(0,0,0,0.6);
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
        padding: 2px 6px;
        border-radius: 999px;
      }
      #mdp-body {
        padding: 12px 14px;
      }
      #mdp-info {
        font-size: 12px;
        margin-bottom: 4px;
      }
      .mdp-buttons {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .mdp-btn {
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        cursor: pointer;
        transition: 0.2s;
      }
      .mdp-btn.primary {
        background: #a3e635;
        color: #000;
        cursor: default;
      }
      .mdp-btn.action {
        background: #3b82f6;
        color: #fff;
      }
      .mdp-btn.action:hover {
        background: #60a5fa;
      }
      .mdp-btn.secondary {
        background: #3f3f46;
        color: #fff;
      }
      .mdp-btn.secondary:hover {
        background: #52525b;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // Evento: Upscale 4K
    document.getElementById("mdp-btn-upscale").addEventListener("click", () => {
      if (!lastCaptured) {
        setLog("⚠️ Capture um modelo primeiro.");
        return;
      }
      setLog(`Iniciando Upscale 4K de ${lastCaptured.filename}...`);
      fetch("http://localhost:9999/upscale_4k", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: lastCaptured.filename })
      }).then(r => r.json()).then(res => {
        if (res.status === "success") {
          setLog("✨ Modelo 4K gerado na pasta Downloads!");
        } else {
          setLog("Aviso: " + (res.message || "Sem texturas ou erro."));
        }
      }).catch(e => setLog("Erro no servidor: " + e.message));
    });

    // Evento: Converter STL
    document.getElementById("mdp-btn-stl").addEventListener("click", () => {
      if (!lastCaptured) {
        setLog("⚠️ Capture um modelo primeiro.");
        return;
      }
      setLog(`Convertendo ${lastCaptured.filename} para STL...`);
      fetch("http://localhost:9999/convert_stl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: lastCaptured.filename })
      }).then(r => r.json()).then(res => {
        if (res.status === "success") {
          setLog("🖨️ Arquivo STL salvo na pasta Downloads!");
        } else {
          setLog("Erro ao converter: " + res.message);
        }
      }).catch(e => setLog("Erro no servidor: " + e.message));
    });
  }

  function updateFloatingPanel() {
    const countEl = document.getElementById("mdp-count");
    if (countEl) countEl.textContent = capturedGLBs.length;
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
