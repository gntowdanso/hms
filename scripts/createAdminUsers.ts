import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.userAccount.createMany({
    data: [
      { username: 'rekoll', passwordHash: 'changeme', role: 'Admin', isActive: true },
      { username: 'koll@admin', passwordHash: 'changeme', role: 'Admin', isActive: true },
    ],
    skipDuplicates: true,
  });
  console.log('Default admin users created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
