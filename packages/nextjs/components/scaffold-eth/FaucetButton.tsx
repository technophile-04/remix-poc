"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { TxnNotification } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { memoryClient } from "~~/services/web3/wagmiConfig";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

// Number of ETH faucet sends to an address
const NUM_OF_ETH = "1";
const FAUCET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/**
 * FaucetButton button which lets you grab eth.
 */
export const FaucetButton = () => {
  const { address } = useAccount();

  const { data: balance } = useWatchBalance({ address });

  const [loading, setLoading] = useState(false);

  const sendETH = async () => {
    if (!address) return;

    let notificationId = null;
    try {
      setLoading(true);

      notificationId = notification.loading(<TxnNotification message="Waiting for transaction to complete." />);

      await memoryClient.tevmCall({
        from: FAUCET_ADDRESS,
        to: address,
        value: parseEther(NUM_OF_ETH),
        createTransaction: "on-success",
      });

      const mineResult = await memoryClient.tevmMine();

      notification.remove(notificationId);

      notification.success(<TxnNotification message="Transaction completed successfully!" />, {
        icon: "🎉",
      });

      if (mineResult.errors) throw new Error("Failed to mine");
    } catch (error) {
      if (notificationId) {
        notification.remove(notificationId);
      }
      console.error("⚡️ ~ file: useTransactor.ts ~ error", error);
      const message = getParsedError(error);
      notification.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* // Render only on local chain
  if (ConnectedChain?.id !== hardhat.id) {
    return null;
  } */

  const isBalanceZero = balance && balance.value === 0n;

  return (
    <div
      className={
        !isBalanceZero
          ? "ml-1"
          : "ml-1 tooltip tooltip-bottom tooltip-secondary tooltip-open font-bold before:left-auto before:transform-none before:content-[attr(data-tip)] before:right-0"
      }
      data-tip="Grab funds from faucet"
    >
      <button className="btn btn-secondary btn-sm px-2 rounded-full" onClick={sendETH} disabled={loading}>
        {!loading ? (
          <BanknotesIcon className="h-4 w-4" />
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};
