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
import cmp from "semver-compare";

const Details = () => {
  const router = useRouter();
  const { name } = router.query;
  const [data, setData] = useState();
  const [filesNumberChartData, setFilesNumberChartData] = useState();
  const [bundleSizeChartData, setBundleSizeChartData] = useState();
  const [downloadsChartData, setDownloadsChartData] = useState();
  const [dependenciesChartData, setDependenciesChartData] = useState();
  const [devDependenciesChartData, setDevDependenciesChartData] = useState();
  const [optionalDependencies, setOptionalDevDependencies] = useState();
  const [peerDependencies, setPeerDependencies] = useState();
  const [bundledDependencies, setBundledDependencies] = useState();
  const start = moment().subtract("months", 1).toDate(); // start date for lookup
  const end = new Date(); // end date for lookup

  const sortAndSliceVersions = (d: { versions: {} }) =>
    Object.keys(d.versions).sort(cmp).slice(-30);

  useEffect(() => {
    fectNpmPackage(name)
      .then((d) => {
        setData(d);
        console.log("Detailed data for " + name, d);
        const filesNumberChartData: any = {
          labels: sortAndSliceVersions(d),
          datasets: [
            {
              label: "Number of files",
              data: sortAndSliceVersions(d).map((ver) => {
                return d.versions[ver].dist.fileCount;
              }),
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
          ],
        };
        const bundleSizeChartData: any = {
          labels: sortAndSliceVersions(d),
          datasets: [
            {
              label: `Bundle size ${bytesToSize(
                d.versions[
                  sortAndSliceVersions(d)[sortAndSliceVersions(d).length - 1]
                ].dist.unpackedSize,
                2,
                true
              ).slice(-2)}`,
              data: sortAndSliceVersions(d).map((ver) => {
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
        const dependenciesLatestVersion =
          d.versions[
            Object.keys(d.versions)[Object.keys(d.versions).length - 1]
          ];
        console.log("Dependencies: ", dependenciesLatestVersion);
        const dependenciesLatestVersionArray =
          dependenciesLatestVersion.dependencies || {};
        const dependenciesChartData: any = {
          labels: Object.keys(dependenciesLatestVersionArray).map(
            (dep) => `${dep}@${dependenciesLatestVersionArray[dep]}`
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
          Object.keys(dependenciesLatestVersionArray).map(async (dep) => {
            let sizeInMB;
            if (dep) {
              const val = await fectNpmPackageByVersion(
                dep,
                dependenciesLatestVersionArray[dep]
              );
              sizeInMB = (val?.dist?.unpackedSize / (1024 * 1024)).toFixed(2);
            }
            return sizeInMB === undefined ? 0 : sizeInMB;
          })
        );

        dependenciesChartData.datasets[0].data = depsSize;
        setDependenciesChartData(dependenciesChartData);

        const devDependenciesLatestVersionArray =
          dependenciesLatestVersion.devDependencies || {};

        const devDependenciesChartData: any = {
          labels: Object.keys(devDependenciesLatestVersionArray).map((dep) => {
            if (dep) {
              return `${dep}@${devDependenciesLatestVersionArray[dep]}`;
            }
            return "0";
          }),
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
          Object.keys(devDependenciesLatestVersionArray).map(async (dep) => {
            let sizeInMB;
            if (dep) {
              const val = await fectNpmPackageByVersion(
                dep,
                devDependenciesLatestVersionArray[dep]
              );
              sizeInMB = (val?.dist?.unpackedSize / (1024 * 1024)).toFixed(2);
            }
            return sizeInMB === undefined ? 0 : sizeInMB;
          })
        );

        devDependenciesChartData.datasets[0].data = devDepsSize;
        setDevDependenciesChartData(devDependenciesChartData);
        setOptionalDevDependencies(
          dependenciesLatestVersion.optionalDependencies
        );
        setPeerDependencies(dependenciesLatestVersion.peerDependencies);
        setBundledDependencies(dependenciesLatestVersion.bundledDependencies);
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
        <div className="w-full pt-30 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
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
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of dependencies per type
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="px-4 md:px-5 mt-1 text-sm text-gray-500 dark:text-gray-500 text-lg">
                      <ul className="list-disc">
                        <li>
                          Dependencies:{" "}
                          {dependenciesChartData !== undefined
                            ? //@ts-ignore
                              dependenciesChartData?.labels?.length
                            : 0}
                        </li>
                        <li>
                          Dev Dependencies:{" "}
                          {devDependenciesChartData !== undefined
                            ? //@ts-ignore
                              devDependenciesChartData?.labels?.length
                            : 0}
                        </li>
                        <li>
                          Peer Dependencies:{" "}
                          {peerDependencies &&
                          Object.keys(peerDependencies).length > 0
                            ? Object.keys(peerDependencies).length
                            : "0"}
                        </li>
                        <li>
                          Optional Dependencies:{" "}
                          {optionalDependencies &&
                          Object.keys(optionalDependencies).length > 0
                            ? Object.keys(optionalDependencies).length
                            : "0"}
                        </li>
                        <li>
                          Bundled Dependencies:{" "}
                          {bundledDependencies &&
                          Object.keys(bundledDependencies).length > 0
                            ? Object.keys(bundledDependencies).length
                            : "0"}
                        </li>
                      </ul>
                    </div>
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
                                Object.keys(data.time)
                                  .reverse()
                                  .map((t, i) => (
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
