import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, unauthorized } from "@/lib/api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const trees = await db.tree.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { persons: true } } },
    orderBy: { createdAt: "asc" },
  });

  return ok(trees);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await req.json();
  const { name, rootFirstName, rootLastName } = body;

  if (!name) return err("name is required");

  // Ensure the user exists in our DB
  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, email: body.email ?? "", name: body.name },
    update: {},
  });

  // Create tree and root person in a transaction
  const tree = await db.$transaction(async (tx) => {
    const newTree = await tx.tree.create({
      data: { name, ownerId: userId },
    });

    if (rootFirstName && rootLastName) {
      await tx.person.create({
        data: {
          treeId: newTree.id,
          firstName: rootFirstName,
          lastName: rootLastName,
        },
      });
    }

    return newTree;
  });

  return ok(tree);
}
