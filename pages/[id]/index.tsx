import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { fectNpmPackage } from "../../helpers/utils";
import { useEffect, useState } from "react";

const Details = () => {
  const router = useRouter();
  const { name } = router.query;
  const [data, setData] = useState();

  useEffect(() => {
    fectNpmPackage(name).then((d) => {
      setData(d);
      console.log("Detailed data for " + name, d);
    });
  }, []);

  return (
    <>
      <Layout>
        <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
          {data !== undefined ? (
            <div className="container mx-auto bg-white">
              <h1>Details of: {name}</h1>
            </div>
          ) : (
            <></>
          )}
        </div>
      </Layout>
    </>
  );
};

export default Details;
