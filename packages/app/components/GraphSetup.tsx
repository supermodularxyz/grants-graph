import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { useState, useRef, useEffect, useCallback } from 'react'
import { BigNumber, ethers } from 'ethers';
import { CornerDownRight, X } from 'react-feather';
import { useRoundDetailsQuery } from '../gql/types.generated';
import { Card } from "../components"
import { formatNumber, getTokenInfo, loadIPFSJSON } from '../utils/web3';
import { NodeType, handleNodeClick, DonorNode } from '../utils/pack';
import { NodeSummary, ActiveNode, Stats, Meta } from '../types';

const GraphPage = dynamic(() => import('./GraphPage'), {
  ssr: false
})

const Home = ({ roundAddress }: { roundAddress: `0x${string}` }) => {
  roundAddress = roundAddress.toLowerCase() as `0x${string}`
  const countRef = useRef(0)
  const chainId = 1;
  const [meta, setMeta] = useState<Meta>()
  const [loading, setLoading] = useState<boolean>(true)
  const [activeDonors, setActiveDonors] = useState<Record<string, ActiveNode>>({})
  const [updateNode, setUpdateNode] = useState<{ id: string, type: NodeType, color: string, highlightColor: string }>()
  const [projectsData, setProjectsData] = useState<Record<string, any>>({})
  const { data: roundData, fetchMore } = useRoundDetailsQuery({
    context: {
      clientName: String(chainId)
    },
    variables: {
      address: roundAddress
    },
    onCompleted(data: any) {
      countRef.current += 1000
      if (roundAddress.length > 0) {
        // if ((roundData?.round?.votingStrategy?.votes?.length || 0) >= countRef.current) {
        //   fetchMore({
        //     variables: {
        //       skip: countRef.current
        //     }
        //   })
        // } else {
        //   setLoading(false)
        // }


        if (countRef.current <= 2000) {
          console.log(`Loading more`)
          fetchMore({
            variables: {
              skip: countRef.current
            }
          })
        } else {
          console.log(`Done Loading`)
          setLoading(false)
        }
      } else {
        countRef.current = 0
      }
    }
  })

  console.log({ loading, roundData, roundAddress, count: countRef.current })

  const openNode = useCallback((nodeId: string, color: string, highlightColor: string) => {
    const donors = { ...activeDonors };
    const id = nodeId.toLowerCase()

    if (donors[id]) {
      donors[id].show = !donors[id].show;
      donors[id].color = color;
      donors[id].highlightColor = highlightColor;
    } else {
      // calculate donations
      const summary: NodeSummary = {};

      (roundData?.round?.votingStrategy.votes || []).forEach((i) => {
        if (i.from.toLowerCase() === id) {
          if (summary[i.projectId]) {
            summary[i.projectId].votes += 1;
            if (summary[i.projectId].donations[i.token]) {
              summary[i.projectId].donations[i.token] = summary[i.projectId].donations[i.token].add(i.amount)
            } else {
              summary[i.projectId].donations[i.token] = BigNumber.from(i.amount)
            }
          } else {
            summary[i.projectId] = { votes: 1, donations: { [i.token]: BigNumber.from(i.amount) } }
          }
        }
      })

      donors[id] = {
        id,
        color,
        highlightColor,
        address: `${id.substring(0, 6)}...${id.substring(id.length - 4)}`,
        show: true,
        summary
      }
    }

    setActiveDonors({ ...activeDonors, ...donors })
  }, [activeDonors, roundData?.round?.votingStrategy.votes]);

  const handleNode = useCallback((node: DonorNode, highlightColor: string) => {
    setUpdateNode({ id: node.name, type: node.type, color: node.color, highlightColor });
  }, [])

  useEffect(() => {
    if (updateNode?.type === NodeType.Donor) {
      openNode(updateNode.id, updateNode.color, updateNode.highlightColor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateNode])

  const loadMetaPtr = useCallback(async () => {
    // load the round from IPFS
    const roundMetaPtr = roundData?.round?.roundMetaPtr.pointer as string
    const programMetaPtr = roundData?.round?.program.metaPtr.pointer as string
    const [roundMeta, programMeta] = await Promise.all([loadIPFSJSON(roundMetaPtr), loadIPFSJSON(programMetaPtr)])
    // const projectsMeta = await Promise.all((roundData?.round?.projects || []).map((p: any) => loadIPFSJSON(p.metaPtr.pointer)));
    const stats: Stats[] = [];
    const uniqueVoters: Set<string> = new Set([]);
    const tokenVotes: Record<string, BigNumber> = {};

    // TODO : Add count for projects, donors & donations
    (roundData?.round?.votingStrategy.votes || []).forEach((i: any) => {
      uniqueVoters.add(i.from);
      const amount = BigNumber.from(i.amount)

      if (tokenVotes[i.token]) {
        tokenVotes[i.token] = tokenVotes[i.token].add(amount);
      } else {
        tokenVotes[i.token] = BigNumber.from(amount);
      }
    });

    stats.push({ name: "Registered Projects", count: (roundData?.round?.projects || []).length })
    stats.push({ name: "Votes", count: (roundData?.round?.votingStrategy.votes || []).length })
    stats.push({ name: "Unique Voters", count: uniqueVoters.size });

    const tokenInfo = (await getTokenInfo(Object.keys(tokenVotes).filter((i) => i !== "0x0000000000000000000000000000000000000000"), chainId))
    for (const key in tokenInfo) {
      const i = tokenInfo[key];
      stats.push({ name: `${i.symbol} donation(s)`, count: formatNumber(tokenVotes[i.address], i.decimal) })
    }

    setMeta({ roundMeta, programMeta, stats })
  }, [roundData?.round?.program.metaPtr.pointer, roundData?.round?.projects, roundData?.round?.roundMetaPtr.pointer, roundData?.round?.votingStrategy.votes])

  useEffect(() => {
    if (!loading) {
      loadMetaPtr()
    }
  }, [loading, loadMetaPtr])

  const handleSetRound = (address: `0x${string}`) => {
    setUpdateNode(undefined)
    setProjectsData({})
    setMeta(undefined)
    setActiveDonors({})
    setLoading(true)
    countRef.current = 0
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const target = e.target as typeof e.target & {
      roundAddress: { value: string };
    };

    if (!ethers.utils.isAddress(target.roundAddress.value)) {
      // TODO : Throw error and set in state
      return null;
    }

    handleSetRound(target.roundAddress.value as `0x${string}`)
  }

  return (
    <main className='flex'>
      <aside className='sticky h-screen overflow-y-auto overflow-x-visible pt-3 px-1 pr-2 left-2 pointer-events-auto w-[26rem]'>
        {meta && <Card className="mt-3 text-sm">
          <div className='font-medium text-center w-full mb-2'>
            <h1>
              {meta.programMeta.name}
            </h1>
            <h2>
              {meta.roundMeta.name}
            </h2>
          </div>
          {meta.stats.length > 0 && <ul role="list" className="divide-y divide-gray-200 mt-4">
            {meta.stats.map((i: any) => <li key={i.name} className="relative bg-white py-3 px-2 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 hover:bg-gray-50">
              <div className='flex flex-1 justify-between'>
                <span className='font-semibold'>{i.count}</span>
                <span>{i.name}</span>
              </div>
            </li>)}
          </ul>}
          {/* {meta.projectsMeta.length > 0 && <ul role="list" className="divide-y divide-gray-200">
            {meta.projectsMeta.map((i: any) => <li key={`${i.signature}-${i.application.project.id}`} className="relative bg-white py-3 px-2 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 hover:bg-gray-50">{i.application.project.title}</li>)}
          </ul>} */}
        </Card>}

        {Object.values(activeDonors).filter((i) => i.show).length > 0 && <Card className="mt-3 text-sm">
          <div className='font-medium w-full mb-2'>
            <h1>
              Selected Donors
            </h1>
          </div>
          {/* <ul role="list" className="divide-y divide-gray-200"> */}
          <ul role="list">
            {Object.values(activeDonors).map((i: ActiveNode) => {
              return i.show ? <li key={i.id} className="relative bg-white py-3 px-2 my-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 hover:bg-gray-50">
                <div className='flex flex-1 flex-col w-full'>
                  <div className='flex flex-1 flex-row justify-between mb-2'>
                    <div className='font-semibold flex flex-1 items-center'>
                      <div className='w-3 h-3 rounded-full mr-2' style={{ backgroundColor: i.highlightColor }} />
                      <div>
                        <a href={`https://etherscan.io/address/${i.id}`} target="_blank" rel="noreferrer">{i.address}</a>
                      </div>
                    </div>
                    <span onClick={() => {
                      handleNodeClick("", { data: { name: i.id, type: NodeType.Donor, color: i.color } }, "")
                      openNode(i.id, i.color, i.highlightColor)
                    }}>
                      <X size={18} />
                    </span>
                  </div>
                  {Object.keys(i.summary).map((projectId) => (<div key={projectId} className='flex flex-1 flex-col'>
                    <div className='flex flex-1 flex-row my-1 items-center'>
                      <div className='mr-2'><CornerDownRight size={14} /></div>
                      <div className='line-clamp-1'>{projectsData.projectsMeta[projectId]?.application.project.title}</div>
                    </div>
                    {Object.keys(i.summary[projectId].donations).map((tokenId) => {
                      const { symbol, decimal } = projectsData.tokensMap[tokenId]
                      return <div key={symbol} className='flex flex-1 flex-row justify-between items-center'>
                        <div className='border border-dashed flex flex-1' />
                        <div>
                          <span className='mx-2'>{formatNumber(i.summary[projectId].donations[tokenId], decimal)}</span>
                          <span>{symbol}</span>
                        </div>
                      </div>
                    })}
                  </div>))}
                </div>
              </li> : null
            })}
          </ul>
        </Card>}
      </aside>
      {/* {!loading && <GraphPage chainId={chainId} roundData={loading ? undefined : roundData} showLoading={loading} handleNode={handleNode} onProjectsMeta={(m) => {
        setProjectsData(m)
      }} />} */}
    </main>
  )
}

export default Home