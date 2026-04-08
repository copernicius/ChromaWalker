import { Crown, MapPin, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import type { Mission } from '../data/mockData';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
  const difficultyConfig = {
    easy: {
      bgGradient: 'linear-gradient(135deg, #8db3a8 0%, #7a9e93 100%)',
      bgColor: '#8db3a8',
      icon: Zap,
    },
    medium: {
      bgGradient: 'linear-gradient(135deg, #d4b598 0%, #c2a688 100%)',
      bgColor: '#d4b598',
      icon: Sparkles,
    },
    hard: {
      bgGradient: 'linear-gradient(135deg, #d4a994 0%, #c29a82 100%)',
      bgColor: '#d4a994',
      icon: Trophy,
    },
    legendary: {
      bgGradient: 'linear-gradient(135deg, #c0a5d4 0%, #d4a8c2 100%)',
      bgColor: '#c0a5d4',
      icon: Crown,
    },
  };

  const config = difficultyConfig[mission.difficulty];
  const DifficultyIcon = config.icon;

  const progressPercentage = mission.total ? ((mission.progress ?? 0) / mission.total) * 100 : 0;

  return (
    <button
      type="button"
      className="rounded-3xl p-6 shadow-sm text-white relative overflow-hidden cursor-pointer hover:shadow-lg hover:scale-102 transition-all w-full text-left"
      style={{ background: config.bgGradient }}
      onClick={onClick}
    >
      {/* Decorative background circles */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 animate-pulse"
        style={{ background: config.bgColor }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 animate-pulse delay-75"
        style={{ background: config.bgColor }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DifficultyIcon className="w-5 h-5 fill-white" />
              <span className="text-sm font-medium uppercase tracking-wide opacity-90">
                {mission.difficulty} Mission
              </span>
              {mission.teamMission && <Users className="w-4 h-4 ml-1" />}
            </div>
            <h3 className="text-2xl font-bold mb-2">{mission.title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">{mission.description}</p>
          </div>
        </div>

        {/* Mission Details */}
        <div className="flex items-center gap-3 mb-4">
          {mission.location && (
            <div className="flex items-center gap-1.5 text-sm opacity-90">
              <MapPin className="w-4 h-4" />
              <span>{mission.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Trophy className="w-4 h-4" />
            <span>+{mission.reward} points</span>
          </div>
        </div>

        {/* Progress Bar */}
        {mission.total && mission.total > 1 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium opacity-90">Progress</span>
              <span className="font-bold">
                {mission.progress}/{mission.total}
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-white h-2.5 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action */}
        <button
          type="button"
          className="inline-block bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md hover:scale-105 active:scale-95"
        >
          {mission.completed ? 'Completed' : 'Start Mission'}
        </button>
      </div>
    </button>
  );
}
