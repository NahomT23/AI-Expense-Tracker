import React from "react";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from "chart.js";
import PropTypes from "prop-types";

ChartJS.register(CategoryScale, LinearScale, BarElement);

const Charts = ({ chartType, chartData }) => {
  // Map category labels to the desired values
  const mappedChartData = {
    ...chartData,
    labels: chartData.labels.map((label) => {
      if (label === "investment") return "Income";
      if (label === "saving") return "Budget";
      if (label === "expense") return "Expense";
      return label;
    }),
  };

  return (
    <div>
      {chartType === "bar" && (
        <Bar
          data={mappedChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `$${context.raw}`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Amount ($)", // Title for Y-axis
                },
                ticks: {
                  stepSize: 100, // Adjust step size if necessary
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Categories", // Title for X-axis
                },
                ticks: {
                  autoSkip: false, 
                  maxRotation: 45, 
                  minRotation: 0, 
                },
              },
            },
            aspectRatio: 1.2, // Reverted to the original aspect ratio
          }}
        />
      )}
      {chartType === "doughnut" && (
        <Doughnut
          data={mappedChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `$${context.raw}`;
                  },
                },
              },
            },
            cutout: "85%", // Thinner doughnut chart
          }}
        />
      )}
      {chartType === "pie" && (
        <Pie
          data={mappedChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `$${context.raw}`;
                  },
                },
              },
            },
          
          }}
        />
      )}
    </div>
  );
};

Charts.propTypes = {
  chartType: PropTypes.string.isRequired,
  chartData: PropTypes.object.isRequired,
};

export default Charts;
