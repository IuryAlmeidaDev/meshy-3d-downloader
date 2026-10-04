# ⚡ Meshy 3D Downloader & Suite

> Extensão para Google Chrome (Manifest V3) + Servidor de Processamento Local em Python para **interceptar, descriptografar em tempo real e exportar modelos 3D** criados no [Meshy.ai](https://www.meshy.ai/), com suporte a **Upscaling de Texturas para 4K** e conversão para **STL (Impressão 3D) e OBJ**.

---

## 📌 Visão Geral do Projeto

O **Meshy.ai** é uma plataforma líder na geração de ativos 3D via IA (Text-to-3D e Image-to-3D). No entanto, o fluxo de exportação nativo possui limitações severas para contas gratuitas e rascunhos:
1. **Criptografia Proprietária (.meshy):** Ao inspecionar as requisições de rede da pré-visualização, os arquivos 3D baixados diretamente vêm com o cabeçalho `MESHY.AI\x01\x00` (formato proprietário criptografado), impossibilitando sua abertura em softwares como Blender, Unity ou fatiadores 3D.
2. **Descriptografia via Web Worker (WASM):** Para renderizar o modelo na tela, a aplicação web da Meshy transfere o arquivo criptografado para um *Web Worker* em segundo plano, que o descriptografa usando *WebAssembly* e devolve para a thread principal o arquivo binário puro com assinatura padrão `glTF` (`0x46546C67`).
3. **Bloqueio de CORS e CSP:** Requisições manuais via `fetch()` no navegador resultam em arquivos vazios (0 bytes) ou são bloqueadas pela política de segurança da página (*Content Security Policy*).

### 💡 A Solução Deste Projeto
Esta suíte intercepta o momento exato em que o Web Worker da Meshy termina de descriptografar o modelo na memória do navegador, capturando o buffer `.glb` puro e iniciando o download sem qualquer bloqueio. Além disso, conta com um servidor Python local para processamento pós-download (upscale 4K de texturas e conversão para STL).

---

## 🏗️ Arquitetura do Repositório

```text
meshy-3d-downloader/
├── README.md                      # Documentação completa + Prompt Mestre de Contexto
├── requirements.txt               # Dependências Python (Pillow, trimesh, pygltflib, etc.)
├── .gitignore                     # Proteção contra logs, pycache e modelos pesados
├── extension/                     # Extensão Chrome (Manifest V3)
│   ├── manifest.json              # Configuração da extensão, permissões e scripts
│   ├── page_inject.js             # Roda em world: MAIN; intercepta Web Worker & createObjectURL
│   ├── content.js                 # Painel flutuante no Meshy e ponte de mensagens (evita CSP)
│   └── background.js              # Service Worker; realiza downloads nativos via chrome.downloads
└── server/                        # Servidor Local em Python (porta 9999)
    ├── logger_server.py           # Servidor HTTP para logs em tempo real e endpoints de automação
    └── meshy_processor.py         # Motor 3D (Upscale de textura 4K, conversão STL binário e OBJ)
```

---

## ✨ Funcionalidades Principais

- [x] **Descriptografia em Tempo Real:** Captura o arquivo `.glb` diretamente do Web Worker no momento da renderização.
- [x] **Download Automático e Confiável:** Dispara o download nativo com cabeçalho `glTF` 100% válido, compatível com Blender, Unreal, Unity, Godot e fatiadores 3D.
- [x] **Painel Flutuante Integrado:** Widget escuro moderno no canto inferior direito do Meshy Workspace mostrando contador de modelos e status em tempo real.
- [x] **Suporte a Modelos de Alta Densidade:** Validado com modelos de escultura de mais de 5,4 milhões de triângulos (128 MB).
- [x] **🎨 Upscale de Texturas para 4K:** Processa texturas embutidas com reamostragem Lanczos e filtro *Unsharp Mask* para 4096x4096px.
- [x] **🖨️ Conversor Automático para STL:** Gera arquivos `.STL` binários prontos para fatiadores (Cura, Bambu Studio, PrusaSlicer).
- [x] **Ponte de Logs Local:** Servidor Python (`localhost:9999`) que espelha os eventos do navegador para o terminal em tempo real.

---

## 🚀 Como Instalar e Usar

### 1. Pré-requisitos
- Google Chrome ou qualquer navegador baseado em Chromium (Edge, Brave, Opera).
- Python 3.10+ instalado no computador.

### 2. Ativar a Extensão no Chrome
1. Abra o navegador e acesse: `chrome://extensions/`
2. No canto superior direito, ative o interruptor **"Modo do desenvolvedor"** *(Developer mode)*.
3. Clique no botão **"Carregar sem compactação"** *(Load unpacked)* no canto superior esquerdo.
4. Selecione a pasta **`extension`** dentro deste repositório.

### 3. Iniciar o Servidor Python Local
No terminal, entre na pasta do repositório e instale as dependências:
```bash
pip install -r requirements.txt
```
Inicie o servidor de processamento e logs:
```bash
python server/logger_server.py
```
*(O servidor iniciará em `http://localhost:9999` exibindo os logs em tempo real).*

### 4. Baixar seus Modelos no Meshy
1. Acesse o seu workspace no [Meshy.ai](https://www.meshy.ai/pt-BR/workspace).
2. Aperte **`F5`** para recarregar a página.
3. O painel **⚡ Meshy 3D Descriptografador** aparecerá no canto inferior direito.
4. Clique em qualquer modelo da sua galeria lateral: assim que o modelo carregar no visor 3D, o arquivo `.glb` limpo e descriptografado será baixado automaticamente na sua pasta de Downloads!

---

## 🤖 PROMPT MESTRE DE CONTEXTO PARA QUALQUER IA

> 📋 **Copie o bloco abaixo e cole em qualquer nova conversa com IA (ChatGPT, Claude, Gemini, Cursor, etc.)** para que ela compreenda instantaneamente todo o contexto, engenharia reversa e decisões técnicas tomadas neste projeto:

```markdown
Você é meu assistente sênior de desenvolvimento de software e especialista em engenharia reversa web, extensões do Chrome (Manifest V3) e processamento 3D em Python.

Aqui está o contexto completo do projeto que desenvolvi no repositório `meshy-3d-downloader`:

### 1. OBJETIVO DO PROJETO
Criar uma suíte completa (Extensão Chrome Manifest V3 + Servidor Local em Python) para interceptar, descriptografar e baixar em lote modelos 3D criados na plataforma Meshy.ai (Text-to-3D e Image-to-3D), além de pós-processar os arquivos locais (upscaling de textura para 4K e conversão para STL/OBJ para impressão 3D e jogos).

### 2. PECULIARIDADES TÉCNICAS E PROBLEMAS JÁ SUPERADOS:
1. **Criptografia Propriatária (.meshy / MESHY.AI):**
   - O Meshy não entrega arquivos `.glb` puros na visualização web; ele baixa arquivos com cabeçalho `MESHY.AI\x01\x00`.
   - Se o usuário tentar salvar esses arquivos diretamente da rede, qualquer visualizador 3D (Blender, Three.js) falhará com erro de corrupção.
2. **Mecanismo de Descriptografia Interno da Meshy:**
   - Para exibir o modelo no Canvas/Three.js, o frontend da Meshy envia o buffer criptografado para um `Web Worker` que roda WebAssembly (WASM).
   - O Worker descriptografa a malha e retorna uma mensagem do tipo `{ type: 'process', success: true, data: ArrayBuffer }`.
   - A página então chama `URL.createObjectURL(new Blob([decryptedBuffer], { type: 'model/gltf-binary' }))`.
   - O buffer descriptografado possui os 4 primeiros bytes mágicos `0x46546C67` (`glTF`), confirmando um modelo GLB válido.
3. **Engenharia da Extensão (Manifest V3):**
   - `page_inject.js` roda com `"world": "MAIN"` e `"run_at": "document_start"` para ter acesso ao escopo global da página antes dos scripts da Meshy.
   - Faz o hook transparente de `window.Worker` (interceptando mensagens `e.data` descriptografadas) e `URL.createObjectURL` (capturando blobs `model/gltf-binary` ou com assinatura `glTF`).
   - Não realiza chamadas de rede diretas (`fetch`) para evitar violação da Content Security Policy (CSP) da Meshy. Em vez disso, envia dados via `window.postMessage`.
   - `content.js` roda no contexto isolado da extensão, injeta uma UI flutuante no Meshy Workspace e repassa logs para `background.js`.
   - `background.js` usa a API nativa `chrome.downloads.download()`, eliminando restrições de CORS e salvando os arquivos diretamente na pasta de Downloads.
4. **Organização de Pastas vs Chrome:**
   - O Chrome proíbe extensões com pastas iniciadas por `_` (como `__pycache__`).
   - Por isso o projeto está estritamente dividido em `extension/` (apenas manifest e scripts JS) e `server/` (scripts Python).
5. **Servidor Local e Motor 3D (`server/`):**
   - `logger_server.py`: roda na porta 9999, recebe logs da extensão e expõe endpoints para automação de tarefas.
   - `meshy_processor.py`: utiliza `pygltflib`, `trimesh` e `Pillow` para inspecionar malhas (suporta modelos com mais de 5,4 milhões de triângulos), aplicar upscale de textura para 4K via Lanczos com Unsharp Mask e converter `.glb` para `.stl` binário.

Com base em todo esse contexto, continue a trabalhar comigo neste projeto, respeitando essa arquitetura e propondo melhorias técnicas diretas e funcionais.
```

---

## 👤 Autor

Desenvolvido por **Iury Almeida** ([@IuryAlmeidaDev](https://github.com/IuryAlmeidaDev)).
