---
name: canopy-add-repo
description: Add a repository to a Canopy workspace without spawning the browser UI. Use for quick keyboard-only edits when the user already knows the workspace name and repo path.
allowed-tools: Bash, Read
---

# Add a repo to a Canopy workspace

Quick path for "add this repo to my workspace" — no UI involved.

## Usage

1. The user typically gives you the repo path explicitly. If they don't, ask. Never guess.
2. Determine the workspace: if the current working directory is `~/.claude/canopy/workspaces/<name>/`, use `<name>`. Otherwise list workspaces with `${CLAUDE_PLUGIN_ROOT}/bin/canopy list` and ask the user which one.
3. Run: `${CLAUDE_PLUGIN_ROOT}/bin/canopy add-repo <workspace> <absolute-repo-path> [alias]`. The alias defaults to the repo directory's basename — only pass one if the user requests it explicitly.
4. After it succeeds, run `${CLAUDE_PLUGIN_ROOT}/bin/canopy launch <workspace>` to regenerate the merged config.
5. Tell the user: "Added `<alias>` → `<path>`. Exit this session and run `cd <workspace-path> && claude` to pick up the new repo's settings (additionalDirectories, permissions, MCP)."

## Notes

- The CLI rejects repos that don't exist on disk and rejects duplicates (same absolute path). Surface those errors verbatim.
- Adding a repo is always a restart-required edit because it changes `additionalDirectories` in the workspace's merged `settings.local.json`.
