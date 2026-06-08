import { SkeletonGroupTable } from "@/components/Skeleton";

export default function GruposLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="skeleton h-8 w-28 rounded mb-2" />
      <div className="skeleton h-4 w-64 rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => <SkeletonGroupTable key={i} />)}
      </div>
    </div>
  );
}
