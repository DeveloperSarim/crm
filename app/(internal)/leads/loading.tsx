export default function LeadsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-border bg-white px-5">
        <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-28 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
      </div>
      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        {/* Toolbar */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-56 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          <div className="h-8 w-28 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          <div className="h-8 w-28 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          <div className="flex-1" />
          <div className="h-7 w-20 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
        </div>
        {/* Table */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="h-9 animate-pulse bg-[#FAFAFB]" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-t border-[#EEF0F3] px-3 py-2.5">
              <div className="h-4 w-4 animate-pulse rounded bg-[#F3F4F6]" />
              <div className="h-5 w-5 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-3 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="flex-1" />
              <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
