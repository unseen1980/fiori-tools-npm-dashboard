/**
 * Web Worker for ML-based download predictions
 * Runs TensorFlow.js computations off the main thread to keep UI responsive
 * 
 * Pattern-Anchored Prediction: Uses historical weekly patterns as anchors
 * to prevent autoregressive error accumulation
 */

// Import TensorFlow.js in the worker
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js');

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().substring(0, 10);
}

/**
 * Filter out incomplete current day data
 * Today's data may be incomplete (partial downloads), so exclude it from calculations
 */
function filterCompleteData(downloadsData) {
  const today = getTodayDateString();
  return downloadsData.filter(d => d.day !== today);
}

/**
 * Calculate weekly download patterns from historical data
 * Returns average downloads for each day of week (Sunday=0, Monday=1, etc.)
 */
function calculateWeeklyPattern(downloadsData) {
  const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  
  downloadsData.forEach(d => {
    const dayOfWeek = new Date(d.day).getDay();
    dayTotals[dayOfWeek] += d.downloads;
    dayCounts[dayOfWeek]++;
  });
  
  // Calculate averages for each day
  const dayAverages = dayTotals.map((total, i) => 
    dayCounts[i] > 0 ? Math.round(total / dayCounts[i]) : 0
  );
  
  // Calculate overall statistics
  const allDownloads = downloadsData.map(d => d.downloads);
  const overallMean = allDownloads.reduce((a, b) => a + b, 0) / allDownloads.length;
  const variance = allDownloads.reduce((sum, v) => sum + Math.pow(v - overallMean, 2), 0) / allDownloads.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate day-of-week factors (multiplier relative to mean)
  const dayFactors = dayAverages.map(avg => avg / overallMean || 1);
  
  return {
    dayAverages,
    dayFactors,
    overallMean,
    stdDev,
    min: Math.min(...allDownloads),
    max: Math.max(...allDownloads)
  };
}

/**
 * Calculate recent trend from historical data
 * Returns trend multiplier (>1 = increasing, <1 = decreasing)
 */
function calculateTrend(downloadsData, windowSize = 28) {
  if (downloadsData.length < windowSize * 2) {
    return { trendMultiplier: 1, momentum: 0 };
  }
  
  const recentData = downloadsData.slice(-windowSize * 2);
  
  // Compare first half to second half (each ~4 weeks)
  const firstHalf = recentData.slice(0, windowSize);
  const secondHalf = recentData.slice(-windowSize);
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.downloads, 0) / windowSize;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.downloads, 0) / windowSize;
  
  // Calculate trend multiplier (capped to prevent extreme values)
  let trendMultiplier = secondAvg / firstAvg || 1;
  trendMultiplier = Math.max(0.8, Math.min(1.2, trendMultiplier)); // Cap at ±20%
  
  // Calculate week-over-week momentum from last 2 weeks
  const lastWeek = downloadsData.slice(-7);
  const prevWeek = downloadsData.slice(-14, -7);
  const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.downloads, 0) / 7;
  const prevWeekAvg = prevWeek.reduce((sum, d) => sum + d.downloads, 0) / 7;
  const momentum = (lastWeekAvg - prevWeekAvg) / prevWeekAvg || 0;
  
  return { trendMultiplier, momentum };
}

/**
 * Normalize data to [0, 1] range
 */
function normalizeData(data) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return {
    normalized: data.map(v => (v - min) / range),
    min,
    max
  };
}

/**
 * Build a simple LSTM model for trend prediction
 */
function buildTrendModel(sequenceLength) {
  const model = tf.sequential();
  
  model.add(tf.layers.lstm({
    units: 32,
    inputShape: [sequenceLength, 1],
    returnSequences: false,
  }));
  
  model.add(tf.layers.dropout({ rate: 0.1 }));
  
  model.add(tf.layers.dense({ 
    units: 16, 
    activation: 'relu' 
  }));
  
  model.add(tf.layers.dense({ 
    units: 1,
    activation: 'linear'
  }));
  
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'meanSquaredError',
  });
  
  return model;
}

/**
 * Train LSTM to predict trend deviations
 */
async function trainTrendModel(model, downloadsData, weeklyPattern, sequenceLength = 7) {
  const { dayAverages, overallMean } = weeklyPattern;
  
  // Calculate deviation ratios: actual / expected for each day
  const deviationRatios = downloadsData.map(d => {
    const dayOfWeek = new Date(d.day).getDay();
    const expected = dayAverages[dayOfWeek];
    return expected > 0 ? d.downloads / expected : 1;
  });
  
  // Normalize deviation ratios
  const { normalized, min, max } = normalizeData(deviationRatios);
  
  // Create sequences
  const X = [];
  const y = [];
  
  for (let i = sequenceLength; i < normalized.length; i++) {
    X.push(normalized.slice(i - sequenceLength, i).map(v => [v]));
    y.push([normalized[i]]);
  }
  
  if (X.length < 10) {
    return { model: null, deviationStats: { min: 0.5, max: 1.5 } };
  }
  
  const xTensor = tf.tensor3d(X);
  const yTensor = tf.tensor2d(y);
  
  await model.fit(xTensor, yTensor, {
    epochs: 20,
    batchSize: 32,
    shuffle: true,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        const progress = Math.round(20 + ((epoch + 1) / 20) * 50);
        self.postMessage({
          type: 'progress',
          progress,
          message: `Training trend model: ${epoch + 1}/20 (loss: ${logs.loss.toFixed(4)})`
        });
      }
    }
  });
  
  xTensor.dispose();
  yTensor.dispose();
  
  return { 
    model, 
    deviationStats: { min, max },
    lastSequence: normalized.slice(-sequenceLength).map(v => [v])
  };
}

/**
 * Generate future dates from a start date
 * Starts from day after startDate (i=1) by default, or from today (i=0) if includeToday is true
 */
function generateFutureDates(startDate, days, includeStartPlusOne = true) {
  const dates = [];
  const start = new Date(startDate);
  const startOffset = includeStartPlusOne ? 1 : 0;
  
  for (let i = startOffset; i < startOffset + days; i++) {
    const futureDate = new Date(start);
    futureDate.setDate(start.getDate() + i);
    dates.push(futureDate.toISOString().substring(0, 10));
  }
  
  return dates;
}

/**
 * Calculate confidence intervals
 */
function calculateConfidenceIntervals(predictions, stdDev, confidenceLevel = 0.95) {
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645;
  
  const lower = predictions.map((p, i) => 
    Math.max(0, Math.round(p - stdDev * zScore * (1 + i * 0.03)))
  );
  const upper = predictions.map((p, i) => 
    Math.round(p + stdDev * zScore * (1 + i * 0.03))
  );
  
  return { lower, upper };
}

/**
 * Main pattern-anchored LSTM prediction function
 * 
 * Strategy:
 * 1. Calculate weekly patterns (Mon-Sun averages) from 365 days of history
 * 2. Use LSTM to predict deviation from pattern (not absolute values)
 * 3. Anchor each prediction to historical pattern for that day-of-week
 * 4. Apply trend and variance for realistic predictions
 */
async function predictWithPatternAnchor(downloadsData, daysToPredict) {
  const sequenceLength = 7;
  
  if (!downloadsData || downloadsData.length < 30) {
    throw new Error('Not enough data for prediction (need at least 30 days)');
  }
  
  self.postMessage({ type: 'progress', progress: 5, message: 'Analyzing weekly patterns...' });
  
  // Step 1: Calculate weekly patterns from all historical data
  const weeklyPattern = calculateWeeklyPattern(downloadsData);
  const { dayAverages, stdDev, overallMean } = weeklyPattern;
  
  self.postMessage({ 
    type: 'progress', 
    progress: 10, 
    message: `Pattern found: weekday avg ~${Math.round(dayAverages[1])}, weekend avg ~${Math.round(dayAverages[0])}` 
  });
  
  // Step 2: Calculate recent trend
  const { trendMultiplier, momentum } = calculateTrend(downloadsData);
  
  self.postMessage({ 
    type: 'progress', 
    progress: 15, 
    message: `Trend: ${trendMultiplier > 1 ? 'increasing' : trendMultiplier < 1 ? 'decreasing' : 'stable'} (${((trendMultiplier - 1) * 100).toFixed(1)}%)` 
  });
  
  // Step 3: Build and train LSTM for deviation prediction
  const model = buildTrendModel(sequenceLength);
  
  self.postMessage({ type: 'progress', progress: 20, message: 'Training deviation model...' });
  
  const { deviationStats, lastSequence } = await trainTrendModel(
    model, 
    downloadsData, 
    weeklyPattern, 
    sequenceLength
  );
  
  self.postMessage({ type: 'progress', progress: 75, message: 'Generating pattern-anchored predictions...' });
  
  // Step 4: Generate predictions anchored to weekly pattern
  // Since we excluded today's incomplete data, lastCompleteDate is yesterday
  // Predictions should start from today (day after lastCompleteDate)
  const predictions = [];
  const lastCompleteDate = new Date(downloadsData[downloadsData.length - 1].day);
  
  // Get recent deviation ratios for variance calculation
  const recentDeviations = downloadsData.slice(-14).map(d => {
    const dayOfWeek = new Date(d.day).getDay();
    return dayAverages[dayOfWeek] > 0 ? d.downloads / dayAverages[dayOfWeek] : 1;
  });
  const deviationStdDev = Math.sqrt(
    recentDeviations.reduce((sum, d) => sum + Math.pow(d - 1, 2), 0) / recentDeviations.length
  );
  
  // Use LSTM to predict trend continuation
  let currentSequence = lastSequence ? [...lastSequence] : null;
  let lstmPredictions = [];
  
  if (currentSequence && model) {
    for (let i = 0; i < Math.min(daysToPredict, 14); i++) {
      try {
        const input = tf.tensor3d([currentSequence]);
        const pred = model.predict(input);
        const predValue = (await pred.data())[0];
        lstmPredictions.push(predValue);
        
        // Update sequence for next prediction
        currentSequence = [...currentSequence.slice(1), [predValue]];
        
        input.dispose();
        pred.dispose();
      } catch (e) {
        lstmPredictions.push(1); // Default to no deviation
      }
    }
    
    // Denormalize LSTM predictions to deviation ratios
    const { min, max } = deviationStats;
    const range = max - min || 1;
    lstmPredictions = lstmPredictions.map(p => p * range + min);
  }
  
  // Generate predictions for each future day (starting from day after lastCompleteDate = today)
  for (let i = 0; i < daysToPredict; i++) {
    const predDate = new Date(lastCompleteDate);
    predDate.setDate(lastCompleteDate.getDate() + i + 1);
    const dayOfWeek = predDate.getDay();
    
    // Base prediction from weekly pattern
    const baseValue = dayAverages[dayOfWeek];
    
    // Apply trend (gradual, not compounding too fast)
    const trendFactor = 1 + (trendMultiplier - 1) * Math.min(1, (i + 1) / 30);
    
    // Apply momentum (decays over time)
    const momentumFactor = 1 + momentum * Math.exp(-i / 7) * 0.3;
    
    // Apply LSTM deviation if available, otherwise use slight randomness
    let deviationFactor = 1;
    if (i < lstmPredictions.length) {
      // LSTM prediction, capped to reasonable range
      deviationFactor = Math.max(0.7, Math.min(1.3, lstmPredictions[i]));
    } else {
      // For predictions beyond LSTM range, use gradual decay to pattern mean
      const decayFactor = Math.exp(-(i - 14) / 20);
      const randomDeviation = (Math.random() - 0.5) * 2 * deviationStdDev * 0.5;
      deviationFactor = 1 + randomDeviation * decayFactor;
    }
    
    // Combine all factors
    let prediction = baseValue * trendFactor * momentumFactor * deviationFactor;
    
    // Add controlled random variance based on historical volatility
    const variance = (Math.random() - 0.5) * stdDev * 0.3;
    prediction += variance;
    
    // Ensure positive and round
    predictions.push(Math.max(0, Math.round(prediction)));
  }
  
  // Cleanup
  if (model) {
    model.dispose();
  }
  
  self.postMessage({ type: 'progress', progress: 95, message: 'Calculating confidence intervals...' });
  
  const futureDates = generateFutureDates(lastCompleteDate.toISOString().substring(0, 10), daysToPredict);
  const confidence = calculateConfidenceIntervals(predictions, stdDev);
  
  return {
    dates: futureDates,
    values: predictions,
    confidence,
    metadata: {
      method: 'pattern-anchored-lstm',
      weeklyPattern: dayAverages,
      trend: trendMultiplier,
      dataPoints: downloadsData.length
    }
  };
}

/**
 * Improved moving average prediction with pattern recognition
 * Fallback when LSTM fails
 */
function predictWithMovingAverage(downloadsData, daysToPredict) {
  if (!downloadsData || downloadsData.length < 7) {
    throw new Error('Not enough data for prediction');
  }
  
  self.postMessage({ type: 'progress', progress: 30, message: 'Calculating pattern-based moving average...' });
  
  // Calculate weekly patterns
  const weeklyPattern = calculateWeeklyPattern(downloadsData);
  const { dayAverages, stdDev } = weeklyPattern;
  
  // Calculate trend
  const { trendMultiplier } = calculateTrend(downloadsData);
  
  const predictions = [];
  const lastDate = new Date(downloadsData[downloadsData.length - 1].day);
  
  // Use last 4 weeks to calculate recent adjustment factors
  const last28Days = downloadsData.slice(-28);
  const recentFactors = last28Days.map(d => {
    const dow = new Date(d.day).getDay();
    return dayAverages[dow] > 0 ? d.downloads / dayAverages[dow] : 1;
  });
  const recentFactor = recentFactors.reduce((a, b) => a + b, 0) / recentFactors.length;
  
  for (let i = 0; i < daysToPredict; i++) {
    const predDate = new Date(lastDate);
    predDate.setDate(lastDate.getDate() + i + 1);
    const dayOfWeek = predDate.getDay();
    
    // Base from weekly pattern
    let prediction = dayAverages[dayOfWeek];
    
    // Apply recent performance adjustment
    prediction *= recentFactor;
    
    // Apply trend
    prediction *= 1 + (trendMultiplier - 1) * Math.min(1, (i + 1) / 30);
    
    // Add variance
    const variance = (Math.random() - 0.5) * stdDev * 0.25;
    prediction += variance;
    
    predictions.push(Math.max(0, Math.round(prediction)));
  }
  
  self.postMessage({ type: 'progress', progress: 90, message: 'Finalizing predictions...' });
  
  const futureDates = generateFutureDates(lastDate.toISOString().substring(0, 10), daysToPredict);
  const confidence = calculateConfidenceIntervals(predictions, stdDev);
  
  return {
    dates: futureDates,
    values: predictions,
    confidence,
    metadata: {
      method: 'pattern-moving-average',
      weeklyPattern: dayAverages,
      trend: trendMultiplier,
      dataPoints: downloadsData.length
    }
  };
}

/**
 * Handle messages from the main thread
 */
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  if (type === 'predict') {
    const { downloadsData, daysToPredict, useLSTM } = data;
    
    try {
      self.postMessage({ type: 'start' });
      
      // Filter out today's incomplete data before processing
      const completeData = filterCompleteData(downloadsData);
      const today = getTodayDateString();
      const excludedToday = downloadsData.length !== completeData.length;
      
      if (excludedToday) {
        self.postMessage({ 
          type: 'progress', 
          progress: 2, 
          message: `Excluding incomplete data for ${today}` 
        });
      }
      
      let result;
      
      if (useLSTM) {
        try {
          result = await predictWithPatternAnchor(completeData, daysToPredict);
        } catch (lstmError) {
          console.warn('Pattern-anchored LSTM failed, falling back to moving average:', lstmError);
          self.postMessage({ 
            type: 'progress', 
            progress: 50, 
            message: 'LSTM unavailable, using pattern-based prediction...' 
          });
          result = predictWithMovingAverage(completeData, daysToPredict);
        }
      } else {
        result = predictWithMovingAverage(completeData, daysToPredict);
      }
      
      self.postMessage({ type: 'progress', progress: 100, message: 'Complete!' });
      self.postMessage({ type: 'result', result });
      
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
    }
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });