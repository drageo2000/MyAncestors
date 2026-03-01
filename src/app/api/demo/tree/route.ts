import { db } from "@/lib/db";
import { ok, notFound } from "@/lib/api";

const DEMO_TREE_ID = "seed_tree_001";
const DEMO_ROOT_PERSON_ID = "seed_person_root";

// Public endpoint — no auth required
export async function GET() {
  const tree = await db.tree.findUnique({ where: { id: DEMO_TREE_ID } });
  if (!tree) return notFound("Demo tree");

  const persons = await db.person.findMany({
    where: { treeId: DEMO_TREE_ID, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, birthDate: true, deathDate: true, profilePhotoUrl: true },
  });

  const relationships = await db.relationship.findMany({
    where: { personA: { treeId: DEMO_TREE_ID } },
  });

  const nodes = persons.map((p) => ({
    id: p.id,
    type: "personNode",
    position: { x: 0, y: 0 },
    data: {
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
      profilePhotoUrl: p.profilePhotoUrl,
      isRoot: p.id === DEMO_ROOT_PERSON_ID,
    },
  }));

  const edges = relationships.map((r) => ({
    id: r.id,
    source: r.personAId,
    target: r.personBId,
    data: { relType: r.type },
  }));

  return ok({ nodes, edges });
}
