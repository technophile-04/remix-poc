"use client";

import { useEffect, useRef, useState } from "react";
import type { NextPage } from "next";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "wagmi";
import { useWatchBalance } from "~~/hooks/scaffold-eth";

const solcWorkerCompile = (worker: Worker, code: string) => {
  const id = uuidv4();
  return new Promise((resolve, reject) => {
    worker.onmessage = e => {
      if (e.data.id !== id) return;
      const { success, result, error } = e.data;

      if (success) {
        resolve(result);
      } else {
        reject(error);
      }
    };
    worker.postMessage({ code, id });
  });
};

const Home: NextPage = () => {
  const [code, setCode] = useState(
    `// SPDX-License-Identifier: MIT
pragma solidity >0.8.0;

contract AddNumbers {
  // Function to add two numbers
  function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
  }
}
`,
  );

  const workerRef = useRef<Worker>();

  const { address: connectedAddress } = useAccount();

  const { data: balance } = useWatchBalance({ address: connectedAddress });
  console.log("balance", balance);

  useEffect(() => {
    workerRef.current = new Worker(new URL("../workers/SolcWorker.ts", import.meta.url));
    workerRef.current.onmessage = event => {
      console.log("Worker message:", event.data);
    };
    workerRef.current.onerror = error => {
      console.error("Worker error:", error);
    };
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);
  const startWorker = async () => {
    if (workerRef.current) {
      const data = await solcWorkerCompile(workerRef.current, code);
      console.log("data", data);
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
          <button className="btn btn-primary mt-4" onClick={startWorker}>
            Compile
          </button>
          <button className="btn btn-primary mt-4">Deploy</button>
        </div>
      </div>
    </>
  );
};

export default Home;
