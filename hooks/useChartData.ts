import { useState, useEffect, useMemo } from 'react';
import { NpmPackage, ChartData } from '../types';
import { bytesToSize, downloadCounts, fetchNpmPackageByVersion } from '../helpers/utils';
import cmp from 'semver-compare';
import moment from 'moment';

interface DependencyData {
  dependencies?: ChartData;
  devDependencies?: ChartData;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  bundledDependencies?: string[];
}

interface RawDownloadData {
  day: string;
  downloads: number;
}

export const useChartData = (npmPackage: NpmPackage | undefined) => {
  const [chartData, setChartData] = useState<{
    filesNumber?: ChartData;
    bundleSize?: ChartData;
    downloads?: ChartData;
    rawDownloads?: RawDownloadData[];
    dependencies?: DependencyData;
  }>({});

  // Date range for ML prediction training (365 days)
  const predictionDateRange = useMemo(() => ({
    start: moment().subtract(1, 'years').toDate(),
    end: new Date()
  }), []);

  const sortedVersions = useMemo(() => {
    if (!npmPackage) return [];
    return Object.keys(npmPackage.versions).sort(cmp).slice(-30);
  }, [npmPackage]);

  useEffect(() => {
    if (!npmPackage) return;

    // File number chart data
    const filesNumberData: ChartData = {
      labels: sortedVersions,
      datasets: [{
        label: 'Number of files',
        data: sortedVersions.map(ver =>
          npmPackage.versions[ver]?.dist?.fileCount || 0
        ),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }],
    };

    // Bundle size chart data
    const latestVersion = sortedVersions[sortedVersions.length - 1];
    const latestSize = npmPackage.versions[latestVersion]?.dist?.unpackedSize || 0;

    const bundleSizeData: ChartData = {
      labels: sortedVersions,
      datasets: [{
        label: `Bundle size ${bytesToSize(latestSize, 2, true).slice(-2)}`,
        data: sortedVersions.map(ver => {
          const size = npmPackage.versions[ver]?.dist?.unpackedSize || 0;
          return parseFloat(bytesToSize(size, 2, false));
        }),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }],
    };

    setChartData(prev => ({
      ...prev,
      filesNumber: filesNumberData,
      bundleSize: bundleSizeData,
    }));

    // Fetch downloads data (365 days for ML training, last 30 days for display)
    downloadCounts(npmPackage.name, predictionDateRange.start, predictionDateRange.end)
      .then(downloadsData => {
        if (downloadsData && downloadsData.length > 0) {
          // Filter out today's incomplete data for display
          const today = moment().format('YYYY-MM-DD');
          const completeData = downloadsData.filter((d: any) => d.day !== today);
          
          // Use last 30 days of complete data for chart display
          const displayData = completeData.slice(-30);
          
          const downloadsChartData: ChartData = {
            labels: displayData.map((d: any) => d.day),
            datasets: [{
              label: 'Daily downloads',
              data: displayData.map((d: any) => d.downloads),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }],
          };
          // Store chart data (30 days, excluding today) and raw data for predictions (365 days)
          setChartData(prev => ({ 
            ...prev, 
            downloads: downloadsChartData,
            rawDownloads: downloadsData.map((d: any) => ({
              day: d.day,
              downloads: d.downloads,
            })),
          }));
        }
      })
      .catch(err => console.error('Error fetching download counts:', err));

    // Fetch dependencies data
    const fetchDependenciesData = async () => {
      const latestVersionData = npmPackage.versions[latestVersion];
      if (!latestVersionData) return;

      const processDependencies = async (deps: Record<string, string> | undefined, label: string) => {
        if (!deps || Object.keys(deps).length === 0) return null;

        const depNames = Object.keys(deps);
        const sizes = await Promise.all(
          depNames.map(async (dep) => {
            try {
              const depData = await fetchNpmPackageByVersion(dep, deps[dep]);
              return depData?.dist?.unpackedSize ?
                parseFloat((depData.dist.unpackedSize / (1024 * 1024)).toFixed(2)) : 0;
            } catch {
              return 0;
            }
          })
        );

        return {
          labels: depNames.map(dep => `${dep}@${deps[dep]}`),
          datasets: [{
            label,
            data: sizes,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          }],
        };
      };

      const [depsData, devDepsData] = await Promise.all([
        processDependencies(latestVersionData.dependencies, 'Dependencies'),
        processDependencies(latestVersionData.devDependencies, 'DevDependencies'),
      ]);

      setChartData(prev => ({
        ...prev,
        dependencies: {
          dependencies: depsData || undefined,
          devDependencies: devDepsData || undefined,
          optionalDependencies: latestVersionData.optionalDependencies,
          peerDependencies: latestVersionData.peerDependencies,
          bundledDependencies: latestVersionData.bundledDependencies,
        },
      }));
    };

    fetchDependenciesData().catch(err =>
      console.error('Error fetching dependencies data:', err)
    );
  }, [npmPackage, sortedVersions, predictionDateRange]);

  return chartData;
};