import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const password = 'changeme';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update all users with the plain password to the hashed version
  await prisma.userAccount.updateMany({
    where: { passwordHash: password },
    data: { passwordHash: hashedPassword },
  });
  console.log('UserAccount passwords updated to hashed version.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
