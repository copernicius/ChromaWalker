// Image storage with two modes, picked at boot from env presence:
//
//   • R2 mode — all five R2_* vars present. Streams directly to a
//     Cloudflare R2 bucket via multer-s3 + the AWS SDK.
//   • Local mode — any R2_* missing. Falls back to multer.diskStorage
//     under <server>/tmp, served back via app.use('/tmp', static).
//     Useful for development so you don't burn R2 egress / storage quota.
//
// Public surface is the same regardless of mode. Controllers don't care:
//   r2Storage(prefix) — multer engine to plug into multer({ storage })
//   r2PublicUrl(key)  — browser-facing URL for the stored object
//   r2DeleteObject    — best-effort cleanup, dispatches by URL shape
//
// Two helpers are also exported for index.ts:
//   usingR2()         — whether we're in R2 mode (drives the static mount)
//   localStorageDir() — absolute path to the local tmp dir

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import multer, { type StorageEngine } from 'multer';
import multerS3 from 'multer-s3';

const R2_ENV_VARS = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
] as const;

const r2Configured = R2_ENV_VARS.every((v) => !!process.env[v]);

// Local tmp lives at <server>/tmp regardless of mode (still a valid path
// even in R2 mode — just unused). Resolved relative to dist/ at runtime,
// so it lands at <server>/tmp from either src/ or dist/.
const TMP_DIR = path.join(__dirname, '..', '..', 'tmp');

let r2Client: S3Client | null = null;
let R2_BUCKET = '';
let R2_PUBLIC_URL = '';

if (r2Configured) {
  R2_BUCKET = process.env.R2_BUCKET!;
  R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');
  r2Client = new S3Client({
    region: 'auto', // R2 ignores region; 'auto' is the documented incantation.
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  console.log('[storage] mode=R2 bucket=' + R2_BUCKET);
} else {
  // Make sure the local dir exists so multer can write into it.
  fs.mkdirSync(TMP_DIR, { recursive: true });
  console.log('[storage] mode=local dir=' + TMP_DIR);
}

export function usingR2(): boolean {
  return r2Configured;
}

export function localStorageDir(): string {
  return TMP_DIR;
}

/** Construct the public URL the browser will fetch. */
export function r2PublicUrl(key: string): string {
  return r2Configured ? `${R2_PUBLIC_URL}/${key}` : `/tmp/${key}`;
}

/**
 * multer storage engine that writes uploads under `${prefix}<uuid><ext>`.
 *
 * In R2 mode: streams to R2, multer-s3 sets `req.file.key`.
 * In local mode: writes to <server>/tmp; multer.diskStorage sets
 * `req.file.filename`. Controllers should read `key ?? filename` to stay
 * mode-agnostic. The prefix is flattened into the filename in local mode
 * (no subdirectories) so the static handler can serve flat.
 */
export function r2Storage(prefix: string): StorageEngine {
  if (r2Configured) {
    return multerS3({
      s3: r2Client!,
      bucket: R2_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${prefix}${randomUUID()}${ext}`);
      },
    });
  }
  const cleanPrefix = prefix.replace(/\/$/, '');
  return multer.diskStorage({
    destination: TMP_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${cleanPrefix}-${randomUUID()}${ext}`);
    },
  });
}

/**
 * Best-effort cleanup. Dispatches by URL shape so Photo/User docs from
 * either storage backend can be deleted by the same code path.
 *   /tmp/foo.jpg     → fs.unlink
 *   <R2_PUBLIC_URL>/ → S3 DeleteObject
 *   anything else    → no-op (external CDN, etc.)
 */
export async function r2DeleteObject(url: string): Promise<void> {
  if (url.startsWith('/tmp/')) {
    const filename = url.replace(/^\/tmp\//, '');
    const filePath = path.join(TMP_DIR, filename);
    try {
      await fsp.unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Local delete failed for', filePath, err);
      }
    }
    return;
  }

  if (!r2Configured) return;
  if (!url.startsWith(R2_PUBLIC_URL + '/')) return;
  const key = url.slice(R2_PUBLIC_URL.length + 1);
  try {
    await r2Client!.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch (err) {
    console.warn('R2 delete failed for', key, err);
  }
}
