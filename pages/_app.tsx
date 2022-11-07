import "../styles/globals.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import { searchNpmRegistry, fectNpmPackage } from "../helpers/utils";
import { Analytics } from "@vercel/analytics/react";

export const DataContext: any = React.createContext(null);

function MyApp({ Component, pageProps }: AppProps) {
  const [data, setData] = useState();

  useEffect(() => {
    searchNpmRegistry("@sap-ux").then((d) => {
      //Appending @sap modules. Too many to search.
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
      });
    });
  }, []);
  return (
    <DataContext.Provider value={data}>
      <Component {...pageProps} />
      <Analytics />
    </DataContext.Provider>
  );
}

export default MyApp;
