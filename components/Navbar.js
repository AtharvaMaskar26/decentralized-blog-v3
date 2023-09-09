import Link from "next/link";
import { ConnectButton } from "@web3uikit/web3";
import { useMoralis } from "react-moralis";
import { useState } from "react";

// Top navbar
export default function Navbar() {
  const { account } = useMoralis();

  return (
    <nav className="pt-5 pb-5 pr-10 pl-10 h-70 w-full fixed top-0 p-0 font-bold border-b-2 border-solid border-slate-700 bg-[#03001C]  z-99">
      <ul className="list-none m-0 p-0 flex items-center justify-between h-full">
        <li className="rounded">
          <Link href="/">
            <h1 className="font-bold text-3xl text--300 text-[#B6EADA]">Peer Web</h1>
          </Link>
        </li>

        {account && (
          <>
            <li>
              <Link href="/write-blog">
                <div className="flex space-x-2 justify-center">
                  <button
                    type="button"
                    className="text-[#5B8FB9] bg-white py-2 px-4 rounded-xl hover:bg-[#B6EADA]"
                  >
                    Write Post
                  </button>
                </div>
              </Link>
            </li>
          </>
        )}

        <li>
          <ConnectButton moralisAuth={false} />
        </li>
      </ul>
    </nav>
  );
}
