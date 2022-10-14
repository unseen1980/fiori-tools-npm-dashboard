import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

function chart(props: any) {
  const noData = props.data.datasets[0].data.every((v: string) => v === "0.00");
  return (
    <div
      style={{
        maxHeight: "50vh",
      }}
    >
      {props.data.labels.length > 0 ? (
        <div>
          <Doughnut data={props.data} />
          {noData ? (
            <div className="">
              <p className="text-center mt-1 text-sm text-gray-500 dark:text-gray-500">
                {" "}
                No data available or very small size
              </p>
            </div>
          ) : (
            ""
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          No data available
        </p>
      )}
    </div>
  );
}

export default chart;
