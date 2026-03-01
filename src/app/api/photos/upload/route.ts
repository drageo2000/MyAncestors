import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { ok, err, unauthorized } from "@/lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return err("No file provided");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return err("File must be JPEG, PNG, or WebP");
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) {
    return err("File exceeds 5 MB limit");
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const filename = `${randomUUID()}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "photos");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  return ok({ url: `/uploads/photos/${filename}` });
}
