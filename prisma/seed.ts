import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const USER_ID = "seed_test_user_001";
  const EMAIL = "test@myancestors.app";

  // Upsert user so re-running seed is safe
  const user = await db.user.upsert({
    where: { id: USER_ID },
    create: { id: USER_ID, email: EMAIL, name: "Test User" },
    update: { email: EMAIL, name: "Test User" },
  });

  // Upsert tree
  const tree = await db.tree.upsert({
    where: { id: "seed_tree_001" },
    create: { id: "seed_tree_001", name: "Test User Family Tree", ownerId: user.id },
    update: { name: "Test User Family Tree" },
  });

  // Root person — Test User himself
  const root = await db.person.upsert({
    where: { id: "seed_person_root" },
    create: {
      id: "seed_person_root",
      treeId: tree.id,
      firstName: "John",
      lastName: "Test",
      birthDate: new Date("1980-06-15"),
      birthPlace: "New York, USA",
      gender: "MALE",
      bio: "Root person of the demo family tree.",
    },
    update: {},
  });

  // Father
  const father = await db.person.upsert({
    where: { id: "seed_person_father" },
    create: {
      id: "seed_person_father",
      treeId: tree.id,
      firstName: "Robert",
      lastName: "Test",
      birthDate: new Date("1952-03-22"),
      birthPlace: "Boston, USA",
      gender: "MALE",
    },
    update: {},
  });

  // Mother
  const mother = await db.person.upsert({
    where: { id: "seed_person_mother" },
    create: {
      id: "seed_person_mother",
      treeId: tree.id,
      firstName: "Mary",
      lastName: "Test",
      birthDate: new Date("1955-09-10"),
      birthPlace: "Chicago, USA",
      gender: "FEMALE",
    },
    update: {},
  });

  // Spouse
  const spouse = await db.person.upsert({
    where: { id: "seed_person_spouse" },
    create: {
      id: "seed_person_spouse",
      treeId: tree.id,
      firstName: "Jane",
      lastName: "Test",
      birthDate: new Date("1983-11-28"),
      birthPlace: "Los Angeles, USA",
      gender: "FEMALE",
    },
    update: {},
  });

  // Child
  await db.person.upsert({
    where: { id: "seed_person_child" },
    create: {
      id: "seed_person_child",
      treeId: tree.id,
      firstName: "Emma",
      lastName: "Test",
      birthDate: new Date("2010-04-05"),
      birthPlace: "New York, USA",
      gender: "FEMALE",
    },
    update: {},
  });

  // Relationships (upsert via unique constraint)
  const rels = [
    { personAId: father.id, personBId: mother.id, type: "SPOUSE_OF" as const },
    { personAId: father.id, personBId: root.id,   type: "PARENT_OF" as const },
    { personAId: mother.id, personBId: root.id,   type: "PARENT_OF" as const },
    { personAId: root.id,   personBId: spouse.id, type: "SPOUSE_OF" as const },
    { personAId: root.id,   personBId: "seed_person_child", type: "PARENT_OF" as const },
  ];

  for (const rel of rels) {
    await db.relationship.upsert({
      where: { personAId_personBId_type: rel },
      create: rel,
      update: {},
    });
  }

  console.log("✅ Seed complete — Test User Family Tree created");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
