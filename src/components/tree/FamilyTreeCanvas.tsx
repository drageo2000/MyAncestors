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
import AddPersonModal from "./AddPersonModal";
import { applyDagreLayout, styleEdges, buildSyntheticEdges } from "@/lib/treeLayout";

const nodeTypes = { personNode: PersonNode };

type PersonSummary = { id: string; firstName: string; lastName: string };

type ModalConfig = {
  relatedPersonId?: string;
  relatedPersonName?: string;
  relationshipType?: "parent" | "child" | "spouse";
};

interface Props {
  rootPersonId: string | null;
  treeId: string | null;
}

export default function FamilyTreeCanvas({ rootPersonId, treeId }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [persons, setPersons] = useState<PersonSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({});

  const openModal = useCallback(
    (
      relationshipType: "parent" | "child" | "spouse",
      relatedPersonId: string,
      relatedPersonName: string
    ) => {
      setModalConfig({ relationshipType, relatedPersonId, relatedPersonName });
      setModalOpen(true);
    },
    []
  );

  const loadGraph = useCallback(
    async (personId: string) => {
      try {
        const res = await fetch(`/api/tree/${personId}`);
        const json = await res.json();
        if (json.error) {
          setError(json.error);
          return;
        }
        const rawEdges = [
          ...(json.data.edges as Edge[]),
          ...buildSyntheticEdges(json.data.edges as Edge[]),
        ];
        const enhanced = (json.data.nodes as Node[]).map((node) => ({
          ...node,
          data: {
            ...node.data,
            onAddParent: () =>
              openModal(
                "parent",
                node.id,
                `${node.data.firstName as string} ${node.data.lastName as string}`
              ),
            onAddChild: () =>
              openModal(
                "child",
                node.id,
                `${node.data.firstName as string} ${node.data.lastName as string}`
              ),
            onAddSpouse: () =>
              openModal(
                "spouse",
                node.id,
                `${node.data.firstName as string} ${node.data.lastName as string}`
              ),
          },
        }));
        const layoutedNodes = applyDagreLayout(enhanced, rawEdges);
        const styledEdges = styleEdges(rawEdges);
        setNodes(layoutedNodes);
        setEdges(styledEdges);
      } catch {
        setError("Failed to load family tree.");
      }
    },
    [openModal, setNodes, setEdges]
  );

  useEffect(() => {
    async function init() {
      if (!rootPersonId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (treeId) {
          const personsRes = await fetch(`/api/persons?treeId=${treeId}`);
          const personsJson = await personsRes.json();
          setPersons(personsJson.data ?? []);
        }
        await loadGraph(rootPersonId);
      } catch {
        setError("Failed to load family tree.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [rootPersonId, treeId, loadGraph]);

  const handleModalSuccess = useCallback(async () => {
    if (!treeId || !rootPersonId) return;

    const personsRes = await fetch(`/api/persons?treeId=${treeId}`);
    const personsJson = await personsRes.json();
    setPersons(personsJson.data ?? []);

    await loadGraph(rootPersonId);
  }, [treeId, rootPersonId, loadGraph]);

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

  // Empty tree state: tree exists but has no persons yet
  if (!rootPersonId || nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm max-w-sm">
          <div className="mb-4 text-5xl">🌱</div>
          <h2 className="mb-2 text-xl font-semibold text-stone-800">
            Start your family tree
          </h2>
          <p className="mb-6 text-stone-500 text-sm">
            Add yourself to begin mapping your family history.
          </p>
          <a
            href="/onboarding"
            className="inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            Add first family member
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
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

        {/* Floating add button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => {
              setModalConfig({});
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-amber-600"
          >
            + Add Person
          </button>
        </div>
      </ReactFlow>

      {treeId && (
        <AddPersonModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
          treeId={treeId}
          relatedPersonId={modalConfig.relatedPersonId}
          relatedPersonName={modalConfig.relatedPersonName}
          defaultRelationType={modalConfig.relationshipType}
          persons={persons}
        />
      )}
    </>
  );
}
