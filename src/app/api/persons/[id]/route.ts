import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, unauthorized } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;

  const person = await db.person.findFirst({
    where: { id, deletedAt: null, tree: { ownerId: userId } },
    include: {
      relationshipsAsA: { include: { personB: true } },
      relationshipsAsB: { include: { personA: true } },
    },
  });

  if (!person) return notFound("Person");
  return ok(person);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const person = await db.person.findFirst({
    where: { id, deletedAt: null, tree: { ownerId: userId } },
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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;

  const person = await db.person.findFirst({
    where: { id, deletedAt: null, tree: { ownerId: userId } },
  });
  if (!person) return notFound("Person");

  await db.person.update({ where: { id }, data: { deletedAt: new Date() } });
  return ok({ id });
}
