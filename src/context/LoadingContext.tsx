import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { GlobalLoadingBar } from '../components/GlobalLoadingBar'

const LoadingContext = createContext(false)

export function LoadingProvider({
  children,
  indicator = <GlobalLoadingBar />,
}: {
  children: ReactNode
  indicator?: ReactNode
}) {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const inc = () => setPending(n => n + 1)
    const dec = () => setPending(n => Math.max(0, n - 1))
    window.addEventListener('loading:start', inc)
    window.addEventListener('loading:end', dec)
    return () => {
      window.removeEventListener('loading:start', inc)
      window.removeEventListener('loading:end', dec)
    }
  }, [])

  const loading = pending > 0

  return (
    <LoadingContext.Provider value={loading}>
      <div
        data-testid="global-loading"
        data-loading={String(loading)}
      />
      {indicator}
      {children}
    </LoadingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoading() {
  return useContext(LoadingContext)
}
