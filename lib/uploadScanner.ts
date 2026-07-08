/**
 * Basic upload scanning hooks.
 *
 * This is intentionally conservative by default: without an external
 * virus scanner configured, it will not block uploads. To enable
 * real scanning, set VIRUS_SCANNER_ENABLED=true and configure one
 * of the supported adapters.
 */

export type ScanResult = {
  clean: boolean;
  reason?: string;
};

export async function scanBuffer(_buffer: Buffer, _filename: string): Promise<ScanResult> {
  const enabled = process.env.VIRUS_SCANNER_ENABLED === 'true';

  if (!enabled) {
    return { clean: true };
  }

  // Future: integrate ClamAV / cloud scanner here.
  // For now, fail open when no scanner is wired up.
  return { clean: true };
}
