import { Zap } from 'lucide-react';
import { Link } from 'react-router';
import { getPaletteColor } from '../data';
import { useDailyMissionQuery, useMyMissionProgressQuery } from '../queries';

// Single source of truth for the daily mission card. Used on both Home and
// Missions so the visual stays in lockstep.
//
// Loading: the card frame always renders. We fall back to "Loading…" /
// neutral background while the daily mission query is in flight, which
// avoids the layout shift (and visible flash) caused by conditionally
// mounting the card after fetch. After the first load `useDailyMissionQuery`
// is cached for an hour so subsequent navigations are instant.

export function DailyMissionCard() {
  const { data: dailyMission } = useDailyMissionQuery();
  const { data: missionProgress = {} } = useMyMissionProgressQuery();
  const dailyCompleted =
    !!dailyMission &&
    (missionProgress[dailyMission.id] ?? 0) >= (dailyMission.total ?? 1);

  // Morandi swatch keyed off the day's color — falls back to a neutral
  // taupe while loading so the tile doesn't flash a different color when
  // data arrives.
  const swatch = dailyMission ? getPaletteColor(dailyMission.color) : null;
  const bg = swatch?.morandi ?? '#9E9E9E';

  return (
    <div
      className="rounded-3xl p-6 shadow-sm text-white relative overflow-hidden animate-scale-in hover:shadow-lg hover:scale-[1.02] transition-all"
      style={{ backgroundColor: bg }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 fill-white animate-pulse" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Daily Challenge
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-2">
          {dailyMission?.title ?? 'Loading…'}
        </h3>
        <p className="text-sm opacity-90 mb-5">
          {dailyMission?.description ?? "Today's color challenge"}
          <br />
          earn{' '}
          <span className="font-semibold">
            +{dailyMission?.reward ?? 20} bonus points
          </span>
        </p>
        {dailyMission &&
          (dailyCompleted ? (
            <span className="inline-flex items-center gap-1.5 bg-white/90 text-green-700 px-6 py-3 rounded-full font-semibold text-sm shadow-md cursor-not-allowed">
              ✓ Completed today
            </span>
          ) : (
            <Link
              to={`/upload?taskType=daily&missionId=${dailyMission.id}`}
              className="inline-block bg-white text-[#2D2520] px-6 py-3 rounded-full font-semibold text-sm hover:bg-gray-100 transition-all shadow-md hover:scale-105 active:scale-95"
            >
              Start Challenge
            </Link>
          ))}
      </div>
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 animate-pulse"
        style={{ backgroundColor: bg }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 animate-pulse delay-75"
        style={{ backgroundColor: bg }}
      />
    </div>
  );
}
