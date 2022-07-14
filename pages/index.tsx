import type { NextPage } from "next";
import { useEffect, useState } from "react";
import Head from "next/head";
import SideNavListItem from "../components/SideNavListItem";
import { npmModules } from "../helpers/constants";
import Card from "../components/Card";

const Home: NextPage = () => {
  const [data, setData] = useState();
  const [isLoading, setLoading] = useState(false);

  async function fectNpmPackageByVersion(name: any, version: any) {
    const endpoint = `https://registry.npmjs.org/${name}/${version}`;
    const res = await fetch(endpoint);
    const d = await res.json();
    setLoading(false);
    console.log(d);
  }

  async function fectNpmPackage(name: any) {
    const endpoint = `https://registry.npmjs.org/${name}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    return data;
  }

  useEffect(() => {
    setLoading(true);
    const data: any = npmModules.map((npmModule) => {
      return fectNpmPackage(npmModule);
    });
    Promise.all(data).then((values: any) => {
      console.log("values:", values);
      setData(values);
    });
  }, []);

  return (
    <main className="bg-white">
      <Head>
        <title>Fiori Tools NPM Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="sticky top-0 inset-x-0 flex flex-wrap sm:justify-start sm:flex-nowrap z-[48] w-full bg-white border-b text-sm py-2.5 sm:py-4 lg:pl-64 dark:bg-gray-800 dark:border-gray-700">
        <nav
          className="flex basis-full items-center w-full mx-auto px-4 sm:px-6 md:px-8"
          aria-label="Global"
        >
          <div className="mr-5 lg:mr-0 lg:hidden">
            <a
              className="flex-none text-xl font-semibold dark:text-white"
              href="#"
              aria-label="Fiori Tools NPM"
            >
              Fiori Tools NPM
            </a>
          </div>

          <div className="w-full flex items-center justify-end ml-auto sm:justify-between sm:gap-x-3 sm:order-3">
            <div className="sm:hidden">
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
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  className="py-2 px-4 pl-11 block w-full border-gray-200 shadow-sm rounded-md text-sm focus:z-10 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                  placeholder="Search"
                />
              </div>
            </div>
          </div>
        </nav>
      </header>
      <div
        id="docs-sidebar"
        className="hs-sidebar hs-sidebar-open:translate-x-0 -translate-x-full transition-all duration-300 transform hidden fixed top-0 left-0 bottom-0 z-[60] w-64 bg-white border-r border-gray-200 pt-7 pb-10 overflow-y-auto scrollbar-y lg:block lg:translate-x-0 lg:right-auto lg:bottom-0 dark:scrollbar-y dark:bg-gray-800 dark:border-gray-700"
      >
        <div className="px-6">
          <a
            className="flex-none text-xl font-semibold dark:text-white"
            href="#"
            aria-label="Fiori Tools NPM"
          >
            Fiori Tools NPM
          </a>
        </div>

        <nav className="p-6 w-full flex flex-col flex-wrap">
          <ul className="space-y-1.5">
            {npmModules.map((npmModule) => (
              <SideNavListItem name={npmModule} key={npmModule} />
            ))}
          </ul>
        </nav>
      </div>
      <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
        <div className="container mx-auto bg-white">
          <div className="grid grid-cols-3 gap-4">
            {data !== undefined
              ? //@ts-ignore
                data.map((v, i) => <Card key={i} values={v} />)
              : ""}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
