import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@aix.com';
  const password = 'aix123';
  const name = 'Super Admin';

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    console.log('Admin already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('-----------------------------------');
  console.log('ADMIN BOOTSTRAP SUCCESSFUL');
  console.log('Email: admin@aix.com');
  console.log('Password: aix123');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
