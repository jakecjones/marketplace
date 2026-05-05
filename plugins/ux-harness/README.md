# ux-harness

A Claude marketplace plugin that provides the **UI/UX interaction harness** layer.

## Skills

| Skill | Description |
|-------|-------------|
| `render-component` | Renders a named UI component with supplied props |
| `capture-input` | Presents a prompt to the user and captures their response |
| `stream-response` | Streams a Claude response token-by-token to the UI surface |

## Agents

| Agent | Description |
|-------|-------------|
| `ux-orchestrator` | Coordinates multi-step UX flows: prompt → render → capture → respond |

## Hooks

| Event | Handler | Description |
|-------|---------|-------------|
| `beforeSkill` | `log-ux-call` | Logs each skill invocation for UX telemetry |
| `onSessionStart` | `init-ux-context` | Initialises the UX context (theme, locale, surface) |

## MCPs

| MCP | Description |
|-----|-------------|
| `ux-harness-mcp` | MCP server exposing UX tools to Claude via the Model Context Protocol |

## Usage

This plugin is auto-loaded by the Claude Marketplace when listed in `marketplace.config.json`.
