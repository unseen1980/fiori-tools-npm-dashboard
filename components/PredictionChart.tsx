import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { PredictionResult } from "../helpers/prediction";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PredictionChartProps {
  historicalData: {
    labels: string[];
    data: number[];
  };
  prediction: PredictionResult | null;
  isLoading?: boolean;
  progress?: number;
  progressMessage?: string;
  showConfidence?: boolean;
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  historicalData,
  prediction,
  isLoading = false,
  progress = 0,
  progressMessage = '',
  showConfidence = true,
}) => {
  const chartData = useMemo(() => {
    // Combine historical and prediction data
    const allLabels = [
      ...historicalData.labels,
      ...(prediction?.dates || []),
    ];

    // Historical data with nulls for prediction period
    const historicalValues = [
      ...historicalData.data,
      ...Array(prediction?.dates?.length || 0).fill(null),
    ];

    // Prediction data with nulls for historical period (overlap last point)
    const predictionValues = [
      ...Array(historicalData.labels.length - 1).fill(null),
      historicalData.data[historicalData.data.length - 1], // Connect to last historical point
      ...(prediction?.values || []),
    ];

    // Confidence interval data (upper bound)
    const upperBound = showConfidence && prediction?.confidence
      ? [
          ...Array(historicalData.labels.length - 1).fill(null),
          historicalData.data[historicalData.data.length - 1],
          ...prediction.confidence.upper,
        ]
      : [];

    // Confidence interval data (lower bound)
    const lowerBound = showConfidence && prediction?.confidence
      ? [
          ...Array(historicalData.labels.length - 1).fill(null),
          historicalData.data[historicalData.data.length - 1],
          ...prediction.confidence.lower,
        ]
      : [];

    const datasets: any[] = [
      {
        label: 'Historical Downloads',
        data: historicalValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Predicted Downloads',
        data: predictionValues,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointStyle: 'triangle',
      },
    ];

    // Add confidence interval as a filled area
    if (showConfidence && prediction?.confidence) {
      datasets.push({
        label: 'Confidence Interval (Upper)',
        data: upperBound,
        borderColor: 'rgba(34, 197, 94, 0.3)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderDash: [2, 2],
        tension: 0.1,
        pointRadius: 0,
        fill: '+1', // Fill to the next dataset (lower bound)
      });

      datasets.push({
        label: 'Confidence Interval (Lower)',
        data: lowerBound,
        borderColor: 'rgba(34, 197, 94, 0.3)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [2, 2],
        tension: 0.1,
        pointRadius: 0,
        fill: false,
      });
    }

    return {
      labels: allLabels,
      datasets,
    };
  }, [historicalData, prediction, showConfidence]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          filter: (item: any) => !item.text.includes('Confidence Interval'),
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null) return '';
            return `${label}: ${value.toLocaleString()} downloads`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 15,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {/* Spinner */}
          <div
            className="animate-spin inline-block w-10 h-10 border-[3px] border-current border-t-transparent text-green-600 rounded-full"
            role="status"
          >
            <span className="sr-only">Generating prediction...</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Progress text */}
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
            <p className="text-xs text-gray-500 mt-1">{progressMessage || 'Training ML model...'}</p>
          </div>
          
          {/* Info text */}
          <p className="text-xs text-gray-400 text-center">
            This runs in a background thread<br/>and won&apos;t freeze the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "350px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PredictionChart;