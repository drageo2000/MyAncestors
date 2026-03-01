"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type PersonNodeData = {
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  profilePhotoUrl?: string;
  isRoot?: boolean;
  onAddParent?: () => void;
  onAddChild?: () => void;
  onAddSpouse?: () => void;
};

export default function PersonNode({ id, data }: NodeProps) {
  const {
    firstName,
    lastName,
    birthDate,
    deathDate,
    profilePhotoUrl,
    isRoot,
    onAddParent,
    onAddChild,
    onAddSpouse,
  } = data as PersonNodeData;

  const [hovered, setHovered] = useState(false);
  const hasActions = onAddParent || onAddChild || onAddSpouse;

  const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;
  const deathYear = deathDate ? new Date(deathDate).getFullYear() : null;
  const years = birthYear
    ? deathYear
      ? `${birthYear} – ${deathYear}`
      : `b. ${birthYear}`
    : null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} />
      <Link href={`/person/${id}`}>
        <div
          className={`flex flex-col items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm w-36 cursor-pointer hover:shadow-md transition-shadow ${
            isRoot ? "border-amber-400 ring-2 ring-amber-200" : "border-stone-200"
          }`}
        >
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              alt={`${firstName} ${lastName}`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-2xl">
              👤
            </div>
          )}
          <div className="text-center">
            <p className="text-xs font-semibold text-stone-900 leading-tight">
              {firstName} {lastName}
            </p>
            {years && (
              <p className="text-[10px] text-stone-400 mt-0.5">{years}</p>
            )}
          </div>
        </div>
      </Link>
      <Handle type="source" position={Position.Bottom} />

      {hasActions && hovered && (
        /* Transparent bridge covers the gap so onMouseLeave doesn't fire mid-move */
        <div className="absolute top-full left-0 w-full pt-2 z-20 nodrag nopan flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {onAddParent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddParent();
              }}
              className="rounded border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 hover:text-stone-900 transition-colors"
            >
              + Parent
            </button>
          )}
          {onAddChild && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              className="rounded border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 hover:text-stone-900 transition-colors"
            >
              + Child
            </button>
          )}
          {onAddSpouse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddSpouse();
              }}
              className="rounded border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 shadow-sm hover:bg-stone-50 hover:text-stone-900 transition-colors"
            >
              + Spouse
            </button>
          )}
        </div>
      )}
    </div>
  );
}
