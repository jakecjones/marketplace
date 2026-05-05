# Claude Marketplace

A monorepo for managing Claude **skills**, **agents**, **hooks**, and **MCPs** (Model Context Protocol servers).

## Structure

```
marketplace/
├── core/               # Registry, loader, and shared types
├── plugins/
│   ├── ux-harness/     # UI/UX interaction harness plugin
│   └── canopy/         # Canopy umbrella plugin
└── marketplace.config.json
```

## Concepts

| Concept | Description |
|---------|-------------|
| **Skills** | Discrete capabilities Claude can invoke (function-calling tools) |
| **Agents** | Autonomous agent configurations that orchestrate skills |
| **Hooks** | Lifecycle callbacks (before/after skill calls, session start/end, etc.) |
| **MCPs** | [Model Context Protocol](https://modelcontextprotocol.io) server definitions |

## Plugins

### `ux-harness`
Provides skills and hooks for managing user-facing interactions — rendering UI components, capturing input, and streaming responses.

### `canopy`
An umbrella plugin offering a tree-structured context layer — managing conversation memory, hierarchical data retrieval, and multi-agent orchestration.

## Getting Started

```bash
npm install          # install all workspace packages
npm run list         # list registered plugins
```

## Adding a New Plugin

1. Create `plugins/<your-plugin>/` with a `plugin.json` manifest.
2. Add the plugin path to `marketplace.config.json`.
3. Run `npm install` to register it in the workspace.
