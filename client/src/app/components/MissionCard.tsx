import { MapPin, Users } from 'lucide-react';
import type { Mission } from '../data/mockData';
import { Badge } from './ui/badge';

export interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-orange-100 text-orange-800',
    legendary: 'bg-purple-100 text-purple-800',
  };

  const progressPercentage = mission.total ? ((mission.progress ?? 0) / mission.total) * 100 : 0;

  return (
    <button
      type="button"
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 w-full text-left"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold">{mission.title}</h3>
            {mission.teamMission && <Users className="w-4 h-4 text-blue-500" />}
          </div>
          <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={difficultyColors[mission.difficulty]}>{mission.difficulty}</Badge>

          {mission.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{mission.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-yellow-600">+{mission.reward} pts</span>
        </div>
      </div>

      {mission.total && mission.total > 1 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>
              {mission.progress}/{mission.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
