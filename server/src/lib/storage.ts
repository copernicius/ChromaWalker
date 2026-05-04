// Cloudflare R2 storage layer. R2 is S3-compatible so we use the AWS SDK
// pointed at R2's endpoint. Two surfaces are exported:
//
//   • r2Storage(prefix) — multer storage engine that streams uploads
//     directly into R2 (no disk write, no tmp dir).
//   • r2DeleteObject(url) — best-effort delete keyed by the public URL
//     stored in the DB (Photo.imageUrl, User.avatarUrl).
//
// Required env (set as Fly secrets):
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_ENDPOINT          https://<account-id>.r2.cloudflarestorage.com
//   R2_BUCKET            bucket name
//   R2_PUBLIC_URL        https://pub-<hash>.r2.dev   (or your custom domain)
//
// Why R2_PUBLIC_URL is separate from R2_ENDPOINT: the endpoint is the
// management/upload API, the public URL is what browsers fetch from. R2
// does not auto-serve from the management endpoint — you must enable the
// R2.dev subdomain (Cloudflare dashboard → bucket → Settings → Public
// access) or wire a custom domain, then paste that base URL into
// R2_PUBLIC_URL.

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';
import multerS3 from 'multer-s3';
import type { StorageEngine } from 'multer';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

const ENDPOINT = requireEnv('R2_ENDPOINT');
const BUCKET = requireEnv('R2_BUCKET');
const PUBLIC_URL = requireEnv('R2_PUBLIC_URL').replace(/\/$/, '');

export const r2Client = new S3Client({
  region: 'auto', // R2 ignores region; 'auto' is the documented incantation.
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
  },
});

/** Construct the public URL the browser will fetch. */
export function r2PublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

/** Recover the storage key from a previously-issued public URL. */
function r2KeyFromUrl(url: string): string | null {
  if (!url.startsWith(PUBLIC_URL + '/')) return null;
  return url.slice(PUBLIC_URL.length + 1);
}

/**
 * Multer storage engine that uploads to R2 under `${prefix}<uuid><ext>`.
 * Use `prefix` to keep folders organised (e.g. 'photos/', 'avatars/').
 *
 * NOTE: do NOT pass `acl` — R2 doesn't support per-object ACLs. Public
 * access is configured at the bucket level via the R2.dev subdomain or
 * custom domain.
 */
export function r2Storage(prefix: string): StorageEngine {
  return multerS3({
    s3: r2Client,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}${randomUUID()}${ext}`);
    },
  });
}

/**
 * Best-effort delete. Logs but doesn't throw on failure — the DB row is
 * the source of truth, and R2 has cheap orphan cleanup via lifecycle
 * rules if a few stragglers slip through.
 */
export async function r2DeleteObject(url: string): Promise<void> {
  const key = r2KeyFromUrl(url);
  if (!key) return; // External URL (e.g. Google avatar CDN) — nothing to delete.
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.warn('R2 delete failed for', key, err);
  }
}
