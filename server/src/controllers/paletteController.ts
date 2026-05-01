import type { Request, Response } from "express";
import { PALETTE } from "../lib/palette";
import { ok } from "../lib/response";

// GET /api/palette
export function getPalette(_req: Request, res: Response): void {
  ok(res, PALETTE);
}
