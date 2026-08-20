import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    const migrationName = '20260819_best_lyrics_portal';
    const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', migrationName, 'migration.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    // Compute checksum the same way Prisma does
    const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');

    const now = new Date();
    
    // Check if already applied
    const existing = await prisma.$queryRaw<any[]>`SELECT * FROM "_prisma_migrations" WHERE "migration_name" = ${migrationName}`;
    if (existing.length > 0) {
      console.log('Migration already applied:', migrationName);
      return;
    }

    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (gen_random_uuid(), ${checksum}, ${now}, ${migrationName}, NULL, NULL, ${now}, 1)
    `;
    
    console.log('Migration record inserted:', migrationName);
    console.log('Checksum:', checksum);

    // Verify
    const applied = await prisma.$queryRaw<any[]>`SELECT migration_name, applied_steps_count FROM "_prisma_migrations" WHERE "migration_name" = ${migrationName}`;
    console.log('Verified:', applied);

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
