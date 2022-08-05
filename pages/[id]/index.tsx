import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  fectNpmPackage,
  bytesToSize,
  downloadCounts,
  fectNpmPackageByVersion,
} from "../../helpers/utils";
import { useEffect, useState } from "react";
import LineChart from "../../components/LineChart";
import DonughtChart from "../../components/DonughtChart";
import moment from "moment";

const Details = () => {
  const router = useRouter();
  const { name } = router.query;
  const [data, setData] = useState();
  const [filesNumberChartData, setFilesNumberChartData] = useState();
  const [bundleSizeChartData, setBundleSizeChartData] = useState();
  const [downloadsChartData, setDownloadsChartData] = useState();
  const [dependenciesChartData, setDependenciesChartData] = useState();
  const [devDependenciesChartData, setDevDependenciesChartData] = useState();
  const start = moment().subtract("months", 1).toDate(); // start date for lookup
  const end = new Date(); // end date for lookup

  useEffect(() => {
    fectNpmPackage(name)
      .then((d) => {
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
              label: `Bundle size ${bytesToSize(
                d.versions[
                  Object.keys(d.versions)[Object.keys(d.versions).length - 1]
                ].dist.unpackedSize,
                2,
                true
              ).slice(-2)}`,
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
        return d;
      })
      .then(async (d) => {
        const dependenciesChartData: any = {
          labels: Object.keys(
            d.versions[
              Object.keys(d.versions)[Object.keys(d.versions).length - 1]
            ].dependencies
          ).map(
            (dep) =>
              `${dep}@${
                d.versions[
                  Object.keys(d.versions)[Object.keys(d.versions).length - 1]
                ].dependencies[dep]
              }`
          ),
          datasets: [
            {
              label: "Dependencies",
              data: [],
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
          ],
        };

        const depsSize = await Promise.all(
          Object.keys(
            d.versions[
              Object.keys(d.versions)[Object.keys(d.versions).length - 1]
            ].dependencies
          ).map(async (dep) => {
            const val = await fectNpmPackageByVersion(
              dep,
              d.versions[
                Object.keys(d.versions)[Object.keys(d.versions).length - 1]
              ].dependencies[dep]
            );
            let sizeInMB = (val.dist.unpackedSize / (1024 * 1024)).toFixed(2);

            return sizeInMB;
          })
        );

        dependenciesChartData.datasets[0].data = depsSize;
        setDependenciesChartData(dependenciesChartData);

        const devDependenciesChartData: any = {
          labels: Object.keys(
            d.versions[
              Object.keys(d.versions)[Object.keys(d.versions).length - 1]
            ].devDependencies
          ).map(
            (dep) =>
              `${dep}@${
                d.versions[
                  Object.keys(d.versions)[Object.keys(d.versions).length - 1]
                ].devDependencies[dep]
              }`
          ),
          datasets: [
            {
              label: "DevDependencies",
              data: [],
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
          ],
        };

        const devDepsSize = await Promise.all(
          Object.keys(
            d.versions[
              Object.keys(d.versions)[Object.keys(d.versions).length - 1]
            ].devDependencies
          ).map(async (dep) => {
            const val = await fectNpmPackageByVersion(
              dep,
              d.versions[
                Object.keys(d.versions)[Object.keys(d.versions).length - 1]
              ].devDependencies[dep]
            );
            let sizeInMB = (val.dist.unpackedSize / (1024 * 1024)).toFixed(2);

            return sizeInMB;
          })
        );

        devDependenciesChartData.datasets[0].data = devDepsSize;
        setDevDependenciesChartData(devDependenciesChartData);
      });

    downloadCounts(name as string, start, end).then((downloadsData) => {
      const data: any = {
        labels: downloadsData.map((d: any) => d.day),
        datasets: [
          {
            label: "Daily downloads",
            data: downloadsData.map((d: any) => d.downloads),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      };

      setDownloadsChartData(data);
    });
  }, [name]);

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
                    {
                      //@ts-ignore
                      data.description
                    }
                  </h3>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Bundle size
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <LineChart data={bundleSizeChartData} />
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of files
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <LineChart data={filesNumberChartData} />
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of downloads per day
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
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Dependencies
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    {dependenciesChartData !== undefined ? (
                      <DonughtChart data={dependenciesChartData} />
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Dev Dependencies
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    {devDependenciesChartData !== undefined ? (
                      <DonughtChart data={devDependenciesChartData} />
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
                              {
                                //@ts-ignore
                                Object.keys(data.time).map((t, i) => (
                                  <tr key={i}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {t}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                      {
                                        //@ts-ignore
                                        moment(data.time[t]).format("lll")
                                      }
                                    </td>
                                  </tr>
                                ))
                              }
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
