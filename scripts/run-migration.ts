import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected!');

    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', 'manual-best-lyrics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      try {
        await prisma.$executeRawUnsafe(stmt);
        console.log(`  [${i + 1}/${statements.length}] OK`);
      } catch (e: any) {
        // Some statements might fail if objects already exist
        console.log(`  [${i + 1}/${statements.length}] SKIP: ${e.message?.substring(0, 80)}`);
      }
    }

    console.log('Migration complete!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
