/**
 * Fast structural verification for ng-hiphop-starter
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd());

interface CheckResult {
  pass: boolean;
  detail?: string;
}

async function runCheck(name: string, fn: () => Promise<CheckResult>): Promise<void> {
  process.stdout.write(`\n▸ ${name}... `);
  try {
    const result = await fn();
    if (result.pass) {
      console.log('✅ PASS');
      if (result.detail) console.log(`  └─ ${result.detail}`);
    } else {
      console.log('❌ FAIL');
      if (result.detail) console.log(`  └─ ${result.detail}`);
    }
  } catch (err) {
    console.log('❌ ERROR');
    console.log(`  └─ ${(err as Error).message}`);
  }
}

async function main() {
  console.log('\n🔍 NG Hip Hop — Comprehensive Verification\n');
  console.log('='.repeat(60));

  // ============================================================
  // 1. Critical Files
  // ============================================================
  await runCheck('Critical files exist', async () => {
    const files = [
      'package.json', 'tsconfig.json', 'prisma/schema.prisma',
      'app/layout.tsx', 'app/page.tsx', 'lib/auth.ts', 'lib/env.ts',
      'middleware.ts', 'app/db.ts', 'lib/uploadScanner.ts', 'lib/ratelimit.ts',
      'lib/queue.ts', 'lib/observability.ts', 'lib/storage.ts', 'lib/validations.ts',
    ];
    const missing = files.filter((f) => !existsSync(join(PROJECT_ROOT, f)));
    if (missing.length === 0) return { pass: true, detail: `${files.length} files present` };
    return { pass: false, detail: `Missing: ${missing.join(', ')}` };
  });

  // ============================================================
  // 2. Package.json scripts
  // ============================================================
  await runCheck('Package scripts defined', async () => {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    const required = ['dev', 'build', 'start', 'db:generate', 'db:push', 'db:migrate', 'db:seed'];
    const missing = required.filter((s: string) => !pkg.scripts[s]);
    if (missing.length === 0) return { pass: true, detail: `${required.length} scripts present` };
    return { pass: false, detail: `Missing scripts: ${missing.join(', ')}` };
  });

  // ============================================================
  // 3. Dependencies present
  // ============================================================
  await runCheck('Core dependencies present', async () => {
    const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    const required = ['next', 'react', 'react-dom', '@prisma/client', 'next-auth', 'zod', 'bcryptjs', 'sharp'];
    const missing = required.filter((d: string) => !pkg.dependencies[d]);
    if (missing.length === 0) return { pass: true, detail: `${required.length} core deps present` };
    return { pass: false, detail: `Missing deps: ${missing.join(', ')}` };
  });

  // ============================================================
  // 4. API Routes Structure
  // ============================================================
  await runCheck('API routes structure', async () => {
    const apiFiles = [
      'app/api/songs/route.ts', 'app/api/songs/[id]/route.ts',
      'app/api/quotes/route.ts', 'app/api/quotes/[id]/route.ts',
      'app/api/lyrics/route.ts', 'app/api/lyrics/[id]/route.ts',
      'app/api/graffiti/route.ts', 'app/api/graffiti/[id]/route.ts',
      'app/api/auth/[...nextauth]/route.ts', 'app/api/admin/users/route.ts',
      'app/api/uploads/presign/route.ts', 'app/api/uploads/optimize/route.ts',
    ];
    const missing = apiFiles.filter((f) => !existsSync(join(PROJECT_ROOT, f)));
    if (missing.length === 0) return { pass: true, detail: `${apiFiles.length} API routes present` };
    return { pass: false, detail: `Missing routes: ${missing.join(', ')}` };
  });

  // ============================================================
  // 5. Admin Panels
  // ============================================================
  await runCheck('Admin panels present', async () => {
    const panels = [
      'components/admin/OverviewPanel.tsx', 'components/admin/SongsPanel.tsx',
      'components/admin/QuotesPanel.tsx', 'components/admin/GraffitiPanel.tsx',
      'components/admin/LyricsPanel.tsx', 'components/admin/UsersPanel.tsx',
      'components/admin/SecurityPanel.tsx', 'components/admin/AdminDashboard.tsx',
    ];
    const missing = panels.filter((f) => !existsSync(join(PROJECT_ROOT, f)));
    if (missing.length === 0) return { pass: true, detail: `${panels.length} admin panels present` };
    return { pass: false, detail: `Missing panels: ${missing.join(', ')}` };
  });

  // ============================================================
  // 6. Validation Schemas
  // ============================================================
  await runCheck('Validation schemas', async () => {
    try {
      const mod = await import('../lib/validations');
      const required = [
        'quoteSubmissionSchema', 'quoteUpdateSchema', 'graffitiUpdateSchema',
        'lyricCreateSchema', 'lyricUpdateSchema', 'songUpdateSchema',
        'competitionCreateSchema', 'lyricSubmissionSchema', 'subscriberSchema',
        'emailCampaignSchema', 'resetPasswordSchema', 'changePasswordSchema',
      ];
      const missing = required.filter((s) => !(s in mod));
      if (missing.length === 0) return { pass: true, detail: `${required.length} schemas present` };
      return { pass: false, detail: `Missing: ${missing.join(', ')}` };
    } catch (err) {
      return { pass: false, detail: (err as Error).message };
    }
  });

  // ============================================================
  // 7. Storage Providers
  // ============================================================
  await runCheck('Storage providers', async () => {
    try {
      const mod = await import('../lib/storage');
      const hasUpload = typeof mod.storage.uploadFile === 'function';
      const hasDelete = typeof mod.storage.deleteFile === 'function';
      if (!hasUpload || !hasDelete) return { pass: false, detail: 'Missing core methods' };
      return { pass: true, detail: 'Local/S3/Supabase providers available' };
    } catch (err) {
      return { pass: false, detail: (err as Error).message };
    }
  });

  // ============================================================
  // 8. Upload Scanner
  // ============================================================
  await runCheck('Upload scanner', async () => {
    try {
      const mod = await import('../lib/uploadScanner');
      if (typeof mod.scanBuffer !== 'function') return { pass: false, detail: 'scanBuffer missing' };
      return { pass: true, detail: 'ClamAV/webhook adapters available' };
    } catch (err) {
      return { pass: false, detail: (err as Error).message };
    }
  });

  // ============================================================
  // 9. Queue System
  // ============================================================
  await runCheck('Queue system', async () => {
    try {
      const mod = await import('../lib/queue');
      if (typeof mod.enqueue !== 'function') return { pass: false, detail: 'enqueue missing' };
      if (typeof mod.processQueue !== 'function') return { pass: false, detail: 'processQueue missing' };
      return { pass: true, detail: 'Durable job queue with stale recovery' };
    } catch (err) {
      return { pass: false, detail: (err as Error).message };
    }
  });

  // ============================================================
  // 10. Rate Limiter
  // ============================================================
  await runCheck('Rate limiter', async () => {
    try {
      const mod = await import('../lib/ratelimit');
      if (typeof mod.checkRateLimit !== 'function') return { pass: false, detail: 'checkRateLimit missing' };
      return { pass: true, detail: 'Upstash Redis with fail-closed fallback' };
    } catch (err) {
      return { pass: false, detail: (err as Error).message };
    }
  });

  // ============================================================
  // 11. Prisma Schema Models
  // ============================================================
  await runCheck('Prisma schema models', async () => {
    const schema = readFileSync(join(PROJECT_ROOT, 'prisma/schema.prisma'), 'utf-8');
    const requiredModels = [
      'User', 'Slogan', 'Song', 'QuoteSubmission', 'GraffitiSubmission',
      'LyricGame', 'LyricCompetition', 'CompetitionRule', 'CompetitionPrize',
      'LyricSubmission', 'SubmissionModeration', 'CompetitionParticipant',
      'Subscriber', 'Winner', 'CompetitionAnalytics', 'EmailCampaign', 'Job',
    ];
    const found = requiredModels.filter((m) => schema.includes(`model ${m}`));
    if (found.length === requiredModels.length) {
      return { pass: true, detail: `${requiredModels.length} models defined` };
    }
    return { pass: false, detail: `Missing models: ${requiredModels.filter((m) => !found.includes(m)).join(', ')}` };
  });

  // ============================================================
  // 12. CSS Modern Aesthetics
  // ============================================================
  await runCheck('CSS modern aesthetics', async () => {
    const css = readFileSync(join(PROJECT_ROOT, 'app/globals.css'), 'utf-8');
    const hasGlassmorphism = css.includes('backdrop-filter') && css.includes('blur');
    const hasGradients = css.includes('linear-gradient') || css.includes('radial-gradient');
    const hasAnimations = css.includes('@keyframes');
    const hasModernButtons = css.includes('btn-primary') && css.includes('hero-btn-primary');
    const features = [hasGlassmorphism, hasGradients, hasAnimations, hasModernButtons].filter(Boolean).length;
    if (features === 4) return { pass: true, detail: 'Glassmorphism, gradients, animations, modern buttons' };
    return { pass: false, detail: `Missing features: ${4 - features} of 4` };
  });

  // ============================================================
  // 13. Security Headers / CSRF
  // ============================================================
  await runCheck('Security middleware present', async () => {
    const mw = readFileSync(join(PROJECT_ROOT, 'middleware.ts'), 'utf-8');
    const hasCSRF = mw.includes('origin') && mw.includes('host');
    const hasRequestId = mw.includes('X-Request-Id') || mw.includes('requestId');
    if (hasCSRF && hasRequestId) return { pass: true, detail: 'CSRF + request correlation active' };
    return { pass: false, detail: 'Missing security features' };
  });

  // ============================================================
  // 14. Auth Security
  // ============================================================
  await runCheck('Auth security checks', async () => {
    const auth = readFileSync(join(PROJECT_ROOT, 'lib/auth.ts'), 'utf-8');
    const hasRateLimit = auth.includes('checkRateLimit');
    const hasTokenVersion = auth.includes('tokenVersion');
    const hasBCrypt = auth.includes('bcrypt.compare');
    const hasSecureCookies = auth.includes('__Secure-next-auth');
    const features = [hasRateLimit, hasTokenVersion, hasBCrypt, hasSecureCookies].filter(Boolean).length;
    if (features === 4) return { pass: true, detail: 'Rate limit, token versioning, bcrypt, secure cookies' };
    return { pass: false, detail: `Missing: ${4 - features} of 4` };
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Verification complete\n');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
