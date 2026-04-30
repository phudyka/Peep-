import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 🔒 Fix #18 : mot de passe lu depuis SEED_ADMIN_PASSWORD (env var)
  //   En production, définissez cette variable. En dev, le fallback 'password123' est accepté.
  const rawPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('[SECURITY] SEED_ADMIN_PASSWORD non défini — mot de passe par défaut utilisé.');
  }
  const adminPassword = await bcrypt.hash(rawPassword, 12);

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
