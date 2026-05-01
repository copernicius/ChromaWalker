import { Award, Camera, Heart, LogIn, LogOut, MapPin, Settings, Star, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Header, PhotoCard, PhotoDetail } from '../components';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import { MOCK_ACHIEVEMENTS, RAINBOW_COLORS } from '../data';
import { queryClient } from '../lib';
import {
  useDeletePhotoMutation,
  useMyBookmarksQuery,
  usePhotosQuery,
  useUpdateProfileMutation,
  useUserLevel,
} from '../queries';
import { useAppStore } from '../store';

export function Profile() {
  const { user, isAuthenticated, logout, setUser } = useAppStore();
  const navigate = useNavigate();
  const { data: allPhotos = [] } = usePhotosQuery();
  const deleteMutation = useDeletePhotoMutation();
  const { current: currentLevel, next: nextLevel, progressPercent: levelProgress } =
    useUserLevel(user.points);
  const userPhotos = allPhotos.filter((p) => p.username === user.username);
  const totalLikes = userPhotos.reduce((sum, photo) => sum + photo.likes, 0);
  const { data: bookmarkIds = [] } = useMyBookmarksQuery();
  const savedPhotos = allPhotos.filter((p) => bookmarkIds.includes(p.id));

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const selectedPhoto = selectedPhotoId
    ? userPhotos.find((p) => p.id === selectedPhotoId) ?? null
    : null;

  const handleConfirmDelete = () => {
    if (!pendingDeleteId || deleteMutation.isPending) return;
    deleteMutation.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success('Photo deleted');
        setPendingDeleteId(null);
      },
      onError: () => {
        toast.error('Could not delete photo. Please try again.');
        setPendingDeleteId(null);
      },
    });
  };

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user.username);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeView, setActiveView] = useState<'photos' | 'achievements'>('photos');
  const updateProfileMutation = useUpdateProfileMutation();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (updateProfileMutation.isPending) return;

    const trimmed = editedUsername.trim();
    if (trimmed.length === 0) {
      toast.error('Username cannot be empty');
      return;
    }

    const usernameChanged = trimmed !== user.username;
    if (!usernameChanged && !avatarFile) {
      setIsEditDialogOpen(false);
      return;
    }

    updateProfileMutation.mutate(
      {
        username: usernameChanged ? trimmed : undefined,
        avatarFile: avatarFile ?? undefined,
      },
      {
        onSuccess: (updated) => {
          setUser(updated);
          setEditedUsername(updated.username);
          setProfileImagePreview(null);
          setAvatarFile(null);
          setIsEditDialogOpen(false);
          toast.success('Profile updated');
        },
        onError: () => {
          toast.error('Could not update profile. Please try again.');
        },
      },
    );
  };

  const handleGoogleLogin = () => {
    navigate('/');
  };

  // Show login screen if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] pb-24">
        <Header title="" />

        <div className="max-w-screen-xl mx-auto px-4 pt-4">
          {/* Brand Header */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-3xl mb-1">
              <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
                Profile
              </span>
            </h1>
          </div>

          <div className="max-w-md mx-auto">
            {/* Login Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg text-center animate-scale-in">
              {/* ChromaWalk Logo/Branding */}
              <div className="mb-8">
                <h1 className="text-4xl mb-2">
                  <span className="font-semibold text-[#2D2520]">Chroma</span>
                  <span
                    className="italic text-[#2D2520]"
                    style={{ fontFamily: 'var(--font-brand-serif)' }}
                  >
                    Walk
                  </span>
                </h1>
                <p className="text-gray-600">Explore colors around you</p>
              </div>

              {/* Colorful Icon */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF8A65] via-[#FFD54F] to-[#9575CD] flex items-center justify-center mx-auto mb-6 animate-pulse">
                <LogIn className="w-12 h-12 text-white" />
              </div>

              {/* Not Logged In Message */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-[#2D2520] mb-3">You're Not Logged In</h2>
                <p className="text-gray-600">
                  Sign in to view your profile, track your progress, and join the ChromaWalk
                  community.
                </p>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-gray-300 text-[#2D2520] px-6 py-4 rounded-full font-semibold text-base hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" role="img" aria-label="Google logo">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Additional Info */}
              <p className="text-xs text-gray-500 mt-6">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>

            {/* Features Preview */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="bg-white/50 rounded-2xl p-4 text-center backdrop-blur-sm">
                <Camera className="w-8 h-8 text-[#FF8A65] mx-auto mb-2" />
                <p className="text-xs text-gray-700 font-medium">Capture Colors</p>
              </div>
              <div className="bg-white/50 rounded-2xl p-4 text-center backdrop-blur-sm">
                <Award className="w-8 h-8 text-[#FFD54F] mx-auto mb-2" />
                <p className="text-xs text-gray-700 font-medium">Earn Rewards</p>
              </div>
              <div className="bg-white/50 rounded-2xl p-4 text-center backdrop-blur-sm">
                <Heart className="w-8 h-8 text-[#FF6B9D] mx-auto mb-2" />
                <p className="text-xs text-gray-700 font-medium">Share & Like</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" />

      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {/* Brand Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl mb-1">
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Profile
            </span>
          </h1>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-gray-600">
                  Lv {currentLevel.level} ·{' '}
                  <span style={{ color: currentLevel.color }} className="font-semibold">
                    {currentLevel.name}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Level Progress */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {nextLevel ? `Progress to ${nextLevel.name}` : 'Max level reached'}
              </span>
              <span className="font-medium">
                {nextLevel
                  ? `${user.points}/${nextLevel.minPoints}`
                  : `${user.points} pts`}
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setActiveView('photos')}
              className={`text-center transition-all ${activeView === 'photos' ? 'scale-105' : 'hover:scale-105'}`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors ${
                  activeView === 'photos' ? 'bg-blue-100' : 'bg-blue-50'
                }`}
              >
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{userPhotos.length}</p>
              <p className="text-xs text-gray-600">Photos</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('achievements')}
              className={`text-center transition-all ${activeView === 'achievements' ? 'scale-105' : 'hover:scale-105'}`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors ${
                  activeView === 'achievements' ? 'bg-yellow-100' : 'bg-yellow-50'
                }`}
              >
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold">
                {MOCK_ACHIEVEMENTS.filter((a) => a.unlocked).length}
              </p>
              <p className="text-xs text-gray-600">Achievements</p>
            </button>
            <div className="text-center">
              <div className="bg-pink-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-2xl font-bold">{totalLikes}</p>
              <p className="text-xs text-gray-600">Likes</p>
            </div>
          </div>
        </div>

        {/* Achievements View */}
        {activeView === 'achievements' && (
          <>
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
          </>
        )}

        {/* Photos View */}
        {activeView === 'photos' && (
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="photos" className="flex-1">
                My Photos
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">
                Saved
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex-1">
                Locations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              {userPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {userPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={() => setSelectedPhotoId(photo.id)}
                      onDelete={() => setPendingDeleteId(photo.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No photos yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved">
              {savedPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {savedPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={() => setSelectedPhotoId(photo.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No saved photos yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tap the star on any photo to save it here
                  </p>
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
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open && updateProfileMutation.isPending) return;
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="bg-[#F5F1ED] border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#2D2520]">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="profile-image" className="text-sm font-medium text-[#2D2520]">
                Profile Image
              </Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 aspect-square shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 grid place-items-center text-white text-2xl font-bold overflow-hidden">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="block w-full h-full object-cover"
                    />
                  ) : user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      referrerPolicy="no-referrer"
                      className="block w-full h-full object-cover"
                    />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <label
                    htmlFor="profile-image"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#2D2520] rounded-full text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-[#2D2520]">
                Username
              </Label>
              <Input
                id="username"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="bg-white border-gray-300 focus:border-[#C89F7B] focus:ring-[#C89F7B]"
                placeholder="Enter your username"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateProfileMutation.isPending}
                className="flex-1 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="flex-1 bg-[#2D2520] hover:bg-[#3D3530] text-white"
              >
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  queryClient.clear();
                  setIsEditDialogOpen(false);
                  navigate('/');
                }}
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDeleteId(null);
        }}
      >
        <DialogContent className="bg-white border-none sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold text-[#2D2520]">
              Delete this photo?
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              This action can't be undone. The photo and any points it earned will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={deleteMutation.isPending}
              className="flex-1 border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Modal — same component the Gallery uses */}
      {selectedPhoto && (
        <PhotoDetail photo={selectedPhoto} onClose={() => setSelectedPhotoId(null)} />
      )}
    </div>
  );
}
