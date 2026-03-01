"use client";

import { useState } from "react";
import FamilyTreeCanvas from "./FamilyTreeCanvas";

interface TreeWithRoot {
  id: string;
  name: string;
  rootPersonId: string | null;
}

interface Props {
  trees: TreeWithRoot[];
}

export default function TreePageClient({ trees }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = trees[selectedIdx];

  return (
    <div className="flex h-full flex-col">
      {trees.length > 1 && (
        <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-2 shrink-0">
          <span className="text-sm font-medium text-stone-600">Family Tree:</span>
          <select
            className="rounded-md border border-stone-300 bg-white px-3 py-1 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
          >
            {trees.map((t, i) => (
              <option key={t.id} value={i}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <FamilyTreeCanvas
          rootPersonId={selected?.rootPersonId ?? null}
          treeId={selected?.id ?? null}
        />
      </div>
    </div>
  );
}
