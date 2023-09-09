import Metatags from "../components/Metatags";
import PostFeed from "../components/PostFeed";
import {
  getFollowing,
  getPublications,
  getPublicationsQueryVariables,
} from "../constants/lensConstants";
import { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import { useLensContext } from "../context/LensContext";
import { apolloClient } from "../constants/lensConstants";

// We start with at least Patrick's Posts
let profileIdList = ["0x869c"];

export default function Home(props) {
  const { profileId } = useLensContext();
  const { account } = useMoralis();
  const [pubs, setPubs] = useState();

  const getPublicationsList = async () => {
    let followers;
    let followingsIds = [];
    if (account) {
      followers = await apolloClient.query({
        query: getFollowing,
        variables: { request: { address: account } },
      });
      followingsIds = followers.data.following.items.map((f) => f.profile.id);
    }
    profileIdList = profileIdList.concat(followingsIds);
    const publications = await apolloClient.query({
      query: getPublications,
      variables: getPublicationsQueryVariables(profileIdList),
    });
    return publications;
  };

  useEffect(() => {
    if (account) {
      getPublicationsList().then((publications) => {
        setPubs(publications);
      });
    }
  }, [account]);

  return (
    <main className="pt-24 bg-[#03001C]">
      <Metatags
        title="Home Page"
        description="Get the latest publications on our site"
      />

      {!profileId ? (
        <div>
          <h1 className="text-md text-white pl-4">You aren&apos;t following anyone yet! Here is Atharva</h1>
        </div>
      ) : (
        <div></div>
      )}

      {!pubs ? (
        <p>Loading...</p>
      ) : (
        <PostFeed posts={pubs.data.publications.items} />
      )}
    </main>
  );
}
