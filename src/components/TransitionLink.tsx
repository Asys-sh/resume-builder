'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'

type TransitionLinkProps = ComponentProps<typeof Link>

export default function TransitionLink({ href, children, onClick, ...props }: TransitionLinkProps) {
  return (
    <Link href={href} onClick={onClick} {...props}>
      {children}
    </Link>
  )
}
