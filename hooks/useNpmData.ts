import { useState, useEffect } from 'react';
import { NpmPackage } from '../types';
import { fectNpmPackage } from '../helpers/utils';

interface UseNpmDataResult {
  data: NpmPackage | undefined;
  isLoading: boolean;
  error: string | null;
}

const cache = new Map<string, NpmPackage>();

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

        // Check cache first
        if (cache.has(packageName)) {
          setData(cache.get(packageName));
          setIsLoading(false);
          return;
        }

        const packageData = await fectNpmPackage(packageName);
        
        if (packageData && packageData.name) {
          cache.set(packageName, packageData);
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