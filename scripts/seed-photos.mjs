import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import pg from "pg";

// R2 config from .env
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

const persons = [
  { id: "seed_gp_william",    file: "william.jpg"  },
  { id: "seed_gp_eleanor",    file: "eleanor.jpg"  },
  { id: "seed_gp_thomas",     file: "thomas.jpg"   },
  { id: "seed_gp_margaret",   file: "margaret.jpg" },
  { id: "seed_person_father", file: "robert.jpg"   },
  { id: "seed_person_mother", file: "mary.jpg"     },
  { id: "seed_person_root",   file: "john.jpg"     },
  { id: "seed_person_spouse", file: "sarah.jpg"    },
  { id: "seed_person_nicole", file: "nicole.jpg"   },
  { id: "seed_person_david",  file: "david.jpg"    },
  { id: "seed_person_child",  file: "emma.jpg"     },
  { id: "seed_person_lucas",  file: "lucas.jpg"    },
  { id: "seed_person_olivia", file: "olivia.jpg"   },
  { id: "seed_person_ethan",  file: "ethan.jpg"    },
  { id: "seed_person_noah",   file: "noah.jpg"     },
];

const TREE_ID = "seed_tree_001";
const UPLOADER_ID = "seed_test_user_001";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

for (const p of persons) {
  const bytes = readFileSync(`/tmp/seed-photos/${p.file}`);
  const key = `seed/${randomUUID()}.jpg`;

  // Upload to R2
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: bytes,
      ContentType: "image/jpeg",
    })
  );

  const url = `${PUBLIC_URL}/${key}`;
  const photoId = `seed_photo_${p.id}`;

  console.log(`✅ ${p.file} → ${url}`);

  // Update person profilePhotoUrl
  await client.query(
    `UPDATE "Person" SET "profilePhotoUrl" = $1 WHERE id = $2`,
    [url, p.id]
  );

  // Create Photo record
  await client.query(
    `INSERT INTO "Photo" (id, "treeId", url, "uploadedById", "createdAt")
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (id) DO NOTHING`,
    [photoId, TREE_ID, url, UPLOADER_ID]
  );

  // Create PhotoPerson link
  await client.query(
    `INSERT INTO "PhotoPerson" ("photoId", "personId")
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [photoId, p.id]
  );
}

// Verify
const res = await client.query(
  `SELECT "firstName", "lastName", "profilePhotoUrl" IS NOT NULL as "hasPhoto"
   FROM "Person" WHERE "treeId" = $1 ORDER BY "birthDate"`,
  [TREE_ID]
);
console.log("\n📋 Final state:");
console.table(res.rows);

await client.end();
console.log("\n🎉 Done! All 15 persons have profile photos.");
