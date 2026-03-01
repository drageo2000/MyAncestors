"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "onboarding_draft";

type FormData = {
  treeName: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  gender: string;
};

const EMPTY_FORM: FormData = {
  treeName: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  birthPlace: "",
  gender: "",
};

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormData>;
        setForm((prev) => ({ ...prev, ...parsed }));
        if (parsed.treeName) setStep(2);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist draft to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateStep1(): boolean {
    if (!form.treeName.trim()) {
      setErrors({ treeName: "Tree name is required" });
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (validateStep1()) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.treeName.trim(),
          rootFirstName: form.firstName.trim(),
          rootLastName: form.lastName.trim(),
          rootBirthDate: form.birthDate || undefined,
          rootBirthPlace: form.birthPlace.trim() || undefined,
          rootGender: form.gender || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/tree");
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-5xl">🌳</span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-stone-900">
            Welcome to MyAncestors
          </h1>
          <p className="mt-2 text-stone-500">
            Let's set up your family tree in just a moment.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-3">
          {[1, 2].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= n
                    ? "bg-stone-900 text-white"
                    : "border border-stone-300 text-stone-400"
                }`}
              >
                {n}
              </div>
              {n < 2 && (
                <div
                  className={`h-px flex-1 transition-colors ${
                    step > n ? "bg-stone-900" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
            >
              <h2 className="mb-1 text-xl font-semibold text-stone-900">
                Name your tree
              </h2>
              <p className="mb-6 text-sm text-stone-500">
                Give your family tree a name — usually your family surname works
                great.
              </p>

              <label className="block text-sm font-medium text-stone-700">
                Tree name
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. The Smith Family"
                  value={form.treeName}
                  onChange={(e) => update("treeName", e.target.value)}
                  className={`mt-1 block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-stone-900 ${
                    errors.treeName
                      ? "border-red-400 bg-red-50"
                      : "border-stone-300 bg-stone-50 focus:border-stone-900"
                  }`}
                />
                {errors.treeName && (
                  <p className="mt-1 text-xs text-red-500">{errors.treeName}</p>
                )}
              </label>

              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                Continue →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h2 className="mb-1 text-xl font-semibold text-stone-900">
                About you
              </h2>
              <p className="mb-6 text-sm text-stone-500">
                You are the root of this tree. Tell us a little about yourself.
              </p>

              <div className="flex gap-3">
                <label className="flex-1 block text-sm font-medium text-stone-700">
                  First name *
                  <input
                    autoFocus
                    type="text"
                    placeholder="Jane"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className={`mt-1 block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-stone-900 ${
                      errors.firstName
                        ? "border-red-400 bg-red-50"
                        : "border-stone-300 bg-stone-50 focus:border-stone-900"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.firstName}
                    </p>
                  )}
                </label>

                <label className="flex-1 block text-sm font-medium text-stone-700">
                  Last name *
                  <input
                    type="text"
                    placeholder="Smith"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    className={`mt-1 block w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-stone-900 ${
                      errors.lastName
                        ? "border-red-400 bg-red-50"
                        : "border-stone-300 bg-stone-50 focus:border-stone-900"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.lastName}
                    </p>
                  )}
                </label>
              </div>

              <label className="mt-4 block text-sm font-medium text-stone-700">
                Birth date
                <span className="ml-1 font-normal text-stone-400">
                  (optional)
                </span>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => update("birthDate", e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-stone-700">
                Birth place
                <span className="ml-1 font-normal text-stone-400">
                  (optional)
                </span>
                <input
                  type="text"
                  placeholder="e.g. Dublin, Ireland"
                  value={form.birthPlace}
                  onChange={(e) => update("birthPlace", e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-stone-700">
                Gender
                <span className="ml-1 font-normal text-stone-400">
                  (optional)
                </span>
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900"
                >
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>

              {serverError && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {serverError}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
                >
                  {submitting ? "Creating…" : "Create my tree"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
