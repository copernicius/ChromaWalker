import { useReducer } from 'react';
import { useMissionsQuery } from '../../queries';
import {
  calculatePoints,
  colorMatches,
  type ColorId,
  getColor,
  getDailyColor,
  getRequiredColor,
  type TaskType,
} from './domain';

type Step =
  | { kind: 'idle' }
  | { kind: 'photo-selected'; image: string }
  | { kind: 'color-tested'; image: string; detected: ColorId }
  | { kind: 'uploaded'; pointsEarned: number };

interface UploadState {
  step: Step;
  taskType: TaskType;
  missionId: string | null;
  location: string;
  missionDialogPendingType: 'solo' | 'team' | null;
}

type Action =
  | { type: 'SELECT_PHOTO'; image: string }
  | { type: 'CLEAR_PHOTO' }
  | { type: 'COLOR_TEST_RESULT'; detected: ColorId }
  | { type: 'SELECT_DAILY' }
  | { type: 'CLEAR_TASK' }
  | { type: 'OPEN_MISSION_DIALOG'; pendingTaskType: 'solo' | 'team' }
  | { type: 'CLOSE_MISSION_DIALOG' }
  | { type: 'SELECT_MISSION'; missionId: string }
  | { type: 'SET_LOCATION'; value: string }
  | { type: 'UPLOAD_SUCCESS'; pointsEarned: number };

const initial: UploadState = {
  step: { kind: 'idle' },
  taskType: null,
  missionId: null,
  location: '',
  missionDialogPendingType: null,
};

function reducer(state: UploadState, action: Action): UploadState {
  switch (action.type) {
    case 'SELECT_PHOTO':
      return { ...state, step: { kind: 'photo-selected', image: action.image } };
    case 'CLEAR_PHOTO':
      return { ...state, step: { kind: 'idle' } };
    case 'COLOR_TEST_RESULT':
      if (state.step.kind === 'idle' || state.step.kind === 'uploaded') return state;
      return {
        ...state,
        step: { kind: 'color-tested', image: state.step.image, detected: action.detected },
      };
    case 'SELECT_DAILY':
      return { ...state, taskType: 'daily', missionId: null };
    case 'CLEAR_TASK':
      return { ...state, taskType: null, missionId: null };
    case 'OPEN_MISSION_DIALOG':
      return { ...state, missionDialogPendingType: action.pendingTaskType };
    case 'CLOSE_MISSION_DIALOG':
      return { ...state, missionDialogPendingType: null };
    case 'SELECT_MISSION':
      if (!state.missionDialogPendingType) return state;
      return {
        ...state,
        taskType: state.missionDialogPendingType,
        missionId: action.missionId,
        missionDialogPendingType: null,
      };
    case 'SET_LOCATION':
      return { ...state, location: action.value };
    case 'UPLOAD_SUCCESS':
      return { ...state, step: { kind: 'uploaded', pointsEarned: action.pointsEarned } };
  }
}

export function useUploadFlow() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { data: missions = [] } = useMissionsQuery();

  const dailyColor = getDailyColor();
  const mission = state.missionId
    ? (missions.find((m) => m.id === state.missionId) ?? null)
    : null;

  const requiredColorId = getRequiredColor(state.taskType, mission, dailyColor.id);
  const requiredColor = getColor(requiredColorId);

  const detected = state.step.kind === 'color-tested' ? state.step.detected : null;
  const detectedColor = getColor(detected);
  const colorPassed = detected !== null && colorMatches(detected, requiredColorId);
  const pointsEarned = calculatePoints(state.taskType, mission);

  const taskNeedsMission = state.taskType === 'solo' || state.taskType === 'team';
  const canSubmit =
    state.step.kind === 'color-tested' && colorPassed && !(taskNeedsMission && !state.missionId);

  return {
    state,
    dailyColor,
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
      selectDaily: () => dispatch({ type: 'SELECT_DAILY' }),
      clearTask: () => dispatch({ type: 'CLEAR_TASK' }),
      openMissionDialog: (pendingTaskType: 'solo' | 'team') =>
        dispatch({ type: 'OPEN_MISSION_DIALOG', pendingTaskType }),
      closeMissionDialog: () => dispatch({ type: 'CLOSE_MISSION_DIALOG' }),
      selectMission: (missionId: string) => dispatch({ type: 'SELECT_MISSION', missionId }),
      setLocation: (value: string) => dispatch({ type: 'SET_LOCATION', value }),
      uploadSuccess: (pointsEarned: number) =>
        dispatch({ type: 'UPLOAD_SUCCESS', pointsEarned }),
    },
  };
}
