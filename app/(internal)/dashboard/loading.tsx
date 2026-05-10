export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar */}
      <div className="flex h-[52px] flex-none items-center border-b border-border bg-white px-5">
        <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-24 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
      </div>

      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        {/* Header row */}
        <div className="mb-5 flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-32 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-7 w-52 animate-pulse rounded-full bg-[#E5E7EB]" />
          </div>
          <div className="h-8 w-52 animate-pulse rounded-[7px] bg-[#F3F4F6]" />
        </div>

        {/* 4-col stat cards */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex min-h-[110px] flex-col gap-2.5 rounded-[10px] border border-border bg-white p-4">
              <div className="h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-9 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-7 w-full animate-pulse rounded-[3px] bg-[#F9FAFB]" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#F9FAFB]" />
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1.7fr 1fr' }}>
          {/* Recent leads */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-white">
            <div className="flex items-center border-b border-border px-3.5 py-3">
              <div className="h-3.5 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="flex-1" />
              <div className="h-6 w-16 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
            </div>
            {/* Table header */}
            <div className="flex items-center gap-3 border-b border-border/60 px-3.5 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-2.5 flex-1 animate-pulse rounded-full bg-[#F3F4F6]" />
              ))}
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border/40 px-3.5 py-[9px]">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
                </div>
                <div className="h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-[#F9FAFB]" />
                  <div className="h-3 w-16 animate-pulse rounded-full bg-[#F9FAFB]" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
              </div>
            ))}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* Pipeline */}
            <div className="rounded-[10px] border border-border bg-white p-3.5">
              <div className="mb-4 h-3.5 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
              {[100, 70, 45, 25, 18].map((w, i) => (
                <div key={i} className="mb-3 flex items-center gap-3">
                  <div className="h-3 w-[90px] animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div className="h-full animate-pulse rounded-full bg-[#E5E7EB]" style={{ width: `${w}%` }} />
                  </div>
                  <div className="h-3 w-6 animate-pulse rounded-full bg-[#F9FAFB]" />
                </div>
              ))}
            </div>
            {/* Quick actions */}
            <div className="rounded-[10px] border border-border bg-white p-3.5">
              <div className="mb-3 h-3.5 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="mb-1.5 h-9 animate-pulse rounded-[6px] bg-[#F9FAFB]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
