import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import {
  createContentMetadata,
  getCreatePostQuery,
  apolloClient,
} from "../constants/lensConstants";
import {
  lensHub,
  networkConfig,
  TRUE_BYTES,
} from "../constants/contractConstants";
import { useLensContext } from "../context/LensContext";
import toast from "react-hot-toast";
import { useMoralis, useWeb3Contract } from "react-moralis";
import lensAbi from "./lensAbi.json";
import { useNotification } from "@web3uikit/core";
import { encode } from "js-base64";

const BASE_64_PREFIX = "data:application/json;base64,";
const PINATA_PIN_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

async function pinMetadataToPinata(
  metadata,
  contentName,
  pinataApiKey,
  pinataApiSecret
) {
  console.log("pinning metadata to pinata...");
  const data = JSON.stringify({
    pinataMetadata: { name: contentName },
    pinataContent: metadata,
  });
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataApiSecret,
    },
    body: data,
  };
  const response = await fetch(PINATA_PIN_ENDPOINT, config);
  const ipfsHash = (await response.json()).IpfsHash;
  console.log(`Stored content metadata with ${ipfsHash}`);
  return ipfsHash;
}

function PostForm({ preview }) {
  const { profileId, token } = useLensContext();
  const { account, chainId } = useMoralis();
  const { register, errors, handleSubmit, formState, reset, watch } = useForm({
    mode: "onChange",
  });
  const chainIdString = chainId ? parseInt(chainId).toString() : "31337";
  const dispatch = useNotification();

  const { runContractFunction } = useWeb3Contract();

  async function handlePostSuccess(tx) {
    const response = await tx.wait();
    dispatch({
      type: "success",
      message: `Transaction Complete ${response}`,
      position: "topR",
    });
  }

  const { isValid, isDirty } = formState;

  const publishPost = async ({
    content,
    contentName,
    imageUri,
    imageType,
    pinataApiKey,
    pinataApiSecret,
  }) => {
    let fullContentURI;
    const contentMetadata = createContentMetadata(
      content,
      contentName,
      imageUri,
      imageType
    );
    if (pinataApiSecret && pinataApiKey) {
      const metadataIpfsHash = await pinMetadataToPinata(
        contentMetadata,
        contentName,
        pinataApiKey,
        pinataApiSecret
      );
      fullContentURI = `ipfs://${metadataIpfsHash}`;
      console.log(fullContentURI);
    } else {
      const base64EncodedContent = encode(JSON.stringify(contentMetadata));
      const fullContentURI = BASE_64_PREFIX + base64EncodedContent;
    }
    const transactionParameters = [
      profileId,
      fullContentURI,
      networkConfig[chainIdString]["freeCollectModule"],
      TRUE_BYTES,
      networkConfig[chainIdString]["followerOnlyReferenceModule"],
      TRUE_BYTES,
    ];
    console.log(transactionParameters);
    console.log(fullContentURI);

    const transactionOptions = {
      abi: lensAbi,
      contractAddress: networkConfig[chainIdString]["lensProtocol"],
      functionName: "post",
      params: {
        vars: transactionParameters,
      },
    };

    await runContractFunction({
      onSuccess: (tx) => handlePostSuccess(tx),
      onError: (error) => console.log(error),
      params: transactionOptions,
    });
  };

  return (
    <form onSubmit={handleSubmit(publishPost)} className="p-10 bg-[#03001C]">
      {preview && (
        <div className="markdown bg-white rounded-xl px-4 py-2">
          <h1 class>Preview</h1>
          <ReactMarkdown>{watch("content")}</ReactMarkdown>
        </div>
      )}

      <div className={preview ? "invisible" : "flex flex-col w-full "}>
        <input
          className="mb-2 border py-2 px-4 rounded-xl"
          placeholder="Post Title"
          name="contentName"
          {...register("contentName", {
            maxLength: 100,
            minLength: 1,
            required: true,
          })}
        />

        <textarea
          className="h-96 mb-2 py-2 px-4 rounded-xl"
          placeholder="Write your article here!"
          name="content"
          {...register("content", {
            maxLength: 25000,
            minLength: 10,
            required: true,
          })}
        />
        <input
          className="mb-2 py-2 px-4 rounded-xl"
          placeholder="(optional) Image URI"
          name="imageURI"
          {...register("imageURI", {
            maxLength: 100,
            minLength: 1,
            required: false,
          })}
        />
        <input
          className="mb-2 py-2 px-4 rounded-xl"
          placeholder="(optional) image/svg+xml,image/gif,image/jpeg,image/png,image/tiff..."
          name="imageType"
          {...register("imageType", {
            maxLength: 100,
            minLength: 1,
            required: false,
          })}
        />
        <input
          className="mb-2 py-2 px-4 rounded-xl"
          placeholder="(optional) Pinata API Key"
          name="pinataApiKey"
          {...register("pinataApiKey", {
            maxLength: 100,
            minLength: 1,
            required: false,
          })}
        />
        <input
          className="mb-2 py-2 px-4 rounded-xl"
          placeholder="(optional) Pinata API Secret"
          name="pinataApiSecret"
          {...register("pinataApiSecret", {
            maxLength: 100,
            minLength: 1,
            required: false,
          })}
        />
        {errors ? (
          <p className="text-danger">{errors.content?.message}</p>
        ) : (
          <div></div>
        )}
        {profileId && token ? (
          <button
            type="submit"
            className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            disabled={!isDirty || !isValid}
          >
            Publish
          </button>
        ) : (
          <div className="mt-4 flex">
            <h1 className="font-bold text-md text-white">You need a lens profile to submit!{" "}</h1>
            <a
              href="https://claim.lens.xyz/"
              className="bg-white px-4 py-2 ml-4 font-bold text-[#5B8FB9] rounded-xl hover:bg-[#B6EADA]"
            >
              Claim here!
            </a>
            <br />
          </div>
        )}
      </div>
    </form>
  );
}

export default function WritePost() {
  const [preview, setPreview] = useState(false);

  return (
    <main className="flex flex-row w-full bg-[#03001C]">
      <section className="flex flex-col w-3/4 h-60">
        <h1 className="mt-40 text-center text-3xl font-bold text-white">
          Write Your Post Here!
        </h1>
        <PostForm preview={preview} />
      </section>

      <aside className="flex flex-col w-1/4 mt-28 p-6">
        <h3 className="text-xl font-bold text-center text-white pb-4">Tools</h3>
        <button
          className="bg-white rounded-xl py-2 px-4 font-bold hover:bg-[#B6EADA]"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </aside>
    </main>
  );
}
