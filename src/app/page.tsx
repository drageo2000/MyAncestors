import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 text-7xl">🌳</span>
      <h1 className="font-serif text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl">
        MyAncestors
      </h1>
      <p className="mt-4 max-w-xl text-lg text-stone-500">
        Map your family tree, upload old photos, record stories, and discover
        your heritage — all in one place.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <SignedOut>
          <Link
            href="/sign-up"
            className="rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
          >
            Start your tree
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-stone-300 px-8 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Sign in
          </Link>
        </SignedOut>

        <SignedIn>
          <Link
            href="/tree"
            className="rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
          >
            View my tree
          </Link>
        </SignedIn>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl text-left">
        {[
          { icon: "🌿", title: "Family Tree", desc: "Visually map ancestors and descendants with an interactive tree canvas." },
          { icon: "📸", title: "Photos & Stories", desc: "Upload old photos and record stories for every person in your tree." },
          { icon: "📂", title: "GEDCOM Import", desc: "Import data from Ancestry, FamilySearch, or MyHeritage in seconds." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-white border border-stone-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-stone-900 mb-1">{f.title}</h3>
            <p className="text-sm text-stone-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
