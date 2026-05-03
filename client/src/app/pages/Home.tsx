import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { DailyMissionCard, PhotoCard, PhotoDetail } from '../components';
import { Progress } from '../components/ui';
import { usePhotosQuery, useUserLevel } from '../queries';
import { useAppStore } from '../store';

export function Home() {
  const { user } = useAppStore();
  const { data: photos, isLoading, isError } = usePhotosQuery();
  const { current, next, pointsForNextLevel, progressPercent } = useUserLevel(user.points);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const selectedPhotoData = selectedPhoto ? photos?.find((p) => p.id === selectedPhoto) : null;

  // Get recent photos
  const recentPhotos = photos?.slice(0, 4) ?? [];

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <div className="max-w-screen-xl mx-auto px-4 pt-8">
        {/* Header with Branding */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl">
                <span className="font-semibold">Chroma</span>
                <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
                  Walk
                </span>
              </h1>
            </div>
            <Link
              to="/profile"
              className="w-12 h-12 rounded-full overflow-hidden shadow-md hover:scale-110 transition-transform active:scale-95"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center text-white font-semibold">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </Link>
          </div>
          <p className="text-gray-600">Explore colors around you</p>
        </div>

        {/* User Stats Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 animate-slide-up hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-gray-500 mb-1">Welcome back,</p>
              <p className="text-2xl font-semibold">{user.username}</p>
            </div>
            <div className="text-right">
              <div
                className="text-white px-4 py-2 rounded-full animate-pulse"
                style={{ backgroundColor: current.color }}
              >
                <p className="text-xs">
                  Lv {current.level} · {current.name}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFD54F] animate-pulse" />
                {next ? `Progress to ${next.name}` : 'Max level reached'}
              </span>
              <span className="font-semibold text-[#2D2520]">
                {next ? `${user.points}/${current.minPoints + pointsForNextLevel}` : `${user.points} pts`}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2.5 bg-[#E8DFD8]" />
          </div>
        </div>

        {/* Daily Color Challenge — shared component, identical on Missions page. */}
        <div className="mb-6">
          <DailyMissionCard />
        </div>

        {/* Recent Discoveries */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Discoveries</h2>
            <Link
              to="/galleries"
              className="text-sm text-[#C89F7B] font-medium hover:text-[#B08968] transition-colors"
            >
              View All →
            </Link>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gray-200 animate-pulse"
                />
              ))}
            </div>
          )}

          {isError && (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-red-600">
              Could not load photos. Please try again later.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid grid-cols-2 gap-3">
              {recentPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PhotoCard photo={photo} onClick={() => setSelectedPhoto(photo.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhotoData && (
        <PhotoDetail photo={selectedPhotoData} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
