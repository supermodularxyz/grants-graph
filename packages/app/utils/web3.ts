import { Provider, readContracts } from '@wagmi/core'
import { ethers, BigNumber } from 'ethers'

const tokenABI = ['function decimals() view returns (uint8)', 'function symbol() view returns (string)']

export type TokenMap = Record<string, { symbol: string; decimal: number; address: string; group: number }>

// export const getTokenInfo = async (tokenAddress: string, provider: Provider): Promise<{ symbol: string, decimal: number }> => {
// const tokenContract = new Contract(tokenAddress, tokenABI, provider)
export const getTokenInfo = async (tokenAddresses: string[], chainId: number) => {
  const tokenInfo: TokenMap = {}
  let addressIndex = 0

  tokenInfo['0x0000000000000000000000000000000000000000'] = {
    symbol: 'ETH',
    decimal: 18,
    address: '0x0000000000000000000000000000000000000000',
    group: addressIndex,
  }

  if (tokenAddresses.length > 0) {
    const contracts = tokenAddresses.reduce((acc, tokenAddress) => {
      acc.push({ address: tokenAddress, abi: tokenABI, functionName: 'decimals', chainId })
      acc.push({ address: tokenAddress, abi: tokenABI, functionName: 'symbol', chainId })
      return acc
    }, <{ address: string; abi: string[]; functionName: string; chainId: number }[]>[])

    const data = await readContracts({
      contracts,
    })

    // TODO : Loop through data and get values for each token
    let dataIndex = 0
    do {
      if (tokenAddresses[addressIndex]) {
        tokenInfo[tokenAddresses[addressIndex]] = {
          address: tokenAddresses[addressIndex],
          decimal: data[dataIndex] as number,
          symbol: data[dataIndex + 1] as string,
          group: addressIndex + 1,
        }

        addressIndex += 1
        dataIndex += 2
      }
    } while (addressIndex < tokenAddresses.length)
  }

  return tokenInfo
}

export const sortAddresses = (a: unknown, b: unknown) => {
  return ethers.BigNumber.from(a)
    .sub(ethers.BigNumber.from(b))
    .toNumber()
}

export const loadIPFSJSON = async (hash: string) => {
  return fetch(`https://gitcoin.mypinata.cloud/ipfs/${hash}`).then((resp) => resp.json())
}

export const formatNumber = (numberVal: BigNumber, decimal: number) =>
  ethers.utils.commify(
    Number(ethers.utils.formatUnits(numberVal, decimal).toString())
      .toFixed(2)
      .toString()
  )
