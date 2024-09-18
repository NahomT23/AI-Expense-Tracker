import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import { MdLogout } from "react-icons/md";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@apollo/client";
import { LOGOUT } from "../graphql/mutations/user.mutation";
import { GET_TRANSACTION_STATISTICS } from "../graphql/queries/transaction.query";
import { GET_AUTHENTICATED_USER } from "../graphql/queries/user.query";

import Cards from "../components/Cards";
import TransactionForm from "../components/TransactionForm";
import Charts from "../components/Charts";
import Advice from "../components/Advice";

ChartJS.register(ArcElement, Tooltip, Legend);

const HomePage = () => {
  const { data } = useQuery(GET_TRANSACTION_STATISTICS);
  const { data: authUserData } = useQuery(GET_AUTHENTICATED_USER);

  const [logout, { loading, client }] = useMutation(LOGOUT, {
    refetchQueries: ["GetAuthenticatedUser"],
  });

  const [chartType, setChartType] = useState("doughnut");

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "$",
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
        borderRadius: 30,
        spacing: 0,
      },
    ],
  });

  useEffect(() => {
    if (data?.categoryStatistics) {
      const categories = data.categoryStatistics.map((stat) => stat.category);
      const totalAmounts = data.categoryStatistics.map(
        (stat) => stat.totalAmount
      );

      const backgroundColors = [];
      const borderColors = [];

      categories.forEach((category) => {
        if (category === "saving") {
          backgroundColors.push("rgba(34, 197, 94)"); // Green-500
          borderColors.push("rgba(34, 197, 94)"); // Green-500
        } else if (category === "expense") {
          backgroundColors.push("rgba(219, 39, 119)"); // Pink-800
          borderColors.push("rgba(219, 39, 119)"); // Pink-800
        } else if (category === "investment") {
          backgroundColors.push("rgba(59, 130, 246)"); // Blue-500
          borderColors.push("rgba(96, 165, 250)"); // Blue-400
        }
      })        

      setChartData((prev) => ({
        labels: categories,
        datasets: [
          {
            ...prev.datasets[0],
            data: totalAmounts,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
          },
        ],
      }));
    }
  }, [data]);

  const handleLogout = async () => {
    try {
      await logout();
      // Clear the Apollo Client cache FROM THE DOCS
      // https://www.apollographql.com/docs/react/caching/advanced-topics/#:~:text=Resetting%20the%20cache,any%20of%20your%20active%20queries
      client.resetStore();
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(error.message);
    }
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value); // Update chart type based on user selection
  };

  return (
    <>
      <div className="flex flex-col gap-6 items-center max-w-7xl mx-auto z-20 relative justify-center">
        <div className="flex items-center">
          <p className="md:text-4xl text-2xl lg:text-4xl font-bold text-center relative z-50 mb-4 mr-4 bg-gradient-to-r from-pink-600 via-indigo-500 to-pink-400 inline-block text-transparent bg-clip-text">
            Spend wisely, track wisely
          </p>
          <img
            src={authUserData?.authUser.profilePicture}
            className="w-11 h-11 rounded-full border cursor-pointer"
            alt="Avatar"
          />
          {!loading && (
            <MdLogout
              className="mx-2 w-5 h-5 cursor-pointer"
              onClick={handleLogout}
            />
          )}
          {/* loading spinner */}
          {loading && (
            <div className="w-6 h-6 border-t-2 border-b-2 mx-2 rounded-full animate-spin"></div>
          )}
        </div>
        <div className="flex flex-wrap w-full justify-center items-center gap-6">
          {data?.categoryStatistics.length > 0 && (
            <>
              <select
                className="border border-gray-300 rounded-md p-2 bg-black text-white"
                value={chartType}
                onChange={handleChartTypeChange}
              >
                <option value="doughnut">Doughnut Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="bar">Bar Chart</option>
              </select>

              <div className="h-[330px] w-[330px] md:h-[360px] md:w-[360px]">
                <Charts chartType={chartType} chartData={chartData} />
              </div>
            </>
          )}
          <TransactionForm />
        </div>
        <Cards />
        <Advice />
        
      </div>
    </>
  );
};

export default HomePage;

