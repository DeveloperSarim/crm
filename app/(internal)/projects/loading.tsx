export default function ProjectsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar skeleton */}
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-border bg-white px-5">
        <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-28 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
      </div>

      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        {/* Title row */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
          <div className="h-4 w-6 animate-pulse rounded-full bg-[#F3F4F6]" />
        </div>
        {/* Tabs */}
        <div className="mb-4 flex gap-5 border-b border-border pb-px">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-12 animate-pulse rounded-full bg-[#F3F4F6]" />
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-3 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[12px] border border-border bg-white">
              <div className="h-[150px] animate-pulse bg-[#F3F4F6]" />
              <div className="p-3">
                <div className="mb-2 h-4 w-3/4 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="mb-3 h-3 w-1/2 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3 w-full animate-pulse rounded-full bg-[#F9FAFB]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
