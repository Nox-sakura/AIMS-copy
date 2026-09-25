/**
 * Skeleton — 骨架屏占位组件
 * variant: 'line' | 'table' | 'card'
 * rows: 表格模式下的行数（默认 5）
 */
export default function Skeleton({ variant = 'line', rows = 5, className = '' }) {
  if (variant === 'table') {
    return (
      <div className={`divide-y divide-medical-border ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`p-4 space-y-3 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
      </div>
    )
  }

  // 'line'
  return <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`} />
}
