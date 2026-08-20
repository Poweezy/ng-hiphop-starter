import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('uploads'),
  SUPABASE_STORAGE_PUBLIC_URL: z.string().url().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  ADMIN_RESET_SECRET: z.string().min(1),
  MODERATION_WEBHOOK_URL: z.string().url().optional(),
  VIRUS_SCANNER_ENABLED: z.enum(['true', 'false']).default('false'),
  VIRUS_SCANNER: z.enum(['clamav', 'webhook']).optional(),
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: z.string().optional(),
  SCAN_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  TRUSTED_PROXIES: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    SUPABASE_STORAGE_PUBLIC_URL: process.env.SUPABASE_STORAGE_PUBLIC_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ADMIN_RESET_SECRET: process.env.ADMIN_RESET_SECRET,
    MODERATION_WEBHOOK_URL: process.env.MODERATION_WEBHOOK_URL || undefined,
    VIRUS_SCANNER_ENABLED: process.env.VIRUS_SCANNER_ENABLED,
    VIRUS_SCANNER: process.env.VIRUS_SCANNER,
    CLAMAV_HOST: process.env.CLAMAV_HOST,
    CLAMAV_PORT: process.env.CLAMAV_PORT,
    SCAN_WEBHOOK_URL: process.env.SCAN_WEBHOOK_URL || undefined,
    SENTRY_DSN: process.env.SENTRY_DSN || undefined,
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    TRUSTED_PROXIES: process.env.TRUSTED_PROXIES,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const missing = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
