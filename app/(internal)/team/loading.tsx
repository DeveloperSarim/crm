export default function TeamLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-border bg-white px-5">
        <div className="h-3.5 w-40 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="flex-1" />
        <div className="h-7 w-28 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
      </div>
      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        <div className="mb-5 h-7 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="h-9 animate-pulse bg-[#FAFAFB]" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-t border-border px-4 py-3.5">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-[#F3F4F6]" />
              </div>
              <div className="flex-1" />
              <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F9FAFB]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
