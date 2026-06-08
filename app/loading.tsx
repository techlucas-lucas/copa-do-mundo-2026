import { SkeletonMatchCard } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      {/* Hero */}
      <div className="text-center mb-10 space-y-3">
        <div className="skeleton h-12 w-72 rounded-lg mx-auto" />
        <div className="skeleton h-8 w-40 rounded-lg mx-auto" />
        <div className="skeleton h-4 w-48 rounded mx-auto" />
        <div className="flex justify-center gap-3 mt-6">
          <div className="skeleton h-12 w-28 rounded-full" />
          <div className="skeleton h-12 w-28 rounded-full" />
          <div className="skeleton h-12 w-28 rounded-full" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
            <div className="skeleton h-7 w-10 rounded mx-auto mb-1" />
            <div className="skeleton h-3 w-14 rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Cards */}
      <div className="skeleton h-4 w-32 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonMatchCard key={i} />)}
      </div>
    </div>
  );
}
