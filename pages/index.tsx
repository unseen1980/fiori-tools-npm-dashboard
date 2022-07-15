import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { searchNpmRegistry, fectNpmPackage } from "../helpers/utils";
import Card from "../components/Card";
import Layout from "../components/Layout";
import Link from "next/link";
import React from "react";
import { DataContext } from "../pages/_app";

const Home: NextPage = () => {
  const [isLoading, setLoading] = useState(false);
  const dataContext: any = React.useContext(DataContext);

  return (
    <Layout>
      <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
        <div className="container mx-auto bg-white">
          <div className="grid grid-cols-3 gap-4">
            {dataContext !== undefined
              ? //@ts-ignore
                dataContext.map((v, i) => {
                  return (
                    <Link
                      key={i}
                      href={{
                        pathname: "/" + v._rev,
                        query: { name: v.name },
                      }}
                    >
                      <div className="cursor-pointer">
                        <Card values={v} />
                      </div>
                    </Link>
                  );
                })
              : ""}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
