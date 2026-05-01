import type { Request, Response } from "express";
import { LEVELS } from "../lib/levels";
import { ok } from "../lib/response";

// GET /api/levels
export function getLevels(_req: Request, res: Response): void {
  ok(res, LEVELS);
}
