import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { chain, configureChains, createClient } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
// import { FantomFTMLogo } from '../assets'

// const fantomMainnet = {
//   id: 250,
//   name: 'Fantom',
//   network: 'fantom mainnet',
//   iconUrl: FantomFTMLogo,
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Fantom',
//     symbol: 'FTM',
//   },
//   rpcUrls: {
//     default: 'https://rpcapi.fantom.network/',
//   },
//   blockExplorers: {
//     default: { name: 'ftmscan', url: 'https://ftmscan.com' },
//   },
//   testnet: false,
// }

export const { chains, provider } = configureChains(
  [chain.mainnet],
  [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID }), publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Ama DApp',
  chains,
})

export const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})
