import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import PersonProfile from "@/components/person/PersonProfile";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const person = await db.person.findFirst({
    where: { id, deletedAt: null, tree: { ownerId: userId } },
    include: {
      relationshipsAsA: { include: { personB: true } },
      relationshipsAsB: { include: { personA: true } },
      photoPersons: { include: { photo: true } },
      storyPersons: { include: { story: true } },
    },
  });

  if (!person) notFound();

  return (
    <div className="min-h-screen">
      <Navbar />
      <PersonProfile person={person} />
    </div>
  );
}
