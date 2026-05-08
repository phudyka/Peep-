import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const rawPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';
  const adminPassword = await bcrypt.hash(rawPassword, 12);
  const now = new Date();

  const admin = await prisma.user.upsert({
    where: { email: 'admin@peep.local' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'admin@peep.local',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      createdAt: now,
      updatedAt: now,
    },
  });

  const existingSettings = await prisma.calcSettings.findFirst();
  if (!existingSettings) {
    await prisma.calcSettings.create({
      data: {
        id: randomUUID(),
        updatedById: admin.id,
        residentialFilteringTime: 6,
        publicFilteringTime: 4,
        residentialHMT: 8,
        publicHMT: 12,
        pumpEfficiency: 0.6,
        m3PerSkimmer: 25,
        filteringSpeed: 30,
        sandPerM2: 300,
        overflowFlowMultiplier: 1.3,
        spaFlowAddition: 4,
        counterCurrentAddition: 3,
        updatedAt: now,
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
