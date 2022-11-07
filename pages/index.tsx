import type { NextPage } from "next";
import { useEffect, useState } from "react";
import MainPageCard from "../components/MainPageCard";
import Layout from "../components/Layout";
import Link from "next/link";
import React from "react";
import { DataContext } from "../pages/_app";
import { downloadCounts, bytesToSize, getPercent } from "../helpers/utils";
import moment from "moment";

const Home: NextPage = () => {
  const [isLoading, setLoading] = useState(false);
  const dataContext: any = React.useContext(DataContext);
  const [mainPageCardDataSap, setMainPageCardsDataSap] = useState();
  const [mainPageCardDataSapUx, setMainPageCardsDataSapUx] = useState();
  const [numOfTotalDownloads, setNumOfTotalDownloads] = useState(0);
  const start = moment().subtract("months", 1).toDate(); // start date for lookup
  const end = new Date(); // end date for lookup

  const totalDownloads = async (val: any) => {
    Promise.allSettled(val).then((results) => {
      const totalNum = results
        .map((result: any) =>
          result.value
            .map((d: any) => d.downloads)
            .reduce((a: any, b: any) => a + b, 0)
        )
        .reduce((a: any, b: any) => a + b, 0);
      setNumOfTotalDownloads(totalNum);
    });
  };

  useEffect(() => {
    setLoading(true);
    if (dataContext !== undefined) {
      const mainPageCardsData = {
        numOfSapModules: dataContext.filter((m: any) =>
          m._id.startsWith("@sap/")
        ).length,
        numOfSapUxModules: dataContext.filter((m: any) =>
          m._id.startsWith("@sap-ux/")
        ).length,
      };
      totalDownloads(
        dataContext.map(async (m: any, i: any) =>
          downloadCounts(m.name as string, start, end)
        )
      );
      setMainPageCardsDataSap(mainPageCardsData.numOfSapModules);
      setMainPageCardsDataSapUx(mainPageCardsData.numOfSapUxModules);
      setLoading(false);
    }
  }, [dataContext]);

  return (
    <Layout>
      <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
        <div className="container mx-auto bg-white">
          {isLoading && (
            <div className="grid grid-cols-1 place-items-center">
              <div
                className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}
          {!isLoading && (
            <div className="grid grid-cols-3 gap-4">
              <MainPageCard
                values={{
                  title: "Number of @sap npm modules",
                  value: mainPageCardDataSap,
                }}
              />
              <MainPageCard
                values={{
                  title: "Number of @sap-ux npm modules",
                  value: mainPageCardDataSapUx,
                }}
              />
              <MainPageCard
                values={{
                  title: "Number of total downloads in last 30 days",
                  value: numOfTotalDownloads.toLocaleString(),
                }}
              />
              <div className="col-span-3 ...">
                <div className="flex flex-col">
                  <div className="-m-1.5 overflow-x-auto">
                    <div className="p-1.5 min-w-full inline-block align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-800 dark:border-gray-700 rounded-xl dark:shadow-slate-700/[.7]">
                          <thead>
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                Module name
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                Version
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                Number of files
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                Filesize
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {dataContext !== undefined
                              ? //@ts-ignore
                                dataContext.map((v, i) => (
                                  <tr className="">
                                    <td className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                      <Link
                                        key={i}
                                        href={{
                                          pathname: "/" + v._rev,
                                          query: { name: v.name },
                                        }}
                                      >
                                        {v.name}
                                      </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                      {v["dist-tags"].latest}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                      {
                                        v.versions[v["dist-tags"].latest].dist
                                          .fileCount
                                      }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                      {bytesToSize(
                                        v.versions[v["dist-tags"].latest].dist
                                          .unpackedSize,
                                        2,
                                        true
                                      )}

                                      {parseFloat(
                                        getPercent(
                                          v.versions[
                                            Object.keys(v.versions)[
                                              Object.keys(v.versions).length - 2
                                            ]
                                          ]?.dist.unpackedSize,
                                          v.versions[
                                            Object.keys(v.versions)[
                                              Object.keys(v.versions).length - 1
                                            ]
                                          ].dist.unpackedSize
                                        )
                                      ) === 0.0 ? (
                                        <b> - </b>
                                      ) : parseFloat(
                                          getPercent(
                                            v.versions[
                                              Object.keys(v.versions)[
                                                Object.keys(v.versions).length -
                                                  2
                                              ]
                                            ]?.dist.unpackedSize,
                                            v.versions[
                                              Object.keys(v.versions)[
                                                Object.keys(v.versions).length -
                                                  1
                                              ]
                                            ].dist.unpackedSize
                                          )
                                        ) > 0 ? (
                                        <b className="text-red-400">
                                          {" "}
                                          &#8599;{" "}
                                        </b>
                                      ) : (
                                        <b className="text-green-400">
                                          {" "}
                                          &#8601;{" "}
                                        </b>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              : ""}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
