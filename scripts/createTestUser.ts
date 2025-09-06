import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'test1234';
  const passwordHash = await bcrypt.hash(password, 10);

  // Create test user
  const user = await prisma.userAccount.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      passwordHash,
  role: 'Admin',
      isActive: true,
    },
  });

  console.log('Test user created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
