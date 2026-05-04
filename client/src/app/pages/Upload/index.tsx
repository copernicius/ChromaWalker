import { Sparkles, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Header, LocationPicker } from '../../components';
import { Button } from '../../components/ui';
import { getPaletteColor } from '../../data';
import { blobToDataUrl, compressImage } from '../../lib';
import { useMyMissionProgressQuery } from '../../queries';
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

  const { state, dailyMission, mission, detected, detectedColor, requiredColor, colorPassed, pointsEarned, canSubmit, actions } = flow;
  const { data: missionProgress = {} } = useMyMissionProgressQuery();
  const dailyCompleted =
    !!dailyMission &&
    (missionProgress[dailyMission.id] ?? 0) >= (dailyMission.total ?? 1);

  const image =
    state.step.kind === 'photo-selected' || state.step.kind === 'color-tested'
      ? state.step.image
      : null;

  const hasTaskRequirement = state.taskType === 'daily' || mission !== null;

  // Deep-link prefill: Missions page links here as
  //   /upload?taskType=daily|solo|team&missionId=<id>
  // We pre-select the mission once on mount so the user lands ready to shoot.
  const [searchParams, setSearchParams] = useSearchParams();
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run once
  useEffect(() => {
    const taskType = searchParams.get('taskType');
    const missionId = searchParams.get('missionId');
    if (
      missionId &&
      (taskType === 'daily' || taskType === 'solo' || taskType === 'team')
    ) {
      actions.setMission(taskType, missionId);
      // Clean the params so a refresh doesn't keep re-applying.
      const next = new URLSearchParams(searchParams);
      next.delete('taskType');
      next.delete('missionId');
      setSearchParams(next, { replace: true });
    }
  }, []);

  // Redirect after upload success
  useEffect(() => {
    if (state.step.kind !== 'uploaded') return;
    const id = setTimeout(() => navigate('/galleries'), REDIRECT_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.step.kind, navigate]);

  // Brief flag for the "Preparing image…" hint while compression runs.
  // Re-encoding a 12MP photo on a phone is ~150–400ms; we hide PhotoCapture
  // during that window so the user doesn't try to interact with stale UI.
  const [preparing, setPreparing] = useState(false);

  // Compress on intake so the same compressed bytes feed BOTH the
  // /api/detect-color request and the eventual /api/photos/upload — saves
  // one ~3 MB roundtrip on the test step. compressImage no-ops if the
  // source is already under the target size.
  const handleSelectPhoto = async (img: string) => {
    detectMutation.reset();
    setPreparing(true);
    try {
      const original = await fetch(img).then((r) => r.blob());
      const compressed = await compressImage(original);
      const dataUrl = await blobToDataUrl(compressed);
      actions.selectPhoto(dataUrl);
    } catch (err) {
      console.warn('Compression failed; using original:', err);
      actions.selectPhoto(img);
    } finally {
      setPreparing(false);
    }
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
        // Server may award fewer points than the client estimated (catalog
        // missions only pay the full reward on the upload that completes
        // them). Read the authoritative figure off the saved photo.
        onSuccess: (photo) => {
          actions.uploadSuccess(photo.pointsAwarded ?? 0);
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

        {/* Mission hint — visible whenever a task is selected (deep link
            from Missions page or picked via TaskTypeSelector). Tells the
            user what color they're hunting for at a glance. */}
        {mission && (() => {
          const colorMeta = getPaletteColor(mission.color);
          const isRainbow = mission.color === 'rainbow';
          const swatch = isRainbow
            ? 'linear-gradient(135deg, #FF9BA0 0%, #E18430 33%, #7C9C7A 66%, #6E8FAA 100%)'
            : (colorMeta?.morandi ?? '#9E9E9E');
          // Use the literal palette name (e.g. "Red") so the instruction is
          // unambiguous when the user is actually hunting for the color.
          const colorLabel = isRainbow
            ? 'Any color'
            : (colorMeta?.name ?? mission.color);
          const target = mission.total ?? 1;
          const progress = mission.teamMission
            ? (mission.progress ?? 0)
            : (missionProgress[mission.id] ?? 0);
          const progressLabel =
            target > 1 ? ` · ${Math.min(progress, target)}/${target}` : '';

          return (
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex items-center gap-3 animate-fade-in">
              <div
                className="w-12 h-12 rounded-xl shadow-sm flex-shrink-0 flex items-center justify-center"
                style={{ background: swatch }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  On mission · +{mission.reward} pts{progressLabel}
                </p>
                <p className="font-semibold text-[#2D2520] truncate">
                  {mission.title}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  Find {colorLabel.toLowerCase()}
                </p>
              </div>
            </div>
          );
        })()}

        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-[#2D2520]">Choose Photo</h3>

          <PhotoCapture
            image={image}
            onSelect={handleSelectPhoto}
            onClear={handleClearPhoto}
          />
          {preparing && (
            <p className="mt-3 text-xs text-gray-500 text-center">
              Preparing image…
            </p>
          )}

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
              dailyMission={dailyMission}
              dailyCompleted={dailyCompleted}
              onSelectDaily={() => actions.selectDaily(dailyMission?.id ?? null)}
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
                {uploadMutation.isPending ? (
                  <>Uploading…</>
                ) : !colorPassed ? (
                  <>🔒 Test color to unlock upload</>
                ) : (
                  <>
                    Upload Photo <span className="text-[#FFD54F] ml-2">+{pointsEarned} pts</span>
                  </>
                )}
              </Button>
              {uploadMutation.isPending && (
                <p className="text-xs text-gray-500 text-center -mt-2">
                  Sending your photo to the gallery — almost there.
                </p>
              )}
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
