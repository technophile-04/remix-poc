import { wagmiConnectors } from "./wagmiConnectors";
import { createMemoryClient, tevmTransport } from "tevm";
import { Chain } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

const memoryClient = createMemoryClient();

export const wagmiConfig = createConfig({
  chains: [hardhat],
  connectors: wagmiConnectors,
  ssr: true,
  transports: {
    [hardhat.id]: tevmTransport(memoryClient),
  },
});
