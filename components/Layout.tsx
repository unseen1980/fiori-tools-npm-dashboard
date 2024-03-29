import Head from "next/head";
import SideNavListItem from "./SideNavListItem";
import AutoComplete from "./AutoComplete";
import React from "react";
import Link from "next/link";
import { DataContext } from "../pages/_app";

export default function Layout({ children }: any) {
  const dataContext: any = React.useContext(DataContext);
  console.log("dataContext: ", dataContext);
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
              <div className="xs:hidden sm:hidden">
                <button
                  type="button"
                  className="inline-flex flex-shrink-0 justify-center items-center gap-2 h-[2.375rem] w-[2.375rem] rounded-full font-medium bg-white text-gray-700 align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-all text-xs dark:bg-gray-800 dark:hover:bg-slate-800 dark:text-gray-400 dark:hover:text-white dark:focus:ring-gray-700 dark:focus:ring-offset-gray-800"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                  </svg>
                </button>
              </div>

              {dataContext && (
                <div className="hidden sm:block">
                  <label htmlFor="icon" className="sr-only">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none z-20 pl-4">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                      </svg>
                    </div>

                    <AutoComplete
                      data={dataContext.map((d: any) => ({
                        name: d.name,
                        pathname: d._rev,
                      }))}
                    />
                  </div>
                </div>
              )}
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
              {dataContext &&
                dataContext.map((npmModule: any) => (
                  <SideNavListItem
                    name={npmModule.name}
                    rev={npmModule._rev}
                    key={npmModule.name}
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
