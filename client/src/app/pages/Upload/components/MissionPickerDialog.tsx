import { MapPin, Sparkles, Target, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui';
import { type Mission, RAINBOW_COLORS } from '../../../data';
import { useMissionsQuery } from '../../../queries';

interface Props {
  pendingType: 'solo' | 'team' | null;
  onSelect: (missionId: string) => void;
  onClose: () => void;
}

export function MissionPickerDialog({ pendingType, onSelect, onClose }: Props) {
  const open = pendingType !== null;
  const { data: missions = [] } = useMissionsQuery();
  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  const candidates = pendingType
    ? missions
        .filter((m: Mission) => (pendingType === 'team' ? m.teamMission : !m.teamMission))
        .filter((m) => !m.completed)
    : [];

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
                Select Team Mission
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {pendingType === 'solo'
              ? 'Choose a solo mission to complete on your own'
              : 'Choose a team mission to complete with your teammates'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto py-4">
          {candidates.map((mission) => {
            const missionColor = RAINBOW_COLORS.find((c) => c.id === mission.color);
            return (
              <button
                type="button"
                key={mission.id}
                onClick={() => onSelect(mission.id)}
                className="w-full rounded-2xl p-4 transition-all text-left bg-white hover:shadow-lg active:scale-95 border-2 border-transparent hover:border-[#2D2520]"
              >
                <div className="flex items-start gap-3">
                  {missionColor && mission.color !== 'rainbow' && (
                    <div
                      className="w-12 h-12 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: missionColor.hex }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {mission.color === 'rainbow' && (
                    <div className="w-12 h-12 rounded-xl shadow-md flex-shrink-0 bg-gradient-to-br from-[#FF8A65] via-[#FFD54F] to-[#9575CD] flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-bold text-[#2D2520]">{mission.title}</p>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD54F]/20 text-[#F4C430] flex-shrink-0">
                        +{mission.reward} pts
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Color:</span>
                      <span className="font-semibold text-[#2D2520]">
                        {mission.color === 'rainbow' ? 'Any color' : missionColor?.name}
                      </span>
                    </div>
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
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
