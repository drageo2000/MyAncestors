import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, unauthorized } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { personAId, personBId, type } = await req.json();

  if (!personAId || !personBId || !type) {
    return err("personAId, personBId, and type are required");
  }
  if (!["PARENT_OF", "SPOUSE_OF"].includes(type)) {
    return err("type must be PARENT_OF or SPOUSE_OF");
  }

  // Verify both persons belong to a tree the user owns
  const [personA, personB] = await Promise.all([
    db.person.findFirst({ where: { id: personAId, tree: { ownerId: userId } } }),
    db.person.findFirst({ where: { id: personBId, tree: { ownerId: userId } } }),
  ]);

  if (!personA || !personB) return err("One or both persons not found", 404);
  if (personA.treeId !== personB.treeId) return err("Persons must belong to the same tree");

  const relationship = await db.relationship.create({
    data: { personAId, personBId, type },
  });

  return ok(relationship);
}
