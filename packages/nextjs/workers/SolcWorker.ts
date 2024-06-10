// @ts-expect-error - solc does not export types checkout: https://github.com/ethereum/solc-js/pull/693
import wrapper from "solc/wrapper";
import { z } from "zod";

importScripts("https://binaries.soliditylang.org/bin/soljson-v0.8.19+commit.7dd6d404.js");

const params = z.object({
  code: z.string(),
  id: z.string(),
});

// Solc is expensive to import expensive to compile and expensive to run
// Run it in a web worker so it always runs on a seperate thread
onmessage = async e => {
  const { code, id } = params.parse(e.data);
  const compiler = wrapper(self);
  console.log(`Solc version: ${compiler.version()}`);

  const sourceCode = {
    language: "Solidity",
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
    sources: {
      "contract.sol": {
        content: code,
      },
    },
  };

  const data = JSON.parse(compiler.compile(JSON.stringify(sourceCode)));

  try {
    const result = {
      data,
      id,
    };

    postMessage({ success: true, result });
  } catch (error) {
    console.error("Failed to compile code", id, error);
    postMessage({
      success: false,
      result: { id },
      error: error instanceof Error ? error.message : error,
    });
  }
};
