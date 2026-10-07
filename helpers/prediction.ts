/**
 * Shared types for ML download predictions.
 *
 * The actual prediction logic lives in /public/prediction.worker.js and runs
 * TensorFlow.js (loaded from CDN) inside a Web Worker so training and
 * inference never block the main thread.
 */
export interface PredictionResult {
  dates: string[];
  values: number[];
  confidence?: { lower: number[]; upper: number[] };
}

export interface DownloadDataPoint {
  day: string;
  downloads: number;
}
