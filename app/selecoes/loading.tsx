export default function SelecoesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="skeleton h-8 w-32 rounded mb-2" />
      <div className="skeleton h-4 w-52 rounded mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-2">
            <div className="skeleton w-14 h-14 rounded-full" />
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
