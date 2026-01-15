import { useState, useEffect } from 'react';
import { NpmPackage } from '../types';
import { fetchNpmPackage } from '../helpers/utils';

interface UseNpmDataResult {
  data: NpmPackage | undefined;
  isLoading: boolean;
  error: string | null;
}

export const useNpmData = (packageName: string | undefined): UseNpmDataResult => {
  const [data, setData] = useState<NpmPackage | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageName) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // fetchNpmPackage already handles caching via requestCache
        const packageData = await fetchNpmPackage(packageName);

        if (packageData && packageData.name) {
          setData(packageData);
        } else {
          throw new Error('Invalid package data received');
        }
      } catch (err) {
        console.error(`Error fetching package ${packageName}:`, err);
        setError(`Failed to load package data for ${packageName}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [packageName]);

  return { data, isLoading, error };
};