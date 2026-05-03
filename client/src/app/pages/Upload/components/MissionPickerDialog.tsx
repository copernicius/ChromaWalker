import { MapPin, Sparkles, Target, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui';
import { getPaletteColor } from '../../../data';
import {
  useMyMissionProgressQuery,
  useMyTeamMissionsQuery,
  useSoloMissionsQuery,
} from '../../../queries';

interface Props {
  pendingType: 'solo' | 'team' | null;
  onSelect: (missionId: string) => void;
  onClose: () => void;
}

interface CandidateRow {
  id: string;
  title: string;
  description: string;
  color: string;
  reward: number;
  location?: string;
  completed?: boolean;
}

export function MissionPickerDialog({ pendingType, onSelect, onClose }: Props) {
  const open = pendingType !== null;

  const { data: soloMissions = [] } = useSoloMissionsQuery();
  const { data: myTeamMissions = [] } = useMyTeamMissionsQuery();
  const { data: missionProgress = {} } = useMyMissionProgressQuery();

  const candidates: CandidateRow[] =
    pendingType === 'solo'
      ? soloMissions.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          color: m.color,
          reward: m.reward,
          location: m.location,
          // Completed missions stay visible but the tile is disabled below.
          completed: (missionProgress[m.id] ?? 0) >= (m.total ?? 1),
        }))
      : pendingType === 'team'
        ? myTeamMissions
            // Only `in_progress` teams accept contributions.
            .filter((t) => t.status === 'in_progress')
            .map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              color: t.color,
              reward: t.reward,
              location: t.location,
            }))
        : [];

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#F5F1ED] border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2D2520] flex items-center gap-2">
            {pendingType === 'solo' ? (
              <>
                <Target className="w-6 h-6 text-blue-500" />
                Select Solo Mission
              </>
            ) : (
              <>
                <Users className="w-6 h-6 text-purple-500" />
                Pick Team Mission
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {pendingType === 'solo'
              ? 'Choose a solo mission to complete on your own'
              : 'Pick one of your active team missions to contribute to'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto py-4">
          {candidates.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">
              {pendingType === 'team'
                ? 'No active team missions. Join or start one in Missions.'
                : 'No missions available.'}
            </p>
          ) : (
            candidates.map((mission) => {
              const missionColor = getPaletteColor(mission.color);
              const isRainbow = mission.color === 'rainbow';
              const isCompleted = mission.completed === true;
              return (
                <button
                  type="button"
                  key={mission.id}
                  onClick={() => onSelect(mission.id)}
                  disabled={isCompleted}
                  className={`w-full rounded-2xl p-4 transition-all text-left bg-white border-2 border-transparent ${
                    isCompleted
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:shadow-lg active:scale-95 hover:border-[#2D2520]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center ${
                        isRainbow
                          ? 'bg-gradient-to-br from-[#FF8A65] via-[#FFD54F] to-[#9575CD]'
                          : ''
                      }`}
                      style={
                        isRainbow ? undefined : { backgroundColor: missionColor?.morandi }
                      }
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-[#2D2520]">{mission.title}</p>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            isCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-[#FFD54F]/20 text-[#F4C430]'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : `+${mission.reward} pts`}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {mission.description}
                      </p>
                      {/* Highlighted target-color chip — literal name so the
                          actionable instruction is unambiguous. */}
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold mt-1"
                        style={{
                          backgroundColor: isRainbow
                            ? 'rgba(0,0,0,0.05)'
                            : `${missionColor?.morandi ?? '#9E9E9E'}33`,
                          color: '#2D2520',
                        }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background: isRainbow
                              ? 'linear-gradient(135deg, #B86060, #C08762, #7E9683, #5F7B96)'
                              : (missionColor?.morandi ?? '#9E9E9E'),
                          }}
                          aria-hidden
                        />
                        Find {isRainbow ? 'Any color' : (missionColor?.name ?? mission.color)}
                      </span>
                      {mission.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {mission.location}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
