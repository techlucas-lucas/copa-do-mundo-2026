import { SkeletonBracketSlot } from "@/components/Skeleton";

function SkeletonRound({ slots }: { slots: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="skeleton h-5 w-16 rounded-full mb-1" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: slots }).map((_, i) => <SkeletonBracketSlot key={i} />)}
      </div>
    </div>
  );
}

export default function MataMataLoading() {
  return (
    <div className="px-4 py-8 max-w-[1600px] mx-auto">
      <div className="skeleton h-8 w-36 rounded mb-2" />
      <div className="skeleton h-4 w-64 rounded mb-8" />
      <div className="overflow-x-auto pb-6 -mx-4 px-4">
        <div className="min-w-[900px] flex items-center justify-center gap-8">
          <SkeletonRound slots={8} />
          <SkeletonRound slots={4} />
          <SkeletonRound slots={2} />
          <SkeletonRound slots={1} />
          {/* Final */}
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <SkeletonBracketSlot />
          </div>
          <SkeletonRound slots={1} />
          <SkeletonRound slots={2} />
          <SkeletonRound slots={4} />
          <SkeletonRound slots={8} />
        </div>
      </div>
    </div>
  );
}
