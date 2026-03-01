"use client";

import { useState, useEffect } from "react";

type PersonSummary = { id: string; firstName: string; lastName: string };
type RelationshipType = "parent" | "child" | "spouse";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  treeId: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  defaultRelationType?: RelationshipType;
  persons?: PersonSummary[];
};

export default function AddPersonModal({
  isOpen,
  onClose,
  onSuccess,
  treeId,
  relatedPersonId,
  relatedPersonName,
  defaultRelationType,
  persons = [],
}: Props) {
  // "new" = create a new person | "existing" = link someone already in the tree
  const [mode, setMode] = useState<"new" | "existing">("new");

  // New-person fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("UNKNOWN");

  // Link-existing field
  const [linkPersonId, setLinkPersonId] = useState("");

  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    defaultRelationType ?? "child"
  );
  const [selectedRelatedPersonId, setSelectedRelatedPersonId] = useState(
    relatedPersonId ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingOtherParent, setExistingOtherParent] = useState<PersonSummary | null>(null);
  const [linkAsSpouse, setLinkAsSpouse] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode("new");
      setFirstName("");
      setLastName("");
      setBirthDate("");
      setBirthPlace("");
      setGender("UNKNOWN");
      setLinkPersonId("");
      setRelationshipType(defaultRelationType ?? "child");
      setSelectedRelatedPersonId(relatedPersonId ?? "");
      setError(null);
      setLinkAsSpouse(false);
      setExistingOtherParent(null);
    }
  }, [isOpen, defaultRelationType, relatedPersonId]);

  // When adding a parent, check if the child already has one parent — offer to link as spouses
  useEffect(() => {
    if (!isOpen || relationshipType !== "parent" || !relatedPersonId) {
      setExistingOtherParent(null);
      setLinkAsSpouse(false);
      return;
    }
    fetch(`/api/persons/${relatedPersonId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const parents = (json.data.relationshipsAsB as { type: string; personA: PersonSummary }[])
            .filter((r) => r.type === "PARENT_OF")
            .map((r) => r.personA);
          setExistingOtherParent(parents.length === 1 ? parents[0] : null);
        }
      })
      .catch(() => {});
  }, [isOpen, relationshipType, relatedPersonId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Persons available to link (exclude the anchor person)
  const linkablePeople = persons.filter((p) => p.id !== (relatedPersonId ?? selectedRelatedPersonId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const anchorId = relatedPersonId ?? selectedRelatedPersonId;

    if (!anchorId) {
      setError("Please select a related person.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let targetPersonId: string;

      if (mode === "existing") {
        // ── Link existing person ──────────────────────────────────────────
        if (!linkPersonId) {
          setError("Please select a person to link.");
          setLoading(false);
          return;
        }
        targetPersonId = linkPersonId;
      } else {
        // ── Create new person ────────────────────────────────────────────
        if (!firstName.trim() || !lastName.trim()) {
          setError("First name and last name are required.");
          setLoading(false);
          return;
        }
        const personRes = await fetch("/api/persons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treeId,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate: birthDate || undefined,
            birthPlace: birthPlace.trim() || undefined,
            gender,
          }),
        });
        const personJson = await personRes.json();
        if (personJson.error) { setError(personJson.error); return; }
        targetPersonId = personJson.data.id;
      }

      // Determine relationship direction
      let personAId: string;
      let personBId: string;
      let relType: "PARENT_OF" | "SPOUSE_OF";

      if (relationshipType === "parent") {
        personAId = targetPersonId;
        personBId = anchorId;
        relType = "PARENT_OF";
      } else if (relationshipType === "child") {
        personAId = anchorId;
        personBId = targetPersonId;
        relType = "PARENT_OF";
      } else {
        personAId = anchorId;
        personBId = targetPersonId;
        relType = "SPOUSE_OF";
      }

      const relRes = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personAId, personBId, type: relType }),
      });
      const relJson = await relRes.json();
      if (relJson.error) { setError(relJson.error); return; }

      // Optionally link new parent as spouse of the existing parent (new-person mode only)
      if (mode === "new" && linkAsSpouse && existingOtherParent) {
        await fetch("/api/relationships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personAId: existingOtherParent.id,
            personBId: targetPersonId,
            type: "SPOUSE_OF",
          }),
        });
      }

      onSuccess();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-lg font-semibold text-stone-800">Add Person</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-stone-200 overflow-hidden text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 py-1.5 transition-colors ${
                mode === "new"
                  ? "bg-stone-800 text-white"
                  : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              Create new
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 py-1.5 transition-colors ${
                mode === "existing"
                  ? "bg-stone-800 text-white"
                  : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              Link existing
            </button>
          </div>

          {/* Relationship type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Relationship
            </label>
            <div className="flex gap-2">
              {(["parent", "child", "spouse"] as RelationshipType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRelationshipType(type)}
                  className={`flex-1 rounded-lg border py-1.5 text-sm font-medium capitalize transition-colors ${
                    relationshipType === type
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {type === "parent" ? "Parent" : type === "child" ? "Child" : "Spouse"}
                </button>
              ))}
            </div>
          </div>

          {/* Related to */}
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Related to
            </label>
            {relatedPersonId ? (
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                {relatedPersonName}
              </div>
            ) : (
              <select
                value={selectedRelatedPersonId}
                onChange={(e) => setSelectedRelatedPersonId(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">Select a person...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── Link existing mode ── */}
          {mode === "existing" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Person in this tree
              </label>
              <select
                value={linkPersonId}
                onChange={(e) => setLinkPersonId(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">Select a person...</option>
                {linkablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── New person fields ── */}
          {mode === "new" && (
            <>
              {/* Spouse link hint — shown when adding a 2nd parent */}
              {relationshipType === "parent" && existingOtherParent && (
                <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={linkAsSpouse}
                    onChange={(e) => setLinkAsSpouse(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 accent-amber-500"
                  />
                  Also link as spouse of{" "}
                  <span className="font-medium">
                    {existingOtherParent.firstName} {existingOtherParent.lastName}
                  </span>
                </label>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Birth Date & Place */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    Birth Place
                  </label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="City, Country"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-stone-200 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
            >
              {loading ? "Saving..." : mode === "existing" ? "Link Person" : "Add Person"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
