import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsoleProvider, getEmailProvider } from '../index';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('email provider selection', () => {
  it('requires SendGrid explicitly in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EMAIL_PROVIDER', '');
    vi.stubEnv('SENDGRID_API_KEY', '');

    expect(() => getEmailProvider()).toThrow('EMAIL_PROVIDER must be "sendgrid" in production');
  });

  it('rejects the console provider in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EMAIL_PROVIDER', 'console');

    expect(() => getEmailProvider()).toThrow('EMAIL_PROVIDER must be "sendgrid" in production');
  });

  it('fails explicitly when SendGrid is selected without credentials', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EMAIL_PROVIDER', 'sendgrid');
    vi.stubEnv('SENDGRID_API_KEY', '');

    expect(() => getEmailProvider()).toThrow('Missing required environment variable: SENDGRID_API_KEY');
  });

  it('requires an explicitly configured sender in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('EMAIL_PROVIDER', 'sendgrid');
    vi.stubEnv('SENDGRID_API_KEY', 'configured-api-key');
    vi.stubEnv('EMAIL_FROM', '');

    expect(() => getEmailProvider()).toThrow('Missing required environment variable: EMAIL_FROM');
  });

  it('keeps the console provider available in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('EMAIL_PROVIDER', '');

    expect(getEmailProvider()).toBeInstanceOf(ConsoleProvider);
  });
});
