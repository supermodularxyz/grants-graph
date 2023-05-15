import type { NextPage } from 'next'
import { useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Provider } from '@wagmi/core';
import Pack, { DonorNode, NodeItem, colors } from "../utils/pack"
import { NodeType, OpenNode } from '../utils/pack';
import { getTokenInfo, sortAddresses, loadIPFSJSON } from '../utils/web3';
import { RoundDetailsQueryResult, MetaPtr } from '../gql/types.generated';

type Props = { chainId?: number, roundData?: RoundDetailsQueryResult, showLoading: boolean, handleNode: OpenNode, projectsMeta: any, tokensMap: any }

const GraphPage: NextPage<Props> = ({ chainId = 1, roundData, showLoading, handleNode, projectsMeta, tokensMap }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const loadGraph = useCallback(async () => {

    if (!projectsMeta) {
      return null
    }

    const exisitingNodes: Record<string, NodeItem> = {}

    exisitingNodes["0x0000000000000000000000000000000000000000000000000000000000000000"] = { name: "0x0000000000000000000000000000000000000000000000000000000000000000", type: NodeType.Project, shortKey: "0x000...0000", children: [] };

    // projects node
    (roundData?.round?.projects || []).forEach((project: { project: string }, i: number) => {
      if (!exisitingNodes[project.project]) {
        exisitingNodes[project.project] = { name: project.project, title: projectsMeta[project.project].application.project.title, type: NodeType.Project, shortKey: `${project.project.substring(0, 6)}...${project.project.substring(project.project.length - 4)}`, children: [] }
      }
    });

    // donor nodes & links
    (roundData?.round?.votingStrategy.votes || []).forEach((vote: { from: string, projectId: string, amount: string | number, token: string }) => {
      const donationTokenInfo = tokensMap[vote.token];

      if (!projectsMeta[vote.projectId]) {
        console.log("Error projectId", vote.projectId)
        return null
      }

      const donorNode: DonorNode = { name: vote.from, shortKey: `${vote.from.substring(0, 6)}...${vote.from.substring(vote.from.length - 4)}`, type: NodeType.Donor, color: colors[donationTokenInfo.group], size: Number(ethers.utils.formatUnits(vote.amount, donationTokenInfo.decimal || "finney")) }

      if (exisitingNodes[vote.projectId]) {
        exisitingNodes[vote.projectId].children.push(donorNode)
      } else {
        exisitingNodes[vote.projectId] = { name: vote.from, title: projectsMeta[vote.projectId].application.project.title, shortKey: `${vote.projectId.substring(0, 6)}...${vote.projectId.substring(vote.projectId.length - 4)}`, type: NodeType.Project, children: [donorNode] }
      }
    });

    const graphData = { name: "Round X", type: NodeType.Round, shortKey: "", children: Object.values(exisitingNodes) }

    const graph = Pack(graphData, handleNode, {
      value: (d: any) => d.size, // size of each node (file); null for internal nodes (folders)
      // label: (d: any, n: any) => [`${d.name.substring(0, 6)}...${d.name.substring(d.name.length - 4)}`, n.value].join("\n"),
      // label: (d: any, n: any) => [`${d.name.substring(0, 5)}...${d.name.substring(d.name.length - 4)}`, n.value].join("\n"),
      title: (d: any, n: any) => `${n.ancestors().reverse().map(({ data: d }: any) => d.name).join("\r\n")}`,
      strokeWidth: 2
    })

    if (canvasRef.current && graph) {
      canvasRef.current.appendChild(graph)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, handleNode, projectsMeta, tokensMap, roundData?.round?.projects, roundData?.round?.votingStrategy.votes]);

  useEffect(() => {
    if (roundData) {
      loadGraph()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundData, loadGraph])

  return (
    <section className='flex flex-1 items-center justify-center min-h-screen'>
      {showLoading ? <div>Loading...</div> : <div className='overflow-visible' ref={canvasRef} />}
    </section>
  )
}


export default GraphPage