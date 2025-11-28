import { prisma } from "../db";

async function main() {
  const seeds = [
    { name: "Outdoors", description: "Hiking, camping, nature" },
    { name: "Gaming", description: "Video games and board games" },
    { name: "Music", description: "Concerts, jam sessions" },
    { name: "Food", description: "Dining out, cooking" },
    { name: "Tech", description: "Meetups, hack nights" },
    { name: "Fitness", description: "Gym, running, yoga" },
  ];
  for (const s of seeds) {
    await prisma.interest.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: { name: s.name, description: s.description },
    });
  }
  console.log("Seeded interests:", seeds.map((s) => s.name).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
