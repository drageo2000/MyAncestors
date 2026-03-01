"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import PersonNode from "./PersonNode";

const nodeTypes = { personNode: PersonNode };

export default function FamilyTreeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: replace with actual root person ID from user's tree
  const rootPersonId = "placeholder";

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tree/${rootPersonId}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      setNodes(json.data.nodes);
      setEdges(json.data.edges);
    } catch {
      setError("Failed to load family tree.");
    } finally {
      setLoading(false);
    }
  }, [rootPersonId, setNodes, setEdges]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-stone-400">
        <span className="animate-pulse text-4xl">🌳</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      className="bg-stone-50"
    >
      <Background color="#d6d3d1" gap={20} />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
