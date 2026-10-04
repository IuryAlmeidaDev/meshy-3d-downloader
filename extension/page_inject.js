// page_inject.js - Injetado no contexto da página (world: MAIN)
(function initMeshyDecryptor() {
  if (window.__meshyDecryptorActive) return;
  window.__meshyDecryptorActive = true;

  window.__meshyGLBs = [];
  window.__meshyLastGLB = null;

  // Envia logs para o content.js via postMessage (bypassa o CSP da página!)
  function logToExtension(level, message, data = null) {
    try {
      console.log(`%c[Meshy:${level}]`, "color:#a3e635;font-weight:bold;", message, data || "");
      window.postMessage({
        type: "MESHY_LOG",
        payload: { level, message, data }
      }, "*");
    } catch (_) {}
  }

  logToExtension("INFO", "🔓 Meshy Decryptor Engine ativo no contexto da página!");

  function isGLBBuffer(buf) {
    if (!buf || buf.byteLength < 4) return false;
    try {
      return new Uint32Array(buf.slice ? buf.slice(0, 4) : buf)[0] === 0x46546C67;
    } catch (_) {
      return false;
    }
  }

  function isMeshyEncrypted(buf) {
    if (!buf || buf.byteLength < 8) return false;
    try {
      return new TextDecoder().decode(new Uint8Array(buf, 0, 8)).startsWith("MESHY.AI");
    } catch (_) {
      return false;
    }
  }

  function looksLikeGLBUrl(url) {
    if (!url || typeof url !== "string") return false;
    return url.includes(".glb") || url.includes("misc/cdn-models") || url.includes("model.meshy");
  }

  function getModelFilename() {
    const title = document.querySelector("h1")?.textContent || "";
    const promptInput = document.querySelector('input[placeholder*="ger"], textarea')?.value || "";
    const raw = promptInput || title || "modelo_meshy";
    const safe = raw
      .replace(/[<>:"/\\|?*\x00-\x1F-]+/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 30);
    return `${safe || "modelo"}_${Date.now()}.glb`;
  }

  function downloadGLB(blob, filename, revokeDelay = 15000) {
    const url = _origCreateObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), revokeDelay);
  }

  function captureGLB(blob, src) {
    const filename = getModelFilename();
    const entry = { blob, src, time: Date.now(), filename, sizeKB: Math.round(blob.size / 1024) };
    window.__meshyGLBs.push(entry);
    window.__meshyLastGLB = entry;

    logToExtension("INFO", `🎉 [GLB CAPTURADO COM SUCESSO] ${filename} (${entry.sizeKB} KB) via ${src}`);

    // Notifica content.js
    window.postMessage({
      type: "MESHY_GLB_READY",
      payload: { filename, sizeKB: entry.sizeKB, src }
    }, "*");

    // Só faz download automático se o usuário tiver ativado explicitamente
    if (window.__meshyAutoDownload) {
      downloadGLB(blob, filename);
    }
  }

  // Escuta comando do botão da interface para baixar sob demanda
  window.addEventListener("message", (event) => {
    if (!event.data) return;
    if (event.data.type === "MESHY_TRIGGER_DOWNLOAD") {
      const target = window.__meshyLastGLB;
      if (target && target.blob) {
        logToExtension("INFO", "📥 Disparando download manual solicitado pelo usuário: " + target.filename);
        downloadGLB(target.blob, target.filename);
      }
    }
    if (event.data.type === "MESHY_SET_AUTODOWNLOAD") {
      window.__meshyAutoDownload = !!event.data.payload;
    }
  });

  // ─── 1. HOOK: Web Worker de Descriptografia ─────────────────────────
  const _OrigWorker = window.Worker;
  window.Worker = function MeshyWorkerProxy(scriptURL, options) {
    const w = new _OrigWorker(scriptURL, options);
    logToExtension("INFO", "Worker iniciado: " + String(scriptURL).slice(-60));

    function spyWorkerMsg(e) {
      const d = e.data;
      if (!d || !d.type) return;
      
      if (d.type === "process" && d.success && d.data) {
        logToExtension("INFO", `🔓 [DECRYPTED NO WORKER] Tamanho: ${d.data.byteLength} bytes`);
        try {
          const copy = d.data.slice(0); // cópia do buffer antes da aplicação usar
          captureGLB(new Blob([copy], { type: "model/gltf-binary" }), "worker");
        } catch (ex) {
          logToExtension("WARN", "Erro ao copiar buffer do worker: " + ex.message);
        }
      }
    }

    const proto = Object.getPrototypeOf(w);
    const desc = Object.getOwnPropertyDescriptor(proto, "onmessage");
    if (desc && desc.set) {
      Object.defineProperty(w, "onmessage", {
        configurable: true,
        get() { return desc.get ? desc.get.call(w) : undefined; },
        set(fn) {
          desc.set.call(w, function(e) {
            spyWorkerMsg(e);
            return fn.call(this, e);
          });
        }
      });
    }

    const _origAEL = w.addEventListener.bind(w);
    w.addEventListener = function(type, listener, opts) {
      if (type === "message") {
        return _origAEL(type, function(e) {
          spyWorkerMsg(e);
          return listener.call(this, e);
        }, opts);
      }
      return _origAEL(type, listener, opts);
    };

    return w;
  };
  window.Worker.prototype = _OrigWorker.prototype;
  try {
    Object.defineProperty(window.Worker, Symbol.hasInstance, {
      value: function(instance) { return instance instanceof _OrigWorker; }
    });
  } catch (_) {}

  // ─── 2. HOOK: URL.createObjectURL ───────────────────────────────────
  const _origCreateObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function(blob) {
    const url = _origCreateObjectURL(blob);
    if (blob instanceof Blob || blob instanceof File) {
      if (blob.type === "model/gltf-binary") {
        logToExtension("INFO", `🎯 Blob model/gltf-binary detectado! Tamanho: ${Math.round(blob.size/1024)} KB`);
        captureGLB(blob, "createObjectURL");
      } else if (blob.size > 100000) {
        blob.arrayBuffer().then(buf => {
          if (isGLBBuffer(buf)) {
            logToExtension("INFO", `🎯 Blob untyped com assinatura glTF detectado! Tamanho: ${Math.round(blob.size/1024)} KB`);
            captureGLB(new Blob([buf], { type: "model/gltf-binary" }), "createObjectURL-magic");
          }
        }).catch(() => {});
      }
    }
    return url;
  };

  // ─── 3. HOOK: window.fetch ──────────────────────────────────────────
  const _origFetch = window.fetch;
  window.fetch = async function(input) {
    const url = typeof input === "string" ? input : (input && input.url) || String(input);
    const hit = looksLikeGLBUrl(url);
    const p = _origFetch.apply(this, arguments);
    if (!hit) return p;

    return p.then(async resp => {
      try {
        const buf = await resp.clone().arrayBuffer();
        if (isGLBBuffer(buf)) {
          logToExtension("INFO", "🔓 GLB sem criptografia interceptado via fetch!");
          captureGLB(new Blob([buf], { type: "model/gltf-binary" }), "fetch");
        }
      } catch (_) {}
      return resp;
    });
  };
})();
