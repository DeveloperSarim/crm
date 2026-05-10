export default function CommissionsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[52px] flex-none items-center border-b border-border bg-white px-5">
        <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#E5E7EB]" />
      </div>
      <div className="flex-1 overflow-auto p-[22px_28px_32px]">
        <div className="mb-5 h-7 w-36 animate-pulse rounded-full bg-[#E5E7EB]" />
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="h-9 animate-pulse bg-[#FAFAFB]" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-border px-4 py-3">
              <div className="h-3 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="flex-1" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-5 w-20 animate-pulse rounded-[4px] bg-[#F9FAFB]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
