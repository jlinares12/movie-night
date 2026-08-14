import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { GlobalLoadingBar } from '../components/GlobalLoadingBar'

/** What the bar shows: a request is in flight *and* no region is representing it. */
const LoadingContext = createContext(false)

/** Called on mount by a region that owns its own wait; returns its unregister. */
type RegisterRegion = () => () => void

/*
 * A no-op default, so a `SkeletonGroup` rendered outside a `LoadingProvider` — every
 * component unit test does this — still works and simply suppresses nothing.
 */
const SkeletonRegionContext = createContext<RegisterRegion>(() => () => {})

export function LoadingProvider({
  children,
  indicator = <GlobalLoadingBar />,
}: {
  children: ReactNode
  indicator?: ReactNode
}) {
  const [pending, setPending] = useState(0)
  const [regions, setRegions] = useState(0)

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

  const registerRegion = useCallback<RegisterRegion>(() => {
    setRegions(n => n + 1)
    return () => setRegions(n => Math.max(0, n - 1))
  }, [])

  const busy = pending > 0
  const barVisible = busy && regions === 0

  return (
    <SkeletonRegionContext.Provider value={registerRegion}>
      <LoadingContext.Provider value={barVisible}>
        {/*
         * Two attributes, deliberately: `data-loading` stays the raw request count so the
         * ~40 `waitForSelector('[data-loading="false"]')` barriers across the e2e suite
         * keep meaning "the network settled". `data-bar` is what the bar actually renders.
         * Collapsing them into one would make every one of those barriers pass instantly
         * while a skeleton is up — still green, but no longer waiting for anything.
         */}
        <div
          data-testid="global-loading"
          data-loading={String(busy)}
          data-bar={String(barVisible)}
        />
        {indicator}
        {children}
      </LoadingContext.Provider>
    </SkeletonRegionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoading() {
  return useContext(LoadingContext)
}

/**
 * Marks the calling component as a region that represents its own wait, suppressing the
 * bar for as long as it is mounted. `SkeletonGroup` calls this, which makes the division
 * of labor structural: every skeleton — including ones not written yet — opts in by
 * existing, and no consumer has to remember to.
 *
 * Suppression is global rather than per-request: any mounted skeleton anywhere hides the
 * bar entirely. That over-applies in principle (a mutation fired while a skeleton is up
 * would also be hidden), but not in practice — skeletons are only on screen during a
 * route's first paint, and `MainLayout.tsx:11` gates routes behind `sessionReady`, so
 * nothing is clickable underneath one.
 *
 * Scope is skeleton regions only. Inline and button spinners deliberately co-occur with
 * the bar — see the "Deliberate exception" note in the feature plan.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useSkeletonRegion() {
  const register = useContext(SkeletonRegionContext)
  useEffect(() => register(), [register])
}
