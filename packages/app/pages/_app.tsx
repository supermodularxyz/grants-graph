import '../styles/globals.css'
import type { AppProps } from 'next/app'

import '@rainbow-me/rainbowkit/styles.css'
import { WagmiConfig } from 'wagmi';
import { wagmiClient, chains } from '../utils/wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ApolloClient, ApolloLink, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client'
import ContractsProvider from '../providers/ContractsProvider/ContractProvider'
import Footer from '../components/Footer';

const mainnetSugraph = new HttpLink({
  uri: "https://api.studio.thegraph.com/query/32278/allo-grants-graph/v0.0.3"
})

const goerliSubgraph = new HttpLink({
  uri: "https://api.thegraph.com/subgraphs/name/ghostffcode/grants-manager"
})

const fantomSubgraph = new HttpLink({
  uri: "https://api.thegraph.com/subgraphs/name/gitcoinco/grants-round-fantom-mainnet"
})

const optimismSubgraph = new HttpLink({
  uri: "https://api.thegraph.com/subgraphs/name/ghostffcode/sm-op-allo"
})

const cache = new InMemoryCache({
  typePolicies: {
    VotingStrategy: {
      fields: {
        votes: {
          keyArgs: false,
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        }
      }
    }
  }
})

const client = new ApolloClient({
  link: ApolloLink.split((operation) => operation.getContext().clientName === '5', goerliSubgraph, ApolloLink.split((operation) => operation.getContext().clientName === '1', mainnetSugraph, ApolloLink.split((operation) => operation.getContext().clientName === '10', optimismSubgraph, fantomSubgraph))),
  cache,
  connectToDevTools: true
})

function MyApp({ Component, pageProps }: AppProps) {
  return (<ApolloProvider client={client}>
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ContractsProvider>
          <Component {...pageProps} />
          <Footer />
        </ContractsProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  </ApolloProvider>)
}

export default MyApp
