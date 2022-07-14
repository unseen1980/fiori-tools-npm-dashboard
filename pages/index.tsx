import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { npmModules } from "../helpers/constants";
import Card from "../components/Card";
import Layout from "../components/Layout";
import Link from "next/link";
import React from "react";

const Home: NextPage = () => {
  async function searchNpmRegistry(text: any) {
    const endpoint = `https://registry.npmjs.org/-/v1/search?text=${text}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    return data.objects.map(
      (d: { package: { name: any } }) => d?.package?.name
    );
  }

  const [data, setData] = useState();
  const [isLoading, setLoading] = useState(false);
  const [details, setDetails] = useState(false);
  const [registry, setRegistry] = useState(searchNpmRegistry("@sap-ux"));

  // const UserContext = React.createContext([
  //   ...(await registry),
  //   "@sap/generator-fiori",
  // ]);

  // console.log("Siga min doulepsei", registry);

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
      return fectNpmPackage(npmModule.name);
    });
    Promise.all(data).then((values: any) => {
      console.log("values:", values);
      setData(values);
    });
  }, []);

  return (
    <Layout>
      <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
        <div className="container mx-auto bg-white">
          <div className="grid grid-cols-3 gap-4">
            {data !== undefined
              ? //@ts-ignore
                data.map((v, i) => (
                  <Link
                    key={i}
                    href={{ pathname: "/" + v._rev, query: { name: v.name } }}
                  >
                    <div className="cursor-pointer">
                      <Card values={v} />
                    </div>
                  </Link>
                ))
              : ""}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
