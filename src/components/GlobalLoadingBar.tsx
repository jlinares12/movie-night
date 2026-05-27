import { useLoading } from '../context/LoadingContext'

export function GlobalLoadingBar() {
  const loading = useLoading()
  return (
    <div
      aria-busy={loading}
      role="progressbar"
      className={`
        fixed top-0 left-0 right-0 h-1 z-50
        bg-primary transition-opacity duration-300
        ${loading ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {loading && (
        <div className="h-full bg-primary/60 animate-[shimmer_1.5s_ease-in-out_infinite] w-1/3" />
      )}
    </div>
  )
}
