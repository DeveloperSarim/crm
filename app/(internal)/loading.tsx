/**
 * Generic loading skeleton shown for ALL internal pages while server
 * renders. This is what makes navigation feel instant — users see
 * this immediately instead of a blank page.
 */
export default function InternalLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar skeleton */}
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-border bg-white px-5">
        <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-24 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
      </div>

      {/* Page content skeleton */}
      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        {/* Page title */}
        <div className="mb-5 flex items-end gap-3">
          <div className="h-7 w-36 animate-pulse rounded-full bg-[#E5E7EB]" />
          <div className="h-4 w-8 animate-pulse rounded-full bg-[#F3F4F6]" />
          <div className="flex-1" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
        </div>

        {/* Stat cards row */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-[10px] border border-border bg-white p-4">
              <div className="h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-8 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-7 w-full animate-pulse rounded-[4px] bg-[#F9FAFB]" />
            </div>
          ))}
        </div>

        {/* Two-col layout */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1.7fr 1fr' }}>
          {/* Main card */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-white">
            <div className="flex items-center border-b border-border px-3.5 py-3">
              <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border/40 px-3.5 py-[9px]">
                <div className="h-5 w-5 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3 w-32 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="flex-1" />
                <div className="h-3 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F9FAFB]" />
              </div>
            ))}
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-3">
            <div className="rounded-[10px] border border-border bg-white p-3.5">
              <div className="mb-4 h-3.5 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="mb-3 flex items-center gap-3">
                  <div className="h-2.5 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-1.5 flex-1 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-2.5 w-8 animate-pulse rounded-full bg-[#F9FAFB]" />
                </div>
              ))}
            </div>
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
