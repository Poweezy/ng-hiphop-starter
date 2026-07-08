import sharp from 'sharp';

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULTS: Required<ImageOptimizationOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 80,
  format: 'webp',
};

export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULTS, ...options };

  const pipeline = sharp(buffer)
    .rotate()
    .resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  let format = opts.format;
  let mimeType = `image/${format}`;

  if (format === 'webp') {
    pipeline.webp({ quality: opts.quality });
  } else if (format === 'jpeg') {
    pipeline.jpeg({ quality: opts.quality, progressive: true });
  } else if (format === 'png') {
    pipeline.png({ quality: opts.quality, progressive: true });
  }

  const optimizedBuffer = await pipeline.toBuffer();
  const metadata = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    format: mimeType,
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export async function generateThumbnail(
  buffer: Buffer,
  width: number = 400,
  quality: number = 70
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(width, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}
