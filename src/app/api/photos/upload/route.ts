import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { ok, err, unauthorized } from "@/lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") return err("No file provided");
  if (!ALLOWED_TYPES.includes(file.type)) return err("File must be JPEG, PNG, or WebP");

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_SIZE) return err("File exceeds 5 MB limit");

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const key = `${userId}/${randomUUID()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    })
  );

  return ok({ url: `${process.env.R2_PUBLIC_URL}/${key}` });
}
