import "../styles/globals.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import { searchNpmRegistry, fetchNpmPackage } from "../helpers/utils";
import { requestCache } from "../helpers/requestCache";
import { Analytics } from "@vercel/analytics/react";
import { NpmPackage } from "../types";
import ErrorBoundary from "../components/ErrorBoundary";

interface DataContextType {
  data: NpmPackage[] | undefined;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const DataContext = React.createContext<DataContextType | undefined>(undefined);

function MyApp({ Component, pageProps }: AppProps) {
  const [data, setData] = useState<NpmPackage[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Search for @sap-ux packages and add specific @sap packages
      const sapUxResults = await searchNpmRegistry("@sap-ux");

      // Only the specific @sap packages you originally had
      const specificSapModules = [
        "@sap/generator-fiori",
        "@sap/ux-ui5-tooling",
        "@sap/ux-specification",
      ];

      const allModules = Array.from(new Set([...specificSapModules, ...sapUxResults]));

      const packagePromises = allModules.map(npmModule => fetchNpmPackage(npmModule));
      const packages = await Promise.all(packagePromises);

      const validPackages = packages.filter(pkg => pkg && pkg.name);
      setData(validPackages);
    } catch (err) {
      console.error("Error fetching npm packages:", err);
      setError("Failed to load npm packages. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    requestCache.clear();
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const contextValue: DataContextType = {
    data,
    isLoading,
    error,
    refresh,
  };

  return (
    <ErrorBoundary>
      <DataContext.Provider value={contextValue}>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <button
              onClick={refresh}
              className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        <Component {...pageProps} />
        <Analytics />
      </DataContext.Provider>
    </ErrorBoundary>
  );
}

export default MyApp;