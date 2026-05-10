export default function LeadDetailLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar */}
      <div className="flex h-[52px] flex-none items-center gap-2 border-b border-border bg-white px-5">
        <div className="h-3 w-64 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-28 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-auto p-7">
          {/* Header */}
          <div className="mb-6 flex items-start gap-4">
            <div className="h-11 w-11 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-6 w-40 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
                <div className="h-4 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
              </div>
              <div className="mt-2 flex gap-4">
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3.5 w-36 animate-pulse rounded-full bg-[#F3F4F6]" />
              </div>
            </div>
            <div className="h-8 w-32 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          </div>

          {/* Details grid */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-[8px] border border-border bg-white p-3.5">
                <div className="mb-1.5 h-2.5 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-4 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="rounded-[10px] border border-border bg-white">
            <div className="flex items-center border-b border-border px-4 py-3">
              <div className="h-4 w-12 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
            <div className="border-b border-border/60 p-4">
              <div className="h-14 animate-pulse rounded-[7px] bg-[#F3F4F6]" />
            </div>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border-t border-[#EEF0F3] px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
                  <div className="ml-auto h-3 w-14 animate-pulse rounded-full bg-[#F9FAFB]" />
                </div>
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#F3F4F6]" />
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-64 flex-none overflow-auto border-l border-border bg-[#FAFAFB] p-4">
          <div className="mb-3 h-2.5 w-12 animate-pulse rounded-full bg-[#F3F4F6]" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-2.5 w-14 animate-pulse rounded-full bg-[#F9FAFB]" />
                <div className="mt-1 h-3.5 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-2 h-2.5 w-14 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-4 w-6 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
