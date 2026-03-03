import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, unauthorized } from "@/lib/api";

// Returns the full family graph as { nodes, edges } for react-flow
export async function GET(_req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { personId } = await params;

  const rootPerson = await db.person.findFirst({
    where: { id: personId, deletedAt: null, tree: { ownerId: userId } },
  });
  if (!rootPerson) return notFound("Person");

  // Fetch all persons in the tree (not deleted)
  const persons = await db.person.findMany({
    where: { treeId: rootPerson.treeId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, birthDate: true, deathDate: true, profilePhotoUrl: true, deceased: true },
  });

  // Fetch all relationships in the tree
  const relationships = await db.relationship.findMany({
    where: {
      personA: { treeId: rootPerson.treeId, deletedAt: null },
    },
  });

  const nodes = persons.map((p: typeof persons[number]) => ({
    id: p.id,
    type: "personNode",
    position: { x: 0, y: 0 }, // layout handled client-side by react-flow
    data: {
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
      profilePhotoUrl: p.profilePhotoUrl,
      deceased: p.deceased,
      isRoot: p.id === personId,
    },
  }));

  const edges = relationships.map((r: typeof relationships[number]) => ({
    id: r.id,
    source: r.personAId,
    target: r.personBId,
    data: { relType: r.type },
  }));

  return ok({ nodes, edges });
}
