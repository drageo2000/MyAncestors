import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, unauthorized } from "@/lib/api";
import { unlink } from "fs/promises";
import path from "path";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { id } = await params;

  const photo = await db.photo.findFirst({
    where: { id, tree: { ownerId: userId } },
  });
  if (!photo) return notFound("Photo");

  await db.photo.delete({ where: { id } });

  // Remove local file if it's a local upload stub
  if (photo.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", photo.url);
    await unlink(filePath).catch(() => null);
  }

  return ok({ id });
}
