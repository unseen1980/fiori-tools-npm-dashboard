import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import Layout from "../../components/Layout";
import { useNpmData } from "../../hooks/useNpmData";
import { useChartData } from "../../hooks/useChartData";
import { usePrediction } from "../../hooks/usePrediction";
import LineChart from "../../components/LineChart";
import DonughtChart from "../../components/DonughtChart";
import PredictionChart from "../../components/PredictionChart";
import moment from "moment";

const Details = () => {
  const router = useRouter();
  const { name } = router.query;
  const packageName = typeof name === 'string' ? name : undefined;
  
  const { data, isLoading, error } = useNpmData(packageName);
  const chartData = useChartData(data);
  
  // Prediction state
  const [showPredictions, setShowPredictions] = useState(true);
  const [daysToPredict, setDaysToPredict] = useState(7);
  const [useLSTM, setUseLSTM] = useState(true);
  
  // Generate predictions
  const { 
    prediction, 
    isLoading: isPredicting, 
    error: predictionError, 
    progress: predictionProgress,
    progressMessage: predictionProgressMessage,
    refresh: refreshPrediction 
  } = usePrediction(
    chartData.rawDownloads,
    {
      daysToPredict,
      useLSTM,
      enabled: showPredictions && !!chartData.rawDownloads,
    }
  );

  // Prepare historical data for prediction chart
  const historicalData = useMemo(() => {
    if (!chartData.downloads) {
      return { labels: [], data: [] };
    }
    return {
      labels: chartData.downloads.labels,
      data: chartData.downloads.datasets[0]?.data.map(d => Number(d)) || [],
    };
  }, [chartData.downloads]);

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

                {/* ML Prediction Chart - Full Width */}
                <div className="col-span-3 flex flex-col bg-white border shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Downloads Prediction (ML-Powered)
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {useLSTM ? 'LSTM Neural Network' : 'Moving Average'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Toggle Predictions */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs text-gray-600">Show Predictions</span>
                          <input
                            type="checkbox"
                            checked={showPredictions}
                            onChange={(e) => setShowPredictions(e.target.checked)}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />
                        </label>
                        
                        {/* Days to Predict */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Days:</label>
                          <select
                            value={daysToPredict}
                            onChange={(e) => setDaysToPredict(Number(e.target.value))}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-green-500 focus:border-green-500"
                            disabled={!showPredictions}
                          >
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={21}>21 days</option>
                            <option value={30}>30 days</option>
                          </select>
                        </div>
                        
                        {/* Algorithm Toggle */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Algorithm:</label>
                          <select
                            value={useLSTM ? 'lstm' : 'ma'}
                            onChange={(e) => setUseLSTM(e.target.value === 'lstm')}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-green-500 focus:border-green-500"
                            disabled={!showPredictions}
                          >
                            <option value="lstm">LSTM (Neural Network)</option>
                            <option value="ma">Moving Average</option>
                          </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                          onClick={refreshPrediction}
                          disabled={!showPredictions || isPredicting}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className={`w-3 h-3 ${isPredicting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    {historicalData.labels.length > 0 ? (
                      <>
                        <PredictionChart
                          historicalData={historicalData}
                          prediction={showPredictions ? prediction : null}
                          isLoading={isPredicting}
                          progress={predictionProgress}
                          progressMessage={predictionProgressMessage}
                          showConfidence={true}
                        />
                        {prediction && showPredictions && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 text-xs">Predicted Total (Next {daysToPredict} days)</span>
                              <p className="text-lg font-semibold text-gray-900">
                                {prediction.values.reduce((a, b) => a + b, 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 text-xs">Avg Daily Prediction</span>
                              <p className="text-lg font-semibold text-gray-900">
                                {Math.round(prediction.values.reduce((a, b) => a + b, 0) / prediction.values.length).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 text-xs">Peak Predicted Day</span>
                              <p className="text-lg font-semibold text-gray-900">
                                {Math.max(...prediction.values).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-500 text-xs">Min Predicted Day</span>
                              <p className="text-lg font-semibold text-gray-900">
                                {Math.min(...prediction.values).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {predictionError && (
                          <div className="mt-2 text-sm text-amber-600 bg-amber-50 rounded p-2">
                            Note: Using fallback prediction method. {predictionError}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Loading download data for predictions...
                      </div>
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