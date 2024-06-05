import { wagmiConnectors } from "./wagmiConnectors";
import { createMemoryClient, tevmTransport } from "tevm";
import { createCommon, tevmDefault } from "tevm/common";
import { Chain, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

const customCommon = createCommon({
  ...tevmDefault,
  id: hardhat.id,
  loggingLevel: "warn",
  eips: [],
  hardfork: "cancun",
});
export const memoryClient = createMemoryClient({ common: customCommon });

export const wagmiConfig = createConfig({
  chains: [hardhat, mainnet],
  connectors: wagmiConnectors,
  ssr: true,
  transports: {
    [hardhat.id]: tevmTransport(memoryClient),
    [mainnet.id]: http(getAlchemyHttpUrl(mainnet.id)),
  },
});
