import * as tf from '@tensorflow/tfjs';

export interface PredictionResult {
  dates: string[];
  values: number[];
  confidence?: { lower: number[]; upper: number[] };
}

export interface DownloadDataPoint {
  day: string;
  downloads: number;
}

/**
 * Normalize data to [0, 1] range for better model training
 */
function normalizeData(data: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero
  const normalized = data.map(v => (v - min) / range);
  return { normalized, min, max };
}

/**
 * Denormalize predictions back to original scale
 */
function denormalizeData(normalized: number[], min: number, max: number): number[] {
  const range = max - min || 1;
  return normalized.map(v => v * range + min);
}

/**
 * Create sequences for LSTM training
 * @param data Normalized data array
 * @param sequenceLength Number of previous days to use for prediction
 */
function createSequences(data: number[], sequenceLength: number): { X: number[][]; y: number[] } {
  const X: number[][] = [];
  const y: number[] = [];
  
  for (let i = sequenceLength; i < data.length; i++) {
    X.push(data.slice(i - sequenceLength, i));
    y.push(data[i]);
  }
  
  return { X, y };
}

/**
 * Build and compile LSTM model
 */
function buildModel(sequenceLength: number): tf.LayersModel {
  const model = tf.sequential();
  
  // LSTM layer with dropout for regularization
  model.add(tf.layers.lstm({
    units: 32,
    inputShape: [sequenceLength, 1],
    returnSequences: false,
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Dense output layer
  model.add(tf.layers.dense({ units: 1 }));
  
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
  });
  
  return model;
}

/**
 * Train LSTM model on historical data
 */
async function trainModel(
  model: tf.LayersModel,
  X: number[][],
  y: number[],
  epochs: number = 50
): Promise<void> {
  // Reshape X to [samples, sequenceLength, 1] for LSTM
  const xTensor = tf.tensor3d(X.map(seq => seq.map(v => [v])));
  const yTensor = tf.tensor2d(y.map(v => [v]));
  
  await model.fit(xTensor, yTensor, {
    epochs,
    batchSize: 16,
    shuffle: true,
    verbose: 0, // Silent training
  });
  
  // Clean up tensors
  xTensor.dispose();
  yTensor.dispose();
}

/**
 * Generate predictions for future dates
 */
async function predict(
  model: tf.LayersModel,
  lastSequence: number[],
  daysToPredict: number
): Promise<number[]> {
  const predictions: number[] = [];
  let currentSequence = [...lastSequence];
  
  for (let i = 0; i < daysToPredict; i++) {
    // Reshape for prediction [1, sequenceLength, 1]
    const input = tf.tensor3d([currentSequence.map(v => [v])]);
    const predTensor = model.predict(input) as tf.Tensor;
    const predValue = (await predTensor.data())[0];
    
    predictions.push(predValue);
    
    // Update sequence for next prediction (sliding window)
    currentSequence = [...currentSequence.slice(1), predValue];
    
    // Clean up tensors
    input.dispose();
    predTensor.dispose();
  }
  
  return predictions;
}

/**
 * Generate future dates from a start date
 */
function generateFutureDates(startDate: string, days: number): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  
  for (let i = 1; i <= days; i++) {
    const futureDate = new Date(start);
    futureDate.setDate(start.getDate() + i);
    dates.push(futureDate.toISOString().substring(0, 10));
  }
  
  return dates;
}

/**
 * Calculate simple confidence intervals based on historical variance
 */
function calculateConfidenceIntervals(
  predictions: number[],
  historicalData: number[],
  confidenceLevel: number = 0.95
): { lower: number[]; upper: number[] } {
  // Calculate historical standard deviation
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const variance = historicalData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);
  
  // Z-score for 95% confidence
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645;
  
  // Expand uncertainty over time
  const lower = predictions.map((p, i) => Math.max(0, p - stdDev * zScore * (1 + i * 0.1)));
  const upper = predictions.map((p, i) => p + stdDev * zScore * (1 + i * 0.1));
  
  return { lower, upper };
}

/**
 * Main prediction function using LSTM
 * @param downloadsData Historical download data
 * @param daysToPredict Number of days to forecast (default: 7)
 * @param sequenceLength Number of days used for prediction context (default: 7)
 */
export async function predictDownloads(
  downloadsData: DownloadDataPoint[],
  daysToPredict: number = 7,
  sequenceLength: number = 7
): Promise<PredictionResult | null> {
  if (!downloadsData || downloadsData.length < sequenceLength + 5) {
    console.warn('Not enough data for prediction. Need at least', sequenceLength + 5, 'data points.');
    return null;
  }
  
  try {
    // Extract downloads values
    const downloads = downloadsData.map(d => d.downloads);
    
    // Normalize data
    const { normalized, min, max } = normalizeData(downloads);
    
    // Create training sequences
    const { X, y } = createSequences(normalized, sequenceLength);
    
    if (X.length < 5) {
      console.warn('Not enough sequences for training');
      return null;
    }
    
    // Build and train model
    const model = buildModel(sequenceLength);
    await trainModel(model, X, y, 30); // Reduced epochs for faster training
    
    // Get last sequence for prediction
    const lastSequence = normalized.slice(-sequenceLength);
    
    // Generate predictions
    const normalizedPredictions = await predict(model, lastSequence, daysToPredict);
    
    // Denormalize predictions
    const predictions = denormalizeData(normalizedPredictions, min, max);
    
    // Ensure predictions are non-negative integers
    const cleanedPredictions = predictions.map(p => Math.max(0, Math.round(p)));
    
    // Generate future dates
    const lastDate = downloadsData[downloadsData.length - 1].day;
    const futureDates = generateFutureDates(lastDate, daysToPredict);
    
    // Calculate confidence intervals
    const confidence = calculateConfidenceIntervals(cleanedPredictions, downloads);
    
    // Clean up model to free memory
    model.dispose();
    
    return {
      dates: futureDates,
      values: cleanedPredictions,
      confidence,
    };
  } catch (error) {
    console.error('Prediction error:', error);
    return null;
  }
}

/**
 * Simple moving average prediction as a fallback
 * Uses weighted average giving more importance to recent data
 */
export function predictWithMovingAverage(
  downloadsData: DownloadDataPoint[],
  daysToPredict: number = 7,
  windowSize: number = 7
): PredictionResult | null {
  if (!downloadsData || downloadsData.length < windowSize) {
    return null;
  }
  
  const downloads = downloadsData.map(d => d.downloads);
  const predictions: number[] = [];
  let currentData = [...downloads];
  
  for (let i = 0; i < daysToPredict; i++) {
    // Weighted moving average (more weight to recent values)
    const window = currentData.slice(-windowSize);
    const weights = window.map((_, idx) => idx + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const weightedAvg = window.reduce((sum, val, idx) => sum + val * weights[idx], 0) / weightSum;
    
    // Add day-of-week adjustment (weekends typically have lower downloads)
    const lastDate = new Date(downloadsData[downloadsData.length - 1].day);
    const predDate = new Date(lastDate);
    predDate.setDate(lastDate.getDate() + i + 1);
    const dayOfWeek = predDate.getDay();
    
    // Weekend adjustment factor (Saturday/Sunday get ~70% of weekday traffic)
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    const prediction = Math.round(weightedAvg * weekendFactor);
    predictions.push(Math.max(0, prediction));
    currentData.push(prediction);
  }
  
  const lastDate = downloadsData[downloadsData.length - 1].day;
  const futureDates = generateFutureDates(lastDate, daysToPredict);
  
  const confidence = calculateConfidenceIntervals(predictions, downloads);
  
  return {
    dates: futureDates,
    values: predictions,
    confidence,
  };
}