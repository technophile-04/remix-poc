"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useWatchBalance } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { data: balance } = useWatchBalance({ address: connectedAddress });
  console.log("balance", balance);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="flex flex-col border-2 border-base-300 bg-base-200 rounded-xl text-accent w-[800px]">
          <textarea
            className="input input-ghost focus-within:border-transparent focus:outline-none focus:bg-transparent focus:text-gray-400 px-4 pt-2 border w-full font-medium placeholder:text-accent/50 text-gray-400 h-[800px] rounded-none"
            placeholder="Solidity Code"
            name="description"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button className="btn btn-primary mt-4">Compile</button>
          <button className="btn btn-primary mt-4">Deploy</button>
        </div>
      </div>
    </>
  );
};

export default Home;
