// Shake detection + a small synthesized "bling" sound effect.
//
// Detection: subscribe to `devicemotion`, compute |a| - g (gravity baseline),
// and require sustained motion above a threshold for a target duration.
// Brief gaps under RESET_GAP_MS are tolerated — real shaking is bursty.
//
// Permission: iOS Safari requires DeviceMotionEvent.requestPermission(),
// which must be triggered from a user gesture. requestMotionPermission()
// resolves to 'granted' | 'denied' | 'unavailable'. Other browsers expose
// devicemotion without prompting; we treat that as 'granted'.

const SHAKE_THRESHOLD = 12; // m/s² above gravity, sustained
const RESET_GAP_MS = 350; // tolerate short pauses
const TICK_HZ = 30; // approx update rate from devicemotion on most devices

export type MotionPermission = 'granted' | 'denied' | 'unavailable';

interface PermissionRequester {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export async function requestMotionPermission(): Promise<MotionPermission> {
  if (typeof window === 'undefined') return 'unavailable';
  // Some browsers don't expose DeviceMotionEvent at all (older Edge, etc).
  const DM = (window as unknown as { DeviceMotionEvent?: PermissionRequester }).DeviceMotionEvent;
  if (!DM) return 'unavailable';
  if (typeof DM.requestPermission !== 'function') {
    // Android Chrome / desktop browsers — events fire without explicit
    // permission. We can only confirm by hearing back; treat as granted
    // and let the caller's "no events" timeout reveal the actual state.
    return 'granted';
  }
  try {
    const result = await DM.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

interface ShakeWatcher {
  stop: () => void;
}

interface WatchOptions {
  durationMs: number;
  onProgress: (frac: number) => void;
  onComplete: () => void;
  // Called on the first event so the UI can stop showing "waiting for
  // motion" hints (handy for debugging permission issues).
  onFirstEvent?: () => void;
}

export function watchForShake(opts: WatchOptions): ShakeWatcher {
  let shakeStart: number | null = null;
  let lastShake = 0;
  let firstSeen = false;
  let stopped = false;

  const handler = (e: DeviceMotionEvent) => {
    if (stopped) return;
    if (!firstSeen) {
      firstSeen = true;
      opts.onFirstEvent?.();
    }
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    const motion = Math.abs(mag - 9.81);
    const now = performance.now();

    if (motion > SHAKE_THRESHOLD) {
      if (shakeStart == null) shakeStart = now;
      lastShake = now;
      const held = now - shakeStart;
      opts.onProgress(Math.min(1, held / opts.durationMs));
      if (held >= opts.durationMs) {
        stopped = true;
        window.removeEventListener('devicemotion', handler);
        opts.onComplete();
      }
    } else if (shakeStart != null && now - lastShake > RESET_GAP_MS) {
      shakeStart = null;
      opts.onProgress(0);
    }
  };

  window.addEventListener('devicemotion', handler);

  return {
    stop: () => {
      stopped = true;
      window.removeEventListener('devicemotion', handler);
    },
  };
}

// Reference for callers that want to know how often the progress updates.
export const SHAKE_TICK_HZ = TICK_HZ;

// Synthesized bell-like chime. Two sine oscillators (A5 + E6) with a
// short exponential decay — no audio asset required. Web Audio context
// is created on demand and closed shortly after to avoid leaks.
export function playBling(): void {
  if (typeof window === 'undefined') return;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  const notes = [880, 1320]; // A5, E6
  for (const freq of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }
  window.setTimeout(() => {
    ctx.close().catch(() => {});
  }, 900);
}
