# canopy

Multi-repo workspace orchestration for Claude Code. Declare a workspace that points at N repos, draw the relationships between them, and Canopy merges each repo's `.claude/` config (CLAUDE.md, permissions, MCP servers) into one unified workspace `.claude/` — your repos stay untouched.

## What it gives you

- **One `claude` session, many repos.** `additionalDirectories` is populated from every repo you declare, so Claude can read across them.
- **Inherited permissions.** Allow/deny rules from each repo's `.claude/settings.local.json` are unioned and deduped.
- **Inherited MCP servers.** Each repo's `.claude/mcp.json` servers are merged and namespaced (`<repo-alias>/<server>`) so two repos can both expose a `postgres` server without colliding.
- **Inherited CLAUDE.md.** Each repo's instructions are concatenated under a per-repo header, with a "Repository Map" and a "Relationships" section drawn from the workspace graph.
- **A `docs/` dir** in the workspace for project-level notes (decisions, sketches) that don't belong to any one repo.
- **Session context injection.** A SessionStart hook tells Claude what workspace it's in and what repos it can reach, so you don't have to.

## Install

From this marketplace:

```
/plugin marketplace add jakecjones/marketplace
/plugin install canopy@jakecjones-marketplace
```

For local development:

```
claude --plugin-dir /path/to/marketplace/plugins/canopy
```

## Usage

From inside any Claude Code session:

- `/canopy:canopy-workflow` — opens an ephemeral browser UI to add repos, draw relationships, then merges configs.
- `/canopy:canopy-add-repo` — keyboard-only path to add a repo (no UI).
- `/canopy:canopy-save-project-doc` — save a workspace-level note to `docs/`.

The workflow ends with the merged config written to `~/.claude/canopy/workspaces/<name>/.claude/`. To work in the merged workspace, exit your current session and start a fresh one there:

```
cd ~/.claude/canopy/workspaces/<name> && claude
```

The new session picks up the merged permissions, MCP, additionalDirectories, and CLAUDE.md at start.

## Why a separate session?

Claude Code reads `additionalDirectories`, `permissions`, and `mcpServers` once at session start. A hook running mid-session can't change those for the current session. So the canopy CLI prepares the merged config and you start a fresh session in the workspace dir to use it.

## Why no `canopy` on your shell PATH?

Claude Code plugins can only expose binaries inside Bash tool calls during a session — they don't symlink into your user PATH on install. If you want `canopy` available in your terminal directly, symlink it manually:

```
ln -s ~/.claude/plugins/canopy/bin/canopy ~/.local/bin/canopy
```

## Layout

```
plugins/canopy/
├── .claude-plugin/plugin.json
├── bin/canopy             # CLI: list, new, edit, launch, add-repo, session-context
├── bin/canopy-ui          # ephemeral local web server
├── ui/                    # React app (Vite-built into ui/dist/)
├── skills/                # canopy-workflow, add-repo, save-project-doc
└── hooks/hooks.json       # SessionStart → canopy session-context
```

## Workspace storage

```
~/.claude/canopy/workspaces/<name>/
├── workspace.json         # the profile (repos, graph, metadata)
├── .canopy-workspace      # marker file: signals SessionStart hook
├── docs/                  # project-level notes (canopy-save-project-doc)
└── .claude/               # regenerated on every `canopy launch`
    ├── CLAUDE.md
    ├── settings.local.json
    └── mcp.json
```
