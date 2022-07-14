import React from "react";

const Card = (props: any) => {
  if (props.values._id !== undefined) {
    return (
      <div className="flex flex-col bg-white border shadow-sm rounded-xl p-4 md:p-5 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          {props.values.name}
        </h3>
        <p className="mt-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-500">
          SAP SE
        </p>
        <p className="mt-2 text-gray-800 dark:text-gray-400">
          {props.values.description}
        </p>
      </div>
    );
  }
  return "";
};

export default Card;
