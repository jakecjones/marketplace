// Mirror of WorkspaceProfile from the original Electron app.
// Source: config-ui/src/renderer/types/settings.ts:100-142

export interface WorkspaceRepo {
  path: string
  alias: string
  lastAccessed?: string
}

export interface GraphNode {
  id: string
  repoPath: string
  alias: string
  description: string
  x: number
  y: number
}

export interface GraphEdge {
  id: string
  sourceId: string
  targetId: string
  label: string
}

export interface WorkspaceGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  viewportX: number
  viewportY: number
}

export interface WorkspaceProfile {
  name: string
  createdAt: string
  lastLaunchedAt?: string
  repos: WorkspaceRepo[]
  graph: WorkspaceGraph
}
