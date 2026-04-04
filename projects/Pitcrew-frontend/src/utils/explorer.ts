import { getAlgodConfigFromViteEnvironment } from './network/getAlgoClientConfigs';

const getNetworkName = () => {
  const network = getAlgodConfigFromViteEnvironment().network;
  return network === '' ? 'localnet' : network.toLowerCase();
};

export const getTxnExplorerUrl = (txId: string) => `https://lora.algokit.io/${getNetworkName()}/tx/${txId}`;

export const getAccountExplorerUrl = (address: string) => `https://lora.algokit.io/${getNetworkName()}/account/${address}`;
