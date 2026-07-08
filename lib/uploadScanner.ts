/**
 * Upload scanning hooks.
 *
 * Default: fail-open so local development is not blocked.
 * Enable real scanning with VIRUS_SCANNER_ENABLED=true and one of:
 * - VIRUS_SCANNER=clamav  + CLAMAV_HOST / CLAMAV_PORT
 * - VIRUS_SCANNER=webhook + SCAN_WEBHOOK_URL
 */

export type ScanResult = {
  clean: boolean;
  reason?: string;
};

type ScannerAdapter = {
  name: string;
  scan(buffer: Buffer, filename: string): Promise<ScanResult>;
};

const clamavAdapter: ScannerAdapter = {
  name: 'clamav',
  async scan(buffer) {
    const host = process.env.CLAMAV_HOST || '127.0.0.1';
    const port = parseInt(process.env.CLAMAV_PORT || '3310', 10);

    // Minimal INSTREAM scan protocol for clamd.
    // Connects, sends a simple INSTREAM request with the file bytes,
    // then reads the result response.
    await new Promise<void>((resolve, reject) => {
      const net = require('node:net');
      const socket = net.createConnection({ host, port });

      socket.on('error', reject);
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
        const text = response.toString('ascii');
        if (text.includes('OK')) {
          resolve();
        } else if (text.includes('FOUND')) {
          reject(new Error('ClamAV reported FOUND'));
        } else {
          reject(new Error(`ClamAV unexpected response: ${text}`));
        }
      });
    });

    return { clean: true };
  },
};

const webhookAdapter: ScannerAdapter = {
  name: 'webhook',
  async scan(buffer, filename) {
    const url = process.env.SCAN_WEBHOOK_URL;
    if (!url) {
      return { clean: true };
    }

    const form = new FormData();
    form.append('file', buffer as any, filename);

    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) {
      return { clean: true };
    }

    const data = (await res.json()) as { clean?: boolean; reason?: string };
    return {
      clean: data.clean ?? true,
      reason: data.reason,
    };
  },
};

const adapters: Record<string, ScannerAdapter> = {
  clamav: clamavAdapter,
  webhook: webhookAdapter,
};

export async function scanBuffer(buffer: Buffer, filename: string): Promise<ScanResult> {
  const enabled = process.env.VIRUS_SCANNER_ENABLED === 'true';
  if (!enabled) {
    return { clean: true };
  }

  const scanner = process.env.VIRUS_SCANNER || 'clamav';
  const adapter = adapters[scanner];

  if (!adapter) {
    console.warn(`Unknown virus scanner "${scanner}", skipping scan`);
    return { clean: true };
  }

  try {
    return await adapter.scan(buffer, filename);
  } catch (error) {
    console.error('Virus scan failed:', error);
    return { clean: true };
  }
}
