import { useState, useEffect, useCallback, useRef } from 'react';
import { PredictionResult, DownloadDataPoint } from '../helpers/prediction';

export interface UsePredictionOptions {
  daysToPredict?: number;
  useLSTM?: boolean;
  enabled?: boolean;
}

export interface UsePredictionReturn {
  prediction: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  progressMessage: string;
  refresh: () => void;
}

/**
 * Hook to generate download predictions using a Web Worker
 * Runs ML computations off the main thread to keep UI responsive
 */
export function usePrediction(
  downloadsData: DownloadDataPoint[] | undefined,
  options: UsePredictionOptions = {}
): UsePredictionReturn {
  const {
    daysToPredict = 7,
    useLSTM = true,
    enabled = true,
  } = options;

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  const workerRef = useRef<Worker | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize worker on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server
    
    // Create worker
    workerRef.current = new Worker('/prediction.worker.js');
    
    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      const { type, result, error: workerError, progress: workerProgress, message } = e.data;
      
      switch (type) {
        case 'ready':
          isInitializedRef.current = true;
          break;
        case 'start':
          setIsLoading(true);
          setProgress(0);
          setProgressMessage('Initializing...');
          break;
        case 'progress':
          setProgress(workerProgress || 0);
          setProgressMessage(message || '');
          break;
        case 'result':
          setPrediction(result);
          setIsLoading(false);
          setError(null);
          setProgress(100);
          setProgressMessage('Complete!');
          break;
        case 'error':
          setError(workerError);
          setIsLoading(false);
          setProgress(0);
          setProgressMessage('');
          break;
      }
    };

    workerRef.current.onerror = (e) => {
      console.error('Worker error:', e);
      setError('Worker error: ' + e.message);
      setIsLoading(false);
    };

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const generatePrediction = useCallback(() => {
    if (!enabled || !downloadsData || downloadsData.length === 0) {
      setPrediction(null);
      return;
    }

    if (!workerRef.current) {
      setError('Worker not initialized');
      return;
    }

    // Set loading state IMMEDIATELY before sending to worker
    setIsLoading(true);
    setProgress(0);
    setProgressMessage('Starting prediction...');
    setError(null);

    // Send prediction request to worker
    // Use 14-day sequence for better pattern recognition with yearly data
    workerRef.current.postMessage({
      type: 'predict',
      data: {
        downloadsData,
        daysToPredict,
        useLSTM,
        sequenceLength: 14,
      },
    });
  }, [downloadsData, daysToPredict, useLSTM, enabled]);

  // Generate prediction when data or options change
  useEffect(() => {
    // Small delay to ensure worker is ready
    const timer = setTimeout(() => {
      if (enabled && downloadsData && downloadsData.length > 0) {
        generatePrediction();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [downloadsData, daysToPredict, useLSTM, enabled, generatePrediction]);

  const refresh = useCallback(() => {
    generatePrediction();
  }, [generatePrediction]);

  return {
    prediction,
    isLoading,
    error,
    progress,
    progressMessage,
    refresh,
  };
}

/**
 * Transform raw downloads API response to DownloadDataPoint array
 */
export function transformDownloadsData(downloads: Array<{ day: string; downloads: number }> | undefined): DownloadDataPoint[] {
  if (!downloads || !Array.isArray(downloads)) {
    return [];
  }
  return downloads.map(d => ({
    day: d.day,
    downloads: d.downloads,
  }));
}