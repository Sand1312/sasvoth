import { Skeleton } from "@sasvoth/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black">
      <div className="mx-auto max-w-6xl flex flex-col gap-10">
        {/* Hero Skeleton */}
        <section className="rounded-[40px] border border-gray-200 bg-gray-50 px-8 py-10 h-[300px]">
           <Skeleton className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
           <Skeleton className="h-12 w-2/3 bg-gray-200 rounded mb-8" />
           <Skeleton className="h-4 w-1/2 bg-gray-200 rounded" />
        </section>

        {/* View Skeleton */}
        <Skeleton className="h-32 w-full bg-gray-100 rounded-[32px]" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 bg-gray-100 rounded-[32px]" />
          ))}
        </div>
      </div>
    </main>
  );
}
