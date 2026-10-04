// background.js - Service Worker da Extensão
const LOGGER_URL = "http://localhost:9999/log";
const BACKUP_DOWNLOAD_URL = "http://localhost:9999/download_file";

function sendLog(level, message, data = null) {
  try {
    fetch(LOGGER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, data })
    }).catch(() => {});
  } catch (_) {}
}

sendLog("INFO", "🌟 Service Worker (background.js) iniciado com sucesso!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "download") {
    const url = request.url;
    const filename = request.filename || "modelo_meshy.glb";
    sendLog("INFO", `📥 Iniciando download nativo pelo Chrome: ${filename}`, { url });

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false,
      conflictAction: "uniquify"
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        const errorMsg = chrome.runtime.lastError.message;
        sendLog("ERROR", `Falha no chrome.downloads: ${errorMsg}. Tentando download via Python...`, { url });
        
        // Fallback: faz o download pelo servidor Python
        fetch(BACKUP_DOWNLOAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, filename })
        }).catch(() => {});

        sendResponse({ success: false, error: errorMsg, fallback: true });
      } else {
        sendLog("INFO", `✅ Download iniciado com ID: ${downloadId}`);
        sendResponse({ success: true, downloadId });
      }
    });

    return true; // mantém a porta assíncrona aberta
  }

  if (request.action === "log") {
    sendLog(request.level || "INFO", request.message, request.data);
    sendResponse({ received: true });
  }
});

// Monitora o status de cada download
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state) {
    if (delta.state.current === "complete") {
      sendLog("INFO", `🎉 [CHROME DOWNLOAD CONCLUÍDO] Download ID ${delta.id} finalizado com sucesso!`);
    } else if (delta.state.current === "interrupted") {
      sendLog("ERROR", `❌ [CHROME DOWNLOAD INTERROMPIDO] ID ${delta.id}: ${delta.error?.current || 'Erro desconhecido'}`);
    }
  }
});
