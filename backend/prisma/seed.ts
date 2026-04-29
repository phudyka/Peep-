import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@peep.local' },
    update: {},
    create: {
      email: 'admin@peep.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const existingSettings = await prisma.calcSettings.findFirst();
  if (!existingSettings) {
    await prisma.calcSettings.create({
      data: {
        updatedById: admin.id,
      },
    });
  }

  console.log('Seeding completed. Admin user created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
