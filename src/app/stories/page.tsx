import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default async function StoriesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const stories = await db.story.findMany({
    where: { tree: { ownerId: userId } },
    include: {
      storyPersons: { include: { person: true } },
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-serif text-3xl font-bold text-stone-900">Stories</h1>
          <button className="rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700">
            + New Story
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-400">
            <p className="text-4xl mb-3">📖</p>
            <p className="font-medium">No stories yet</p>
            <p className="text-sm mt-1">Record a story about someone in your tree.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {stories.map((story) => (
              <li key={story.id} className="rounded-2xl bg-white border border-stone-200 p-6 shadow-sm">
                <h2 className="font-semibold text-stone-900 text-lg mb-1">{story.title}</h2>
                <p className="text-sm text-stone-500 line-clamp-2">{story.content}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {story.storyPersons.map(({ person }) => (
                    <Link
                      key={person.id}
                      href={`/person/${person.id}`}
                      className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full hover:bg-stone-200"
                    >
                      {person.firstName} {person.lastName}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
