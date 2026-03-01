import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound } from "@/lib/api";

const DEMO_TREE_ID = "seed_tree_001";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const person = await db.person.findFirst({
    where: { id, treeId: DEMO_TREE_ID, deletedAt: null },
    include: {
      relationshipsAsA: { include: { personB: true } },
      relationshipsAsB: { include: { personA: true } },
      photoPersons: { include: { photo: true } },
      storyPersons: { include: { story: true } },
    },
  });

  if (!person) return notFound("Person");
  return ok(person);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const person = await db.person.findFirst({
    where: { id, treeId: DEMO_TREE_ID, deletedAt: null },
  });
  if (!person) return notFound("Person");

  const updated = await db.person.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      deathDate: body.deathDate !== undefined ? (body.deathDate ? new Date(body.deathDate) : null) : undefined,
      birthPlace: body.birthPlace,
      gender: body.gender,
      bio: body.bio,
      profilePhotoUrl: body.profilePhotoUrl,
    },
  });

  return ok(updated);
}
