import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'admin@aix.com' },
    data: { password: hashedPassword }
  });
  console.log('Password updated successfully');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
