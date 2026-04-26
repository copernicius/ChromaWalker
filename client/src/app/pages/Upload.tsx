import { Camera, Check, ImagePlus, MapPin, Sparkles, Target, Users, X, Zap } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { LocationPicker } from '../components/LocationPicker';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { MOCK_MISSIONS, RAINBOW_COLORS } from '../data/mockData';
import { useAppStore } from '../store/appStore';

type TaskType = 'daily' | 'solo' | 'team' | null;

export function Upload() {
  const navigate = useNavigate();
  const { token } = useAppStore();
  const [location, setLocation] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploaded, setUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>(null);
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [colorTested, setColorTested] = useState(false);
  const [detectedColor, setDetectedColor] = useState<string>('');
  const [colorTestPassed, setColorTestPassed] = useState(false);
  const [testingColor, setTestingColor] = useState(false);
  const [showMissionDialog, setShowMissionDialog] = useState(false);
  const [pendingTaskType, setPendingTaskType] = useState<'solo' | 'team' | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get daily color (same logic as Home page)
  const dailyColor = RAINBOW_COLORS[new Date().getDay() % RAINBOW_COLORS.length];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setColorTested(false);
        setColorTestPassed(false);
        setDetectedColor('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle mission selection
  const handleMissionSelect = (missionId: string) => {
    setSelectedMission(missionId);
    setShowMissionDialog(false);
    // Set task type from pending
    if (pendingTaskType) {
      setSelectedTaskType(pendingTaskType);
      setPendingTaskType(null);
    }

    // If color was already tested, check if it matches the new mission
    if (colorTested && detectedColor) {
      const mission = MOCK_MISSIONS.find((m) => m.id === missionId);
      if (mission && mission.color !== 'rainbow') {
        const passed = detectedColor === mission.color;
        setColorTestPassed(passed);
      } else {
        // Rainbow mission accepts any color
        setColorTestPassed(true);
      }
    } else {
      // No color tested yet, reset
      setColorTested(false);
      setColorTestPassed(false);
      setDetectedColor('');
    }
  };

  const handleOpenMissionDialog = (taskType: 'solo' | 'team') => {
    setPendingTaskType(taskType);
    setShowMissionDialog(true);
  };

  // Simulate color detection API call
  const handleTestColor = async () => {
    if (!imagePreview) return;

    setTestingColor(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate color detection - randomly pick a color
    // In production, this would call your backend API with the image
    // Example: const response = await fetch('/api/detect-color', { method: 'POST', body: imageFile })
    const randomColor = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
    const detected = randomColor.id;
    setDetectedColor(detected);

    // Determine required color based on task type
    let requiredColor = '';
    if (selectedTaskType === 'daily') {
      requiredColor = dailyColor.id;
    } else if (selectedMission) {
      const mission = MOCK_MISSIONS.find((m) => m.id === selectedMission);
      if (mission && mission.color !== 'rainbow') {
        requiredColor = mission.color;
      }
    }

    // Check if detected color matches required color
    // If no required color (user skipped task selection), always pass
    const passed = !requiredColor || detected === requiredColor;
    setColorTestPassed(passed);
    setColorTested(true);
    setTestingColor(false);
  };

  const handleRetryPhoto = () => {
    setImagePreview('');
    setColorTested(false);
    setColorTestPassed(false);
    setDetectedColor('');
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: imagePreview,
          location,
          color: detectedColor,
          taskType: selectedTaskType,
          missionId: selectedMission || undefined,
        }),
      });

      if (!res.ok) throw new Error('Upload failed');

      setUploaded(true);
      setTimeout(() => {
        navigate('/galleries');
      }, 2000);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (uploaded) {
    const pointsEarned =
      selectedTaskType === 'daily'
        ? 20
        : selectedMission
          ? MOCK_MISSIONS.find((m) => m.id === selectedMission)?.reward || 10
          : 10;

    return (
      <div className="min-h-screen bg-[#F5F1ED] pb-24 flex items-center justify-center px-4 animate-fade-in">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-[#8BA888] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-[#2D2520] animate-fade-in">
            Photo Uploaded!
          </h2>
          {detectedColor && (
            <div
              className="flex items-center justify-center gap-2 mb-2 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: RAINBOW_COLORS.find((c) => c.id === detectedColor)?.hex }}
              />
              <p className="text-sm text-gray-600">
                {RAINBOW_COLORS.find((c) => c.id === detectedColor)?.name} detected
              </p>
            </div>
          )}
          {selectedTaskType && (
            <p
              className="text-sm text-gray-600 mb-2 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {selectedTaskType === 'daily' && '✨ Daily Challenge completed!'}
              {selectedTaskType === 'solo' && '🎯 Solo Mission progress updated!'}
              {selectedTaskType === 'team' && '👥 Team Mission contribution added!'}
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

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" showBack />

      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2D2520] mb-2">
            Upload{' '}
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Photo
            </span>
          </h1>
          <p className="text-gray-600">Share your color discovery</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-[#2D2520]">Choose Photo</h3>

          {imagePreview ? (
            <div className="mb-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRetryPhoto}
                  className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Color Test Button and Results */}
              {!colorTested && !testingColor && (
                <div className="animate-fade-in">
                  <button
                    type="button"
                    onClick={handleTestColor}
                    className="w-full bg-gradient-to-r from-[#4DB6AC] to-[#8BA888] text-white py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    {selectedTaskType === 'daily' || selectedMission
                      ? 'Test Color Match'
                      : 'Detect Color'}
                  </button>
                  <p className="text-xs text-gray-600 text-center mt-2 transition-opacity">
                    {selectedTaskType === 'daily' || selectedMission ? (
                      <>
                        Will check if photo contains:{' '}
                        <span className="font-semibold text-[#2D2520]">
                          {selectedTaskType === 'daily'
                            ? dailyColor.name
                            : RAINBOW_COLORS.find(
                                (c) =>
                                  c.id ===
                                  MOCK_MISSIONS.find((m) => m.id === selectedMission)?.color,
                              )?.name || 'Any color'}
                        </span>
                      </>
                    ) : (
                      'AI will detect the dominant color in your photo'
                    )}
                  </p>
                </div>
              )}

              {testingColor && (
                <div className="w-full bg-white border-2 border-gray-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-600 animate-fade-in">
                  <div className="w-5 h-5 border-2 border-[#4DB6AC] border-t-transparent rounded-full animate-spin" />
                  Analyzing color...
                </div>
              )}

              {colorTested && (
                <div
                  className={`w-full rounded-3xl overflow-hidden shadow-lg transition-all animate-scale-in ${
                    colorTestPassed
                      ? 'bg-white ring-2 ring-green-400 ring-offset-2'
                      : 'bg-white ring-2 ring-red-400 ring-offset-2'
                  }`}
                >
                  {/* Color Display Header */}
                  <div
                    className="p-6 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${RAINBOW_COLORS.find((c) => c.id === detectedColor)?.hex}dd 0%, ${RAINBOW_COLORS.find((c) => c.id === detectedColor)?.hex}99 100%)`,
                    }}
                  >
                    {/* Decorative circles */}
                    <div
                      className="absolute -top-4 -right-4 w-32 h-32 rounded-full opacity-20 animate-pulse"
                      style={{
                        backgroundColor: RAINBOW_COLORS.find((c) => c.id === detectedColor)?.hex,
                      }}
                    />
                    <div
                      className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-15 animate-pulse"
                      style={{
                        backgroundColor: RAINBOW_COLORS.find((c) => c.id === detectedColor)?.hex,
                      }}
                    />

                    <div className="relative z-10 flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {colorTestPassed ? (
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl animate-bounce">
                            <Check className="w-9 h-9 text-green-500" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                            <span className="text-3xl font-bold text-red-500">✕</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-2xl mb-1.5 drop-shadow-sm">
                          {RAINBOW_COLORS.find((c) => c.id === detectedColor)?.name}
                        </p>
                        <p className="text-white/95 text-sm tracking-wide">
                          Detected from your photo
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Result Message */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {colorTestPassed ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                          <p
                            className={`font-bold text-lg ${colorTestPassed ? 'text-green-800' : 'text-red-800'}`}
                          >
                            {colorTestPassed
                              ? selectedTaskType === 'daily' || selectedMission
                                ? 'Perfect Match!'
                                : 'Color Detected'
                              : 'Color Mismatch'}
                          </p>
                          {colorTestPassed && (selectedTaskType === 'daily' || selectedMission) && (
                            <span className="text-xl">✨</span>
                          )}
                        </div>
                        <p
                          className={`text-sm leading-relaxed ${colorTestPassed ? 'text-green-700' : 'text-red-700'}`}
                        >
                          {colorTestPassed ? (
                            <>
                              {selectedTaskType === 'daily' || selectedMission ? (
                                <>
                                  This color matches the required color for your task. You're ready
                                  to upload!
                                </>
                              ) : (
                                <>
                                  Your photo has been analyzed. You can now upload it with the
                                  detected color.
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              This photo contains{' '}
                              <strong>
                                {RAINBOW_COLORS.find((c) => c.id === detectedColor)?.name}
                              </strong>
                              , but your task requires{' '}
                              <strong>
                                {selectedTaskType === 'daily'
                                  ? dailyColor.name
                                  : RAINBOW_COLORS.find(
                                      (c) =>
                                        c.id ===
                                        MOCK_MISSIONS.find((m) => m.id === selectedMission)?.color,
                                    )?.name || 'Any color'}
                              </strong>
                              . Please try again.
                            </>
                          )}
                        </p>
                        {!colorTestPassed && (
                          <button
                            type="button"
                            onClick={handleRetryPhoto}
                            className="mt-4 text-sm text-red-700 font-semibold hover:text-red-900 underline decoration-2 underline-offset-2 transition-colors"
                          >
                            Take another photo →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#C89F7B] transition-colors cursor-pointer bg-[#F5F1ED] flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7 text-[#C89F7B]" />
                  </div>
                  <p className="font-semibold text-[#2D2520] text-sm">Take Photo</p>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#C89F7B] transition-colors cursor-pointer bg-[#F5F1ED] flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ImagePlus className="w-7 h-7 text-[#C89F7B]" />
                  </div>
                  <p className="font-semibold text-[#2D2520] text-sm">From Gallery</p>
                </button>
              </div>
            </div>
          )}

          {/* Task Selection */}
          {imagePreview && (
            <div className="mb-6 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <span className="block text-sm font-semibold text-[#2D2520]">
                  {selectedTaskType ? 'Selected Task' : 'What is this photo for?'}
                </span>
                {selectedTaskType && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskType(null);
                      setSelectedMission('');

                      // If color was already tested, keep it but mark as passed (no requirement)
                      if (colorTested && detectedColor) {
                        setColorTestPassed(true);
                      } else {
                        setColorTested(false);
                        setColorTestPassed(false);
                        setDetectedColor('');
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel Task
                  </button>
                )}
              </div>

              {!selectedTaskType ? (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Choose a task to earn extra points, or skip to upload for basic points
                  </p>
                  <div className="space-y-3">
                    {/* Daily Challenge Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskType('daily');
                        setSelectedMission('');

                        // If color was already tested, check if it matches daily color
                        if (colorTested && detectedColor) {
                          const passed = detectedColor === dailyColor.id;
                          setColorTestPassed(passed);
                        } else {
                          // No color tested yet, reset
                          setColorTested(false);
                          setColorTestPassed(false);
                          setDetectedColor('');
                        }
                      }}
                      className={`w-full rounded-2xl p-4 transition-all text-left ${
                        selectedTaskType === 'daily'
                          ? 'bg-gradient-to-r from-[#FF8A65] to-[#FFD54F] text-white shadow-md ring-2 ring-[#2D2520] ring-offset-2'
                          : 'bg-white border-2 border-gray-200 hover:border-[#FF8A65]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center relative ${
                            selectedTaskType === 'daily' ? 'bg-white/20' : ''
                          }`}
                          style={
                            selectedTaskType !== 'daily'
                              ? {
                                  background: `linear-gradient(135deg, ${dailyColor.hex} 0%, ${dailyColor.hex}dd 100%)`,
                                }
                              : undefined
                          }
                        >
                          <Zap className={'w-6 h-6 text-white'} />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-bold mb-1 ${selectedTaskType === 'daily' ? 'text-white' : 'text-[#2D2520]'}`}
                          >
                            Daily Challenge
                          </p>
                          <p
                            className={`text-sm ${selectedTaskType === 'daily' ? 'text-white/90' : 'text-gray-600'}`}
                          >
                            Find {dailyColor.name} today
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedTaskType === 'daily'
                              ? 'bg-white/20 text-white'
                              : 'bg-[#FFD54F]/20 text-[#F4C430]'
                          }`}
                        >
                          +20 pts
                        </div>
                      </div>
                    </button>

                    {/* Solo Mission Option */}
                    <button
                      type="button"
                      onClick={() => handleOpenMissionDialog('solo')}
                      className={`w-full rounded-2xl p-4 transition-all text-left ${
                        selectedTaskType === 'solo'
                          ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow-md ring-2 ring-[#2D2520] ring-offset-2'
                          : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            selectedTaskType === 'solo'
                              ? 'bg-white/20'
                              : 'bg-gradient-to-r from-blue-400 to-purple-400'
                          }`}
                        >
                          <Target className={'w-6 h-6 text-white'} />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-bold mb-1 ${selectedTaskType === 'solo' ? 'text-white' : 'text-[#2D2520]'}`}
                          >
                            Solo Mission
                          </p>
                          <p
                            className={`text-sm ${selectedTaskType === 'solo' ? 'text-white/90' : 'text-gray-600'}`}
                          >
                            {selectedTaskType === 'solo' && selectedMission
                              ? MOCK_MISSIONS.find((m) => m.id === selectedMission)?.title
                              : 'Complete a personal mission'}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedTaskType === 'solo'
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          Varies
                        </div>
                      </div>
                    </button>

                    {/* Team Mission Option */}
                    <button
                      type="button"
                      onClick={() => handleOpenMissionDialog('team')}
                      className={`w-full rounded-2xl p-4 transition-all text-left ${
                        selectedTaskType === 'team'
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-md ring-2 ring-[#2D2520] ring-offset-2'
                          : 'bg-white border-2 border-gray-200 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            selectedTaskType === 'team'
                              ? 'bg-white/20'
                              : 'bg-gradient-to-r from-purple-400 to-pink-400'
                          }`}
                        >
                          <Users className={'w-6 h-6 text-white'} />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-bold mb-1 ${selectedTaskType === 'team' ? 'text-white' : 'text-[#2D2520]'}`}
                          >
                            Team Mission
                          </p>
                          <p
                            className={`text-sm ${selectedTaskType === 'team' ? 'text-white/90' : 'text-gray-600'}`}
                          >
                            {selectedTaskType === 'team' && selectedMission
                              ? MOCK_MISSIONS.find((m) => m.id === selectedMission)?.title
                              : "Contribute to your team's goal"}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedTaskType === 'team'
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 text-purple-600'
                          }`}
                        >
                          Varies
                        </div>
                      </div>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskType(null);
                      setSelectedMission('');

                      // If color was already tested, keep it but mark as passed (no requirement)
                      if (colorTested && detectedColor) {
                        setColorTestPassed(true);
                      } else {
                        setColorTested(false);
                        setColorTestPassed(false);
                        setDetectedColor('');
                      }
                    }}
                    className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2"
                  >
                    Skip task selection (+10 pts)
                  </button>
                </>
              ) : (
                <>
                  {/* Display selected task */}
                  {selectedTaskType === 'daily' && (
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

                  {selectedMission &&
                    (selectedTaskType === 'solo' || selectedTaskType === 'team') && (
                      <div
                        className={`border-2 rounded-2xl p-4 ${
                          selectedTaskType === 'solo'
                            ? 'bg-blue-50/50 border-blue-300'
                            : 'bg-purple-50/50 border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedTaskType === 'solo' ? (
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
                              {selectedTaskType === 'solo' ? 'Solo Mission' : 'Team Mission'}
                            </p>
                            <p className="font-bold text-[#2D2520]">
                              {MOCK_MISSIONS.find((m) => m.id === selectedMission)?.title}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFD54F]/20 text-[#F4C430]">
                              +{MOCK_MISSIONS.find((m) => m.id === selectedMission)?.reward} pts
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenMissionDialog(selectedTaskType as 'solo' | 'team')
                              }
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
          )}

          {/* Required Color Display - Enhanced */}
          {imagePreview && (selectedTaskType === 'daily' || selectedMission) && (
            <div className="mb-4 animate-scale-in">
              <span className="block text-sm font-semibold mb-3 text-[#2D2520] flex items-center gap-2">
                🎯 Required Color
                {colorTestPassed && (
                  <span className="text-xs text-green-600 font-normal">(Verified!)</span>
                )}
              </span>
              <div
                className={`relative rounded-3xl p-6 shadow-lg transition-all ${
                  colorTestPassed ? 'ring-4 ring-green-500 ring-offset-2' : 'ring-2 ring-offset-2'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${
                    selectedTaskType === 'daily'
                      ? dailyColor.hex
                      : RAINBOW_COLORS.find(
                          (c) =>
                            c.id === MOCK_MISSIONS.find((m) => m.id === selectedMission)?.color,
                        )?.hex || '#ccc'
                  } 0%, ${
                    selectedTaskType === 'daily'
                      ? `${dailyColor.hex}dd`
                      : `${RAINBOW_COLORS.find((c) => c.id === MOCK_MISSIONS.find((m) => m.id === selectedMission)?.color)?.hex || '#ccc'}dd`
                  } 100%)`,
                }}
              >
                {/* Decorative elements */}
                <div
                  className="absolute -top-2 -right-2 w-24 h-24 rounded-full opacity-20 animate-pulse"
                  style={{
                    backgroundColor:
                      selectedTaskType === 'daily'
                        ? dailyColor.hex
                        : RAINBOW_COLORS.find(
                            (c) =>
                              c.id === MOCK_MISSIONS.find((m) => m.id === selectedMission)?.color,
                          )?.hex || '#ccc',
                  }}
                />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex-1 text-white">
                    <p className="text-2xl font-bold mb-2">
                      {selectedTaskType === 'daily'
                        ? dailyColor.name
                        : RAINBOW_COLORS.find(
                            (c) =>
                              c.id === MOCK_MISSIONS.find((m) => m.id === selectedMission)?.color,
                          )?.name || 'Any color'}
                    </p>
                    <p className="text-sm opacity-90">
                      {colorTestPassed
                        ? '✓ Your photo matches this color!'
                        : 'Find and photograph this color'}
                    </p>
                  </div>
                  {colorTestPassed && (
                    <div className="flex-shrink-0 animate-bounce">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-7 h-7 text-green-500" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Input and Submit Button */}
          {imagePreview && (
            <div className="animate-fade-in space-y-6">
              <LocationPicker location={location} onLocationChange={setLocation} />

              <Button
                onClick={handleSubmit}
                disabled={
                  isUploading ||
                  !imagePreview ||
                  !colorTestPassed ||
                  ((selectedTaskType === 'solo' || selectedTaskType === 'team') && !selectedMission)
                }
                className="w-full bg-[#2D2520] hover:bg-[#2D2520]/90 text-white py-6 rounded-2xl text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {!colorTestPassed && imagePreview ? (
                  <>🔒 Test color to unlock upload</>
                ) : (
                  <>
                    Upload Photo{' '}
                    <span className="text-[#FFD54F] ml-2">
                      +
                      {selectedTaskType === 'daily'
                        ? '20'
                        : selectedMission
                          ? MOCK_MISSIONS.find((m) => m.id === selectedMission)?.reward
                          : '10'}{' '}
                      pts
                    </span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Tips Section - Show only when no image is uploaded */}
          {!imagePreview && (
            <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-semibold text-[#2D2520]">Tips for Great Photos</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#FF8A65]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-base">🎯</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2520] mb-0.5">Select a task first</p>
                    <p className="text-xs text-gray-600">
                      See which color you need to find for your mission
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#FFD54F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-base">📸</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2520] mb-0.5">
                      Match the required color
                    </p>
                    <p className="text-xs text-gray-600">
                      Take photos of objects that clearly match the color
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-base">💡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2520] mb-0.5">
                      Good lighting matters
                    </p>
                    <p className="text-xs text-gray-600">
                      Proper lighting helps AI detect colors accurately
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#8BA888]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-base">🔄</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2520] mb-0.5">Try again if needed</p>
                    <p className="text-xs text-gray-600">
                      If color test fails, retake with better color match
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mission Selection Dialog */}
      <Dialog open={showMissionDialog} onOpenChange={setShowMissionDialog}>
        <DialogContent className="bg-[#F5F1ED] border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#2D2520] flex items-center gap-2">
              {pendingTaskType === 'solo' ? (
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
              {pendingTaskType === 'solo'
                ? 'Choose a solo mission to complete on your own'
                : 'Choose a team mission to complete with your teammates'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-4">
            {MOCK_MISSIONS.filter((m) =>
              pendingTaskType === 'team' ? m.teamMission : !m.teamMission,
            )
              .filter((m) => !m.completed)
              .map((mission) => {
                const missionColor = RAINBOW_COLORS.find((c) => c.id === mission.color);
                return (
                  <button
                    type="button"
                    key={mission.id}
                    onClick={() => handleMissionSelect(mission.id)}
                    className="w-full rounded-2xl p-4 transition-all text-left bg-white hover:shadow-lg active:scale-95 border-2 border-transparent hover:border-[#2D2520]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Color indicator */}
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
    </div>
  );
}
