---
name: Meshy 3D Studio PRO
description: Cyberpunk obsidian glass HUD and local 3D engineering suite
colors:
  bg-obsidian: "#0d0e12"
  bg-header: "#16171d"
  surface-card: "rgba(255, 255, 255, 0.04)"
  surface-card-hover: "rgba(255, 255, 255, 0.09)"
  accent-lime: "#a3e635"
  accent-lime-hover: "#bef264"
  accent-cyan: "#38bdf8"
  status-amber: "#fcd34d"
  status-amber-bg: "rgba(245, 158, 11, 0.15)"
  text-primary: "#f4f4f5"
  text-secondary: "#e4e4e7"
  text-subtle: "#d4d4d8"
  text-muted: "#a1a1aa"
  text-disabled: "#71717a"
  dark-surface: "#09090b"
  dark-card: "#27272a"
  terminal-bg: "rgba(0, 0, 0, 0.55)"
  progress-bg: "rgba(0, 0, 0, 0.5)"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  border-default: "rgba(255, 255, 255, 0.12)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.08em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 600
rounded:
  xs: "3px"
  sm: "4px"
  base: "6px"
  md: "7px"
  lg: "8px"
  xl: "14px"
  pill: "12px"
---

## Overview

Meshy 3D Studio PRO é uma suíte de produtividade e engenharia 3D operando na borda (no navegador do usuário e em um servidor local ultrarrápido). Sua identidade visual segue uma estética escura, futurista e de alta densidade de informação estilo Studio/Cyberpunk com acentos neon lime `#a3e635`, inspirada em equipamentos modulares de áudio e engines 3D.

## Colors

- **Superfícies Base**: Vidro obsidian translúcido `rgba(13, 14, 18, 0.96)` com desfoque profundo (`backdrop-filter: blur(24px)`).
- **Acento Primário**: Neon Lime `#a3e635` para ações afirmativas, status online e downloads.
- **Hover de Acento**: Lime claro `#bef264` para estados ativos de ponteiro.
- **Acento Secundário**: Ciano elétrico `#38bdf8` para barras de progresso e gradientes de decimação.
- **Avisos & Offline**: Âmbar `#fcd34d` sobre fundo translúcido para alertas do motor Python.
- **Hierarquia de Texto**:
  - `#ffffff` / `#f4f4f5`: Títulos de alta importância e texto primário.
  - `#e4e4e7`: Nomes de arquivos e dados ativos.
  - `#a1a1aa`: Rótulos secundários e divisores táticos (em conformidade WCAG AA > 4.5:1).
  - `#71717a`: Estados desabilitados.

## Typography

Piso mínimo absoluto de legibilidade estabelecido em 11px:
- **Títulos e Ações Primárias**: 12px, font-weight 800, uppercase ou title case.
- **Rótulos Secundários e Badges**: 11px, font-weight 700.
- **Terminal e Telemetria**: 11px monospace (`ui-monospace, SFMono-Regular, Menlo`).

## Layout

- Painel flutuante de 320px de largura com posicionamento relativo aos cantos da viewport e suporte a arrastar (`draggable`).
- Modo minimizado em cápsula compacta de 250px x 38px para manter 100% da visualização do canvas 3D e gizmos desobstruídos.
- Gavetas retráteis (`.mdp-drawer`) para instruções do motor local e histórico de capturas.

## Elevation & Depth

- Vidro com desfoque profundo e camada dupla de sombra:
  `box-shadow: 0 24px 48px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(0, 0, 0, 0.6)`
- Bordas nítidas de 1px com `rgba(255, 255, 255, 0.12)`.
- Indicadores de liveness utilizam anel técnico nítido (`box-shadow: 0 0 0 1.5px rgba(163, 230, 53, 0.4)`) em vez de difusões desfocadas artificiais.

## Shapes

- Contêiner Principal: `border-radius: 14px`.
- Botões de Ação: `border-radius: 8px`.
- Botões de Ferramentas e Chips: `border-radius: 7px` e `4px`.
- Pílulas de Status: `border-radius: 12px`.

## Components

- `Header HUD`: Cabeçalho arrastável com pulso tático, título, badge de ambiente e pílula de status do motor local.
- `Telemetry Box`: Caixa de informações do asset ativo com pílula clicável para histórico multimodelo.
- `Ação Principal`: Botão de alta proeminência para download manual com suporte a atalho de teclado (`Alt + D`).
- `LOD Presets`: Chips rápidos para seleção de alvos de triângulos (`Roblox 5k`, `Unity 20k`, `Hi-Fi 50k`).
- `Grade Studio`: Botões secundários em grid 2x2 com ícones vetoriais inline e estados de bloqueio durante processamento.
- `Progress Box`: Barra de progresso animada via aceleração por GPU (`transform: scaleX()`).
- `Result Card`: Card de confirmação de entrega com botão direto para baixar o arquivo gerado.
- `Terminal de Log`: Linha de diagnóstico monoespaçada em tempo real.

## Do's and Don'ts

### Do
- Manter todos os textos funcionais com tamanho >= 11px.
- Preservar o download como ação estritamente intencional sob demanda.
- Travar concorrência durante processamento pesado no servidor local.
- Informar com clareza o estado de conexão do motor Python local.

### Don't
- Não utilizar halos de neon difusos artificiais (`dark-glow`).
- Não pulsar indicadores continuamente quando o sistema estiver em repouso ocioso.
- Não disparar animações de propriedades de layout como `width` ou `height` (usar `transform` e `opacity`).
- Não esconder a localização dos arquivos gerados pelo pós-processamento.
