export default function ProjectDetailLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-border bg-white px-5">
        <div className="h-3.5 w-56 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-20 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
        <div className="h-7 w-24 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-7 pt-5">
          {/* Hero row */}
          <div className="mb-5 flex items-start gap-4">
            <div className="h-[92px] w-[140px] flex-none animate-pulse rounded-[10px] bg-[#F3F4F6]" />
            <div className="flex flex-col gap-2 pt-0.5">
              <div className="h-7 w-52 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-4 w-40 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-3 w-56 animate-pulse rounded-full bg-[#F9FAFB]" />
            </div>
            <div className="ml-auto flex gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-2.5 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-5 w-10 animate-pulse rounded-full bg-[#E5E7EB]" />
                </div>
              ))}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-5 border-b border-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-2.5 h-4 w-14 animate-pulse rounded-full bg-[#F3F4F6]" />
            ))}
          </div>
        </div>

        {/* Leads table skeleton */}
        <div className="px-7 pt-4">
          <div className="flex gap-2 pb-3">
            <div className="h-8 w-52 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
            <div className="h-8 w-28 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          </div>
          <div className="overflow-hidden rounded-[10px] border border-border">
            <div className="h-9 animate-pulse bg-[#FAFAFB]" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-[#EEF0F3] px-3 py-3">
                <div className="h-4 w-4 animate-pulse rounded bg-[#F3F4F6]" />
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-3 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
                </div>
                <div className="flex-1" />
                <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-[#F9FAFB]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
