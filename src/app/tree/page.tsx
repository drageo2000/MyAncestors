import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import TreePageClient from "@/components/tree/TreePageClient";

export default async function TreePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const trees = await db.tree.findMany({
    where: { ownerId: userId },
    include: {
      persons: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (trees.length === 0) {
    redirect("/onboarding");
  }

  const treesWithRoot = trees.map((t) => ({
    id: t.id,
    name: t.name,
    rootPersonId: t.persons[0]?.id ?? null,
  }));

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <TreePageClient trees={treesWithRoot} />
      </div>
    </div>
  );
}
