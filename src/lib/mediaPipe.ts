import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let loadingPromise: Promise<boolean> | null = null;

export async function loadMediaPipeModels(): Promise<boolean> {
  if (faceLandmarker) {
    console.log('MediaPipe models already loaded');
    return true;
  }

  if (loadingPromise) {
    console.log('MediaPipe models loading in progress, waiting...');
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log('Loading MediaPipe models...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU'
        },
        runningMode: 'IMAGE',
        numFaces: 1
      });

      console.log('MediaPipe models loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load MediaPipe models:', error);
      loadingPromise = null;
      return false;
    }
  })();

  return loadingPromise;
}

export async function detectFaceLandmarks(image: HTMLImageElement): Promise<any[] | null> {
  if (!faceLandmarker) {
    console.error('FaceLandmarker not initialized');
    return null;
  }

  try {
    const results = faceLandmarker.detect(image);
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      return results.faceLandmarks[0];
    }
    return null;
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
}

export const CLINICAL_ZONES = {
  ZONE_1_FOREHEAD: { type: 'forehead', color: '#FF6B6B', opacity: 0.3 },
  ZONE_2_GLABELLAR: { type: 'between_eyebrows', color: '#4ECDC4', opacity: 0.3 },
  ZONE_3A_LEFT_CROWS_FEET: { type: 'crows_feet_left', color: '#45B7D1', opacity: 0.3 },
  ZONE_3B_RIGHT_CROWS_FEET: { type: 'crows_feet_right', color: '#96CEB4', opacity: 0.3 },
  ZONE_4A_LEFT_UPPER_CHEEK: { type: 'upper_cheek_left', color: '#FFEAA7', opacity: 0.3 },
  ZONE_4B_RIGHT_UPPER_CHEEK: { type: 'upper_cheek_right', color: '#DFE6E9', opacity: 0.3 },
  ZONE_5A_LEFT_NASOLABIAL: { type: 'nasolabial_left', color: '#FD79A8', opacity: 0.3 },
  ZONE_5B_RIGHT_NASOLABIAL: { type: 'nasolabial_right', color: '#FDCB6E', opacity: 0.3 },
  ZONE_6A_LEFT_LOWER_CHEEK: { type: 'lower_cheek_left', color: '#74B9FF', opacity: 0.3 },
  ZONE_6B_RIGHT_LOWER_CHEEK: { type: 'lower_cheek_right', color: '#A29BFE', opacity: 0.3 },
};

export const ZONE_LEGEND = [
  { label: 'Zone 1 - Forehead', color: '#FF6B6B' },
  { label: 'Zone 2 - Glabellar', color: '#4ECDC4' },
  { label: 'Zone 3A - Left Crow\'s Feet', color: '#45B7D1' },
  { label: 'Zone 3B - Right Crow\'s Feet', color: '#96CEB4' },
  { label: 'Zone 4A - Left Upper Cheek', color: '#FFEAA7' },
  { label: 'Zone 4B - Right Upper Cheek', color: '#DFE6E9' },
  { label: 'Zone 5A - Left Nasolabial', color: '#FD79A8' },
  { label: 'Zone 5B - Right Nasolabial', color: '#FDCB6E' },
  { label: 'Zone 6A - Left Lower Cheek', color: '#74B9FF' },
  { label: 'Zone 6B - Right Lower Cheek', color: '#A29BFE' },
];
