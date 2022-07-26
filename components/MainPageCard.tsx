import React from "react";

const MainPageCard = (props: any) => {
  if (props.values.title !== undefined) {
    return (
      <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
        <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
          <p className="mt-1 text-sm text-gray-800 dark:text-white text-xl">
            {props.values.title}
          </p>
        </div>
        <div className="p-4 md:p-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white text-3xl">
            {props.values.value}
          </h3>
        </div>
      </div>
    );
  }
  return <></>;
};

export default MainPageCard;
