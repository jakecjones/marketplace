import { useRef, useState, useCallback, useEffect } from 'react'
import type { GraphNode, GraphEdge, WorkspaceGraph } from './types'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Lock,
  Unlock
} from 'lucide-react'

interface RepoGraphProps {
  graph: WorkspaceGraph
  onChange: (graph: WorkspaceGraph) => void
  height?: number
}

const NODE_W = 210
const NODE_H = 76
const PORT_R = 5
const GRID_SIZE = 20
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.1

type Side = 'left' | 'right' | 'top' | 'bottom'

function getPortPos(node: GraphNode, side: Side) {
  switch (side) {
    case 'left':
      return { x: node.x, y: node.y + NODE_H / 2 }
    case 'right':
      return { x: node.x + NODE_W, y: node.y + NODE_H / 2 }
    case 'top':
      return { x: node.x + NODE_W / 2, y: node.y }
    case 'bottom':
      return { x: node.x + NODE_W / 2, y: node.y + NODE_H }
  }
}

function closestPorts(a: GraphNode, b: GraphNode) {
  const sides: Side[] = ['left', 'right', 'top', 'bottom']
  let best = { dist: Infinity, from: sides[0], to: sides[0] }
  for (const s1 of sides) {
    const p1 = getPortPos(a, s1)
    for (const s2 of sides) {
      const p2 = getPortPos(b, s2)
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (d < best.dist) best = { dist: d, from: s1, to: s2 }
    }
  }
  return best
}

function snapToGrid(v: number) {
  return Math.round(v / GRID_SIZE) * GRID_SIZE
}

// Compute control points for a smooth cubic bezier that exits perpendicular to the port side
function computeControlPoints(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromSide: Side,
  toSide: Side
) {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  const offset = Math.max(40, dist * 0.4)

  const dir: Record<Side, { x: number; y: number }> = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 }
  }

  const d1 = dir[fromSide]
  const d2 = dir[toSide]

  return {
    c1: { x: p1.x + d1.x * offset, y: p1.y + d1.y * offset },
    c2: { x: p2.x + d2.x * offset, y: p2.y + d2.y * offset }
  }
}

// ─── Edge ──────────────────────────────────────────────────

function EdgePath({
  edge,
  nodes,
  onDelete,
  onLabelChange
}: {
  edge: GraphEdge
  nodes: GraphNode[]
  onDelete: (id: string) => void
  onLabelChange: (id: string, label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(edge.label)
  const [hovered, setHovered] = useState(false)
  const source = nodes.find((n) => n.id === edge.sourceId)
  const target = nodes.find((n) => n.id === edge.targetId)
  if (!source || !target) return null

  const ports = closestPorts(source, target)
  const p1 = getPortPos(source, ports.from)
  const p2 = getPortPos(target, ports.to)
  const { c1, c2 } = computeControlPoints(p1, p2, ports.from, ports.to)

  const d = `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`

  // Midpoint on the cubic bezier at t=0.5
  const mx = 0.125 * p1.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * p2.x
  const my = 0.125 * p1.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * p2.y

  // Arrowhead direction: tangent at t=1
  const ax = p2.x - c2.x
  const ay = p2.y - c2.y
  const angle = (Math.atan2(ay, ax) * 180) / Math.PI

  const strokeColor = hovered ? 'var(--color-fg-secondary)' : 'var(--color-border-default)'

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Visible edge */}
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        className="transition-colors duration-150"
      />
      {/* Wide hit target */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer"
        onDoubleClick={() => setEditing(true)}
        onContextMenu={(e) => {
          e.preventDefault()
          onDelete(edge.id)
        }}
      />
      {/* Arrowhead */}
      <g transform={`translate(${p2.x},${p2.y}) rotate(${angle})`}>
        <polygon
          points="-9,-4 0,0 -9,4"
          fill={strokeColor}
          className="transition-colors duration-150"
        />
      </g>
      {/* Delete badge on hover */}
      {hovered && !editing && (
        <g
          className="cursor-pointer"
          onClick={() => onDelete(edge.id)}
        >
          <circle cx={mx + 50} cy={my - 12} r={8} fill="var(--color-bg-primary)" stroke="var(--color-border-default)" strokeWidth={1} />
          <text x={mx + 50} y={my - 8} textAnchor="middle" fontSize={11} fill="var(--color-fg-tertiary)">x</text>
        </g>
      )}
      {/* Label */}
      <foreignObject x={mx - 56} y={my - 12} width={112} height={24}>
        {editing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => {
              setEditing(false)
              onLabelChange(edge.id, label)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditing(false)
                onLabelChange(edge.id, label)
              }
              if (e.key === 'Escape') {
                setEditing(false)
                setLabel(edge.label)
              }
            }}
            className="w-full text-center text-[10px] bg-bg-primary border border-accent rounded px-1.5 py-0.5 text-fg-primary focus:outline-none"
            style={{ fontSize: '10px' }}
          />
        ) : edge.label ? (
          <div
            className="text-center text-[10px] text-fg-secondary bg-bg-primary border border-border-default rounded-full px-2 py-0.5 cursor-pointer select-none truncate shadow-sm"
            onDoubleClick={() => setEditing(true)}
          >
            {edge.label}
          </div>
        ) : hovered ? (
          <div
            className="text-center text-[10px] text-fg-tertiary bg-bg-primary/60 border border-dashed border-border-default rounded-full px-2 py-0.5 cursor-pointer select-none"
            onDoubleClick={() => setEditing(true)}
          >
            add label
          </div>
        ) : null}
      </foreignObject>
    </g>
  )
}

// ─── Connection preview ────────────────────────────────────

function ConnectionPreview({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const mx = (from.x + to.x) / 2
  const d = `M ${from.x} ${from.y} Q ${mx} ${from.y} ${to.x} ${to.y}`
  return (
    <path
      d={d}
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={2}
      strokeDasharray="6 3"
      strokeLinecap="round"
      pointerEvents="none"
    />
  )
}

// ─── Node ──────────────────────────────────────────────────

const PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function GraphNodeComponent({
  node,
  index,
  isDragging,
  isHovered,
  onDragStart,
  onPortDragStart,
  onHover,
  onDescriptionChange
}: {
  node: GraphNode
  index: number
  isDragging: boolean
  isHovered: boolean
  onDragStart: (id: string, e: React.MouseEvent) => void
  onPortDragStart: (nodeId: string, pos: { x: number; y: number }, e: React.MouseEvent) => void
  onHover: (id: string | null) => void
  onDescriptionChange: (id: string, desc: string) => void
}) {
  const [editingDesc, setEditingDesc] = useState(false)
  const [desc, setDesc] = useState(node.description)
  const color = PALETTE[index % PALETTE.length]
  const dirName = node.repoPath.split('/').pop() || node.repoPath

  // Smarter path truncation: show last meaningful segments
  const segments = node.repoPath.split('/')
  const truncPath = segments.length > 3
    ? '.../' + segments.slice(-2).join('/')
    : node.repoPath

  const showPorts = isHovered || isDragging
  const sides: Side[] = ['left', 'right', 'top', 'bottom']

  return (
    <g
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Drop shadow */}
      <rect
        x={node.x + 1}
        y={node.y + 2}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        ry={10}
        fill="rgba(0,0,0,0.08)"
        className="pointer-events-none"
        style={{ opacity: isDragging ? 0.3 : 0.12 }}
      />
      {/* Card background */}
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        ry={10}
        fill="var(--color-bg-primary)"
        stroke={isDragging ? color : isHovered ? color : 'var(--color-border-default)'}
        strokeWidth={isDragging ? 2.5 : isHovered ? 2 : 1.5}
        className="cursor-grab active:cursor-grabbing transition-all duration-100"
        onMouseDown={(e) => onDragStart(node.id, e)}
        style={{
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transformOrigin: `${node.x + NODE_W / 2}px ${node.y + NODE_H / 2}px`
        }}
      />
      {/* Color accent stripe */}
      <rect
        x={node.x}
        y={node.y}
        width={4}
        height={NODE_H}
        rx={2}
        fill={color}
        className="pointer-events-none"
      />
      {/* Alias */}
      <text
        x={node.x + 14}
        y={node.y + 22}
        fontSize={12}
        fontWeight={600}
        fill="var(--color-fg-primary)"
        className="pointer-events-none select-none"
      >
        {(node.alias || dirName).length > 24
          ? (node.alias || dirName).slice(0, 22) + '...'
          : (node.alias || dirName)}
      </text>
      {/* Path */}
      <text
        x={node.x + 14}
        y={node.y + 38}
        fontSize={9}
        fill="var(--color-fg-tertiary)"
        fontFamily="monospace"
        className="pointer-events-none select-none"
      >
        {truncPath}
      </text>
      {/* Description (editable on double-click) */}
      <foreignObject
        x={node.x + 10}
        y={node.y + 46}
        width={NODE_W - 20}
        height={22}
      >
        {editingDesc ? (
          <input
            autoFocus
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => {
              setEditingDesc(false)
              onDescriptionChange(node.id, desc)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingDesc(false)
                onDescriptionChange(node.id, desc)
              }
              if (e.key === 'Escape') {
                setEditingDesc(false)
                setDesc(node.description)
              }
            }}
            className="w-full text-[10px] bg-transparent border-b border-accent px-0.5 py-0 text-fg-secondary focus:outline-none"
            style={{ fontSize: '10px', lineHeight: '16px' }}
            placeholder="Add description..."
          />
        ) : (
          <div
            className="text-[10px] text-fg-secondary truncate cursor-text select-none"
            style={{ lineHeight: '16px' }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditingDesc(true)
            }}
          >
            {node.description || (isHovered ? (
              <span className="text-fg-tertiary italic">double-click to describe</span>
            ) : '')}
          </div>
        )}
      </foreignObject>
      {/* Port circles - only visible on hover */}
      {sides.map((side) => {
        const pos = getPortPos(node, side)
        return (
          <circle
            key={side}
            cx={pos.x}
            cy={pos.y}
            r={PORT_R}
            fill={showPorts ? 'var(--color-bg-primary)' : 'transparent'}
            stroke={showPorts ? color : 'transparent'}
            strokeWidth={1.5}
            className="cursor-crosshair transition-all duration-150"
            style={{
              opacity: showPorts ? 1 : 0,
              transform: showPorts ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${pos.x}px ${pos.y}px`
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortDragStart(node.id, pos, e)
            }}
          />
        )
      })}
    </g>
  )
}

// ─── Toolbar ───────────────────────────────────────────────

function GraphToolbar({
  zoom,
  snapEnabled,
  locked,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleSnap,
  onToggleLock
}: {
  zoom: number
  snapEnabled: boolean
  locked: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onToggleSnap: () => void
  onToggleLock: () => void
}) {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-bg-primary/90 backdrop-blur-sm border border-border-default rounded-lg px-1 py-0.5 shadow-sm z-10">
      <button
        onClick={onZoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="p-1 text-fg-tertiary hover:text-fg-primary disabled:opacity-30 transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={13} strokeWidth={1.5} />
      </button>
      <span className="text-[10px] text-fg-tertiary font-mono w-9 text-center select-none">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        disabled={zoom >= MAX_ZOOM}
        className="p-1 text-fg-tertiary hover:text-fg-primary disabled:opacity-30 transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={13} strokeWidth={1.5} />
      </button>
      <div className="w-px h-4 bg-border-default mx-0.5" />
      <button
        onClick={onFitView}
        className="p-1 text-fg-tertiary hover:text-fg-primary transition-colors"
        title="Fit to view"
      >
        <Maximize size={13} strokeWidth={1.5} />
      </button>
      <button
        onClick={onToggleSnap}
        className={`p-1 transition-colors ${snapEnabled ? 'text-accent' : 'text-fg-tertiary hover:text-fg-primary'}`}
        title={snapEnabled ? 'Disable snap to grid' : 'Enable snap to grid'}
      >
        <Grid3X3 size={13} strokeWidth={1.5} />
      </button>
      <button
        onClick={onToggleLock}
        className={`p-1 transition-colors ${locked ? 'text-accent' : 'text-fg-tertiary hover:text-fg-primary'}`}
        title={locked ? 'Unlock nodes' : 'Lock nodes in place'}
      >
        {locked ? <Lock size={13} strokeWidth={1.5} /> : <Unlock size={13} strokeWidth={1.5} />}
      </button>
    </div>
  )
}

// ─── Grid pattern ──────────────────────────────────────────

function GridBackground({ zoom }: { zoom: number }) {
  const size = GRID_SIZE * zoom
  return (
    <defs>
      <pattern id="grid-dots" width={size} height={size} patternUnits="userSpaceOnUse">
        <circle cx={size / 2} cy={size / 2} r={0.8} fill="var(--color-border-default)" opacity={0.4} />
      </pattern>
    </defs>
  )
}

// ─── Main graph ────────────────────────────────────────────

export function RepoGraph({ graph, onChange, height = 400 }: RepoGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: graph.viewportX, y: graph.viewportY })
  const [zoom, setZoom] = useState(1)
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [locked, setLocked] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<{
    id: string
    startX: number
    startY: number
    nodeStartX: number
    nodeStartY: number
  } | null>(null)
  const [panning, setPanning] = useState<{
    startX: number
    startY: number
    panStartX: number
    panStartY: number
  } | null>(null)
  const [connecting, setConnecting] = useState<{
    sourceId: string
    from: { x: number; y: number }
    to: { x: number; y: number }
  } | null>(null)

  const dragNodeRef = useRef(draggingNode)
  dragNodeRef.current = draggingNode
  const panRef = useRef(panning)
  panRef.current = panning
  const connectingRef = useRef(connecting)
  connectingRef.current = connecting
  const nodesRef = useRef(graph.nodes)
  nodesRef.current = graph.nodes
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const panStateRef = useRef(pan)
  panStateRef.current = pan
  const snapRef = useRef(snapEnabled)
  snapRef.current = snapEnabled

  // ─── Zoom ──────────────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  }, [])

  const handleFitView = useCallback(() => {
    if (graph.nodes.length === 0) {
      setPan({ x: 0, y: 0 })
      setZoom(1)
      return
    }
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of graph.nodes) {
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + NODE_W)
      maxY = Math.max(maxY, n.y + NODE_H)
    }

    const contentW = maxX - minX + 80
    const contentH = maxY - minY + 80
    const scaleX = rect.width / contentW
    const scaleY = rect.height / contentH
    const newZoom = Math.min(Math.max(MIN_ZOOM, Math.min(scaleX, scaleY)), 1.5)

    setPan({
      x: (rect.width - contentW * newZoom) / 2 - minX * newZoom + 40 * newZoom,
      y: (rect.height - contentH * newZoom) / 2 - minY * newZoom + 40 * newZoom
    })
    setZoom(newZoom)
  }, [graph.nodes])

  // Scroll-wheel zoom (centered on cursor)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const oldZoom = zoomRef.current
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + delta))

      // Adjust pan so zoom is centered on cursor
      const scale = newZoom / oldZoom
      const p = panStateRef.current
      setPan({
        x: mouseX - (mouseX - p.x) * scale,
        y: mouseY - (mouseY - p.y) * scale
      })
      setZoom(newZoom)
    }

    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [])

  // ─── Drag handlers ─────────────────────────────────────

  const handleNodeDragStart = useCallback((id: string, e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    const node = nodesRef.current.find((n) => n.id === id)
    if (!node) return
    setDraggingNode({
      id,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y
    })
  }, [locked])

  const handlePortDragStart = useCallback(
    (_nodeId: string, pos: { x: number; y: number }, e: React.MouseEvent) => {
      if (locked) return
      e.stopPropagation()
      setConnecting({ sourceId: _nodeId, from: pos, to: pos })
    },
    [locked]
  )

  const handleCanvasPanStart = useCallback(
    (e: React.MouseEvent) => {
      // Only pan if clicking the background (svg or grid rect)
      const target = e.target as Element
      if (target !== svgRef.current && target.getAttribute('data-grid') !== 'true') return
      setPanning({
        startX: e.clientX,
        startY: e.clientY,
        panStartX: pan.x,
        panStartY: pan.y
      })
    },
    [pan]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragNodeRef.current
      if (drag) {
        const z = zoomRef.current
        let newX = drag.nodeStartX + (e.clientX - drag.startX) / z
        let newY = drag.nodeStartY + (e.clientY - drag.startY) / z
        if (snapRef.current) {
          newX = snapToGrid(newX)
          newY = snapToGrid(newY)
        }
        const node = nodesRef.current.find((n) => n.id === drag.id)
        if (node) {
          node.x = newX
          node.y = newY
        }
        setDraggingNode((prev) => (prev ? { ...prev } : null))
        return
      }

      const p = panRef.current
      if (p) {
        setPan({
          x: p.panStartX + (e.clientX - p.startX),
          y: p.panStartY + (e.clientY - p.startY)
        })
        return
      }

      const conn = connectingRef.current
      if (conn) {
        const svg = svgRef.current
        if (!svg) return
        const rect = svg.getBoundingClientRect()
        const z = zoomRef.current
        const p2 = panStateRef.current
        setConnecting({
          ...conn,
          to: {
            x: (e.clientX - rect.left - p2.x) / z,
            y: (e.clientY - rect.top - p2.y) / z
          }
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const drag = dragNodeRef.current
      if (drag) {
        const z = zoomRef.current
        let newX = drag.nodeStartX + (e.clientX - drag.startX) / z
        let newY = drag.nodeStartY + (e.clientY - drag.startY) / z
        if (snapRef.current) {
          newX = snapToGrid(newX)
          newY = snapToGrid(newY)
        }
        const updatedNodes = nodesRef.current.map((n) =>
          n.id === drag.id ? { ...n, x: newX, y: newY } : n
        )
        onChange({ ...graph, nodes: updatedNodes })
        setDraggingNode(null)
        return
      }

      if (panRef.current) {
        setPanning(null)
        onChange({ ...graph, viewportX: panStateRef.current.x, viewportY: panStateRef.current.y })
        return
      }

      const conn = connectingRef.current
      if (conn) {
        const svg = svgRef.current
        if (svg) {
          const rect = svg.getBoundingClientRect()
          const z = zoomRef.current
          const p2 = panStateRef.current
          const mx = (e.clientX - rect.left - p2.x) / z
          const my = (e.clientY - rect.top - p2.y) / z
          const target = nodesRef.current.find(
            (n) =>
              n.id !== conn.sourceId &&
              mx >= n.x &&
              mx <= n.x + NODE_W &&
              my >= n.y &&
              my <= n.y + NODE_H
          )
          if (target) {
            const exists = graph.edges.some(
              (ed) =>
                (ed.sourceId === conn.sourceId && ed.targetId === target.id) ||
                (ed.sourceId === target.id && ed.targetId === conn.sourceId)
            )
            if (!exists) {
              const newEdge: GraphEdge = {
                id: crypto.randomUUID(),
                sourceId: conn.sourceId,
                targetId: target.id,
                label: ''
              }
              onChange({ ...graph, edges: [...graph.edges, newEdge] })
            }
          }
        }
        setConnecting(null)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [graph, onChange])

  // ─── Edge handlers ─────────────────────────────────────

  const handleDeleteEdge = useCallback(
    (id: string) => {
      onChange({ ...graph, edges: graph.edges.filter((e) => e.id !== id) })
    },
    [graph, onChange]
  )

  const handleEdgeLabelChange = useCallback(
    (id: string, label: string) => {
      onChange({
        ...graph,
        edges: graph.edges.map((e) => (e.id === id ? { ...e, label } : e))
      })
    },
    [graph, onChange]
  )

  const handleDescriptionChange = useCallback(
    (id: string, description: string) => {
      onChange({
        ...graph,
        nodes: graph.nodes.map((n) => (n.id === id ? { ...n, description } : n))
      })
    },
    [graph, onChange]
  )

  // Fit on first render if nodes exist
  useEffect(() => {
    if (graph.nodes.length > 0 && graph.viewportX === 0 && graph.viewportY === 0) {
      handleFitView()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className="relative" style={{ height }}>
      <GraphToolbar
        zoom={zoom}
        snapEnabled={snapEnabled}
        locked={locked}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onToggleSnap={() => setSnapEnabled((s) => !s)}
        onToggleLock={() => setLocked((l) => !l)}
      />
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="border border-border-default rounded-xl bg-bg-secondary select-none overflow-hidden"
        style={{ cursor: panning ? 'grabbing' : locked ? 'default' : 'grab' }}
        onMouseDown={handleCanvasPanStart}
      >
        <GridBackground zoom={zoom} />
        {/* Grid fill */}
        <rect
          width="100%"
          height="100%"
          fill="url(#grid-dots)"
          data-grid="true"
        />
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges behind nodes */}
          {graph.edges.map((edge) => (
            <EdgePath
              key={edge.id}
              edge={edge}
              nodes={graph.nodes}
              onDelete={handleDeleteEdge}
              onLabelChange={handleEdgeLabelChange}
            />
          ))}
          {/* Connection preview */}
          {connecting && <ConnectionPreview from={connecting.from} to={connecting.to} />}
          {/* Nodes */}
          {graph.nodes.map((node, i) => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              index={i}
              isDragging={draggingNode?.id === node.id}
              isHovered={hoveredNodeId === node.id}
              onDragStart={handleNodeDragStart}
              onPortDragStart={handlePortDragStart}
              onHover={setHoveredNodeId}
              onDescriptionChange={handleDescriptionChange}
            />
          ))}
        </g>
      </svg>
      {/* Status hint */}
      {graph.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-fg-tertiary">Add repositories to see them here</p>
        </div>
      )}
    </div>
  )
}
