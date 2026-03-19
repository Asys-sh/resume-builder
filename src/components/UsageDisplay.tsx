import { cn } from '@/lib/utils'

interface UsageDisplayProps {
  usageCount?: number
  usageLimit?: number
  onClick?: () => void
  className?: string
}

export function UsageDisplay({ usageCount, usageLimit, onClick, className }: UsageDisplayProps) {
  const percentage = usageCount !== undefined && usageLimit ? (usageCount / usageLimit) * 100 : 0

  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-2 hover:scale-105 transition-transform duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-2',
        className,
      )}
      aria-label={`Usage: ${usageCount ?? 0} out of ${usageLimit ?? 0} AI assists used`}
      onClick={onClick}
    >
      <span className="text-primary text-lg" aria-hidden="true">
        ⚡
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          {usageCount ?? 0}/{usageLimit ?? 0} AI Assists
        </span>
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </button>
  )
}
