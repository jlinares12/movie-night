import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'
import { GlobalLoadingBar } from '../components/GlobalLoadingBar'

export const loadingSetterRef = { current: null as ((v: boolean) => void) | null }

const LoadingContext = createContext(false)

export function LoadingProvider({
  children,
  indicator = <GlobalLoadingBar />,
}: {
  children: ReactNode
  indicator?: ReactNode
}) {
  const [loading, setLoading] = useState(false)
  useLayoutEffect(() => { loadingSetterRef.current = setLoading }, [])

  return (
    <LoadingContext.Provider value={loading}>
      <div
        data-testid="global-loading"
        data-loading={String(loading)}
        style={{ display: 'none' }}
      />
      {indicator}
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  return useContext(LoadingContext)
}
