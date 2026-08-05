import { useLoading } from '../context/LoadingContext'

export function GlobalLoadingBar() {
  const loading = useLoading()
  return (
    <div
      aria-busy={loading}
      role="progressbar"
      data-testid="loading-bar-track"
      className={`
        fixed top-0 left-0 right-0 h-1 z-loading-bar
        overflow-hidden transition-opacity duration-300
        ${loading ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {loading && (
        <div
          data-testid="loading-bar-sweep"
          className="
            h-full w-1/3 animate-shimmer
            bg-gradient-to-r from-transparent via-primary to-transparent
            motion-reduce:w-full motion-reduce:bg-none motion-reduce:bg-primary
          "
        />
      )}
    </div>
  )
}
