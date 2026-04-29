import { Target, Users, X, Zap } from 'lucide-react';
import type { Mission } from '../../../data';
import type { TaskType } from '../domain';

interface ColorMeta {
  id: string;
  name: string;
  hex: string;
}

interface Props {
  taskType: TaskType;
  selectedMission: Mission | null;
  dailyColor: ColorMeta;
  onSelectDaily: () => void;
  onRequestMission: (type: 'solo' | 'team') => void;
  onClearTask: () => void;
}

export function TaskTypeSelector({
  taskType,
  selectedMission,
  dailyColor,
  onSelectDaily,
  onRequestMission,
  onClearTask,
}: Props) {
  return (
    <div className="mb-6 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <span className="block text-sm font-semibold text-[#2D2520]">
          {taskType ? 'Selected Task' : 'What is this photo for?'}
        </span>
        {taskType && (
          <button
            type="button"
            onClick={onClearTask}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancel Task
          </button>
        )}
      </div>

      {!taskType ? (
        <>
          <p className="text-xs text-gray-600 mb-3">
            Choose a task to earn extra points, or skip to upload for basic points
          </p>
          <div className="space-y-3">
            {/* Daily Challenge */}
            <button
              type="button"
              onClick={onSelectDaily}
              className="w-full rounded-2xl p-4 transition-all text-left bg-white border-2 border-gray-200 hover:border-[#FF8A65]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${dailyColor.hex} 0%, ${dailyColor.hex}dd 100%)`,
                  }}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1 text-[#2D2520]">Daily Challenge</p>
                  <p className="text-sm text-gray-600">Find {dailyColor.name} today</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD54F]/20 text-[#F4C430]">
                  +20 pts
                </div>
              </div>
            </button>

            {/* Solo Mission */}
            <button
              type="button"
              onClick={() => onRequestMission('solo')}
              className="w-full rounded-2xl p-4 transition-all text-left bg-white border-2 border-gray-200 hover:border-blue-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-400">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1 text-[#2D2520]">Solo Mission</p>
                  <p className="text-sm text-gray-600">Complete a personal mission</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                  Varies
                </div>
              </div>
            </button>

            {/* Team Mission */}
            <button
              type="button"
              onClick={() => onRequestMission('team')}
              className="w-full rounded-2xl p-4 transition-all text-left bg-white border-2 border-gray-200 hover:border-purple-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-pink-400">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1 text-[#2D2520]">Team Mission</p>
                  <p className="text-sm text-gray-600">Contribute to your team's goal</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-600">
                  Varies
                </div>
              </div>
            </button>
          </div>
          <button
            type="button"
            onClick={onClearTask}
            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Skip task selection (+10 pts)
          </button>
        </>
      ) : (
        <>
          {taskType === 'daily' && (
            <div className="bg-gradient-to-r from-[#FF8A65]/10 to-[#FFD54F]/10 border-2 border-[#FF8A65]/30 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${dailyColor.hex} 0%, ${dailyColor.hex}dd 100%)`,
                  }}
                >
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#2D2520]">Daily Challenge</p>
                  <p className="text-sm text-gray-600">Find {dailyColor.name} today</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD54F]/20 text-[#F4C430]">
                  +20 pts
                </div>
              </div>
            </div>
          )}

          {selectedMission && (taskType === 'solo' || taskType === 'team') && (
            <div
              className={`border-2 rounded-2xl p-4 ${
                taskType === 'solo'
                  ? 'bg-blue-50/50 border-blue-300'
                  : 'bg-purple-50/50 border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {taskType === 'solo' ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">
                    {taskType === 'solo' ? 'Solo Mission' : 'Team Mission'}
                  </p>
                  <p className="font-bold text-[#2D2520]">{selectedMission.title}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD54F]/20 text-[#F4C430]">
                    +{selectedMission.reward} pts
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequestMission(taskType)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
