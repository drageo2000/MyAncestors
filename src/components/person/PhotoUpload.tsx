"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";

interface Props {
  personId: string;
  treeId: string;
  onSuccess: () => void;
}

export default function PhotoUpload({ personId, treeId, onSuccess }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setProgress("Compressing…");

    try {
      const compressed = await imageCompression(selected, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Failed to compress image. Please try another file.");
    } finally {
      setProgress("");
    }
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      setProgress("Uploading file…");
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/photos/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Upload failed");

      setProgress("Saving…");
      const metaRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploadJson.data.url, caption, personIds: [personId], treeId }),
      });
      const metaJson = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaJson.error ?? "Failed to save photo");

      reset();
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setCaption("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-4">
      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-stone-300 px-4 py-3 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-600 transition-colors"
        >
          <span>📷</span> Add photo
        </button>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 max-w-sm">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-stone-100">
            <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
          </div>

          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={uploading}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-50"
          />

          {progress && <p className="text-sm text-stone-400">{progress}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={uploading}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
