import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, unauthorized } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const personId = req.nextUrl.searchParams.get("personId");
  const treeId = req.nextUrl.searchParams.get("treeId");

  if (!personId && !treeId) {
    return err("personId or treeId query param is required");
  }

  const photos = await db.photo.findMany({
    where: {
      tree: { ownerId: userId },
      ...(personId ? { photoPersons: { some: { personId } } } : {}),
      ...(treeId ? { treeId } : {}),
    },
    include: { photoPersons: { select: { personId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(photos);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { url, caption, personIds, treeId } = body;

  if (!url || !treeId || !Array.isArray(personIds) || personIds.length === 0) {
    return err("url, treeId, and personIds are required");
  }

  const tree = await db.tree.findFirst({ where: { id: treeId, ownerId: userId } });
  if (!tree) return err("Tree not found or access denied", 403);

  const photo = await db.photo.create({
    data: {
      treeId,
      url,
      caption: caption || null,
      uploadedById: userId,
      photoPersons: {
        create: (personIds as string[]).map((personId) => ({ personId })),
      },
    },
    include: { photoPersons: { select: { personId: true } } },
  });

  return ok(photo);
}
