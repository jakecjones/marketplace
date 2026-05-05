import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Trash2, FolderOpen, Save, Loader2 } from 'lucide-react'
import { RepoGraph } from './RepoGraph'
import { RepoBrowser } from './RepoBrowser'
import type { WorkspaceProfile, WorkspaceRepo, WorkspaceGraph, GraphNode, GraphEdge } from './types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function App() {
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [closing, setClosing] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)

  useEffect(() => {
    fetch('/api/workspace')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`load failed: ${r.status}`)))
      .then(setProfile)
      .catch(e => setLoadError(e.message))
  }, [])

  const persist = useCallback(async (next: WorkspaceProfile) => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      })
      if (!res.ok) throw new Error(`save failed: ${res.status}`)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1500)
    } catch (e) {
      setSaveState('error')
      console.error(e)
    }
  }, [])

  const update = useCallback((mut: (p: WorkspaceProfile) => WorkspaceProfile) => {
    setProfile(prev => {
      if (!prev) return prev
      const next = mut(prev)
      void persist(next)
      return next
    })
  }, [persist])

  const handleAddRepoFromBrowser = useCallback((path: string, alias: string) => {
    setBrowserOpen(false)
    update(p => {
      if (p.repos.some(r => r.path === path)) return p
      const repo: WorkspaceRepo = { path, alias, lastAccessed: new Date().toISOString() }
      const node: GraphNode = {
        id: crypto.randomUUID(),
        repoPath: path,
        alias,
        description: '',
        x: (p.graph.nodes.length % 4) * 240 + 40,
        y: Math.floor(p.graph.nodes.length / 4) * 100 + 40
      }
      // Auto-wire: connect every existing node to the new one with an empty
      // label. Empty labels render as a hover hint in RepoGraph, inviting
      // refinement. Easier to delete unwanted edges than to draw missing ones.
      const newEdges: GraphEdge[] = p.graph.nodes.map(existing => ({
        id: crypto.randomUUID(),
        sourceId: existing.id,
        targetId: node.id,
        label: ''
      }))
      return {
        ...p,
        repos: [...p.repos, repo],
        graph: {
          ...p.graph,
          nodes: [...p.graph.nodes, node],
          edges: [...p.graph.edges, ...newEdges]
        }
      }
    })
  }, [update])

  const handleRemoveRepo = useCallback((path: string) => {
    if (!window.confirm(`Remove this repo from the workspace?\n${path}`)) return
    update(p => {
      const removedNodeIds = p.graph.nodes.filter(n => n.repoPath === path).map(n => n.id)
      return {
        ...p,
        repos: p.repos.filter(r => r.path !== path),
        graph: {
          ...p.graph,
          nodes: p.graph.nodes.filter(n => n.repoPath !== path),
          edges: p.graph.edges.filter(e => !removedNodeIds.includes(e.sourceId) && !removedNodeIds.includes(e.targetId))
        }
      }
    })
  }, [update])

  const handleAliasChange = useCallback((path: string, alias: string) => {
    update(p => ({
      ...p,
      repos: p.repos.map(r => r.path === path ? { ...r, alias } : r),
      graph: { ...p.graph, nodes: p.graph.nodes.map(n => n.repoPath === path ? { ...n, alias } : n) }
    }))
  }, [update])

  const handleGraphChange = useCallback((graph: WorkspaceGraph) => {
    update(p => ({ ...p, graph }))
  }, [update])

  const handleSaveAndClose = useCallback(async () => {
    setClosing(true)
    try {
      await fetch('/api/done', { method: 'POST' })
      setTimeout(() => { document.title = '✓ Saved — you can close this tab.' }, 100)
    } catch (e) {
      setClosing(false)
      console.error(e)
    }
  }, [])

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-danger text-sm">Failed to load workspace: {loadError}</div>
      </div>
    )
  }
  if (!profile) {
    return (
      <div className="h-full flex items-center justify-center text-fg-tertiary text-sm">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading workspace…
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      <header className="border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-fg-primary">{profile.name}</h1>
          <p className="text-xs text-fg-tertiary mt-0.5">
            {profile.repos.length} repo{profile.repos.length === 1 ? '' : 's'} · {profile.graph.edges.length} relationship{profile.graph.edges.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} />
          <button
            onClick={handleSaveAndClose}
            disabled={closing || saveState === 'saving'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover disabled:opacity-60 transition-colors"
          >
            {closing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={1.75} />}
            {closing ? 'Closing…' : 'Save & Close'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-5 space-y-6">
        <section>
          <SectionHeader title="Repositories" subtitle="Browse for repos to add. Each new repo is auto-wired to existing repos so editing the relationships is easier than drawing them from scratch.">
            <button
              onClick={() => setBrowserOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-fg-primary text-xs hover:bg-bg-hover transition-colors"
            >
              <Plus size={13} strokeWidth={1.5} /> Browse to add
            </button>
          </SectionHeader>
          {profile.repos.length === 0 ? (
            <EmptyState text="No repos yet. Click Add repo to get started." />
          ) : (
            <ul className="border border-border-default rounded-lg divide-y divide-[var(--border-default)] overflow-hidden">
              {profile.repos.map(repo => (
                <li key={repo.path} className="flex items-center gap-3 px-3 py-2.5 bg-bg-secondary">
                  <FolderOpen size={14} className="text-fg-tertiary shrink-0" strokeWidth={1.5} />
                  <input
                    value={repo.alias}
                    onChange={e => handleAliasChange(repo.path, e.target.value)}
                    className="text-sm font-medium text-fg-primary bg-transparent border-b border-transparent hover:border-border-default focus:border-accent focus:outline-none px-0.5"
                    style={{ width: `${Math.max(repo.alias.length, 6)}ch` }}
                  />
                  <code className="text-[11px] text-fg-tertiary font-mono truncate flex-1">{repo.path}</code>
                  <button
                    onClick={() => handleRemoveRepo(repo.path)}
                    className="text-fg-tertiary hover:text-danger transition-colors"
                    title="Remove from workspace"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHeader title="Relationships" subtitle="Drag a port (hover a node) to another node to draw a directed edge. Double-click an edge to label it (e.g. 'calls', 'depends on'). Right-click to delete." />
          <RepoGraph graph={profile.graph} onChange={handleGraphChange} height={460} />
        </section>

        <footer className="text-[11px] text-fg-tertiary border-t border-border-default pt-4">
          Permissions and MCP servers are <strong className="text-fg-secondary">merged from each repo's <code>.claude/</code></strong> on every <code>canopy launch</code>. Use this UI for repos and the relationship graph; manage allow/deny rules per repo in their own <code>.claude/settings.local.json</code>.
        </footer>
      </main>

      {browserOpen && profile && (
        <RepoBrowser
          excludePaths={new Set(profile.repos.map(r => r.path))}
          onSelect={handleAddRepoFromBrowser}
          onClose={() => setBrowserOpen(false)}
        />
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-secondary">{title}</h2>
        {subtitle && <p className="text-[11px] text-fg-tertiary mt-1 max-w-xl">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border-default rounded-lg px-4 py-8 text-center text-xs text-fg-tertiary">
      {text}
    </div>
  )
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  if (state === 'saving') return <span className="text-[11px] text-fg-tertiary inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> saving…</span>
  if (state === 'saved') return <span className="text-[11px] text-success">saved</span>
  return <span className="text-[11px] text-danger">save failed</span>
}
