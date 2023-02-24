import { BigNumber } from 'ethers'

export type NodeSummary = {
  [project: string]: {
    votes: number
    donations: {
      [token: string]: BigNumber
    }
  }
}

export type ActiveNode = {
  id: string
  address: string
  show: boolean
  color: string
  highlightColor: string
  summary: NodeSummary
}

export type Stats = {
  name: string
  count: number | string
}

export type Meta = {
  roundMeta: any
  programMeta?: any
  stats: Stats[]
  // projectsMeta: any[]
}
