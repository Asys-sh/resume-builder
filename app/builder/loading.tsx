export default function BuilderLoading() {
  return (
    <div className="min-h-screen bg-background-light animate-pulse">
      <div className="h-16 bg-highlight/50" />
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="h-8 w-48 bg-highlight/70 rounded" />
            <div className="h-12 bg-highlight/50 rounded-lg" />
            <div className="h-12 bg-highlight/50 rounded-lg" />
            <div className="h-12 bg-highlight/50 rounded-lg" />
          </div>
          <div className="hidden xl:block h-[600px] bg-highlight/30 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
