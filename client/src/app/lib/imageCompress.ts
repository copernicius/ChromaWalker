// Client-side JPEG re-encoder used to keep uploads under a target size.
// Saves bandwidth (R2 egress, mobile data) and storage cost without
// touching the server.
//
// Strategy:
//   1. If the source is already small enough, return it untouched.
//   2. Cap the longest edge at MAX_INITIAL_DIMENSION so huge phone photos
//      (4032×3024 etc.) don't pay the full encode cost on the first try.
//   3. Encode at quality 0.85, then step quality down by 0.1 each pass.
//   4. Once quality hits MIN_QUALITY and we're still over budget, scale
//      the dimensions down by SCALE_STEP and reset quality.
//   5. Stop when under target — or after MAX_ITERATIONS, returning the
//      smallest blob produced so far (best-effort).
//
// Note: always emits image/jpeg. Loses transparency (fine for photos /
// avatars) and any animation (we don't accept GIF uploads). EXIF
// orientation is honored automatically because modern browsers apply
// `image-orientation: from-image` by default when drawing to canvas.

const TARGET_BYTES = 500 * 1024;
const MAX_INITIAL_DIMENSION = 2000;
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.1;
const SCALE_STEP = 0.75;
const MAX_ITERATIONS = 10;

export interface CompressOptions {
  /** Cap in bytes. Defaults to 500 KB. */
  targetBytes?: number;
  /** Initial cap on the longest edge in pixels. Defaults to 2000. */
  maxDimension?: number;
}

export async function compressImage(
  source: Blob,
  opts: CompressOptions = {},
): Promise<Blob> {
  const targetBytes = opts.targetBytes ?? TARGET_BYTES;
  const maxDimension = opts.maxDimension ?? MAX_INITIAL_DIMENSION;

  // Already small enough — skip the canvas roundtrip entirely.
  if (source.size <= targetBytes) return source;

  const img = await loadImage(source);
  const longest = Math.max(img.width, img.height);
  const ratio = img.width / img.height;
  let dim = Math.min(maxDimension, longest);
  let quality = INITIAL_QUALITY;
  let smallest: Blob | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const w = ratio >= 1 ? dim : Math.round(dim * ratio);
    const h = ratio >= 1 ? Math.round(dim / ratio) : dim;
    const blob = await encodeJpeg(img, w, h, quality);
    if (blob.size <= targetBytes) return blob;
    if (!smallest || blob.size < smallest.size) smallest = blob;

    if (quality > MIN_QUALITY + 1e-6) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    } else {
      dim = Math.max(200, Math.round(dim * SCALE_STEP));
      quality = INITIAL_QUALITY;
    }
  }

  // Best-effort: hand back the smallest we managed to produce.
  return smallest ?? source;
}

/** FileReader → data URL string. Use to pipe a compressed Blob back into
 * code paths that require a data: URL (e.g. JSON-serialised endpoints). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error('Could not decode image (unsupported format?)'));
      img.src = url;
    });
  } finally {
    // Bitmap is now in memory; URL handle is safe to release.
    URL.revokeObjectURL(url);
  }
}

async function encodeJpeg(
  img: HTMLImageElement,
  w: number,
  h: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('JPEG encode failed'))),
      'image/jpeg',
      quality,
    );
  });
}
