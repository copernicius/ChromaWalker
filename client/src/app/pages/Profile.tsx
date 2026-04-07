import { Award, Camera, MapPin, Settings, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Header } from '../components/Header';
import { PhotoCard } from '../components/PhotoCard';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MOCK_ACHIEVEMENTS, MOCK_PHOTOS, MOCK_USER, RAINBOW_COLORS } from '../data/mockData';

export const Profile = () => {
  const levelProgress = useMemo(() => (MOCK_USER.points / MOCK_USER.nextLevelPoints) * 100, []);
  const userPhotos = useMemo(
    () => MOCK_PHOTOS.filter((p) => p.username === MOCK_USER.username),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Profile" />

      <div className="max-w-screen-xl mx-auto px-4 pt-20">
        {/* Profile Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {MOCK_USER.username[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{MOCK_USER.username}</h2>
                <p className="text-gray-600">Level {MOCK_USER.level} Explorer</p>
              </div>
            </div>
            <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Level Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress to Level {MOCK_USER.level + 1}</span>
              <span className="font-medium">
                {MOCK_USER.points}/{MOCK_USER.nextLevelPoints}
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{MOCK_USER.photosUploaded}</p>
              <p className="text-xs text-gray-600">Photos</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold">{MOCK_USER.missionsCompleted}</p>
              <p className="text-xs text-gray-600">Missions</p>
            </div>
            <div className="text-center">
              <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{MOCK_USER.points}</p>
              <p className="text-xs text-gray-600">Points</p>
            </div>
          </div>
        </div>

        {/* Unlocked Colors */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Unlocked Colors</h3>
          <div className="grid grid-cols-7 gap-2">
            {RAINBOW_COLORS.map((color) => (
              <div
                key={color.id}
                className="aspect-square rounded-lg shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Achievements</h3>
          <div className="space-y-3">
            {MOCK_ACHIEVEMENTS.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border ${
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {achievement.unlocked ? '🏆' : '🔒'}
                    </div>
                    <div>
                      <p className="font-semibold">{achievement.name}</p>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                </div>
                {!achievement.unlocked && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / achievement.total) * 100}
                      className="h-1.5"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Content */}
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="photos" className="flex-1">
              My Photos
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex-1">
              Locations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            {userPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {userPhotos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No photos yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locations">
            <div className="bg-white rounded-lg p-5">
              <div className="space-y-3">
                {Array.from(new Set(userPhotos.map((p) => p.location))).map((location) => {
                  const count = userPhotos.filter((p) => p.location === location).length;
                  return (
                    <div
                      key={location}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">{location}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count} photos</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
