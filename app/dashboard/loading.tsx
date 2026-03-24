export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background-light animate-pulse">
      <div className="flex">
        <div className="hidden md:block w-64 h-screen bg-highlight/30" />
        <div className="flex-1 p-6 space-y-6">
          <div className="h-8 w-64 bg-highlight/70 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-highlight/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
