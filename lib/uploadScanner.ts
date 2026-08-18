/**
 * Upload scanning hooks.
 *
 * Production is fail-closed: when the scanner is disabled or errors, uploads
 * are rejected rather than silently accepted. To opt out in development only,
 * set VIRUS_SCANNER_FAIL_OPEN=true (never set this in production).
 *
 * Enable real scanning with VIRUS_SCANNER_ENABLED=true and one of:
 * - VIRUS_SCANNER=clamav  + CLAMAV_HOST / CLAMAV_PORT
 * - VIRUS_SCANNER=webhook + SCAN_WEBHOOK_URL
 */

import net from 'node:net';

export type ScanResult = {
  clean: boolean;
  reason?: string;
};

type ScannerAdapter = {
  name: string;
  scan(buffer: Buffer, filename: string): Promise<ScanResult>;
};

const CLAMAV_TIMEOUT_MS = Number(process.env.CLAMAV_TIMEOUT_MS || '30000');
const WEBHOOK_TIMEOUT_MS = Number(process.env.SCAN_WEBHOOK_TIMEOUT_MS || '15000');
const SCAN_OVERALL_TIMEOUT_MS = Number(process.env.SCAN_OVERALL_TIMEOUT_MS || '60000');

const clamavAdapter: ScannerAdapter = {
  name: 'clamav',
  async scan(buffer) {
    const host = process.env.CLAMAV_HOST || '127.0.0.1';
    const port = parseInt(process.env.CLAMAV_PORT || '3310', 10);

    const socketRef: { current: ReturnType<typeof net.createConnection> | null } = { current: null };

    const scanPromise = new Promise<ScanResult>((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      socketRef.current = socket;
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      socket.setTimeout(CLAMAV_TIMEOUT_MS);
      socket.on('timeout', () => {
        socket.destroy();
        finish(() => reject(new Error('ClamAV scan timed out')));
      });
      socket.on('error', (err) => {
        socket.destroy();
        finish(() => reject(err));
      });

      socket.on('connect', () => {
        const streamId = Buffer.alloc(4);
        streamId.writeUInt32BE(0, 0);

        const header = Buffer.from('zINSTREAM', 'ascii');
        const lengthHeader = Buffer.alloc(4);
        lengthHeader.writeUInt32BE(buffer.byteLength, 0);

        const footer = Buffer.alloc(4);

        socket.write(Buffer.concat([header, lengthHeader, buffer, footer]));
      });

      let response = Buffer.alloc(0);
      socket.on('data', (chunk: Buffer) => {
        response = Buffer.concat([response, chunk]);
      });

      socket.on('end', () => {
        socket.destroy();
        finish(() => {
          const text = response.toString('ascii');
          if (text.includes('FOUND')) {
            resolve({ clean: false, reason: 'ClamAV reported a threat' });
          } else if (text.includes('OK')) {
            resolve({ clean: true });
          } else {
            reject(new Error(`ClamAV unexpected response: ${text}`));
          }
        });
      });
    });

    const timeoutPromise = new Promise<ScanResult>((_, reject) => {
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.destroy();
        }
        reject(new Error('ClamAV scan overall timeout'));
      }, SCAN_OVERALL_TIMEOUT_MS);
    });

    return Promise.race([scanPromise, timeoutPromise]);
  },
};

const webhookAdapter: ScannerAdapter = {
  name: 'webhook',
  async scan(buffer, filename) {
    const url = process.env.SCAN_WEBHOOK_URL;
    if (!url) {
      throw new Error('SCAN_WEBHOOK_URL is not configured');
    }

    const form = new FormData();
    form.append('file', buffer as unknown as Blob, filename);

    const scanPromise = fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Scan webhook returned ${res.status}`);
      }
      const data = (await res.json()) as { clean?: boolean; reason?: string };
      return {
        clean: data.clean ?? false,
        reason: data.reason,
      } as ScanResult;
    });

    const timeoutPromise = new Promise<ScanResult>((_, reject) => {
      setTimeout(() => reject(new Error('Webhook scan overall timeout')), SCAN_OVERALL_TIMEOUT_MS);
    });

    return Promise.race([scanPromise, timeoutPromise]);
  },
};

const adapters: Record<string, ScannerAdapter> = {
  clamav: clamavAdapter,
  webhook: webhookAdapter,
};

function failClosedByDefault(): boolean {
  // Fail closed by default. The only opt-out is an explicit dev flag.
  if (process.env.NODE_ENV === 'production') return true;
  return process.env.VIRUS_SCANNER_FAIL_OPEN !== 'true';
}

export async function scanBuffer(buffer: Buffer, filename: string): Promise<ScanResult> {
  const enabled = process.env.VIRUS_SCANNER_ENABLED === 'true';
  if (!enabled) {
    if (!failClosedByDefault()) {
      return { clean: true };
    }
    return { clean: false, reason: 'Virus scanner is disabled' };
  }

  const scanner = process.env.VIRUS_SCANNER || 'clamav';
  const adapter = adapters[scanner];

  if (!adapter) {
    console.error(`Unknown virus scanner "${scanner}"`);
    return { clean: false, reason: `Unknown virus scanner "${scanner}"` };
  }

  try {
    return await adapter.scan(buffer, filename);
  } catch (error) {
    console.error('Virus scan failed:', error);
    return { clean: false, reason: 'Virus scan error' };
  }
}
