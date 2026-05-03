// Orchestration hook for the upload flow. Composes:
//   • uploadReducer.ts        — pure state machine (testable, no React deps)
//   • useSelectedMission.ts   — looks up the active mission across sources
// and exposes derived UI state (requiredColor / pointsEarned / canSubmit)
// plus a single bag of action creators.

import { useReducer } from 'react';
import {
  calculatePoints,
  colorMatches,
  type ColorId,
  getColor,
  getDailyColor,
  getDetectedColor,
  getRequiredColor,
  type TaskType,
} from './domain';
import { initialUploadState, uploadReducer } from './uploadReducer';
import { useSelectedMission } from './useSelectedMission';

export function useUploadFlow() {
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState);
  const { mission, dailyMission } = useSelectedMission(state.missionId);

  // Legacy day-of-week rotation, kept only as a UI fallback for the brief
  // moment before useDailyMissionQuery resolves.
  const dailyColor = getDailyColor();

  const requiredColorId = getRequiredColor(state.taskType, mission, dailyColor.id);
  const requiredColor = getColor(requiredColorId);

  const detected = state.step.kind === 'color-tested' ? state.step.detected : null;
  const detectedColor = getDetectedColor(detected);
  const colorPassed = detected !== null && colorMatches(detected, requiredColorId);
  const pointsEarned = calculatePoints(state.taskType, mission);

  const taskNeedsMission = state.taskType === 'solo' || state.taskType === 'team';
  const canSubmit =
    state.step.kind === 'color-tested' && colorPassed && !(taskNeedsMission && !state.missionId);

  return {
    state,
    dailyColor,
    dailyMission,
    mission,
    detected,
    detectedColor,
    requiredColorId,
    requiredColor,
    colorPassed,
    pointsEarned,
    canSubmit,
    actions: {
      selectPhoto: (image: string) => dispatch({ type: 'SELECT_PHOTO', image }),
      clearPhoto: () => dispatch({ type: 'CLEAR_PHOTO' }),
      submitColorTest: (detected: ColorId) =>
        dispatch({ type: 'COLOR_TEST_RESULT', detected }),
      selectDaily: (missionId: string | null = null) =>
        dispatch({ type: 'SELECT_DAILY', missionId }),
      clearTask: () => dispatch({ type: 'CLEAR_TASK' }),
      openMissionDialog: (pendingTaskType: 'solo' | 'team') =>
        dispatch({ type: 'OPEN_MISSION_DIALOG', pendingTaskType }),
      closeMissionDialog: () => dispatch({ type: 'CLOSE_MISSION_DIALOG' }),
      selectMission: (missionId: string) => dispatch({ type: 'SELECT_MISSION', missionId }),
      setMission: (taskType: TaskType, missionId: string | null) =>
        dispatch({ type: 'SET_MISSION', taskType, missionId }),
      setLocation: (value: string, lat: number | null = null, lng: number | null = null) =>
        dispatch({ type: 'SET_LOCATION', value, lat, lng }),
      setCaption: (value: string) => dispatch({ type: 'SET_CAPTION', value }),
      uploadSuccess: (pointsEarned: number) =>
        dispatch({ type: 'UPLOAD_SUCCESS', pointsEarned }),
    },
  };
}
