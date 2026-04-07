import { Camera, Sparkles, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { PhotoCard } from '../components/PhotoCard';
import { Progress } from '../components/ui/progress';
import { MOCK_PHOTOS, MOCK_USER, RAINBOW_COLORS } from '../data/mockData';

export const Home = () => {
  const levelProgress = useMemo(() => (MOCK_USER.points / MOCK_USER.nextLevelPoints) * 100, []);
  const recentPhotos = useMemo(() => MOCK_PHOTOS.slice(0, 4), []);
  const dailyColor = useMemo(() => RAINBOW_COLORS[new Date().getDay() % RAINBOW_COLORS.length], []);

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24 pt-6">
      <div className="max-w-screen-xl mx-auto px-4">
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
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center text-white font-semibold shadow-md hover:scale-110 transition-transform active:scale-95"
            >
              {MOCK_USER.username[0].toUpperCase()}
            </Link>
          </div>
          <p className="text-gray-600">Explore colors around you</p>
        </div>

        {/* User Stats Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 animate-slide-up hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-gray-500 mb-1">Welcome back,</p>
              <p className="text-2xl font-semibold">{MOCK_USER.username}</p>
            </div>
            <div className="text-right">
              <div className="bg-[#2D2520] text-white px-4 py-2 rounded-full animate-pulse">
                <p className="text-xs">Level {MOCK_USER.level}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFD54F] animate-pulse" />
                Progress to Level {MOCK_USER.level + 1}
              </span>
              <span className="font-semibold text-[#2D2520]">
                {MOCK_USER.points}/{MOCK_USER.nextLevelPoints}
              </span>
            </div>
            <Progress value={levelProgress} className="h-2.5 bg-[#E8DFD8]" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            className="bg-white rounded-2xl p-5 shadow-sm text-center animate-slide-up hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-10 h-10 bg-[#FF8A65]/10 rounded-full flex items-center justify-center mx-auto mb-3 hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-[#FF8A65]" />
            </div>
            <p className="text-2xl font-bold text-[#2D2520]">{MOCK_USER.photosUploaded}</p>
            <p className="text-xs text-gray-600 mt-1">Photos</p>
          </div>
          <div
            className="bg-white rounded-2xl p-5 shadow-sm text-center animate-slide-up hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="w-10 h-10 bg-[#FFD54F]/20 rounded-full flex items-center justify-center mx-auto mb-3 hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 text-[#F4C430]" />
            </div>
            <p className="text-2xl font-bold text-[#2D2520]">{MOCK_USER.missionsCompleted}</p>
            <p className="text-xs text-gray-600 mt-1">Missions</p>
          </div>
          <div
            className="bg-white rounded-2xl p-5 shadow-sm text-center animate-slide-up hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-10 h-10 bg-[#8BA888]/10 rounded-full flex items-center justify-center mx-auto mb-3 hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-[#8BA888]" />
            </div>
            <p className="text-2xl font-bold text-[#2D2520]">{RAINBOW_COLORS.length}</p>
            <p className="text-xs text-gray-600 mt-1">Colors</p>
          </div>
        </div>

        {/* Daily Color Challenge */}
        <div
          className="rounded-3xl p-6 shadow-sm mb-6 text-white relative overflow-hidden animate-scale-in hover:shadow-lg hover:scale-102 transition-all cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${dailyColor.hex} 0%, ${dailyColor.hex}dd 100%)`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 fill-white animate-pulse" />
              <span className="text-sm font-medium uppercase tracking-wide">Daily Challenge</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Find {dailyColor.name}!</h3>
            <p className="text-sm opacity-90 mb-5">
              Capture something {dailyColor.name.toLowerCase()} today
              <br />
              and earn <span className="font-semibold">+30 bonus points</span>
            </p>
            <Link
              to="/upload"
              className="inline-block bg-white text-[#2D2520] px-6 py-3 rounded-full font-semibold text-sm hover:bg-gray-100 transition-all shadow-md hover:scale-105 active:scale-95"
            >
              Start Challenge
            </Link>
          </div>
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 animate-pulse"
            style={{ background: dailyColor.hex }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 animate-pulse delay-75"
            style={{ background: dailyColor.hex }}
          />
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
          <div className="grid grid-cols-2 gap-3">
            {recentPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <PhotoCard photo={photo} />
              </div>
            ))}
          </div>
        </div>

        {/* Color Palette Quick Access */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Explore Colors</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-7 gap-2">
              {RAINBOW_COLORS.map((color, index) => (
                <Link
                  key={color.id}
                  to={`/gallery/${color.id}`}
                  className="aspect-square rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-110 active:scale-95 animate-scale-in"
                  style={{
                    backgroundColor: color.hex,
                    animationDelay: `${index * 0.05}s`,
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
