export default function PartnersLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-[52px] items-center border-b border-[#E5E7EB] px-4 sm:px-6">
        <div className="h-3 w-32 animate-pulse rounded-full bg-[#F3F4F6]" />
      </div>
      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        <div className="mb-5 h-6 w-28 animate-pulse rounded-full bg-[#F3F4F6]" />
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4">
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="mt-2 h-7 w-10 animate-pulse rounded-full bg-[#F3F4F6]" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-[#EEF0F3] px-3.5 py-3.5 first:border-0">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#F3F4F6]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
