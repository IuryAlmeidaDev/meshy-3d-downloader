import http.server
import json
import os
import sys
import urllib.request
import urllib.parse
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

# Importa o motor de processamento 3D
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
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/files/"):
            fname = urllib.parse.unquote(parsed.path[7:])
            fpath = os.path.join(DOWNLOADS_DIR, fname)
            if os.path.exists(fpath) and os.path.isfile(fpath):
                self.send_response(200)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Disposition", f'attachment; filename="{fname}"')
                self.send_header("Content-Length", str(os.path.getsize(fpath)))
                self.end_headers()
                with open(fpath, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_response(404)
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(b'{"error": "File not found"}')
                return

        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "running",
            "online": True,
            "port": PORT,
            "engine": "Meshy 3D Studio PRO",
            "features": ["4k", "games", "stl", "repair", "split", "inspect"]
        }).encode("utf-8"))

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
        filename = payload.get("filename")
        file_path = None
        if filename:
            cand = os.path.join(DOWNLOADS_DIR, filename)
            if os.path.exists(cand):
                file_path = cand
            else:
                # Procura por prefixo ou mais recente
                for f in os.listdir(DOWNLOADS_DIR):
                    if filename.lower() in f.lower() and f.endswith(".glb"):
                        file_path = os.path.join(DOWNLOADS_DIR, f)
                        break

        # Rota: Upscale para 4K
        if self.path == "/upscale_4k":
            if file_path and meshy_processor:
                res_data = meshy_processor.upscale_textures_to_4k(file_path)
            else:
                res_data = {"status": "error", "message": "Arquivo nao encontrado na pasta Downloads."}

        # Rota: Otimizar para Jogos (Low Poly)
        elif self.path == "/optimize_games":
            target_faces = int(payload.get("target_faces", 25000))
            if file_path and meshy_processor:
                res_data = meshy_processor.optimize_for_games(file_path, target_faces=target_faces)
            else:
                res_data = {"status": "error", "message": "Arquivo nao encontrado para otimizacao."}

        # Rota: Reparar para Impressao 3D (Watertight STL)
        elif self.path == "/repair_print":
            if file_path and meshy_processor:
                res_data = meshy_processor.repair_for_3d_print(file_path)
            else:
                res_data = {"status": "error", "message": "Arquivo nao encontrado para reparo."}

        # Rota: Dividir Pecas Desconectadas (Split)
        elif self.path == "/split_parts":
            if file_path and meshy_processor:
                res_data = meshy_processor.split_mesh_parts(file_path)
            else:
                res_data = {"status": "error", "message": "Arquivo nao encontrado para divisao."}

        # Rota: Inspecionar Geometria do Modelo
        elif self.path == "/inspect":
            if file_path and meshy_processor:
                res_data = meshy_processor.inspect_glb(file_path)
            else:
                res_data = {"status": "error", "message": "Arquivo nao encontrado para inspecao."}

        # Rota: Converter para STL Simples
        elif self.path == "/convert_stl":
            if file_path and meshy_processor:
                res_data = meshy_processor.convert_to_stl(file_path)
            else:
                res_data = {"status": "error", "message": "Arquivo nao encontrado para conversao."}

        # Anexa filename e URL de download se houver arquivo gerado
        if isinstance(res_data, dict) and "output" in res_data and res_data.get("output"):
            out_file = res_data["output"]
            if isinstance(out_file, str) and os.path.isfile(out_file):
                base_fname = os.path.basename(out_file)
                res_data["filename"] = base_fname
                res_data["download_url"] = f"http://localhost:{PORT}/files/{urllib.parse.quote(base_fname)}"

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
    print(f"  [+] Servidor 3D Suite Ativo! Porta: {PORT}", flush=True)
    print("  [+] Funcionalidades: 4K, Low-Poly, STL, Repair, Split", flush=True)
    print("==================================================", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Servidor encerrado.", flush=True)
