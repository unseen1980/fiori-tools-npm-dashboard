import { useRouter } from "next/router";
import Layout from "../../components/Layout";

const Post = () => {
  const router = useRouter();
  console.log("Router: ", router);
  const { name } = router.query;

  return (
    <>
      <Layout>
        <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:pl-72 bg-white">
          <div className="container mx-auto bg-white">
            <h1>Details of: {name}</h1>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Post;
