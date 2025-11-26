import { prisma } from "../db";

async function main() {
  const seeds = [
    { name: "Outdoors", slug: "outdoors", description: "Hiking, camping, nature" },
    { name: "Gaming", slug: "gaming", description: "Video games and board games" },
    { name: "Music", slug: "music", description: "Concerts, jam sessions" },
    { name: "Food", slug: "food", description: "Dining out, cooking" },
    { name: "Tech", slug: "tech", description: "Meetups, hack nights" },
    { name: "Fitness", slug: "fitness", description: "Gym, running, yoga" },
  ];
  for (const s of seeds) {
    await prisma.interest.upsert({
      where: { slug: s.slug },
      update: { description: s.description, name: s.name },
      create: s,
    });
  }
  console.log("Seeded interests:", seeds.map((s) => s.slug).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
