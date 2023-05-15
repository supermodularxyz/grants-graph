import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { ethers } from 'ethers';
import classNames from 'classnames';
import rounds from '../data/rounds';
import Card from "../components/Card"

const Home: NextPage = () => {
  const router = useRouter()
  const chainId = 1;
  const [showKnownRounds, setShowKnownRounds] = useState<boolean>(false)

  const handleOpenRound = (address: `0x${string}`) => {
    router.push(`/round/${address}`)
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

    handleOpenRound(target.roundAddress.value as `0x${string}`)
  }

  return (
    <main className='flex'>
      <aside className='sticky h-screen overflow-y-auto overflow-x-visible pt-3 px-1 pr-2 left-2 pointer-events-auto w-[26rem]'>
        <Card>
          <form onSubmit={handleSubmit}>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Mainnet Round Address
            </label>
            <div className="mt-1 border-b border-gray-300 focus-within:border-indigo-600">
              <input
                id="name"
                type="text"
                name="roundAddress"
                className="block w-full border-0 border-b border-transparent bg-gray-50 focus:border-indigo-600 focus:ring-0 sm:text-sm p-2"
                placeholder="0x..."
              />
            </div>
            {/* <div className='flex flex-1 justify-end mt-2 italic text-sm'>
              Try with the <button className='ml-1 text-indigo-600 italic' onClick={exampleRound}>latest grant round</button>
            </div> */}
            <div className='w-full mt-2 select-none'>
              <div className={classNames('flex flex-1 italic text-sm mt-3', { "mb-1": showKnownRounds })}>
                <span role="button" onClick={() => setShowKnownRounds(!showKnownRounds)}>Show known rounds</span>
              </div>
              {showKnownRounds && <ul role="list" className="divide-y divide-gray-200">
                {rounds.map((round) => (
                  <li
                    key={round.id}
                    onClick={!round.disable ? () => handleOpenRound(round.id as `0x${string}`) : () => null}
                    className={classNames("relative py-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 hover:bg-gray-50", {
                      "bg-gray-50": round.disable
                    })}
                  >
                    <div className="flex justify-between space-x-3">
                      <div className="min-w-0 flex-1">
                        <button className="block focus:outline-none">
                          <span className="absolute inset-0" aria-hidden="true" />
                          <p className="truncate text-sm font-medium text-gray-900">{round.title}</p>
                        </button>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-600 line-clamp-2">{round.description}</p>
                    </div>
                  </li>
                ))}
              </ul>}
            </div>
          </form>
        </Card>
      </aside>
    </main>
  )
}

export default Home