import type { Request, Response } from "express";
import { MISSIONS } from "../lib/missions";
import { ok } from "../lib/response";

// GET /api/missions
export function getMissions(_req: Request, res: Response): void {
  ok(res, MISSIONS);
}
