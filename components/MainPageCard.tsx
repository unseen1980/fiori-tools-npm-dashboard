import React from "react";
import { MainPageCardData } from "../types";

interface MainPageCardProps {
  values: MainPageCardData;
}

const MainPageCard: React.FC<MainPageCardProps> = ({ values }) => {
  if (!values.title) {
    return null;
  }

  return (
    <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
      <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
        <p className="mt-1 text-sm text-gray-800 dark:text-white text-xl">
          {values.title}
        </p>
      </div>
      <div className="p-4 md:p-5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-3xl">
          {values.value || 'Loading...'}
        </h3>
      </div>
    </div>
  );
};

export default MainPageCard;
