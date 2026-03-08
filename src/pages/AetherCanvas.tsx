import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAether } from '../hooks/useAether';
import { Maximize } from 'lucide-react';

export default function AetherCanvas() {
  const { notes } = useAether();
  
  // Transform notes into initial nodes spread randomly or grid-like
  const initialNodes: Node[] = notes.map((note, index) => ({
    id: note.id,
    position: { x: (index % 3) * 250 + 100, y: Math.floor(index / 3) * 150 + 100 },
    data: { label: note.title },
    style: {
      background: '#1e293b',
      color: '#f8fafc',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '14px',
      fontWeight: '500',
      minWidth: '150px',
      textAlign: 'center',
    }
  }));

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [],
  );

  return (
    <div className="h-full flex flex-col bg-navy-900 overflow-hidden" data-color-mode="dark">
      {/* Top Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-navy-700/50 bg-navy-950/80 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-sm flex items-center gap-2">
            <Maximize size={18} className="text-lti-coral" />
            Canvas Espacial
          </h1>
          <span className="text-xs text-slate-500">Mueve libremente tus notas cerebrales</span>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          colorMode="dark"
        >
          <Background color="#334155" gap={24} size={2} />
          <Controls className="bg-navy-800 border-navy-700 fill-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
