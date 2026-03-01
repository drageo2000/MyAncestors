import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 120;

type RelEdgeData = { relType?: string };

/** Generates synthetic PARENT_OF edges from a spouse to their partner's children.
 *  These are added to the visual graph so Emma appears below both John AND Jane,
 *  mirroring how John appears below both Mary AND Robert. */
export function buildSyntheticEdges(edges: Edge[]): Edge[] {
  const spouseEdges = edges.filter((e) => (e.data as RelEdgeData)?.relType === "SPOUSE_OF");
  const parentEdges = edges.filter((e) => (e.data as RelEdgeData)?.relType === "PARENT_OF");

  const synthetic: Edge[] = [];
  spouseEdges.forEach((se) => {
    parentEdges
      .filter((pe) => pe.source === se.source)
      .forEach((pe) => {
        synthetic.push({
          id: `syn-${se.target}-${pe.target}`,
          source: se.target,
          target: pe.target,
          data: { relType: "PARENT_OF" },
        });
      });
  });
  return synthetic;
}

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 60 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Only PARENT_OF edges (real + synthetic) drive the hierarchy
  edges.forEach((edge) => {
    if ((edge.data as RelEdgeData)?.relType === "PARENT_OF") {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  // Mutable position map
  const pos = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    const n = g.node(node.id);
    pos.set(node.id, { x: n?.x ?? 0, y: n?.y ?? 0 });
  });

  // Post-process: force spouse to same y-level and place to the right, then center
  // children under the midpoint of each couple. Process top-to-bottom so that when
  // a child couple is processed, the parent's position is already finalised.
  const spouseEdges = edges.filter((e) => (e.data as RelEdgeData)?.relType === "SPOUSE_OF");
  const sortedSpouseEdges = [...spouseEdges].sort(
    (a, b) => (pos.get(a.source)?.y ?? 0) - (pos.get(b.source)?.y ?? 0)
  );

  for (const e of sortedSpouseEdges) {
    const partnerPos = pos.get(e.source);
    const spousePos = pos.get(e.target);
    if (!partnerPos || !spousePos) continue;

    // Snap spouse to same row, fixed distance to the right
    spousePos.y = partnerPos.y;
    spousePos.x = partnerPos.x + NODE_WIDTH + 60;
    pos.set(e.target, spousePos);

    // Center children under the midpoint of this couple
    const midX = (partnerPos.x + spousePos.x) / 2;
    const childEdges = edges.filter(
      (ce) =>
        ce.source === e.source &&
        (ce.data as RelEdgeData)?.relType === "PARENT_OF"
    );
    if (childEdges.length === 1) {
      const cp = pos.get(childEdges[0].target);
      if (cp) cp.x = midX;
    } else if (childEdges.length > 1) {
      const spread = (childEdges.length - 1) * (NODE_WIDTH + 60);
      childEdges.forEach((ce, i) => {
        const cp = pos.get(ce.target);
        if (cp) cp.x = midX - spread / 2 + i * (NODE_WIDTH + 60);
      });
    }
  }

  // Second pass: center children who have 2 parents but NO SPOUSE_OF edge between them.
  // (The SPOUSE_OF loop above already handled coupled parents; this covers unlinked pairs.)
  const explicitSpousePairs = new Set(
    spouseEdges.flatMap((e) => [`${e.source}|${e.target}`, `${e.target}|${e.source}`])
  );
  const realParentEdges = edges.filter(
    (e) => (e.data as RelEdgeData)?.relType === "PARENT_OF" && !e.id.startsWith("syn-")
  );
  const childToParents = new Map<string, string[]>();
  realParentEdges.forEach((e) => {
    const list = childToParents.get(e.target) ?? [];
    if (!list.includes(e.source)) list.push(e.source);
    childToParents.set(e.target, list);
  });
  childToParents.forEach((parents, childId) => {
    if (parents.length !== 2) return;
    const [a, b] = parents;
    if (explicitSpousePairs.has(`${a}|${b}`)) return; // already handled above
    const aPos = pos.get(a);
    const bPos = pos.get(b);
    const childPos = pos.get(childId);
    if (!aPos || !bPos || !childPos) return;
    childPos.x = (aPos.x + bPos.x) / 2;
  });

  return nodes.map((node) => {
    const p = pos.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      position: { x: p.x - NODE_WIDTH / 2, y: p.y - NODE_HEIGHT / 2 },
    };
  });
}

export function styleEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => {
    const relType = (edge.data as RelEdgeData)?.relType;
    if (relType === "SPOUSE_OF") {
      return {
        ...edge,
        sourceHandle: "right",
        targetHandle: "left",
        style: { strokeDasharray: "4 4", stroke: "#ef4444", strokeWidth: 2 },
      };
    }
    return {
      ...edge,
      sourceHandle: "bottom",
      targetHandle: "top",
      style: { stroke: "#78716c", strokeWidth: 2 },
    };
  });
}
