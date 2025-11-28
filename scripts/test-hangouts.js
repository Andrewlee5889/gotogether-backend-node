const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const hangouts = await prisma.hangout.findMany();
    console.log('Hangouts count:', hangouts.length);
    if (hangouts.length) {
      console.log('First hangout sample:', hangouts[0]);
    }
  } catch (e) {
    console.error('Prisma query failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
