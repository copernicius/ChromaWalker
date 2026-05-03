// Resolves a missionId to a unified Mission object across all three
// sources: today's daily (config), solo catalog (config), and the user's
// team missions (DB). Adapts the team mission shape so consumers don't
// have to branch on source.

import { useMemo } from 'react';
import type { Mission } from '../../data';
import {
  useDailyMissionQuery,
  useMyTeamMissionsQuery,
  useSoloMissionsQuery,
} from '../../queries';

export interface SelectedMission {
  /** The active mission resolved from the missionId, or null. */
  mission: Mission | null;
  /** Today's daily mission — surfaced for UI hints (banner, "completed today"). */
  dailyMission: Mission | null;
}

export function useSelectedMission(missionId: string | null): SelectedMission {
  const { data: dailyMission } = useDailyMissionQuery();
  const { data: soloMissions = [] } = useSoloMissionsQuery();
  const { data: myTeamMissions = [] } = useMyTeamMissionsQuery();

  const mission = useMemo<Mission | null>(() => {
    if (!missionId) return null;
    if (dailyMission && dailyMission.id === missionId) return dailyMission;
    const solo = soloMissions.find((m) => m.id === missionId);
    if (solo) return solo;
    const team = myTeamMissions.find((t) => t.id === missionId);
    if (team) {
      return {
        id: team.id,
        title: team.title,
        description: team.description,
        difficulty: 'medium',
        reward: team.reward,
        color: team.color,
        total: team.target,
        progress: team.currentProgress,
        completed: team.status === 'completed',
        teamMission: true,
      };
    }
    return null;
  }, [missionId, dailyMission, soloMissions, myTeamMissions]);

  return { mission, dailyMission: dailyMission ?? null };
}
