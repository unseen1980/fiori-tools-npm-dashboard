import "../styles/globals.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import { searchNpmRegistry, fectNpmPackage } from "../helpers/utils";

export const DataContext: any = React.createContext(null);

function MyApp({ Component, pageProps }: AppProps) {
  const [data, setData] = useState();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchNpmRegistry("@sap-ux").then((d) => {
      //Appending @sap/generator-fiori because is in different org.
      const data: any = [
        "@sap/generator-fiori",
        ...d,
        "@sap/ux-ui5-tooling",
        "@sap/ux-specification",
      ].map((npmModule: any) => {
        return fectNpmPackage(npmModule);
      });
      Promise.all(data).then((values: any) => {
        setData(values);
        setLoading(false);
      });
    });
  }, []);
  return (
    <DataContext.Provider value={data}>
      <Component {...pageProps} />
    </DataContext.Provider>
  );
}

export default MyApp;
