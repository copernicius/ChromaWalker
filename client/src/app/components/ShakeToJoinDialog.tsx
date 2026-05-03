import { Dices, Smartphone, Vibrate } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  type MotionPermission,
  playBling,
  requestMotionPermission,
  watchForShake,
} from '../lib';
import { useJoinRandomTeamMissionMutation } from '../queries';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Progress } from './ui';

const SHAKE_DURATION_MS = 3000;
// Heuristic: if we never see a devicemotion event within this window after
// "granted", assume the device has no accelerometer (desktop browser) and
// surface the simulate fallback so the feature is still testable.
const NO_MOTION_TIMEOUT_MS = 1500;

type Phase =
  | 'idle' // Showing instructions, waiting for user to tap Start.
  | 'awaiting-permission' // iOS prompt in flight.
  | 'listening' // Listening to motion; collecting shake duration.
  | 'qualified' // Threshold met; bling played; calling join API.
  | 'success' // Join succeeded; about to close.
  | 'error'; // Permission denied / no teams / API failure.

export function ShakeToJoinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [seenMotion, setSeenMotion] = useState(false);
  const join = useJoinRandomTeamMissionMutation();

  // Track the active watcher / no-motion timer so cleanup can stop them
  // if the user closes the dialog mid-shake or mid-API-call.
  const stopWatchRef = useRef<(() => void) | null>(null);
  const noMotionTimerRef = useRef<number | null>(null);

  // Reset state every time the dialog re-opens.
  useEffect(() => {
    if (open) {
      setPhase('idle');
      setProgress(0);
      setError(null);
      setSeenMotion(false);
    } else {
      stopWatchRef.current?.();
      stopWatchRef.current = null;
      if (noMotionTimerRef.current != null) {
        window.clearTimeout(noMotionTimerRef.current);
        noMotionTimerRef.current = null;
      }
    }
  }, [open]);

  const fail = (msg: string) => {
    setPhase('error');
    setError(msg);
  };

  const onQualified = () => {
    setPhase('qualified');
    playBling();
    join.mutate(undefined, {
      onSuccess: (team) => {
        setPhase('success');
        toast.success(`Joined "${team.title}"!`, {
          description: `${team.members.length}/${team.maxSize} members · target +${team.reward} pts`,
          duration: 5000,
        });
        // Brief pause so the user can register the success state before
        // the dialog closes.
        window.setTimeout(() => onOpenChange(false), 800);
      },
      onError: (e) => fail(e.message || 'Could not join a team'),
    });
  };

  const start = async () => {
    setPhase('awaiting-permission');
    setError(null);
    const permission: MotionPermission = await requestMotionPermission();
    if (permission === 'denied') {
      fail('Motion permission was denied. Enable it in browser settings.');
      return;
    }
    if (permission === 'unavailable') {
      fail("Your browser doesn't support motion sensing. Use the simulate button below.");
      return;
    }

    setPhase('listening');
    setProgress(0);

    const watcher = watchForShake({
      durationMs: SHAKE_DURATION_MS,
      onProgress: setProgress,
      onComplete: onQualified,
      onFirstEvent: () => setSeenMotion(true),
    });
    stopWatchRef.current = watcher.stop;

    // If no devicemotion fires (desktop), reveal the simulate fallback.
    noMotionTimerRef.current = window.setTimeout(() => {
      setSeenMotion((prev) => prev); // Trigger re-render via state read in JSX
    }, NO_MOTION_TIMEOUT_MS);
  };

  // Manual trigger for desktop testing — also helpful if a phone's sensor
  // is wonky. Skips the shake threshold and goes straight to qualified.
  const simulate = () => {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
    setProgress(1);
    onQualified();
  };

  const showSimulateFallback =
    (phase === 'listening' && !seenMotion) || phase === 'error';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-500" />
            Shake to join a random team
          </DialogTitle>
          <DialogDescription className="text-left pt-1">
            Your adventure begins with a shake — you'll be matched with an
            open team at random. Could be an easy walk in the park, could be
            a legendary 20-photo hunt. That's the fun.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-4">
          {phase === 'idle' && (
            <>
              <Smartphone className="w-20 h-20 text-purple-400" />
              <p className="text-sm text-gray-600 text-center">
                Hold your phone tight and shake it for{' '}
                <strong>{SHAKE_DURATION_MS / 1000} seconds</strong>.
                <br />
                You'll hear a chime when you're in.
              </p>
            </>
          )}

          {phase === 'awaiting-permission' && (
            <p className="text-sm text-gray-600">Waiting for motion permission…</p>
          )}

          {(phase === 'listening' || phase === 'qualified') && (
            <>
              <Vibrate
                className={`w-20 h-20 text-purple-500 ${
                  progress > 0 ? 'animate-pulse' : ''
                }`}
              />
              <div className="w-full space-y-1">
                <Progress value={progress * 100} className="h-2" />
                <p className="text-xs text-gray-500 text-center">
                  {phase === 'qualified'
                    ? 'Locked in! Joining a team…'
                    : seenMotion
                      ? `Keep shaking… ${Math.round(progress * (SHAKE_DURATION_MS / 1000))}s / ${SHAKE_DURATION_MS / 1000}s`
                      : 'Waiting for motion. Make sure you allow sensor access.'}
                </p>
              </div>
            </>
          )}

          {phase === 'success' && (
            <p className="text-sm text-green-700 font-medium text-center">
              You're in! Check the My Team section.
            </p>
          )}

          {phase === 'error' && error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </div>

        <DialogFooter className="flex-row gap-2">
          {phase === 'idle' && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={start}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
              >
                Start
              </Button>
            </>
          )}

          {(phase === 'listening' ||
            phase === 'awaiting-permission' ||
            phase === 'error') && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              {showSimulateFallback && (
                <Button
                  onClick={phase === 'error' ? start : simulate}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {phase === 'error' ? 'Try again' : 'Simulate shake'}
                </Button>
              )}
            </>
          )}

          {(phase === 'qualified' || phase === 'success') && (
            <Button disabled className="flex-1 bg-purple-500 text-white">
              {phase === 'qualified' ? 'Joining…' : 'Joined!'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
