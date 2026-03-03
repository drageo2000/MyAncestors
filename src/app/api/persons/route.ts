import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, unauthorized } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const treeId = searchParams.get("treeId");

  if (!treeId) return err("treeId is required");

  const tree = await db.tree.findFirst({ where: { id: treeId, ownerId: userId } });
  if (!tree) return err("Tree not found or access denied", 403);

  const persons = await db.person.findMany({
    where: { treeId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { createdAt: "asc" },
  });

  return ok(persons);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { treeId, firstName, lastName, birthDate, deathDate, birthPlace, gender, bio, deceased } = body;

  if (!treeId || !firstName || !lastName) {
    return err("treeId, firstName, and lastName are required");
  }

  // Verify tree ownership
  const tree = await db.tree.findFirst({ where: { id: treeId, ownerId: userId } });
  if (!tree) return err("Tree not found or access denied", 403);

  const person = await db.person.create({
    data: {
      treeId,
      firstName,
      lastName,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      deathDate: deathDate ? new Date(deathDate) : undefined,
      birthPlace,
      gender,
      bio,
      deceased: deceased ?? false,
    },
  });

  return ok(person);
}
