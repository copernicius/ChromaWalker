// Pure state machine for the upload flow. Lives in its own file so it can
// be unit-tested without React/router/query dependencies — useUploadFlow.ts
// just composes this reducer with the data hooks and derived state.

import type { ColorId, TaskType } from './domain';

export type Step =
  | { kind: 'idle' }
  | { kind: 'photo-selected'; image: string }
  | { kind: 'color-tested'; image: string; detected: ColorId }
  | { kind: 'uploaded'; pointsEarned: number };

export interface UploadState {
  step: Step;
  taskType: TaskType;
  missionId: string | null;
  location: string;
  // Coordinates from LocationPicker. Optional because the user might
  // type a location string without picking on the map.
  lat: number | null;
  lng: number | null;
  caption: string;
  missionDialogPendingType: 'solo' | 'team' | null;
}

export type UploadAction =
  | { type: 'SELECT_PHOTO'; image: string }
  | { type: 'CLEAR_PHOTO' }
  | { type: 'COLOR_TEST_RESULT'; detected: ColorId }
  | { type: 'SELECT_DAILY'; missionId: string | null }
  | { type: 'CLEAR_TASK' }
  | { type: 'OPEN_MISSION_DIALOG'; pendingTaskType: 'solo' | 'team' }
  | { type: 'CLOSE_MISSION_DIALOG' }
  | { type: 'SELECT_MISSION'; missionId: string }
  | { type: 'SET_MISSION'; taskType: TaskType; missionId: string | null }
  | { type: 'SET_LOCATION'; value: string; lat: number | null; lng: number | null }
  | { type: 'SET_CAPTION'; value: string }
  | { type: 'UPLOAD_SUCCESS'; pointsEarned: number };

export const initialUploadState: UploadState = {
  step: { kind: 'idle' },
  taskType: null,
  missionId: null,
  location: '',
  lat: null,
  lng: null,
  caption: '',
  missionDialogPendingType: null,
};

export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
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
      return { ...state, taskType: 'daily', missionId: action.missionId };
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
    case 'SET_MISSION':
      // Used by deep links from Missions page (?taskType=&missionId=).
      return { ...state, taskType: action.taskType, missionId: action.missionId };
    case 'SET_LOCATION':
      return { ...state, location: action.value, lat: action.lat, lng: action.lng };
    case 'SET_CAPTION':
      return { ...state, caption: action.value };
    case 'UPLOAD_SUCCESS':
      return { ...state, step: { kind: 'uploaded', pointsEarned: action.pointsEarned } };
  }
}
