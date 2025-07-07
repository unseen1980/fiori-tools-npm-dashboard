import type { NextPage } from "next";
import { useEffect, useState, useContext, useMemo, useRef } from "react";
import MainPageCard from "../components/MainPageCard";
import Layout from "../components/Layout";
import { DataContext } from "./_app";
import { downloadCounts, bytesToSize, getPercent } from "../helpers/utils";
import Link from "next/link";
import moment from "moment";

interface HomeProps {
  isLoading?: boolean;
}

const Home: NextPage<HomeProps> = () => {
  const [isLoading, setLoading] = useState(false);
  const context = useContext(DataContext);
  const [mainPageCardDataSap, setMainPageCardsDataSap] = useState<number>(0);
  const [mainPageCardDataSapUx, setMainPageCardsDataSapUx] = useState<number>(0);
  const [numOfTotalDownloads, setNumOfTotalDownloads] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'version' | 'size'>('name');
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const dataContext = context?.data;
  const appLoading = context?.isLoading || false;
  const refresh = context?.refresh;
  const downloadsFetched = useRef(false);
  
  const dateRange = useMemo(() => ({
    start: moment().subtract(1, "months").toDate(),
    end: new Date()
  }), []);

  useEffect(() => {
    if (dataContext && dataContext.length > 0) {
      const sapModules = dataContext.filter(m => m.name.startsWith("@sap/"));
      const sapUxModules = dataContext.filter(m => m.name.startsWith("@sap-ux/"));
      
      setMainPageCardsDataSap(sapModules.length);
      setMainPageCardsDataSapUx(sapUxModules.length);
      
      // Only fetch downloads once to avoid excessive API calls
      if (!downloadsFetched.current) {
        setLoading(true);
        downloadsFetched.current = true;
        
        const fetchTotalDownloads = async (promises: Promise<any[]>[]) => {
          try {
            // Process in batches of 10 to avoid overwhelming the API
            const batchSize = 10;
            let totalNum = 0;
            setDownloadProgress(0);
            
            for (let i = 0; i < promises.length; i += batchSize) {
              const batch = promises.slice(i, i + batchSize);
              const results = await Promise.allSettled(batch);
              
              const batchTotal = results
                .filter((result): result is PromiseFulfilledResult<any[]> => 
                  result.status === 'fulfilled' && Array.isArray(result.value)
                )
                .map(result => 
                  result.value
                    .map((d: any) => d.downloads || 0)
                    .reduce((a, b) => a + b, 0)
                )
                .reduce((a, b) => a + b, 0);
              
              totalNum += batchTotal;
              
              // Update the display progressively
              setNumOfTotalDownloads(totalNum);
              setDownloadProgress(Math.min(100, ((i + batchSize) / promises.length) * 100));
              
              // Small delay between batches to be nice to the API
              if (i + batchSize < promises.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            setDownloadProgress(100);
          } catch (error) {
            console.error('Error fetching total downloads:', error);
            setDownloadProgress(100);
          }
        };
        
        // Fetch downloads for all packages but with proper batching
        const downloadPromises = dataContext.map(m => 
          downloadCounts(m.name, dateRange.start, dateRange.end)
        );
        
        fetchTotalDownloads(downloadPromises).finally(() => {
          setLoading(false);
        });
      }
    }
  }, [dataContext, dateRange]);
  
  const filteredAndSortedData = useMemo(() => {
    if (!dataContext) return [];
    
    let filtered = dataContext;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pkg => 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'version':
          return a['dist-tags'].latest.localeCompare(b['dist-tags'].latest);
        case 'size':
          const sizeA = a.versions[a['dist-tags'].latest]?.dist?.unpackedSize || 0;
          const sizeB = b.versions[b['dist-tags'].latest]?.dist?.unpackedSize || 0;
          return sizeB - sizeA;
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [dataContext, searchTerm, sortBy]);

  return (
    <Layout>
      <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
        <div className="container mx-auto bg-white">
          {(isLoading || appLoading) && (
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
          {!isLoading && !appLoading && dataContext && (
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
                  title: downloadProgress < 100 ? `Loading downloads... ${Math.round(downloadProgress)}%` : "Total downloads in last 30 days",
                  value: numOfTotalDownloads.toLocaleString(),
                }}
              />
              <div className="col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      placeholder="Search packages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'version' | 'size')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="version">Sort by Version</option>
                      <option value="size">Sort by Size</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      downloadsFetched.current = false;
                      setDownloadProgress(0);
                      setNumOfTotalDownloads(0);
                      refresh?.();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
              <div className="col-span-3">
                <div className="flex flex-col">
                  <div className="-m-1.5 overflow-x-auto">
                    <div className="p-1.5 min-w-full inline-block align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-800 dark:border-gray-700 rounded-xl dark:shadow-slate-700/[.7]">
                          <thead className="bg-gray-50 dark:bg-gray-700">
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
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {filteredAndSortedData.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                  {searchTerm ? `No packages found matching "${searchTerm}"` : "Loading packages..."}
                                </td>
                              </tr>
                            ) : (
                              filteredAndSortedData.map((v) => {
                              const latestVersion = v.versions[v["dist-tags"].latest];
                              const currentSize = latestVersion?.dist?.unpackedSize || 0;
                              const sizeDisplay = bytesToSize(currentSize, 2, true);
                              
                              const versionKeys = Object.keys(v.versions);
                              let changeIndicator = <b> - </b>;
                              
                              if (versionKeys.length >= 2) {
                                const previousVersion = v.versions[versionKeys[versionKeys.length - 2]];
                                const previousSize = previousVersion?.dist?.unpackedSize || 0;
                                
                                if (previousSize > 0) {
                                  const percentChange = parseFloat(getPercent(previousSize, currentSize));
                                  
                                  if (percentChange > 0) {
                                    changeIndicator = <b className="text-red-400"> ↗ </b>;
                                  } else if (percentChange < 0) {
                                    changeIndicator = <b className="text-green-400"> ↘ </b>;
                                  }
                                }
                              }

                              return (
                                <tr key={v._id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <td className="cursor-pointer px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                    <Link
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
                                    {latestVersion?.dist?.fileCount || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                    {sizeDisplay} {changeIndicator}
                                  </td>
                                </tr>
                              );
                            })
                            )}
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
