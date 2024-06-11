"use client";

import { ContractUI } from "~~/app/debug/_components/contract";
import { useDeployedContractState } from "~~/services/store/store";

export function DebugContracts() {
  const { deployedContractAbi, deployedContractAddress } = useDeployedContractState(state => ({
    deployedContractAddress: state.deployedContractAddress,
    deployedContractAbi: state.deployedContractAbi,
  }));

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      {deployedContractAddress.length === 0 ? (
        <p className="text-3xl mt-14">No contracts found!</p>
      ) : (
        <>
          <ContractUI deployedContractData={{ address: deployedContractAddress, abi: deployedContractAbi }} />
        </>
      )}
    </div>
  );
}
