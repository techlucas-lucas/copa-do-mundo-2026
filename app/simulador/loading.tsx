export default function SimuladorLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="skeleton h-9 w-48 rounded mb-2" />
        <div className="skeleton h-4 w-80 rounded" />
      </div>
      <div className="flex flex-col lg:grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Left skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton rounded-lg h-28" />
          ))}
        </div>
        {/* Right skeletons */}
        <div className="flex flex-col gap-3">
          <div className="skeleton h-12 rounded-xl w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
