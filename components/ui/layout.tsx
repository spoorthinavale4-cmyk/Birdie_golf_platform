import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Container({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('mx-auto w-full max-w-6xl px-6', className)}>{children}</div>
}

export function Section({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <section className={cn('py-16 md:py-20', className)}>{children}</section>
}

export function Surface({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur-md',
        className
      )}
    >
      {children}
    </div>
  )
}
