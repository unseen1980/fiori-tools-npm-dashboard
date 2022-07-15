import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  fectNpmPackage,
  bytesToSize,
  downloadCounts,
} from "../../helpers/utils";
import { useEffect, useState } from "react";
import LineChart from "../../components/LineChart";
import moment from "moment";

const Details = () => {
  const router = useRouter();
  const { name } = router.query;
  const [data, setData] = useState();
  const [filesNumberChartData, setFilesNumberChartData] = useState();
  const [bundleSizeChartData, setBundleSizeChartData] = useState();
  const [downloadsChartData, setDownloadsChartData] = useState();
  const start = moment().subtract("months", 1).toDate(); // start date for lookup
  const end = new Date(); // end date for lookup

  useEffect(() => {
    fectNpmPackage(name).then((d) => {
      setData(d);
      console.log("Detailed data for " + name, d);
      const filesNumberChartData: any = {
        labels: Object.keys(d.versions),
        datasets: [
          {
            label: "Number of files",
            data: Object.keys(d.versions).map((ver) => {
              return d.versions[ver].dist.fileCount;
            }),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      };
      const bundleSizeChartData: any = {
        labels: Object.keys(d.versions),
        datasets: [
          {
            label: "Bundle size in MB",
            data: Object.keys(d.versions).map((ver) => {
              return bytesToSize(d.versions[ver].dist.unpackedSize);
            }),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      };
      setFilesNumberChartData(filesNumberChartData);
      setBundleSizeChartData(bundleSizeChartData);
    });

    downloadCounts(name as string, start, end).then((downloadsData) => {
      const data: any = {
        labels: downloadsData.map((d: any) => d.day),
        datasets: [
          {
            label: "Numbers of downloads in last 30 days",
            data: downloadsData.map((d: any) => d.downloads),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      };

      setDownloadsChartData(data);
    });
  }, []);

  return (
    <>
      <Layout>
        <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
          {data !== undefined ? (
            <div className="container mx-auto bg-white">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 ...">
                  <h3 className="text-lg font-bold text-gray-800">{name}</h3>
                  <h3 className="text-lg font-bold text-gray-800">
                    {data.description}
                  </h3>
                </div>
                <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Bundle size in kB
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <LineChart data={bundleSizeChartData} />
                  </div>
                </div>
                <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of files
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <LineChart data={filesNumberChartData} />
                  </div>
                </div>
                <div className="flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of downloads
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    {downloadsChartData !== undefined ? (
                      <LineChart data={downloadsChartData} />
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
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
                                  Version
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                >
                                  Release date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {Object.keys(data.time).map((t) => (
                                <tr>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {t}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                    {moment(data.time[t]).format("lll")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Details;
