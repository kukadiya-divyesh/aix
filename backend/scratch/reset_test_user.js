import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.update({
    where: { email: 'divyesh@aix.com' },
    data: { password: hashedPassword }
  });
  console.log('Password updated successfully for divyesh@aix.com');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
