"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { prefundedAccounts } from "tevm";
import { Abi } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractState } from "~~/services/store/store";
import { memoryClient } from "~~/services/web3/wagmiConfig";
import { getParsedError, notification } from "~~/utils/scaffold-eth";
import { MessageResult } from "~~/workers/types";

const Home: NextPage = () => {
  const [code, setCode] = useState(
    `// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract AddNumbers {
	uint256 public result;

	function add(uint256 a, uint256 b) public pure returns (uint256) {
		return a + b;
	}

	function addAndStore(uint256 a, uint256 b) public {
		result = add(a, b);
	}
  receive() external payable {}
}`,
  );

  const [compliedContract, setCompliedContract] = useState<{ abi?: Abi; byteCode?: `0x${string}` }>({
    abi: undefined,
    byteCode: undefined,
  });

  const router = useRouter();

  const workerRef = useRef<Worker>();

  const { setDeployedContractAddress, setDeployedContractAbi, deployedContractAddress } = useDeployedContractState(
    state => state,
  );

  useEffect(() => {
    workerRef.current = new Worker(new URL("../workers/SolcWorker.ts", import.meta.url));
    workerRef.current.onmessage = async ({ data }: MessageEvent<MessageResult>) => {
      try {
        // TODO: Remove hardcoding of contract name
        const byteCode = data.result.data?.contracts["contract.sol"]?.AddNumbers?.evm?.bytecode.object;
        const contractAbi = data.result.data?.contracts["contract.sol"]?.AddNumbers?.abi;
        if (!byteCode || !contractAbi) throw new Error("Bytecode or ABI not found");

        setCompliedContract({ abi: contractAbi, byteCode: `0x${byteCode}` });
        notification.success("Contract compiled successfully");
      } catch (e) {
        console.error("Error", e);
        const error = getParsedError(e);
        notification.error(error);
      }
    };
    workerRef.current.onerror = error => {
      console.error("Worker error:", error);
    };
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [setDeployedContractAddress, setDeployedContractAbi]);

  const complieCode = async () => {
    if (workerRef.current) {
      workerRef.current?.postMessage({ code });
    }
  };

  const deployContract = async () => {
    try {
      if (!compliedContract.abi || !compliedContract.byteCode)
        throw new Error("No contract to deploy, please complie the contract");

      const deployResult = await memoryClient.tevmDeploy({
        from: prefundedAccounts[0],
        abi: compliedContract.abi,
        bytecode: compliedContract.byteCode,
      });

      await memoryClient.tevmMine();

      if (!deployResult.createdAddress) throw new Error("Contract address not found");

      setDeployedContractAbi(compliedContract.abi);
      setDeployedContractAddress(deployResult.createdAddress);

      notification.success("Contract deployed successfully");
      router.push("/debug");
    } catch (e) {
      console.error("Error", e);
      const error = getParsedError(e);
      notification.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="flex flex-col border-2 border-base-300 bg-base-200 rounded-xl text-accent w-[800px]">
          <textarea
            className="input input-ghost focus-within:border-transparent focus:outline-none focus:bg-transparent focus:text-gray-400 px-4 pt-2 border w-full font-medium placeholder:text-accent/50 text-gray-400 h-[800px] rounded-none"
            placeholder="Solidity Code"
            name="description"
            autoComplete="off"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button className="btn btn-primary mt-4" onClick={complieCode}>
            Compile
          </button>
          <button className="btn btn-primary mt-4" onClick={deployContract}>
            Deploy
          </button>
        </div>
        {deployedContractAddress && (
          <div className="mt-4">
            <Address address={deployedContractAddress} />
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
