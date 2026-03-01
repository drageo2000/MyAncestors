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

const nodeTypes = { personNode: PersonNode };

type PersonSummary = { id: string; firstName: string; lastName: string };

type ModalConfig = {
  relatedPersonId?: string;
  relatedPersonName?: string;
  relationshipType?: "parent" | "child" | "spouse";
};

export default function FamilyTreeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [treeId, setTreeId] = useState<string | null>(null);
  const [rootPersonId, setRootPersonId] = useState<string | null>(null);
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
        setNodes(enhanced);
        setEdges(json.data.edges as Edge[]);
      } catch {
        setError("Failed to load family tree.");
      }
    },
    [openModal, setNodes, setEdges]
  );

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const treesRes = await fetch("/api/trees");
        const treesJson = await treesRes.json();
        if (!treesJson.data?.length) {
          setError("No family tree found. Create one to get started.");
          return;
        }
        const tid: string = treesJson.data[0].id;
        setTreeId(tid);

        const personsRes = await fetch(`/api/persons?treeId=${tid}`);
        const personsJson = await personsRes.json();
        const allPersons: PersonSummary[] = personsJson.data ?? [];
        setPersons(allPersons);

        if (!allPersons.length) {
          setError("No persons in tree yet. Add someone to get started.");
          return;
        }

        const rootId = allPersons[0].id;
        setRootPersonId(rootId);
        await loadGraph(rootId);
      } catch {
        setError("Failed to load family tree.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadGraph]);

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
