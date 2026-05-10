export default function StatisticsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[52px] flex-none items-center border-b border-border bg-white px-5">
        <div className="h-3.5 w-44 animate-pulse rounded-full bg-[#E5E7EB]" />
      </div>
      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        <div className="mb-5 h-7 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-[10px] border border-border bg-white p-4">
              <div className="mb-2 h-3 w-24 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-8 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
          ))}
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-[10px] border border-border bg-white p-4">
              <div className="mb-4 h-4 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
              {[...Array(6)].map((_, j) => (
                <div key={j} className="mb-3 flex items-center gap-3">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-3 w-8 animate-pulse rounded-full bg-[#F9FAFB]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
