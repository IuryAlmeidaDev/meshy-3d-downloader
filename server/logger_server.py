import http.server
import json
import os
import sys
import urllib.request
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

PORT = 9999
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "extension.log")
DOWNLOADS_DIR = os.path.join(os.path.expanduser("~"), "Downloads")

# Importa o processador 3D local
try:
    import meshy_processor
except ImportError:
    meshy_processor = None

class LogHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "running", "port": PORT}).encode("utf-8"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8", errors="replace")
        
        try:
            payload = json.loads(body)
        except Exception:
            payload = {"message": body}

        timestamp = datetime.now().strftime("%H:%M:%S")
        level = payload.get("level", "INFO").upper()
        message = payload.get("message", "")
        extra_data = payload.get("data", None)

        log_line = f"[{timestamp}] [{level}] {message}"
        if extra_data:
            log_line += f" | Data: {json.dumps(extra_data, ensure_ascii=False)}"

        try:
            print(log_line, flush=True)
        except Exception:
            pass

        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(log_line + "\n")
        except Exception:
            pass

        res_data = {"status": "received"}

        # Endpoint: Upscale para 4K
        if self.path == "/upscale_4k":
            filename = payload.get("filename")
            file_path = os.path.join(DOWNLOADS_DIR, filename) if filename else None
            if file_path and os.path.exists(file_path) and meshy_processor:
                try:
                    out = meshy_processor.upscale_textures_to_4k(file_path)
                    res_data = {"status": "success", "output": out}
                except Exception as e:
                    res_data = {"status": "error", "message": str(e)}

        # Endpoint: Converter para STL
        elif self.path == "/convert_stl":
            filename = payload.get("filename")
            file_path = os.path.join(DOWNLOADS_DIR, filename) if filename else None
            if file_path and os.path.exists(file_path) and meshy_processor:
                try:
                    out = meshy_processor.convert_to_stl(file_path)
                    res_data = {"status": "success", "output": out}
                except Exception as e:
                    res_data = {"status": "error", "message": str(e)}

        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(res_data).encode("utf-8"))

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), LogHandler)
    print("==================================================", flush=True)
    print(f"  [+] Servidor de Logs e Processador 4K Meshy Ativo!", flush=True)
    print(f"  [+] Porta: http://localhost:{PORT}", flush=True)
    print("==================================================", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Servidor encerrado.", flush=True)
