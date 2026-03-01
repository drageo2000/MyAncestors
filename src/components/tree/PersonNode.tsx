"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import Image from "next/image";

type PersonNodeData = {
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  profilePhotoUrl?: string;
  isRoot?: boolean;
};

export default function PersonNode({ id, data }: NodeProps) {
  const { firstName, lastName, birthDate, deathDate, profilePhotoUrl, isRoot } =
    data as PersonNodeData;

  const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;
  const deathYear = deathDate ? new Date(deathDate).getFullYear() : null;
  const years = birthYear
    ? deathYear
      ? `${birthYear} – ${deathYear}`
      : `b. ${birthYear}`
    : null;

  return (
    <>
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
    </>
  );
}
