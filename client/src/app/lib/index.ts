export { ApiError, apiFetch, apiCall, friendlyErrorMessage } from './api';
export { blobToDataUrl, compressImage, type CompressOptions } from './imageCompress';
export { queryClient } from './queryClient';
export {
  type MotionPermission,
  playBling,
  requestMotionPermission,
  watchForShake,
} from './shake';
export { getSocket, watchAuthForSocket } from './socket';
