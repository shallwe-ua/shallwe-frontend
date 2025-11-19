'use client'


import { ReactNode, useEffect, useState } from 'react'


export function MSWInitializer({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready) {
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({onUnhandledRequest: 'bypass', }).then(() => {
            setReady(true)
          })
      })
    }
  }, [ready])

  // This ensures that worker is initialized first before rendering to avoid middleware errors.
  return !ready ? null : <>{children}</> 
}
