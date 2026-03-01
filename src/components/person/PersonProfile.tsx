"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhotoUpload from "./PhotoUpload";

// Type mirrors what the page query returns
interface RelatedPerson {
  id: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
}

interface PersonWithRelations {
  id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  deathDate: Date | null;
  birthPlace: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  gender: string;
  relationshipsAsA: { type: string; personB: RelatedPerson }[];
  relationshipsAsB: { type: string; personA: RelatedPerson }[];
  photoPersons: { photo: { id: string; url: string; caption: string | null } }[];
  storyPersons: { story: { id: string; title: string; content: string } }[];
}

interface Props {
  person: PersonWithRelations;
}

function fmt(date: Date | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function PersonProfile({ person }: Props) {
  const router = useRouter();

  const parents = person.relationshipsAsB
    .filter((r) => r.type === "PARENT_OF")
    .map((r) => r.personA);

  const children = person.relationshipsAsA
    .filter((r) => r.type === "PARENT_OF")
    .map((r) => r.personB);

  const spouses = [
    ...person.relationshipsAsA.filter((r) => r.type === "SPOUSE_OF").map((r) => r.personB),
    ...person.relationshipsAsB.filter((r) => r.type === "SPOUSE_OF").map((r) => r.personA),
  ];

  async function setProfilePhoto(url: string) {
    await fetch(`/api/persons/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePhotoUrl: url }),
    });
    router.refresh();
  }

  async function deletePhoto(photoId: string) {
    await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        {person.profilePhotoUrl ? (
          <Image
            src={person.profilePhotoUrl}
            alt={`${person.firstName} ${person.lastName}`}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 rounded-full object-cover border-2 border-stone-200"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-100 text-4xl border-2 border-stone-200">
            👤
          </div>
        )}
        <div>
          <h1 className="font-serif text-4xl font-bold text-stone-900">
            {person.firstName} {person.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-500">
            {person.birthDate && <span>Born: {fmt(person.birthDate)}</span>}
            {person.deathDate && <span>Died: {fmt(person.deathDate)}</span>}
            {person.birthPlace && <span>From: {person.birthPlace}</span>}
          </div>
        </div>
      </div>

      {/* Bio */}
      {person.bio && (
        <section className="mb-8">
          <h2 className="font-semibold text-stone-700 mb-2">Biography</h2>
          <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{person.bio}</p>
        </section>
      )}

      {/* Family */}
      {(parents.length > 0 || children.length > 0 || spouses.length > 0) && (
        <section className="mb-8">
          <h2 className="font-semibold text-stone-700 mb-3">Family</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Parents", people: parents },
              { label: "Spouses", people: spouses },
              { label: "Children", people: children },
            ].map(({ label, people }) =>
              people.length > 0 ? (
                <div key={label} className="rounded-xl bg-white border border-stone-200 p-4">
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">{label}</p>
                  <ul className="flex flex-col gap-2">
                    {people.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/person/${p.id}`}
                          className="flex items-center gap-2 text-sm text-stone-800 hover:text-stone-500"
                        >
                          <span className="text-base">👤</span>
                          {p.firstName} {p.lastName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* Photos */}
      <section className="mb-8">
        <h2 className="font-semibold text-stone-700 mb-3">Photos</h2>

        {person.photoPersons.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {person.photoPersons.map(({ photo }) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setProfilePhoto(photo.url)}
                    className="rounded bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
                    title="Set as profile photo"
                  >
                    Set profile
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    title="Delete photo"
                  >
                    Delete
                  </button>
                </div>
                {photo.caption && (
                  <p className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-xs text-white truncate">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <PhotoUpload
          personId={person.id}
          treeId={person.treeId}
          onSuccess={() => router.refresh()}
        />
      </section>

      {/* Stories */}
      {person.storyPersons.length > 0 && (
        <section>
          <h2 className="font-semibold text-stone-700 mb-3">Stories</h2>
          <ul className="flex flex-col gap-3">
            {person.storyPersons.map(({ story }) => (
              <li key={story.id} className="rounded-xl bg-white border border-stone-200 p-4">
                <h3 className="font-medium text-stone-900">{story.title}</h3>
                <p className="text-sm text-stone-500 mt-1 line-clamp-2">{story.content}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
