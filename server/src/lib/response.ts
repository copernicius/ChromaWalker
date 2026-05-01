import type { Response } from 'express';

export const ErrCode = {
  OK: 0,
  MISSING_PARAM: 1001,
  INVALID_PARAM: 1002,
  NOT_FOUND: 1003,
  AUTH_FAILED: 1004,
  NO_RESULT: 1005,
} as const;

export type ErrCodeValue = (typeof ErrCode)[keyof typeof ErrCode];

interface OkEnvelope<T> {
  errno: 0;
  errmsg: string;
  data: T;
}

interface FailEnvelope {
  errno: number;
  errmsg: string;
}

export function ok<T>(res: Response, data: T, errmsg = 'ok'): Response<OkEnvelope<T>> {
  return res.json({ errno: ErrCode.OK, errmsg, data });
}

export function fail(
  res: Response,
  errno: Exclude<ErrCodeValue, 0>,
  errmsg: string,
): Response<FailEnvelope> {
  // Business / validation errors return HTTP 200 with non-zero errno.
  return res.json({ errno, errmsg });
}
