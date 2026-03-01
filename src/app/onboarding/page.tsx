import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // If the user already has a tree, skip onboarding
  const existing = await db.tree.findFirst({ where: { ownerId: userId } });
  if (existing) redirect("/tree");

  return <OnboardingForm />;
}
