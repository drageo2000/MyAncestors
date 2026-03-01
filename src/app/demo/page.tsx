"use client";

import { useEffect, useState } from "react";
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
import PersonNode from "@/components/tree/PersonNode";
import { applyDagreLayout, styleEdges, buildSyntheticEdges } from "@/lib/treeLayout";
import Link from "next/link";

const nodeTypes = { personNode: PersonNode };

export default function DemoPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demo/tree")
      .then((r) => r.json())
      .then((json) => {
        const rawNodes = (json.data.nodes as Node[]).map((n) => ({
          ...n,
          data: { ...n.data, personLinkBase: "/demo/person" },
        }));
        const allEdges = [
          ...(json.data.edges as Edge[]),
          ...buildSyntheticEdges(json.data.edges as Edge[]),
        ];
        setNodes(applyDagreLayout(rawNodes, allEdges));
        setEdges(styleEdges(allEdges));
      })
      .finally(() => setLoading(false));
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-screen flex-col">
      {/* Demo banner */}
      <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <span className="text-lg">👤</span>
          <span>Viewing as <strong>John Test</strong> — Demo Tree (read-only)</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-up" className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-700 transition-colors">
            Create your own tree →
          </Link>
          <Link href="/" className="text-xs text-amber-700 hover:underline">← Back</Link>
        </div>
      </div>

      {/* Navbar-style header */}
      <nav className="border-b border-stone-200 bg-white shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="font-serif text-xl font-semibold text-stone-800">MyAncestors</span>
            <span className="ml-3 rounded-full bg-stone-100 px-3 py-0.5 text-xs text-stone-500">Test User Family Tree</span>
          </div>
        </div>
      </nav>

      {/* Tree canvas */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-stone-400">
            <span className="animate-pulse text-4xl">🌳</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
