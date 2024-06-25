import { customCommon, memoryClient } from "../wagmiConfig";
import { burnerWalletId, burnerWalletName, loadBurnerPK } from "./utils";
import { createConnector, normalizeChainId } from "@wagmi/core";
import { tevmTransport } from "tevm";
import type { EIP1193RequestFn, Hex, SendTransactionParameters, Transport, WalletRpcSchema } from "viem";
import { BaseError, RpcRequestError, SwitchChainError, createWalletClient, custom, fromHex, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getHttpRpcClient, hexToBigInt, hexToNumber, numberToHex } from "viem/utils";

export class ConnectorNotConnectedError extends BaseError {
  override name = "ConnectorNotConnectedError";
  constructor() {
    super("Connector not connected.");
  }
}

export class ChainNotConfiguredError extends BaseError {
  override name = "ChainNotConfiguredError";
  constructor() {
    super("Chain not configured.");
  }
}

type Provider = ReturnType<Transport<"custom", Record<any, any>, EIP1193RequestFn<WalletRpcSchema>>>;

export const burner = () => {
  let connected = true;
  let connectedChainId: number;
  return createConnector<Provider>(config => ({
    id: burnerWalletId,
    name: burnerWalletName,
    type: burnerWalletId,
    async connect({ chainId } = {}) {
      console.log("connect to burnerwallet");
      const provider = await this.getProvider();
      const accounts = await provider.request({
        method: "eth_accounts",
      });
      let currentChainId = await this.getChainId();
      if (chainId && currentChainId !== chainId && this.switchChain) {
        const chain = await this.switchChain({ chainId });
        currentChainId = chain.id;
      }
      connected = true;
      return { accounts, chainId: currentChainId };
    },
    async getProvider({ chainId } = {}) {
      const chain = config.chains.find(x => x.id === chainId) ?? config.chains[0];

      const url = chain.rpcUrls.default.http[0];
      if (!url) throw new Error("No rpc url found for chain");

      const burnerAccount = privateKeyToAccount(loadBurnerPK());
      const client = createWalletClient({
        chain: customCommon,
        account: burnerAccount,
        transport: tevmTransport(memoryClient),
      });

      const request: EIP1193RequestFn = async ({ method, params }) => {
        console.log(`burnerwallet request: ${method} ${JSON.stringify(params)}`);
        if (method === "eth_sendTransaction") {
          const actualParams = (params as SendTransactionParameters[])[0];
          const hash = await client.sendTransaction({
            account: burnerAccount,
            data: actualParams?.data,
            to: actualParams?.to,
            value: actualParams?.value ? hexToBigInt(actualParams.value as unknown as Hex) : undefined,
            gas: actualParams?.gas ? hexToBigInt(actualParams.gas as unknown as Hex) : undefined,
            nonce: actualParams?.nonce ? hexToNumber(actualParams.nonce as unknown as Hex) : undefined,
            maxPriorityFeePerGas: actualParams?.maxPriorityFeePerGas
              ? hexToBigInt(actualParams.maxPriorityFeePerGas as unknown as Hex)
              : undefined,
            maxFeePerGas: actualParams?.maxFeePerGas
              ? hexToBigInt(actualParams.maxFeePerGas as unknown as Hex)
              : undefined,
            gasPrice: (actualParams?.gasPrice
              ? hexToBigInt(actualParams.gasPrice as unknown as Hex)
              : undefined) as undefined,
          });
          return hash;
        }

        if (method === "personal_sign") {
          // first param is Hex data representation of message,
          // second param is address of the signer
          const rawMessage = (params as [`0x${string}`, `0x${string}`])[0];
          const signature = await client.signMessage({
            account: burnerAccount,
            message: { raw: rawMessage },
          });
          return signature;
        }

        if (method === "eth_accounts") {
          return [burnerAccount.address];
        }

        if (method === "wallet_switchEthereumChain") {
          type Params = [{ chainId: Hex }];
          connectedChainId = fromHex((params as Params)[0].chainId, "number");
          this.onChainChanged(connectedChainId.toString());
          return;
        }

        if (method === "eth_chainId") {
          return customCommon.id;
        }

        const body = { method, params };
        const httpClient = getHttpRpcClient(url);
        const { error, result } = await httpClient.request({ body });
        if (error) throw new RpcRequestError({ body, error, url });

        return result;
      };

      return custom({ request })({ retryCount: 0 });
    },
    onChainChanged(chain) {
      const chainId = normalizeChainId(chain);
      config.emitter.emit("change", { chainId });
    },
    async getAccounts() {
      console.log("getAccounts from burnerwallet");
      if (!connected) throw new ConnectorNotConnectedError();
      const provider = await this.getProvider();
      const accounts = await provider.request({ method: "eth_accounts" });
      const burnerAddress = accounts.map(x => getAddress(x))[0] as `0x${string}`;
      return [burnerAddress];
    },
    async onDisconnect() {
      console.log("onDisconnect from burnerwallet");
      config.emitter.emit("disconnect");
      connected = false;
    },
    async getChainId() {
      console.log("getChainId from burnerwallet");
      return customCommon.id;
      /* const provider = await this.getProvider();
      const hexChainId = await provider.request({ method: "eth_chainId" });
      return fromHex(hexChainId, "number"); */
    },
    async isAuthorized() {
      console.log("isAuthorized from burnerwallet");
      if (!connected) return false;
      const accounts = await this.getAccounts();
      return !!accounts.length;
    },
    onAccountsChanged(accounts) {
      console.log("onAccountsChanged from burnerwallet");
      if (accounts.length === 0) this.onDisconnect();
      else
        config.emitter.emit("change", {
          accounts: accounts.map(x => getAddress(x)),
        });
    },
    async switchChain({ chainId }) {
      console.log("switchChain from burnerwallet");
      const provider = await this.getProvider();
      const chain = config.chains.find(x => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(chainId) }],
      });
      return chain;
    },
    disconnect() {
      console.log("disconnect from burnerwallet");
      connected = false;
      return Promise.resolve();
    },
  }));
};
