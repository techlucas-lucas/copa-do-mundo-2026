import { SkeletonMatchCard } from "@/components/Skeleton";

export default function JogosLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="skeleton h-8 w-24 rounded mb-2" />
      <div className="skeleton h-4 w-56 rounded mb-8" />
      {[1, 2, 3].map((d) => (
        <section key={d} className="mb-8">
          <div className="skeleton h-3 w-36 rounded mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonMatchCard key={i} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
