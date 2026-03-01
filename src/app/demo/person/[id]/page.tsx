import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import PersonProfile from "@/components/person/PersonProfile";

const DEMO_TREE_ID = "seed_tree_001";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DemoPersonPage({ params }: Props) {
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

  if (!person) return notFound();

  return (
    <div className="min-h-screen">
      {/* Demo banner */}
      <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <span className="text-lg">👤</span>
          <span>Viewing as <strong>John Test</strong> — Demo Tree</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-700 transition-colors"
          >
            Create your own tree →
          </Link>
          <Link href="/demo" className="text-xs text-amber-700 hover:underline">
            ← Back to tree
          </Link>
        </div>
      </div>

      {/* Navbar */}
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="font-serif text-xl font-semibold text-stone-800">MyAncestors</span>
            <span className="ml-3 rounded-full bg-stone-100 px-3 py-0.5 text-xs text-stone-500">
              Test User Family Tree
            </span>
          </div>
        </div>
      </nav>

      <PersonProfile
        person={person}
        linkBase="/demo/person"
        apiBase="/api/demo/persons"
        isDemo
      />
    </div>
  );
}
