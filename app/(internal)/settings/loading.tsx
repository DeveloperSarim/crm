export default function SettingsLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar skeleton */}
      <div className="flex h-12 flex-none items-center gap-3.5 border-b border-border bg-white px-5">
        <div className="h-3.5 w-52 animate-pulse rounded-full bg-[#E5E7EB]" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav skeleton */}
        <aside className="w-[210px] flex-none border-r border-border bg-white p-4">
          <div className="mb-3 h-2.5 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-1 h-7 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          ))}
          <div className="mb-3 mt-5 h-2.5 w-14 animate-pulse rounded-full bg-[#F3F4F6]" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-1 h-7 animate-pulse rounded-[6px] bg-[#F3F4F6]" />
          ))}
        </aside>

        {/* Content skeleton */}
        <div className="flex-1 p-7">
          <div className="mb-2 h-6 w-40 animate-pulse rounded-full bg-[#E5E7EB]" />
          <div className="mb-6 h-4 w-64 animate-pulse rounded-full bg-[#F3F4F6]" />
          <div className="overflow-hidden rounded-[10px] border border-border bg-white">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <div className="h-3.5 w-40 animate-pulse rounded-full bg-[#F3F4F6]" />
                <div className="h-3.5 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
