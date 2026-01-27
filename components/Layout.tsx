import Head from "next/head";
import SideNavListItem from "./SideNavListItem";
import AutoComplete from "./AutoComplete";
import React, { useMemo } from "react";
import Link from "next/link";
import { DataContext } from "../pages/_app";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const context = React.useContext(DataContext);
  const dataContext = context?.data;
  
  const autoCompleteData = useMemo(() => {
    if (!dataContext) return [];
    return dataContext.map((d) => ({
      name: d.name,
      pathname: d._rev,
    }));
  }, [dataContext]);
  return (
    <>
      <Head>
        <title>Fiori Tools NPM Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-white">
        <header className="sticky top-0 inset-x-0 flex flex-wrap sm:justify-start sm:flex-nowrap z-[48] w-full bg-white border-b text-sm py-2.5 sm:py-4 lg:pl-64 dark:bg-gray-800 dark:border-gray-700">
          <nav
            className="flex basis-full items-center w-full mx-auto px-4 sm:px-6 md:px-8"
            aria-label="Global"
          >
            <div className="mr-5 lg:mr-0 lg:hidden">
              <Link legacyBehavior href={{ pathname: "/" }}>
                <a
                  className="flex-none text-xl font-semibold dark:text-white"
                  href="#"
                  aria-label="Fiori Tools NPM"
                >
                  Fiori Tools NPM
                </a>
              </Link>
            </div>

            <div className="flex items-center justify-end ml-auto">
              {/* Search box removed - using the one on the main page instead */}
            </div>
          </nav>
        </header>
        <div
          id="docs-sidebar"
          className="hs-sidebar hs-sidebar-open:translate-x-0 -translate-x-full transition-all duration-300 transform hidden fixed top-0 left-0 bottom-0 z-[60] w-64 bg-white border-r border-gray-200 pt-7 pb-10 overflow-y-auto scrollbar-y lg:block lg:translate-x-0 lg:right-auto lg:bottom-0 dark:scrollbar-y dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="px-6">
            <Link legacyBehavior href={{ pathname: "/" }}>
              <a
                className="flex-none text-xl font-semibold dark:text-white"
                href="#"
                aria-label="Fiori Tools NPM"
              >
                Fiori Tools NPM
              </a>
            </Link>
          </div>

          <nav className="p-6 w-full flex flex-col flex-wrap">
            <ul className="space-y-1.5">
              {dataContext?.map((npmModule) => (
                <SideNavListItem
                  name={npmModule.name}
                  rev={npmModule._rev}
                  key={npmModule._id}
                />
              ))}
            </ul>
          </nav>
        </div>
        <div>{children}</div>
      </main>
    </>
  );
}
