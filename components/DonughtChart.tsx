import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

function chart(props: any) {
  return (
    <div
      style={{
        maxHeight: "50vh",
      }}
    >
      <Doughnut data={props.data} />
    </div>
  );
}

export default chart;
