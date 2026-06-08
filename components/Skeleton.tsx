export function SkeletonMatchCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="skeleton h-3 w-14 rounded" />
        </div>
        <div className="skeleton h-7 w-16 rounded" />
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="skeleton h-3 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGroupTable() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="bg-green-800/60 px-4 py-2">
        <div className="skeleton h-4 w-20 rounded" />
      </div>
      <div className="p-3 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <div className="skeleton h-3 w-4 rounded" />
            <div className="skeleton w-5 h-5 rounded-full" />
            <div className="skeleton h-3 flex-1 rounded" />
            <div className="skeleton h-3 w-6 rounded" />
            <div className="skeleton h-3 w-6 rounded" />
            <div className="skeleton h-3 w-6 rounded" />
            <div className="skeleton h-3 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonBracketSlot() {
  return (
    <div className="w-44 bg-gray-900 border border-gray-800 rounded-lg p-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="skeleton w-5 h-5 rounded-full shrink-0" />
        <div className="skeleton h-3 flex-1 rounded" />
        <div className="skeleton h-3 w-5 rounded" />
      </div>
      <div className="skeleton h-px w-full" />
      <div className="flex items-center gap-2">
        <div className="skeleton w-5 h-5 rounded-full shrink-0" />
        <div className="skeleton h-3 flex-1 rounded" />
        <div className="skeleton h-3 w-5 rounded" />
      </div>
    </div>
  );
}
