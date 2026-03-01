import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import FamilyTreeCanvas from "@/components/tree/FamilyTreeCanvas";

export default async function TreePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <FamilyTreeCanvas />
      </div>
    </div>
  );
}
