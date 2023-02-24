import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import React from 'react'

const Nav = () => {
  return (
    <nav className='flex flex-1 justify-between items-center px-3 mt-3 w-full'>
      <div>
        <Link href="/">Grants Graph</Link>
      </div>

      <div className='flex flex-row items-center'>
        {/* <div className='mr-4'>
          <Link href="/cart">Cart</Link>
        </div> */}
        <ConnectButton />
      </div>
    </nav>)
}

export default Nav