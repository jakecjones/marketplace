import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, ChevronUp, Folder, GitBranch, Sparkles, Home, X, Check } from 'lucide-react'

interface BrowseItem {
  name: string
  path: string
  hasGit: boolean
  hasClaude: boolean
  hasPackageJson: boolean
}

interface BrowseResponse {
  path: string
  parent: string | null
  items: BrowseItem[]
}

interface SuggestedRoot {
  label: string
  path: string
}

interface SuggestedRootsResponse {
  home: string
  roots: SuggestedRoot[]
}

interface Props {
  excludePaths: Set<string>
  onSelect: (path: string, alias: string) => void
  onClose: () => void
}

export function RepoBrowser({ excludePaths, onSelect, onClose }: Props) {
  const [browse, setBrowse] = useState<BrowseResponse | null>(null)
  const [roots, setRoots] = useState<SuggestedRootsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aliasInput, setAliasInput] = useState('')

  const loadBrowse = useCallback(async (path?: string) => {
    setLoading(true); setError(null)
    try {
      const url = path ? `/api/browse?path=${encodeURIComponent(path)}` : '/api/browse'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`browse failed: ${res.status}`)
      const data: BrowseResponse = await res.json()
      setBrowse(data)
    } catch (e) { setError(String(e)) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch('/api/suggested-roots').then(r => r.json()).then(setRoots).catch(() => {})
    void loadBrowse()
  }, [loadBrowse])

  const handleSelect = useCallback((path: string) => {
    const alias = aliasInput.trim() || path.split('/').filter(Boolean).pop() || path
    onSelect(path, alias)
  }, [aliasInput, onSelect])

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-bg-primary rounded-xl border border-border-default shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <div>
            <h2 className="text-sm font-semibold text-fg-primary">Add a repository</h2>
            <p className="text-[11px] text-fg-tertiary mt-0.5">Browse to the repo's directory and click Add. Repos detected by <code>.git</code> or <code>.claude/</code> are highlighted.</p>
          </div>
          <button onClick={onClose} className="text-fg-tertiary hover:text-fg-primary"><X size={16} strokeWidth={1.5} /></button>
        </div>

        {/* Suggested roots */}
        {roots && roots.roots.length > 0 && (
          <div className="px-5 py-3 border-b border-border-default flex items-center gap-2 flex-wrap bg-bg-secondary">
            <span className="text-[10px] uppercase tracking-wide text-fg-tertiary mr-1">Jump to</span>
            {roots.roots.map(r => (
              <button
                key={r.path}
                onClick={() => loadBrowse(r.path)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border-default text-[11px] text-fg-secondary hover:bg-bg-hover transition-colors"
              >
                {r.label === 'Home' ? <Home size={11} strokeWidth={1.5} /> : <Folder size={11} strokeWidth={1.5} />}
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Path bar */}
        <div className="px-5 py-2.5 border-b border-border-default flex items-center gap-2 bg-bg-secondary">
          <button
            onClick={() => browse?.parent && loadBrowse(browse.parent)}
            disabled={!browse?.parent}
            className="text-fg-tertiary hover:text-fg-primary disabled:opacity-30 transition-colors"
            title="Up one directory"
          >
            <ChevronUp size={14} strokeWidth={1.5} />
          </button>
          <code className="text-[11px] text-fg-secondary font-mono truncate flex-1">{browse?.path || '…'}</code>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {loading && <div className="p-6 text-center text-xs text-fg-tertiary">Loading…</div>}
          {error && <div className="p-6 text-center text-xs text-danger">{error}</div>}
          {browse && !loading && (
            browse.items.length === 0
              ? <div className="p-6 text-center text-xs text-fg-tertiary">(empty directory)</div>
              : (
                <ul className="divide-y divide-[var(--border-default)]">
                  {browse.items.map(item => {
                    const isRepo = item.hasGit || item.hasClaude
                    const alreadyAdded = excludePaths.has(item.path)
                    return (
                      <li
                        key={item.path}
                        className="px-5 py-2.5 flex items-center gap-3 hover:bg-bg-hover transition-colors group"
                      >
                        <button
                          onClick={() => loadBrowse(item.path)}
                          className="flex items-center gap-2 flex-1 text-left min-w-0"
                          title="Open this directory"
                        >
                          {isRepo ? <Sparkles size={13} className="text-accent shrink-0" strokeWidth={1.75} /> : <Folder size={13} className="text-fg-tertiary shrink-0" strokeWidth={1.5} />}
                          <span className={`text-sm truncate ${isRepo ? 'text-fg-primary font-medium' : 'text-fg-secondary'}`}>{item.name}</span>
                          {item.hasGit && <Badge>git</Badge>}
                          {item.hasClaude && <Badge>.claude</Badge>}
                          {item.hasPackageJson && <Badge>package.json</Badge>}
                          <ChevronRight size={12} className="text-fg-tertiary opacity-0 group-hover:opacity-60 ml-auto shrink-0" strokeWidth={1.5} />
                        </button>
                        {alreadyAdded ? (
                          <span className="text-[10px] text-fg-tertiary shrink-0">already added</span>
                        ) : (
                          <button
                            onClick={() => handleSelect(item.path)}
                            className="text-[11px] px-2.5 py-1 rounded-md border border-border-default text-fg-secondary hover:text-fg-primary hover:border-accent transition-colors shrink-0"
                          >
                            Add
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )
          )}
        </div>

        {/* Footer: alias hint + add current dir */}
        <div className="border-t border-border-default px-5 py-3 flex items-center gap-3 bg-bg-secondary">
          <label className="text-[11px] text-fg-tertiary">Alias (optional):</label>
          <input
            value={aliasInput}
            onChange={e => setAliasInput(e.target.value)}
            placeholder="defaults to dir name"
            className="text-xs bg-bg-primary border border-border-default rounded px-2 py-1 text-fg-primary focus:border-accent focus:outline-none flex-1 max-w-[200px]"
          />
          <div className="flex-1" />
          {browse && !excludePaths.has(browse.path) && (
            <button
              onClick={() => handleSelect(browse.path)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-accent text-accent-fg hover:bg-accent-hover transition-colors"
            >
              <Check size={12} strokeWidth={1.75} /> Add this directory
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] uppercase tracking-wide font-medium px-1.5 py-px rounded bg-bg-tertiary text-fg-tertiary border border-border-default shrink-0">
      {children}
    </span>
  )
}

// Re-export for clarity
export type { BrowseItem }
