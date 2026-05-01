import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Header, LocationPicker } from '../../components';
import { Button } from '../../components/ui';
import { ColorTestPanel } from './components/ColorTestPanel';
import { MissionPickerDialog } from './components/MissionPickerDialog';
import { PhotoCapture } from './components/PhotoCapture';
import { RequiredColorDisplay } from './components/RequiredColorDisplay';
import { TaskTypeSelector } from './components/TaskTypeSelector';
import { UploadSuccessView } from './components/UploadSuccessView';
import { UploadTips } from './components/UploadTips';
import { useDetectColorMutation } from './useDetectColorMutation';
import { useUploadFlow } from './useUploadFlow';
import { useUploadPhotoMutation } from './useUploadPhotoMutation';

const REDIRECT_DELAY_MS = 2000;

export function Upload() {
  const navigate = useNavigate();
  const flow = useUploadFlow();
  const detectMutation = useDetectColorMutation();
  const uploadMutation = useUploadPhotoMutation();

  const { state, dailyColor, mission, detected, detectedColor, requiredColor, colorPassed, pointsEarned, canSubmit, actions } = flow;

  const image =
    state.step.kind === 'photo-selected' || state.step.kind === 'color-tested'
      ? state.step.image
      : null;

  const hasTaskRequirement = state.taskType === 'daily' || mission !== null;

  // Redirect after upload success
  useEffect(() => {
    if (state.step.kind !== 'uploaded') return;
    const id = setTimeout(() => navigate('/galleries'), REDIRECT_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.step.kind, navigate]);

  const handleSelectPhoto = (img: string) => {
    actions.selectPhoto(img);
    detectMutation.reset();
  };

  const handleClearPhoto = () => {
    actions.clearPhoto();
    detectMutation.reset();
  };

  const handleTestColor = () => {
    if (!image || detectMutation.isPending) return;
    detectMutation.mutate(image, {
      onSuccess: ({ color }) => {
        actions.submitColorTest(color);
      },
      onError: () => {
        toast.error('Could not analyze color. Please try again.');
      },
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || uploadMutation.isPending) return;
    uploadMutation.mutate(
      {
        image: image ?? '',
        location: state.location,
        lat: state.lat ?? undefined,
        lng: state.lng ?? undefined,
        color: detected ?? '',
        taskType: state.taskType,
        missionId: state.missionId ?? undefined,
        caption: state.caption.trim(),
        pointsAwarded: pointsEarned,
      },
      {
        onSuccess: () => {
          actions.uploadSuccess(pointsEarned);
        },
        onError: () => {
          toast.error('Upload failed. Please try again.');
        },
      },
    );
  };

  if (state.step.kind === 'uploaded') {
    return (
      <UploadSuccessView
        detectedColor={detectedColor}
        taskType={state.taskType}
        pointsEarned={state.step.pointsEarned}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" showBack />

      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2D2520] mb-2">
            Upload{' '}
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Photo
            </span>
          </h1>
          <p className="text-gray-600">Share your color discovery</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-[#2D2520]">Choose Photo</h3>

          <PhotoCapture
            image={image}
            onSelect={handleSelectPhoto}
            onClear={handleClearPhoto}
          />

          {image && (
            <ColorTestPanel
              hasTaskRequirement={hasTaskRequirement}
              requiredColor={requiredColor}
              detected={detected}
              detectedColor={detectedColor}
              isTesting={detectMutation.isPending}
              colorPassed={colorPassed}
              onTest={handleTestColor}
              onRetry={handleClearPhoto}
            />
          )}

          {image && (
            <TaskTypeSelector
              taskType={state.taskType}
              selectedMission={mission}
              dailyColor={dailyColor}
              onSelectDaily={actions.selectDaily}
              onRequestMission={actions.openMissionDialog}
              onClearTask={actions.clearTask}
            />
          )}

          {image && hasTaskRequirement && (
            <RequiredColorDisplay requiredColor={requiredColor} colorPassed={colorPassed} />
          )}

          {image && (
            <div className="animate-fade-in space-y-6">
              <div>
                <label
                  htmlFor="caption"
                  className="block text-sm font-semibold mb-2 text-[#2D2520]"
                >
                  Caption{' '}
                  <span className="text-xs font-normal text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="caption"
                  value={state.caption}
                  onChange={(e) => actions.setCaption(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Tell the story behind this photo…"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#2D2520] placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 text-right mt-1">
                  {state.caption.length}/500
                </p>
              </div>

              <LocationPicker
                location={state.location}
                onLocationChange={(loc, coords) =>
                  actions.setLocation(loc, coords?.lat ?? null, coords?.lng ?? null)
                }
              />

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || uploadMutation.isPending}
                className="w-full bg-[#2D2520] hover:bg-[#2D2520]/90 text-white py-6 rounded-2xl text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {!colorPassed ? (
                  <>🔒 Test color to unlock upload</>
                ) : (
                  <>
                    Upload Photo <span className="text-[#FFD54F] ml-2">+{pointsEarned} pts</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {!image && <UploadTips />}
        </div>
      </div>

      <MissionPickerDialog
        pendingType={state.missionDialogPendingType}
        onSelect={actions.selectMission}
        onClose={actions.closeMissionDialog}
      />
    </div>
  );
}
