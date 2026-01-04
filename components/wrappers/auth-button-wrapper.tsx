"use client"

import React from 'react'

type Props = {
    onClick: () => void;
    children: React.ReactNode
}

function OAuthButton({children, onClick}: Props) {
  return (
    <button onClick={onClick} className="bg-white flex items-center justify-center gap-x-2 rounded-[4px] py-2 px-4 w-[350px] xs:w-auto cursor-pointer">
        {children}
    </button>
  )
}

export default OAuthButton
