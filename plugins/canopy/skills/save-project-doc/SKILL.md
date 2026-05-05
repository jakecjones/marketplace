---
name: canopy-save-project-doc
description: Save a project-specific note (decision, design sketch, open question) to the active Canopy workspace's docs/ directory. The note never touches the underlying repos.
allowed-tools: Write, Read, Bash
---

# Save a project-level note to the workspace docs/

Use when the user wants to record a decision, sketch, or open question that belongs to the *workspace* (the project they're working on across multiple repos), not to any one repo.

## Where notes go

`~/.claude/canopy/workspaces/<workspace-name>/docs/<slug>-YYYY-MM-DD.md`

The `docs/` directory is part of the workspace, not any repo. Repos are never modified by this skill.

## Steps

1. **Determine the workspace.** Look for `.canopy-workspace` in the current working directory or any parent (it's a marker file written by `canopy launch` containing the workspace name). If none, ask the user which workspace.
2. **Slug the user's title** for the filename: lowercase, replace non-alphanumerics with `-`, collapse repeats, trim. Cap at ~60 chars.
3. **Build the filename**: `<slug>-YYYY-MM-DD.md` using today's date in ISO form.
4. **Write the note** with the user's content as the body. If the user gave a one-line prompt, you may add structure (Date, Context, Notes, Open Questions) but keep it tight — don't pad.
5. Confirm the absolute path of the file you wrote.

## What this is NOT

- It's not a session-end auto-save. The user invokes it explicitly when they have something worth keeping.
- It's not a replacement for native session resume — Claude Code already handles that.
- It's not for code or config — those go in the appropriate repo, not the workspace docs.
