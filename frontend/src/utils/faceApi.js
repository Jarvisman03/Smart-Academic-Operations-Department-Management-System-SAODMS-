import * as faceapi from '@vladmandic/face-api';

// Model weights are loaded from a CDN so we don't ship binaries in the repo.
// Override with VITE_FACE_MODEL_URL to self-host under /public/models.
const MODEL_URL = import.meta.env.VITE_FACE_MODEL_URL || 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let loadPromise = null;

// Load detector + landmark + recognition nets once (idempotent).
export function loadFaceModels() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch((err) => {
      loadPromise = null; // allow retry on failure
      throw err;
    });
  }
  return loadPromise;
}

// Detect a single face in a video/image element and return its 128-float
// descriptor as a plain array, or null if no face is found.
export async function getFaceDescriptor(mediaEl) {
  await loadFaceModels();
  const detection = await faceapi
    .detectSingleFace(mediaEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection || !detection.descriptor) return null;
  return Array.from(detection.descriptor);
}
