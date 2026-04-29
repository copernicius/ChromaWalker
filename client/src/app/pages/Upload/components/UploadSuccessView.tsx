import { Check } from 'lucide-react';
import type { TaskType } from '../domain';

interface ColorMeta {
  id: string;
  name: string;
  hex: string;
}

interface Props {
  detectedColor: ColorMeta | null;
  taskType: TaskType;
  pointsEarned: number;
}

export function UploadSuccessView({ detectedColor, taskType, pointsEarned }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24 flex items-center justify-center px-4 animate-fade-in">
      <div className="text-center animate-scale-in">
        <div className="w-24 h-24 bg-[#8BA888] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <Check className="w-14 h-14 text-white" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-[#2D2520] animate-fade-in">Photo Uploaded!</h2>
        {detectedColor && (
          <div
            className="flex items-center justify-center gap-2 mb-2 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: detectedColor.hex }}
            />
            <p className="text-sm text-gray-600">{detectedColor.name} detected</p>
          </div>
        )}
        {taskType && (
          <p
            className="text-sm text-gray-600 mb-2 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            {taskType === 'daily' && '✨ Daily Challenge completed!'}
            {taskType === 'solo' && '🎯 Solo Mission progress updated!'}
            {taskType === 'team' && '👥 Team Mission contribution added!'}
          </p>
        )}
        <p
          className="text-lg text-[#C89F7B] mb-2 font-semibold animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          +{pointsEarned} points earned
        </p>
        <p className="text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Redirecting to galleries...
        </p>
      </div>
    </div>
  );
}
