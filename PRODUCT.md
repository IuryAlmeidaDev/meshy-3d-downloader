# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Criador e desenvolvedor em busca de autonomia total sobre a esteira de criação 3D via IA, utilizando a ferramenta no dia a dia como uma **suíte multiuso completa**:
- Modelagem e prototipagem de jogos (Roblox, Unity, Unreal Engine, Godot).
- Manufatura aditiva e impressão 3D (Cura, Bambu Studio, PrusaSlicer).
- Construção de acervo local de ativos 3D (.GLB, .STL, .OBJ) sem dependência de planos pagos para exportação.

## Product Purpose

Democratizar e otimizar o fluxo de trabalho no Meshy.ai:
- Interceptar e descriptografar em tempo real modelos 3D gerados no Workspace ou visualizados no Discover.
- Permitir download seletivo e sob demanda sem poluir a máquina com downloads automáticos.
- Oferecer ferramentas locais de pós-processamento de nível profissional: Upscaling de texturas para 4K, decimação para Low-Poly de jogos, reparo de malhas para impressão 3D estanque (Watertight) e divisão de peças soltas (Mesh Split).

## Positioning

Uma suíte de produtividade e engenharia reversa que opera na borda (no navegador do usuário e em um servidor local ultrarrápido). Diferente de scrapers comuns que apenas capturam arquivos estáticos, o produto conecta-se ao ciclo de renderização WebGL/WebAssembly da página para extrair o buffer geométrico puro descriptografado e expandi-lo com pós-processamento local.

## Operating Context

- **Ambiente:** Google Chrome / navegadores Chromium no Windows.
- **Ecossistema Web:** Páginas `https://www.meshy.ai/workspace` e `https://www.meshy.ai/discover`.
- **Destino dos Arquivos:** Pasta local de downloads do usuário (`Downloads`) e softwares 3D externos (Blender, Bambu Studio, Roblox Studio, Unity).
- **Ritual de Uso:** O usuário navega pelo Meshy, cria ou explora modelos 3D, inspeciona na tela e utiliza o HUD flutuante para acionar downloads ou transformações de geometria e textura em 1 clique.

## Capabilities and Constraints

- **Captura em Tempo Real:** Hooking do `window.Worker` (WASM) e `URL.createObjectURL` para decodificar o cabeçalho proprietário `MESHY.AI` e obter o `glTF` binário válido (`0x46546C67`).
- **Segurança e CSP:** A injeção na página (`world: MAIN`) não dispara requisições externas não autorizadas; a ponte de comunicação com o servidor local (`localhost:9999`) é isolada e protegida via `postMessage` e `chrome.runtime`.
- **Motor 3D Local (Python):** Suporta modelos gigantescos de até 5,4+ milhões de triângulos (~188 MB) com bibliotecas nativas de alto desempenho (`trimesh`, `fast_simplification`, `Pillow`, `pygltflib`).
- **Controle de Download:** O usuário possui controle sob demanda (navega livremente e baixa apenas quando clica no botão).

## Brand Commitments

- **Identidade Visual:** **Meshy 3D Studio PRO** — estética escura, futurista e de alta densidade de informação (HUD dark & moderno estilo Studio/Cyberpunk com acentos neon lime `#a3e635`, badges de status e feedback em tempo real).
- **Voz do Produto:** Direta, técnica, precisa e empoderadora para o criador 3D.

## Evidence on Hand

- Código-fonte da extensão Chrome Manifest V3 validado e funcional (`extension/`).
- Servidor local Python testado com sucesso para decimação de malhas, reparo STL e upscale (`server/`).
- Modelos reais de alta densidade validados em produção (golfinho 3D, moeda do pavão com 5,4 milhões de triângulos / 128 MB e modelos de 188 MB).
- Repositório Git público/privado versionado em `IuryAlmeidaDev/meshy-3d-downloader`.

## Product Principles

1. **Controle Total do Usuário:** Nunca baixar arquivos sem intenção explícita; a navegação deve ser fluida e o download uma escolha deliberada.
2. **Qualidade Máxima sem Concessões:** Preservar a geometria original pura com 100% de integridade e fornecer ferramentas de super-resolução (4K e Watertight).
3. **Leveza e Invisibilidade:** O HUD deve ser elegante, integrado à interface da plataforma e nunca interferir na experiência nativa de navegação.
4. **Independência de Nuvem:** Toda etapa de transformação, conversão e reparo deve ser executada localmente, de forma instantânea e sem custos.

## Accessibility & Inclusion

- Contraste visual elevado no painel escuro (texto claro `#f4f4f5` e acentos de status `#a3e635`, `#38bdf8`, `#c084fc`).
- Notificações de status textuais claras para cada ação assíncrona (início, progresso, sucesso e erro).
