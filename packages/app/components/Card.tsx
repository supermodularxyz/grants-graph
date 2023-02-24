import React, { ReactNode } from 'react'
import classNames from 'classnames'

const Card = ({ children, className }: { children: ReactNode, className?: any }) => {
  return (<div className={classNames('p-3 rounded-lg bg-white text-slate-700 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 mb-2', className)}>
    {children}
  </div>)
}

export default Card
