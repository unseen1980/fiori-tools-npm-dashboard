import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useNpmData } from "../../hooks/useNpmData";
import { useChartData } from "../../hooks/useChartData";
import LineChart from "../../components/LineChart";
import DonughtChart from "../../components/DonughtChart";
import moment from "moment";

const Details = () => {
  const router = useRouter();
  const { name } = router.query;
  const packageName = typeof name === 'string' ? name : undefined;
  
  const { data, isLoading, error } = useNpmData(packageName);
  const chartData = useChartData(data);

  if (error) {
    return (
      <Layout>
        <div className="w-full pt-30 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full pt-30 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
          <div className="grid grid-cols-1 place-items-center">
            <div
              className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <div className="w-full pt-30 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
          {data ? (
            <div className="container mx-auto bg-white">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 mb-6">
                  <div className="bg-white border shadow-sm rounded-xl p-6 dark:bg-gray-800 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{data.name}</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                      {data.description || 'No description available'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Latest Version:</span>
                        <p className="text-gray-900 dark:text-white">{data['dist-tags'].latest}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">License:</span>
                        <p className="text-gray-900 dark:text-white">{data.versions[data['dist-tags'].latest]?.license || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Homepage:</span>
                        <p className="text-gray-900 dark:text-white">
                          {data.versions[data['dist-tags'].latest]?.homepage ? (
                            <a href={data.versions[data['dist-tags'].latest].homepage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View
                            </a>
                          ) : (
                            'Not available'
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Repository:</span>
                        <p className="text-gray-900 dark:text-white">
                          {data.versions[data['dist-tags'].latest]?.repository?.url ? (
                            <a href={data.versions[data['dist-tags'].latest]?.repository?.url?.replace('git+', '').replace('.git', '') || ''} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View
                            </a>
                          ) : (
                            'Not available'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Bundle size
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    {chartData.bundleSize ? (
                      <LineChart data={chartData.bundleSize} />
                    ) : (
                      <div className="text-center text-gray-500">Loading chart...</div>
                    )}
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of files
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    {chartData.filesNumber ? (
                      <LineChart data={chartData.filesNumber} />
                    ) : (
                      <div className="text-center text-gray-500">Loading chart...</div>
                    )}
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Number of downloads per day
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    {chartData.downloads ? (
                      <LineChart data={chartData.downloads} />
                    ) : (
                      <div className="text-center text-gray-500">Loading chart...</div>
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
                    {chartData.dependencies?.dependencies ? (
                      <DonughtChart data={chartData.dependencies.dependencies} />
                    ) : (
                      <div className="text-center text-gray-500">No dependencies</div>
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
                    {chartData.dependencies?.devDependencies ? (
                      <DonughtChart data={chartData.dependencies.devDependencies} />
                    ) : (
                      <div className="text-center text-gray-500">No dev dependencies</div>
                    )}
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Dependencies Summary
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Dependencies:</span>
                        <span className="font-medium">{chartData.dependencies?.dependencies?.labels?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Dev Dependencies:</span>
                        <span className="font-medium">{chartData.dependencies?.devDependencies?.labels?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Peer Dependencies:</span>
                        <span className="font-medium">{chartData.dependencies?.peerDependencies ? Object.keys(chartData.dependencies.peerDependencies).length : 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Optional:</span>
                        <span className="font-medium">{chartData.dependencies?.optionalDependencies ? Object.keys(chartData.dependencies.optionalDependencies).length : 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Bundled:</span>
                        <span className="font-medium">{chartData.dependencies?.bundledDependencies?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Package Info
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Maintainers:</span>
                        <div className="mt-1">
                          {data.maintainers && data.maintainers.length > 0 ? (
                            data.maintainers.slice(0, 3).map((maintainer: any, index: number) => (
                              <div key={index} className="text-gray-900 dark:text-white">
                                {maintainer.name || maintainer.email}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500">Not available</span>
                          )}
                          {data.maintainers && data.maintainers.length > 3 && (
                            <div className="text-gray-500">+{data.maintainers.length - 3} more</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Keywords:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {data.versions[data['dist-tags'].latest]?.keywords?.slice(0, 5).map((keyword: string, index: number) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {keyword}
                            </span>
                          )) || <span className="text-gray-500">None</span>}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">NPM Link:</span>
                        <div className="mt-1">
                          <a 
                            href={`https://www.npmjs.com/package/${data.name}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View on NPM
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="xs:col-span-3 md:col-span-1 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Installation
                    </p>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">NPM:</span>
                        <div className="mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm font-mono">
                          npm install {data.name}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">Yarn:</span>
                        <div className="mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm font-mono">
                          yarn add {data.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
                    <div className="bg-gray-100 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Version History (Last 20)</h3>
                    </div>
                    <div className="flex flex-col">
                      <div className="-m-1.5 overflow-x-auto">
                        <div className="p-1.5 min-w-full inline-block align-middle">
                          <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700">
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
                                  <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                  >
                                    Size
                                  </th>
                                </tr>
                              </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {data.time && Object.keys(data.time)
                                .filter(t => t !== 'created' && t !== 'modified')
                                .reverse()
                                .slice(0, 20)
                                .map((version, i) => (
                                  <tr key={version} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {version}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                      {moment(data.time[version]).format("lll")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                      {data.versions[version]?.dist?.unpackedSize ? 
                                        `${(data.versions[version].dist.unpackedSize / (1024 * 1024)).toFixed(2)} MB` : 
                                        'N/A'
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
