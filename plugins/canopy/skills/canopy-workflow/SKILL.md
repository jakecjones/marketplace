---
name: canopy-workflow
description: Manage Canopy multi-repo workspaces. Lists existing workspaces, lets the user pick one (or create new), then offers an action menu (open editor, add/remove repo, re-merge & relaunch, rename, delete). After every change, surfaces what needs a session restart.
allowed-tools: Bash, Read
---

# Canopy workspace management hub

You are the management entry point for Canopy. The CLI is at `${CLAUDE_PLUGIN_ROOT}/bin/canopy` and is **not** on the user's shell PATH — always invoke it with the full prefix.

Workspaces live under `~/.claude/canopy/workspaces/<name>/` (each with `workspace.json`, optional `docs/`, and a regenerated `.claude/`).

## Fast path: "start <workspace> [with <mode>]"

If the user's prompt is clearly a *launch request* — phrasings like "start", "launch", "open", "boot up", "fire up" + a workspace name (or partial match) — skip the menu and go straight to launch:

1. Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy list` to find the matching workspace name (fuzzy-match: "story forge" → "Story Forge"). If multiple match, ask which.
2. Translate any mode keyword in the prompt to a `--mode` value:
   - "full auto", "auto", "yolo", "bypass" → `--mode auto`
   - "accept edits", "auto-accept" → `--mode accept`
   - "plan mode", "read only", "plan" → `--mode plan`
   - "deny by default", "don't ask", "lockdown" → `--mode dont-ask`
   - no mode mentioned → omit the flag (default)
3. Always pass `--terminal` for fast-path launches (the user said "start" — they mean *open it*).
4. Run: `${CLAUDE_PLUGIN_ROOT}/bin/canopy launch <name> --terminal --mode <translated>`. The CLI opens a new Terminal/iTerm tab and starts `claude` there.
5. Confirm to the user: "Started Canopy `<name>` in a new terminal tab with permission mode `<mode>`."
6. End the workflow — don't loop into the menu.

If the user's intent isn't clearly a launch (they said "edit", "configure", "manage", "add a repo", or just named a workspace with no verb), fall through to the menu flow below.

## Hand off to sibling skills

This skill is the management hub. Two narrower skills handle single-purpose actions — defer to them when the user's intent matches:

- **`/canopy:canopy-save-project-doc`** — when the user wants to save a note, decision, sketch, or open question to the *workspace's* `docs/` (not to any repo). Phrasings: "save this as a note", "log this decision", "remember this for the project". Hand off; don't try to write the doc from inside this skill.
- **`/canopy:canopy-add-repo`** — direct keyboard-only path to add a single repo when the user already knows the workspace name and absolute path. Equivalent to the menu's "Add a repo (paste path)" action; if the user clearly invokes that intent without entering the management hub, the sibling skill handles it without the menu.

## Menu flow

This skill is a small state machine. Walk the user through it.

### 1. Pick a workspace

Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy list`.

If the user's prompt clearly names a specific workspace and it exists in the list, skip the question and use that one.

Otherwise, use AskUserQuestion to present:
- Each existing workspace name as an option (one option per workspace)
- "Create new workspace" as the last option
- "Cancel" as a final option

If only one workspace exists and the user gave no hint, still ask — but include "Open <name>" and "Create another" as the two real options.

### 2a. If "Create new"

Ask the user for the workspace name. Then run `${CLAUDE_PLUGIN_ROOT}/bin/canopy new <name>`. Then jump to step 4 (action menu) on the new workspace, defaulting to "Open editor (UI)" so the user lands in the browser to add repos.

### 2b. If "Cancel"

End the workflow.

### 3. Show the workspace

Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy show <name>` and surface the output to the user verbatim. This includes:
- Repo list with aliases
- Relationship count
- Last launched timestamp
- **Drift hint** — if any repo's `.claude/` directory has changed since last launch, the output will include a `⚠ N repos changed since last launch` line. Highlight this for the user — they probably want to re-merge.
- **Missing repos** — if a repo's path no longer exists on disk, the output flags it with `[MISSING]`. Suggest removing it.
- Project doc count

### 4. Action menu

Use AskUserQuestion to present the actions below. Always include "Cancel" so the user can back out.

| Option | What you do |
|---|---|
| **Open editor (browser UI)** | Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy edit <name>`. This blocks until the user clicks Save & Close in the browser. If the browser doesn't open, tell the user to visit the printed URL manually. After it returns, re-run `canopy show` and announce changes. |
| **Add a repo (browse)** | Same as Open editor — the UI has a Browse-to-add modal. Direct the user to use it. |
| **Add a repo (paste path)** | Ask the user for the absolute path. Optionally ask for an alias (default: dirname). Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy add-repo <name> <path> [alias]`. |
| **Remove a repo** | Use AskUserQuestion to present the workspace's current repos by alias. Then run `${CLAUDE_PLUGIN_ROOT}/bin/canopy remove-repo <name> <alias>`. |
| **Re-merge & launch in new terminal** | Use AskUserQuestion to pick a permission mode (Default / Accept Edits / Plan / Bypass (full auto) / Don't Ask). Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy launch <name> --terminal --mode <chosen>`. The CLI opens a new Terminal/iTerm tab. Confirm to the user. |
| **Re-merge only (no terminal)** | Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy launch <name>`. Surface the `cd <path> && claude` line so the user can run it themselves. |
| **Rename workspace** | Ask for the new name. Run `${CLAUDE_PLUGIN_ROOT}/bin/canopy rename <old> <new>`. |
| **Delete workspace** | **Confirm first** with AskUserQuestion: "Permanently delete `<name>`? This removes the workspace dir, all docs, and the merged config. Repos themselves are NOT touched." If confirmed, run `${CLAUDE_PLUGIN_ROOT}/bin/canopy delete <name> --force`. End the workflow after delete. |
| **Cancel** | End the workflow. |

### 5. After any mutation

Re-run step 3 (`canopy show`) so the user sees the new state. Then loop back to step 4 so they can chain another action without re-invoking the skill.

### 6. Restart-required hint

After any action that changed `repos[]`, allow/deny rules, MCP servers, or `additionalDirectories` (which is: add-repo, remove-repo, edit if any of those changed, re-merge), tell the user explicitly:

> Permissions / MCP / additionalDirectories changed. To use the new config, exit this session and run: `cd ~/.claude/canopy/workspaces/<name> && claude`

For purely cosmetic edits (graph node positions, edge labels, repo descriptions, aliases) — no restart needed.

## Failure modes

- **Workspace not found**: `canopy show` returns "Workspace not found" → user picked a stale name. Loop back to step 1 with `canopy list`.
- **Repo path missing**: `canopy show` flags it. Offer to run `remove-repo`.
- **Concurrent editor**: `canopy edit` errors with "Another editor is already running (pid N)". If the PID is dead, tell the user how to clear it: `rm ~/.claude/canopy/workspaces/<name>/.canopy-edit.lock`.
- **Browser doesn't open**: `canopy edit` still prints the URL. Relay it.
- **Rename to existing name**: `canopy rename` errors. Ask for a different name.
- **Delete without --force**: shouldn't happen because this skill always passes `--force` after explicit confirmation. If the user types it manually, the CLI explains.

## Permission modes — quick reference

| Mode | What it does | When the user wants it |
|---|---|---|
| `default` | Prompt on first use of each tool. | Normal interactive work. |
| `acceptEdits` (alias `accept`) | Auto-approve file edits, prompt for the rest. | Trusted refactor / build session. |
| `plan` (alias `read-only`, `readonly`) | Read-only, no modifications. | Investigation, audits, code review. |
| `bypassPermissions` (alias `auto`, `full-auto`, `bypass`) | Skip all prompts. **Unsafe.** | Long autonomous runs the user trusts. |
| `dontAsk` (alias `dont-ask`, `deny`) | Deny everything not pre-approved. | Locked-down sandbox. |

The CLI accepts any of these aliases via `--mode`.

## Don't

- Don't start a `claude` subprocess yourself directly — `canopy launch --terminal` does it via `osascript` so it lands in a real Terminal/iTerm tab the user can interact with.
- Don't bypass the confirmation prompt on delete.
- Don't fabricate workspace names — only offer ones returned by `canopy list`.
- Don't read `workspace.json` directly to answer questions — always go through the CLI so the source of truth stays in one place.
- Don't pass `--mode auto` (bypassPermissions) silently — if the user didn't explicitly ask for "auto" or "bypass" or "full auto", default to no `--mode` flag.
