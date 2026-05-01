import vision from "@google-cloud/vision";
import type { Request, Response } from "express";
import { type PaletteId } from "../lib/palette";
import { ErrCode, fail, ok } from "../lib/response";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSV {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

// Hue centers for the chromatic rainbow buckets — used as the fallback when
// none of the achromatic/brown/pink rules match.
const RAINBOW_HUES: { id: PaletteId; hue: number }[] = [
  { id: "red", hue: 0 },
  { id: "orange", hue: 30 },
  { id: "yellow", hue: 60 },
  { id: "green", hue: 120 },
  { id: "blue", hue: 240 },
  { id: "indigo", hue: 275 },
  { id: "violet", hue: 282 },
];

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

function nearestRainbowHue(hue: number): PaletteId {
  let bestId: PaletteId = RAINBOW_HUES[0].id;
  let bestDist = Infinity;
  for (const c of RAINBOW_HUES) {
    const d = hueDistance(hue, c.hue);
    if (d < bestDist) {
      bestDist = d;
      bestId = c.id;
    }
  }
  return bestId;
}

// Classifier: rules are checked top-down, first match wins. The order matters
// — achromatic checks have to run before any hue rules, otherwise a white
// pixel (s≈0) would otherwise be force-bucketed by whatever its near-zero
// hue happened to be.
function classify({ h, s, v }: HSV): PaletteId {
  // Achromatic: V (lightness) decides.
  if (v < 0.18) return "black";
  if (s < 0.12 && v > 0.85) return "white";
  if (s < 0.15) return "gray";

  // Brown: dark warm hues (tires, wood, soil, leather).
  if (h >= 10 && h <= 45 && v < 0.5) return "brown";

  // Pink: light, low-to-moderate-saturation reds (sunsets, blossoms).
  if ((h >= 320 || h <= 20) && v > 0.75 && s < 0.55) return "pink";

  // Otherwise bucket by hue against the rainbow.
  return nearestRainbowHue(h);
}

const apiKey = process.env.GOOGLE_VISION_KEY;
if (!apiKey) {
  console.warn("GOOGLE_VISION_KEY is not set; /api/detect-color will fail.");
}

const visionClient = new vision.ImageAnnotatorClient({
  apiKey,
  fallback: true,
});

function decodeBase64Image(input: string): Buffer {
  const base64 = input.includes(",") ? input.split(",")[1] : input;
  return Buffer.from(base64, "base64");
}

// POST /api/detect-color
export async function detectColor(req: Request, res: Response): Promise<void> {
  try {
    const { image } = (req.body || {}) as { image?: string };

    if (!image || typeof image !== "string") {
      fail(res, ErrCode.MISSING_PARAM, "image is required");
      return;
    }

    const content = decodeBase64Image(image);

    const [result] = await visionClient.imageProperties({
      image: { content },
    });

    const colors =
      result.imagePropertiesAnnotation?.dominantColors?.colors ?? [];
    if (colors.length === 0) {
      fail(res, ErrCode.NO_RESULT, "No dominant colors detected");
      return;
    }

    // Vision returns colors sorted by score; the first one is what the user
    // intends to capture. Now that white/gray/black/brown/pink are all valid
    // palette buckets, we no longer need to skip desaturated pixels.
    const top = colors[0];
    const rgb: RGB = {
      r: top.color?.red ?? 0,
      g: top.color?.green ?? 0,
      b: top.color?.blue ?? 0,
    };

    ok(res, { color: classify(rgbToHsv(rgb)) });
  } catch (err) {
    console.error("Color detection failed:", err);
    res.status(500).json({ errno: 500, errmsg: "Color detection failed" });
  }
}
