# canopy

A Claude marketplace plugin providing the **canopy** umbrella context layer.

## Skills

| Skill | Description |
|-------|-------------|
| `remember` | Store a key/value fact in the conversation memory tree |
| `recall` | Retrieve stored facts by key or key prefix |
| `fetch-context` | Fetch a subtree of hierarchical context data by path |
| `delegate-agent` | Delegate a sub-task to another registered agent |

## Agents

| Agent | Description |
|-------|-------------|
| `canopy-orchestrator` | Multi-agent orchestrator — breaks tasks into sub-tasks and delegates them |

## Hooks

| Event | Handler | Description |
|-------|---------|-------------|
| `onSessionStart` | `restore-memory` | Restores persisted memory tree at the start of each session |
| `onSessionEnd` | `persist-memory` | Persists the in-session memory tree at the end of each session |
| `beforeSkill` | `inject-context` | Injects relevant canopy context into skill inputs |

## MCPs

| MCP | Description |
|-----|-------------|
| `canopy-mcp` | MCP server exposing canopy tools to Claude via the Model Context Protocol |

## Usage

This plugin is auto-loaded by the Claude Marketplace when listed in `marketplace.config.json`.
