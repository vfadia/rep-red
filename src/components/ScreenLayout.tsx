import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function ScreenLayout({ children }: Props) {
  return (
    <main
      className="flex-1 overflow-y-auto"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {children}
    </main>
  )
}
