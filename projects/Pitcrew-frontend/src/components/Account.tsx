import { useWallet } from '@txnlab/use-wallet-react'
import { useMemo } from 'react'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const Account = () => {
  const { activeAddress } = useWallet()
  const algoConfig = getAlgodConfigFromViteEnvironment()

  const networkName = useMemo(() => {
    return algoConfig.network === '' ? 'localnet' : algoConfig.network.toLocaleLowerCase()
  }, [algoConfig.network])

  if (!activeAddress) {
    return null
  }

  return (
    <div className="account-chip">
      <a className="account-link" target="_blank" rel="noreferrer" href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}>
        Address: {ellipseAddress(activeAddress)}
      </a>
      <div className="account-network">Network: {networkName}</div>
    </div>
  )
}

export default Account
