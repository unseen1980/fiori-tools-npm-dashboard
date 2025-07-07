import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { ChartData } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonughtChartProps {
  data: ChartData;
}

const DonughtChart: React.FC<DonughtChartProps> = ({ data }) => {
  const hasData = data.labels && data.labels.length > 0;
  const noData = hasData && data.datasets[0]?.data.every((v) => 
    typeof v === 'number' ? v === 0 : parseFloat(String(v)) === 0
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (!hasData) {
    return (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-500 text-center">
        No data available
      </p>
    );
  }

  return (
    <div style={{ height: "300px" }}>
      <Doughnut data={data} options={options} />
      {noData && (
        <p className="text-center mt-1 text-sm text-gray-500 dark:text-gray-500">
          No data available or very small size
        </p>
      )}
    </div>
  );
};

export default DonughtChart;
